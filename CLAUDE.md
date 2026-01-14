# High-level Architecture
This application consists of a react frontend located in `src/App.tsx` and a backend
located in `src/server.ts`. The server is responsible for calling tools and persisting data.
The frontend calls functions on the server and does not persist any data of its own. It must
not use browser storage like `localStorage`; all persistent state should live in the server's
database. The frontend also must not call any remote APIs other than those defined in
`src/server.ts`.

The frontend has an SDK and helpers available via the `@dev-agents/sdk-client` package.

The server has an SDK and helpers available to it via the `@dev-agents/sdk-server` package. The server also has access to tools from individual modules in the `tools/` directory (these are NOT available to the frontend).

Only edit files in the `src` directory.

# Server
The server is running in bun environment. It is composed of entry-points, which can
call tools, and persist data using the database.

## Entry-points
The server defines its entry points using `serverFunction` or `backgroundFunction` helpers from `@dev-agents/sdk-server`. All server entry points should be created with one of these helpers - whether they read data or mutate it.

- **`serverFunction`** - For fast, synchronous operations that return data immediately to the client
- **`backgroundFunction`** - For long-running operations that execute asynchronously (see Background Functions section below)

Both can be called from the frontend using the `call()` function from `@dev-agents/sdk-client`. The client uses
React Query to manage when data is fetched and refreshed.


e.g. a server function for setting the user's city in a weather application that can be called from the frontend:

```ts
import * as schema from "./schema";
import { userSettings } from "./schema";
import { eq } from "drizzle-orm";

export const setUserLocation = serverFunction({
  description: "Sets the user's location",
  // The type of the parameter the client sends.
  params: Type.Object({
    location: Type.String({ minLength: 1, description: "The user's location as a geocodable string e.g. San Francisco, CA" }),
  }),
  execute: async (sdk: ServerSdk, { location }) => {
    const db = sdk.db<typeof schema>();

    // Upsert the user location
    const existing = await db.select().from(userSettings).where(eq(userSettings.key, "location")).limit(1);

    if (existing.length > 0) {
      await db.update(userSettings).set({ value: location }).where(eq(userSettings.key, "location"));
    } else {
      await db.insert(userSettings).values({ key: "location", value: location });
    }
  },
});
```

e.g., a server function for returning the weather in the user's location that can be called from the frontend:

```ts
export const getWeather = serverFunction({
  description: "Gets the weather at the user's location as previously provided by setUserLocation",
  // The type of the parameter the client sends.
  params: Type.Object({}),
  execute: async (sdk: ServerSdk) => {
    const db = sdk.db<typeof schema>();

    // Get user location from database
    const locationResult = await db.select().from(userSettings).where(eq(userSettings.key, "location")).limit(1);
    const userCity = locationResult[0]?.value;

    if (!userCity) {
      throw new Error("User location not set");
    }

    const weather = await weather_api_service_getcurrentweather(
        sdk,
        { location: userCity },
        Type.Object({
          tempFahrenheit: Type.Number(),
          isRaining: Type.Boolean()
        })
    );

    return weather;
  },
});
```


### Background Functions

Background functions execute asynchronously and return a handle to check status. Call `sdk.currentInvocationId()` within the function to get the ID for this specific execution (useful for storing status in the database). Results should be stored in the database for later retrieval.

**Use `backgroundFunction` for operations that:**
- Call external APIs multiple times (searches, data fetching across services)
- Use `sdk.callLLM` or `sdk.sidekickWithSchema` (especially when processing multiple items)
- Process collections of items with API/LLM calls per item
- Could scale with user data (more search terms = longer runtime, more emails to process, etc.)
- Any operation that might take >30 seconds

**Use `serverFunction` for:**
- Fast, predictable operations (database queries, single quick API calls, simple transformations)

```ts
export const processLargeDataset = backgroundFunction({
  description: "Process a large dataset",
  params: Type.Object({ datasetId: Type.String() }),
  execute: async (sdk: ServerSdk, { datasetId }) => {
    const db = sdk.db<typeof schema>();
    const currentInvocation = await sdk.currentInvocationId();

    // Store the active task invocation ID
    await db.insert(processingTasks).values({
      invocationId: currentInvocation,
      datasetId,
      status: "processing",
      startedAt: dayjs().tz(getUserTimeZone()).toDate(),
    });

    // Long-running work here
    await performHeavyComputation(datasetId);

    // Update status when complete
    await db.update(processingTasks)
      .set({ status: "completed", completedAt: dayjs().tz(getUserTimeZone()).toDate() })
      .where(eq(processingTasks.invocationId, currentInvocation));
  },
});
```

**Important constraints:**
- Background functions MUST return void (no return value)
- Background functions can be invoked:
  - From the client using `call()` (returns an `Invocation` object with `invocationId`)
  - Via a trigger
- MUST NOT call background functions from server functions
- Status checking:
  - Use `sdk.getInvocationStatus(invocationId)` on the server side to check status
  - Returns `{ status: "processing" }` or `{ status: "completed", result: { type: "success" | "error" } }`
  - Store the `invocationId` in the database so clients can check its status via server functions

**Defensive programming:**
 - Any non-critical tool calls and calls to `sdk.callLLM` should be wrapped in a try/catch block and logged with `console.error` so that execution can continue
 Example:
 ```ts
 try {
   const result = await someToolCall();
 } catch (error) {
   console.error("Failed to call someToolCall", error);
 }
 ```


### Exported Functions
To make the agent able to integrate with sidekick and other agents, you can export some of your `serverFunction` or `backgroundFunction` handlers by using the `exported` argument. By setting `exported: true`, the function will be callable by sidekick. The default is `false`. When selecting functions to export,
think about and design functions that would make good public interfaces to the agent. You should aim to design functions such that core functionality
can be exported. When exporting a function, it is important to use the description field for the function and any params to explain exactly what the function does and how to call it. For example if you provide an "addNote" function which requires content in markdown format, make sure you specify that it needs markdown in the description.

DO export functions that:
- Provide core functionality that other agents or Sidekick might need to integrate with
- Have clear, well-defined inputs and outputs (e.g., CRUD operations, data retrieval, status checks)
- Include comprehensive descriptions for both the function and all parameters
- Handle errors gracefully and return meaningful error messages

DO NOT export functions that:
- Perform internal housekeeping or maintenance tasks, such as data cleanup or syncing.
- Have side effects that could be dangerous if called unexpectedly
- Require complex setup or teardown that external callers won't understand
- Depend on specific timing or ordering that external callers can't guarantee

Example - TODO List Agent:
```ts
import * as schema from "./schema";
import { todos } from "./schema";
import { eq, and, lt } from "drizzle-orm";

export const getTodos = serverFunction({
  description: "Retrieves all todos for the current user, optionally filtered by status",
  params: Type.Object({}),
  exported: true, // ✅ Good to export - clear utility for other agents
  execute: async (sdk: ServerSdk) => {
    const db = sdk.db<typeof schema>();
    const allTodos = await db.select().from(todos);
    return allTodos;
  },
});

export const addTodo = serverFunction({
  description: "Creates a new todo item with the given title and optional description in markdown format",
  params: Type.Object({
    title: Type.String({
      minLength: 1,
      maxLength: 200,
      description: "The title of the todo item"
    }),
  }),
  exported: true, // ✅ Good to export - core functionality
  execute: async (sdk: ServerSdk, { title }) => {
    const db = sdk.db<typeof schema>();

    const result = await db.insert(todos).values({
      title,
      completed: false,
      createdAt: dayjs().tz(getUserTimeZone()).toDate(),
    }).returning();

    return result[0];
  },
});

// Functions that should NOT be exported:

const cleanupOldTodos = serverFunction({
  description: "Internal maintenance function to archive todos older than 30 days",
  params: Type.Object({}),
  exported: false, // ❌ Don't export - internal housekeeping
  execute: async (sdk: ServerSdk) => {
    const db = sdk.db<typeof schema>();
    const thirtyDaysAgo = dayjs().tz(getUserTimeZone()).subtract(30, 'days');

    // Delete old completed todos
    await db.delete(todos).where(
      and(
        eq(todos.completed, true),
        lt(todos.createdAt, thirtyDaysAgo.toDate())
      )
    );
  },
});
```

### `main` function (optional)
`main` is a special entry point (and optional) to be used for executing scheduled background work
(if the user asks for that).

e.g., a main function that can be run periodically to create a weather post:
```ts
export const main = backgroundFunction({
  // Main entry point does not take any parameters.
  params: Type.Object({}),
  execute: async (sdk: ServerSdk) => {
    const cities = ["San Francisco", "New York", "London"];
    const weatherReports = [];
    
    for (const city of cities) {
      const weather = await weather_api_service_getcurrentweather(
        sdk,
        { location: city },
        Type.Object({
          tempFahrenheit: Type.Number(), 
          isRaining: Type.Boolean(),
          description: Type.String()
        })
      );
      weatherReports.push({ city, ...weather });
    }
    
    // Create a post to notify the user
    await create_agent_post(
      sdk,
      {
        shortMessage: `Weather update for ${cities.length} cities`,
        attachments: weatherReports.map(report => ({
          type: "markdown",
          content: `**${report.city}**: ${report.tempFahrenheit}°F - ${report.description}`
        })),
        duration: "read_once",
        priority: "normal"
      },
      Type.Object({})
    );
  },
});
```

### Triggers

Triggers define *public entry points* for external systems to invoke your agent's background functions. Published triggers are configured in `agent.yaml` under the `triggers:` section and expose your agent to scheduled events, user input, and incoming emails.

```yaml
triggers:
  # Cron trigger - automatic scheduled invocations
  - type: cron
    defaultSchedule: 0 */2 * * *  # Every 2 hours
    entrypoint: checkUpdates  # Optional - defaults to 'main'
    name: "Check for Updates"  # Optional - custom name

  # Input trigger - manual invocations from user (e.g., share sheet, API)
  - type: input
    contentTypes: ["text/uri-list", "text/markdown"]
    entrypoint: processText
    name: "Process URLs and Markdown"  # Optional - custom name

  # Email trigger - automatic invocations on incoming emails
  - type: email
    entrypoint: handleEmail
    name: "Process support emails"  # Optional - custom name
    filters:
      from: "support@example.com"  # Optional: sender filter (substring match)
      subject: "urgent"             # Optional: subject keyword (substring match)
      to: "me@example.com"          # Optional: recipient filter (substring match)
      hasAttachment: true           # Optional: require attachments
      labels: ["INBOX", "UNREAD"]   # Optional: Gmail labels (ALL must match)
```

**Trigger Types:**
- **`cron`**: Scheduled automatic invocations (uses user's timezone). Defaults to `main` entrypoint if not specified.
- **`input`**: User-initiated invocations via share sheet or API with optional attachments. Requires explicit `entrypoint`.
- **`email`**: Automatic invocations when Gmail receives matching emails. Requires explicit `entrypoint`. Filters are optional (omit all to process every email). Filters use case-insensitive substring matching.

There is a skill with important and detailed information about triggers and their usage, read it now if you need to set or use triggers. Read the email-triggers skill for information specific to handling emails.

### Testing Functions and Triggers

#### Server Functions
Use the `dreamer call-server` command to test server functions:

```bash
# Call a server function with no parameters
dreamer call-server myFunction '{}'

# Call a server function with parameters
dreamer call-server addUser '{"name": "John", "email": "john@example.com"}'
```

#### Testing Triggers

**Cron triggers** run automatically on schedule, or you can test them manually with `call-server`

**Input triggers** can be tested using the same `call-server` command:

```bash
# Test an input trigger function with message and attachments
dreamer call-server handleInput '{
  "message": "Add this to my work reading list",
  "attachments": [
    {
      "name": "Example Web Page",
      "contentType": "text/uri-list",
      "data": "https://example.com"
    }
  ]
}'
```

**Email triggers** can be tested using `call-server` with batch email parameters:

```bash
# Test an email trigger function with a batch of emails
dreamer call-server handleEmail '{
  "messages": [
    {
      "from": "sender@example.com",
      "to": "recipient@example.com",
      "subject": "Test urgent email",
      "body": "This is a test email body",
      "timestamp": "2024-01-01T12:00:00Z",
      "messageId": "test-message-id-1",
      "labels": ["INBOX", "UNREAD"],
      "attachments": [
        {
          "filename": "document.pdf",
          "mimeType": "application/pdf",
          "size": 12345
        }
      ]
    },
    {
      "from": "sender2@example.com",
      "to": "recipient@example.com",
      "subject": "Another test email",
      "body": "This is another test email",
      "timestamp": "2024-01-01T12:05:00Z",
      "messageId": "test-message-id-2",
      "labels": ["INBOX"]
    }
  ],
  "totalCount": 2,
  "batchSize": 2
}'
```


## Database
The server can persist structured data using a SQLite database accessed through Drizzle ORM. Define your database schema in `src/schema.ts` and use the typed `sdk.db()` method to execute queries. The database is scoped per agent and per user. Data persists between function calls and user sessions.

After pushing an agent for the first time, you may query the database using `dreamer`, e.g.:

```bash
dreamer database --query "SELECT * FROM welcomeMessages"
```

You can use this command for querying, updating, deleting and inserting rows. Confirm with the user before destructive operations.

If you are altering an existing database schema, consult the `database-migrations` skill.

### Schema Definition

Define your database schema in `src/schema.ts` using Drizzle ORM:

```ts
// src/schema.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const userPreferences = sqliteTable("user_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});
```

## Tools

Tools are external APIs and services that your server can call. They are defined in individual modules in the `tools/` directory and automatically generated based on your account's available integrations. Each module corresponds to a specific tool server (e.g., `tools/github.ts`, `tools/slack.ts`).

If you need to call an external API, before using a generic function like `fetch`, you should first check the `tools/` directory to see if a tool already exists for the API.

After running `dreamer sync`, you'll have individual tool modules in the `tools/` directory. Each module contains a `SERVER_INFO` object with metadata about the server and tool functions you can import and use.

### Exploring and Using Tools

You can call tools directly from the CLI using `dreamer call-tool -s <server> -n <toolname> '<params>'`:

**Notes:**
- The params argument must be a single JSON-stringified object (quote appropriately for your shell).
- For tools with no parameters, specify an empty json object, i.e. `{}`.
- If a tool clearly does mutations, do not test without asking the user.

Tools can be used in two ways:

### 1. Runtime Integration (Primary Use)
**Most tool usage is within your agent's code** - import and call them from `serverFunction` or `backgroundFunction` handlers (choose based on the guidance in the Background Functions section above):

```ts
import { some_api_tool } from "@tools/some-api";

export const myFunction = serverFunction({
  execute: async (sdk: ServerSdk) => {
    const result = await some_api_tool(sdk, { param: "value" }, resultSchema);
    // Process result...
  }
});
```

**Explore tools before integrating** to decide which tools to use and understand their outputs. Run tools directly to see real responses, which helps you pick the right arguments and design appropriate schemas:

```bash
# Example: Inspect a tool's output to refine arguments and schemas
dreamer call-tool -s gmail -n getgmailmessages '{"labelIds":["INBOX"],"maxResults":5,"pageToken":""}'
```

#### Schema design
- Use what you learn from tool exploration to define precise `Type` schemas for tool outputs in your server functions.
- You must only use `Type` and related exports from `@dev-agents/sdk-shared`. DO NOT use `@sinclair/typebox` directly.

For accessing external data with tools, you must consult `CLAUDE-DATA-PLANNING.md` for detailed instructions on creating a data plan.

### 2. Build-Time Configuration (Secondary Use)
**Some tools can also configure the agent during development.** When the user asks you to set up agent configuration (such as triggers, webhooks, or scheduled jobs), you can call these tools directly via CLI in addition to using them in code:

```bash
# Example: Configure a trigger now using the triggers tool
dreamer call-tool -s triggers -n add_personal '{
  "trigger": {
    "type": "input",
    "name": "Process URLs",
    "entrypoint": "processInput",
    "contentTypes": ["text/uri-list"]
  }
}'
```

Use your judgment: if the user wants configuration set up now, use the tool directly. If they want the agent to configure itself dynamically at runtime, call the tool from code.

### Special Tools

#### Agent Posts
Use `create_agent_post` to notify users of important information:

```ts
await create_agent_post(
  sdk,
  {
    shortMessage: "Brief notification title",
    attachments: [
      { type: "markdown", content: "**Bold** text and [links](https://example.com)" },
      { type: "url", content: "https://example.com" }
    ],
    duration: "read_once", // Currently the only option
    priority: "normal" // Use "urgent" for push notifications
  },
  Type.Object({})
);
```

## Sidekick Tasks for Intelligent Background Processing

**GOLDEN RULE: Background operations requiring intelligence → Sidekick Tasks**

Background functions initiated by non-user input (such as email triggers, cron triggers) run
asynchronously with NO latency constraints. When these operations require **understanding, judgment,
or decision-making**, use Sidekick Tasks.

### When to Use Sidekick Tasks

**✅ ALWAYS use Sidekick Tasks for background operations that require:**
- **Understanding natural language** (emails, documents, web content)
- **Contextual decision-making** (what's relevant? what's urgent? what matters to THIS user?)
- **Intelligent extraction** (finding meaning, not just pattern matching)
- **Synthesis and analysis** (combining information from multiple sources)
- **Multi-step workflows with decision points** (if X then Y, considering context)
- **Access to user context and memory** (personalizing based on what you know about the user)

**❌ DON'T use Sidekick Tasks for:**
- **Real-time user interactions** (user is actively waiting for a response)
- **Simple deterministic transformations** (formatting, simple parsing with no decisions)
- **Operations with fixed logic** (if you can write it as straightforward code, do that)

### The Intelligence Test

Ask yourself: **"Does this require understanding and judgment, or just execution?"**

- **Understanding/Judgment** → Sidekick Task
  - "Read these emails and tell me what's important"
  - "Analyze my calendar and prepare briefing"
  - "Find articles about X and create a summary"

- **Just Execution** → Direct code/tools/LLM
  - "Format this date string"
  - "Get calendar events for today"
  - "Convert this JSON to markdown"

### Decision Tree for Background Functions

```
Is this a background function (email trigger, cron)?
├─ YES → Does it require understanding content AND making decisions?
│  ├─ YES → Use Sidekick Tasks ✓
│  │  (Examples: email intelligence, content analysis, personalized research)
│  └─ NO (just data operations/simple parsing) → Direct code + sdk.callLLM for transforms
└─ NO (user is waiting)
   ├─ Complex analysis required? → Consider making it a background function
   └─ Simple operation? → Direct tools or sdk.callLLM
```

**Example: Email Processing with Intelligence (Background Trigger)**

```typescript
// ✅ CORRECT: Let Sidekick Task understand and decide
export const handleSchoolEmail = backgroundFunction({
  params: EmailTriggerParamsSchema,
  execute: async (sdk: ServerSdk, params: EmailTriggerParams) => {
    for (const email of params.messages) {
      // Check for duplicates first
      const existing = await db.select()...;
      if (existing.length > 0) continue;

      // Let Sidekick Task handle the intelligence
      await create_sidekick_task(sdk, {
        instructions: `Analyze this school email and take appropriate action:

        From: ${email.from}
        Subject: ${email.subject}
        Body: ${email.body}

        Our students and their grades are in the database. Please:
        1. Understand what this email is about (events, announcements, etc.)
        2. Determine which students this is relevant for based on grades/classes mentioned
        3. Create calendar events for relevant students with complete details
        4. Send a post summary of what was added

        Use your judgment - skip generic emails that don't have actionable events.`,
        description: "Process school email"
      });
    }
  },
});

// ❌ WRONG: Trying to orchestrate intelligence manually
export const handleSchoolEmail = backgroundFunction({
  execute: async (sdk: ServerSdk, params: EmailTriggerParams) => {
    for (const email of params.messages) {
      // Trying to handle understanding in a single LLM call
      const analysis = await sdk.callLLM(
        `Extract events and determine relevance for students: ${email.body}`,
        analysisSchema
      );
      // Then manually implementing the decision logic
      // This splits the intelligence across code + LLM awkwardly
    }
  },
});
```

**Key Insight:** Sidekick Tasks excel at **autonomous understanding and decision-making**. Background operations have the time for this. Use it.

See `skills/sidekick-tasks/SKILL.md` for comprehensive patterns and examples.

## Calling LLMs
As part of the SDK, you have access to a general-purpose LLM for via `sdk.callLLM`. You should us this method for
tasks like transforming text, classifying user input and so on. For example, if a tool has free-text or unknown output type,
you can stringify and pass to to the LLM with an output schema to extract structured information.

```ts
import { yelp_get_most_popular_restaurants } from "@tools/yelp";

const result: unknown = yelp_get_most_popular_restaurants(sdk, { city: "Toronto" });

const { italian, chinese } = sdk.callLLM(
  `Extract the names of italian and chinese restaraunts from this list: ${JSON.stringify(result)}`,
  // Desired structured output schema
  Type.Object({
    italian: Type.Array(Type.String()),
    chinese: Type.Array(Type.String())
  }));
```

### When to Use sdk.callLLM vs Sidekick Tasks

**Use `sdk.callLLM` for:**
- Simple transformations with clear input/output (format conversion, extraction with no decisions)
- Quick classification tasks (sentiment, category with fixed options)
- Single-step operations where you know exactly what you need

**Use Sidekick Tasks for:**
- Background operations requiring understanding and judgment
- Multi-step workflows where decisions depend on context
- Tasks where you'd say "figure out what matters here and handle it"

⚠️ **Common Mistake:** Using `sdk.callLLM` in background functions for complex, multi-step understanding tasks. If you're doing background work and need deep intelligence, use Sidekick Tasks - you have the latency budget for it.

### The sidekick
The sidekick is a powerful system agent which builds up in its memory a detailed view of the user, their personal connections, preferences
and information over time. It also has access to a wide range of tools.

**Reading from Sidekick:** Any time you need to perform inference with the personal context of the user in mind, you should use the sidekick via `sdk.sidekickWithSchema`. For example, if you are building an agent which gets information related to the user's city you could ask the sidekick to provide a default value for that city using its existing knowledge of the user.

**Updating Sidekick's Memory:** When your agent learns new information about the user (profile updates, preferences, personal details), you must keep Sidekick's memory synchronized. See `skills/user-profiles/SKILL.md` for the complete pattern.

## Costs

Tool calls, LLM calls and sidekick calls cost real money, whereas database queries are free. Therefore, think carefully about how to achieve the users goal while minimizing the calls that cost money. For instance, if you are implementing a workflow that parses data from a feed on a cron trigger, make use of deterministic code and database queries to find what changed since the previous invocation. Skip LLM calls when there are no changes and process only what did change via paid-for functions.

# Client
The frontend is a React application that communicates with the server through React Query and the `call()` function from `@dev-agents/sdk-client`. It does not directly call external APIs or persist data - all data operations go through the server. You may use all React Query patterns that you find useful for creating fast, responsive client experiences.

The client has no routing - it's a single page application. Use React state and conditional rendering to handle different views. The frontend must not have any routes.

## React Query Setup


**CRITICAL**: Every agent must wrap its App in a `QueryClientProvider` using the SDK's `agentQueryClient`:

```tsx
// App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { agentQueryClient } from '@dev-agents/sdk-client';

export default function App({ renderContext }: { renderContext: RenderContext }) {
  return (
    <QueryClientProvider client={agentQueryClient}>
      {/* Your app components */}
    </QueryClientProvider>
  );
}
```

⚠️ **Never create your own QueryClient** - always use `agentQueryClient` from `@dev-agents/sdk-client`. It's pre-configured with:
- Automatic refetch every 10 seconds for external changes
- Refetch on window focus
- Listeners for invalidation messages from other agents/Sidekick

## Calling Server Functions

Use the `call()` function from `@dev-agents/sdk-client` with React Query hooks:

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { call } from '@dev-agents/sdk-client';
import type { getTodos, addTodo } from './server';

function TodoList() {
  const queryClient = useQueryClient();

  // Fetch data with useQuery
  const { data: todos, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: () => call<typeof getTodos>('getTodos', {}),
  });

  // Mutate data with useMutation and optimistic updates
  const addTodoMutation = useMutation({
    mutationFn: (title: string) => call<typeof addTodo>('addTodo', { title }),
    onMutate: async (title) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos']);

      // Optimistically update
      queryClient.setQueryData(['todos'], (old: Todo[]) => [
        ...old,
        { id: dayjs.tz(undefined, getUserTimeZone()).valueOf(), title, completed: false }
      ]);

      return { previousTodos };
    },
    onError: (err, title, context) => {
      // Rollback on error
      queryClient.setQueryData(['todos'], context.previousTodos);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
```

## Optimistic Updates

For instant UI feedback, update the cache before the server responds. See the example in "Calling Server Functions" above.

## When to Use Optimistic Updates

**Use optimistic updates for:**
- User-initiated mutations where immediate feedback in the UI matters (incrementing counters, toggling states, adding items)
- Operations with predictable outcomes (you know what the result will be)

**Use simple invalidation for:**
- Mutations where the server response cannot be anticipated (computed fields, server-generated IDs, data from external sources)
- Complex operations where rollback would be difficult
- Background/non-interactive updates, where immediate user-feedback is not important.

## Query Invalidation

When you mutate data, explicitly tell React Query which queries need to refresh:

```tsx
import type { updateTodo } from './server';

const updateTodoMutation = useMutation({
  mutationFn: (todo) => call<typeof updateTodo>('updateTodo', todo),
  onSuccess: () => {
    // Invalidate specific query
    queryClient.invalidateQueries({ queryKey: ['todos'] });

    // Or invalidate multiple related queries
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  },
});
```

## State Management Guidelines

* **Local UI State**: Use React state for UI-only concerns (expanded panels, form inputs, modal visibility, loading states)
* **Server State**: Use React Query + server functions for data that persists or affects multiple sessions
* **Never**: Store transient UI state on the server (expanded accordions, active tabs, etc.)

## Complete Example

Here's a full example showing data fetching, mutations, and invalidation:

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { call } from '@dev-agents/sdk-client';
import { useState } from 'react';
import type { getWeather, setUserLocation } from './server';

function WeatherApp() {
  const queryClient = useQueryClient();
  const [city, setCity] = useState("");

  // Fetch weather data
  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['weather'],
    queryFn: () => call<typeof getWeather>('getWeather', {}),
  });

  // Update location mutation
  // Note: Simple invalidation is appropriate here because the weather data
  // comes from an external API and can't be predicted optimistically
  const updateLocationMutation = useMutation({
    mutationFn: (location: string) => call<typeof setUserLocation>('setUserLocation', { location }),
    onSuccess: () => {
      // Invalidate weather query to refetch with new location
      queryClient.invalidateQueries({ queryKey: ['weather'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateLocationMutation.mutateAsync(city);
    setCity("");
  };

  if (isLoading) return <div>Loading weather...</div>;
  if (error) return <div>Error: {String(error)}</div>;

  return (
    <div>
      <h3>Current Weather</h3>
      {weather && (
        <>
          <p>Temperature: {weather.tempFahrenheit}°F</p>
          <p>{weather.isRaining ? "It's raining" : "No rain"}</p>
        </>
      )}

      <form onSubmit={handleSubmit}>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
          disabled={updateLocationMutation.isPending}
        />
        <button type="submit" disabled={updateLocationMutation.isPending}>
          {updateLocationMutation.isPending ? "Updating..." : "Update Location"}
        </button>
      </form>
    </div>
  );
}
```

## User interface

### UI Types

The user interface defined in App.tsx will be rendered by the system either as a widget on a dashboard or as a full screen app (treat feed_item the same as full screen).
You can tell which mode is being rendered using `renderContext.type`

```tsx
interface RenderContext {
  type: "widget" | "app" | "feed_item";
  data?: unknown;
}

export default function App({ renderContext }: { renderContext: RenderContext }) {
  ...
```

When rendering as a widget, keep in mind that the containing iframe, which can vary in dimensions, will be quite small - typically 300x300 px. Show only the most salient information and use compact text sizes etc. Content in widgets can scroll vertically but only the upper part is typically visible to the user, so make sure widget content starts at the very top of the container, and avoid scrolling unless necessary.

When rendering in "app" mode you are being displayed full screen but must still use responsive design as App.tsx renders across mobile and desktop devices. Do make sure that all critical features of your experience are available.

Do not add taglines or a description what the product does within the UI. Only include the app name in the main view if it is an important label. Space is at a premium, use it effectively. Keep the UI focused on content and functionality. Use traditional app structures like toolbars, sidebars, and icon buttons. 

### Examples
Worked examples of various UI scenarios have been provided for you to consult in `examples/`, here's what's in there should you need it:
- examples/components/ : A set of standard system components, including:
  - LoadingIcon.tsx - use this whenever content is loading. Prefer it over text or a custom icon.

### Colors

The app needs to render nicely in dark mode and light mode. Theme appropriate tailwind CSS is loaded in the window so you should strongly prefer to use semantic colors. Tailwind color modifiers available include:

--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border

Strongly prefer semantic colors. Use explicit colors only when the user specifically asks for them. To set the foreground color for text you'd add the class `text-foreground`.

Do not include a dark/light mode switcher in the UI you build - this is set by the system.

### Icons
When creating UI, do not use Emoji as decoration or interface icons.

Unless otherwise specified, import and use icons in the Lucide set for a consistent appearance.


### Static assets

There might be a folder called `static` that contains static files. Loading them in the UI is done via a relative paths starting with 'static/', DO NOT use absolute paths like '/static/...' and don't create any other logic to generate paths to static files.

### Components

A set of standard system components is included in `examples/components`. Use these when possible.

Unless otherwise specified by the user, import and use components from shadcn, with the default theme provided in `globals.css`.


# Time and timezones

Both the server (`process.env.TZ`) and client (browser) run in the user's timezone. Consider this when storing and presenting dates - store timestamps as ISO 8601 UTC, store calendar dates as date strings, and avoid manual timezone conversions.

## Date/Time Library

**Use Day.js** (`bun add dayjs`) with timezone plugin for all date/time operations. DO NOT use `Date` objects.

**Critical Rules:**
1. **Always Use Explicit Timezone** - Use `dayjs(input).tz(getUserTimeZone())` or `dayjs().tz(getUserTimeZone())` from `@dev-agents/sdk-shared` with immediate chaining. NOT acceptable: `const x = dayjs(input); x.tz(...)` (assignment breaks the chain).
2. **Store Timestamps as UTC ISO Strings** - Use `.utc().toISOString()` for database storage
3. **Store Calendar Dates as Plain Strings** - Format as `YYYY-MM-DD` without time/timezone
4. **Use Day.js Methods for Date Math** - Use `.add()`, `.subtract()`, `.startOf()`, `.endOf()`
5. **Use .diff() for Time Calculations** - Get differences between dates in any unit


# Building
The build script is provided by the `@dev-agents/sdk-shared` package as a CLI binary (`sdk-build`). Build scripts in `package.json` call this binary to compile both frontend and server code:

```bash
# Build everything
bun run build

# Build only server
bun run build:server

# Build only frontend
bun run build:frontend
```

The build process:
- Compiles TypeScript server code to `dist/server/`
- Builds React frontend with Tailwind CSS to `dist/frontend/`
- Copies static assets to `dist/frontend/static/` if a `static/` directory exists
- Keeps SDK imports external (they're provided by the runtime)
- Bundles all other dependencies


# Development Steps
1. Create a data-plan for any required external data by following the steps in `CLAUDE-DATA-PLANNING.md`.
2. Define your database schema in `src/schema.ts` if you need to persist data.
3. Implement server functions.
4. Verify server code typechecks and builds with `bun run typecheck` and `bun run build`
5. Implement client app to the specifications, using the server functions for getting / mutating data from
   the database and tools. Make liberal use of console.log messages in server and client code to help you and the developer you are pairing with to understand what's going on. Logs add virtually no overhead at runtime so err on the side of lots of logging.
6. You can pull logs of recent agent runs to verify that things are working as expected using `dreamer logs`. `dreamer logs --run <runId>` gets logs from a specific run, you can find run IDs with `dreamer runs`. Note that you may have to ask the user to interact with the agentic app and then run `dreamer logs` to see the results. `console.log` invocations in both UI and server functions will show up in these logs.

## Proactively use subagents
You have subagents available to you for implementing high-quality code. List your subagents and proactively run subagents that match the current task and stage if implementation and incorporate their feedback.

## Skills
In the `skills/` directory, you will find a set of very important information in `SKILL.md` files which you must consult when dealing with a task in any way related to the relevant skill. Add reading relevant `SKILL.md` files to your todo list.

You have at least these skills available:
```
skills/mail-and-calendar/SKILL.md
skills/text-to-speech/SKILL.md
skills/sidekick-tasks/SKILL.md
skills/dates-times-timezones/SKILL.md
skills/triggers/SKILL.md
skills/email-triggers/SKILL.md
skills/database-migrations/SKILL.md
skills/database-troubleshooting/SKILL.md
skills/frontend-design/SKILL.md
skills/user-profiles/SKILL.md
```

### Data Sources
If the task requires getting information from the web, and is not information that can be obtained from another tool, first use `dreamer call-tool` with the appropriate server (-S) and tool name (-N) options with any web search or web crawling tools to try to identify a good, source or query to use in the implementation for reliably getting this information. Keep trying until you find a useable source of information, DO NOT give up and hardcode information in the app.

If you are gathering content from the web, it is important to deduplicate similar or matching content. For example, if your task is to make an agent that gathers news events from the web, include a step where you filter out results that are talking about the same
event that you had already included.

DO NOT EVER use mock or simulated data in the application unless instructed to do so by the user.

DO NOT EVER use APIs that require API keys, unless instructed to do so. Good sources will be websites that you can crawl an extract information from.

If you are going to use `fetch` from a URL you MUST test the fetch results first yourself by running the appropriate `curl` command in the terminal.

Repeat the steps for discovering an appropriate data source until you have found one that will work to build into the app.

## Final Steps and Verification
1. **Type Check**: Run `bun run typecheck` to verify all TypeScript types are correct (do not use any other comamand or script for typechecking)
2. **Build**: Run `bun run build` to ensure the project compiles successfully
3. **Client-Server Verification**: Verify that:
   - Client is only calling functions defined by the server
   - Function names match exactly between client and server
   - Client properly uses generic typing with types imported from server
4. **Push the code**: Once complete use `dreamer push` to deploy the changes.

Run `dreamer push` every time you reach a complete increment in development, even if you have further to-do items to complete in the session. The user can see a live preview of your progress and will appreciate seeing changes as you complete them.

# Product requirements doc (PRD.md)

There is a file called `PRD.md` in the root directory. Unless you have been provided detailed instructions to the contrary read it and follow the instructions therein.

As you make changes based on the user's instructions, you must keep `PRD.md` up to date - imagine that you have to recreate the experience from that doc only. Make it clear and comprehensive and maintain the same structure. DO NOT use this as a checklist for implementation—it should stand on its own and accurately reflects the product that was built. Always push the code with `dreamer push` before updating PRD.md

# Toolchain error handling.
IMPORTANT - any time you see an error running dreamer or bun commands that is not related to the code you are editing (e.g. authentication issues, internal service errors) DO NOT try to debug and work around it. Just tell the user what went wrong. Of course, if a problem can be addressed by changing the code (e.g. typecheck errors, imports etc) go ahead and fix.
