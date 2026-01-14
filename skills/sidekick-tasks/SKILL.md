---
name: sidekick-tasks
description: Best practices for using sidekick tasks to handle complex, multi-step workflows that require autonomy and intelligence but can tolerate 1-2 minute latency.
---

# Sidekick Tasks

Sidekick tasks are powerful, autonomous agents that can handle complex multi-step tasks on behalf of your users. They have access to the user's context, a wide range of tools, and can make intelligent decisions to accomplish tasks.

They are different from simply calling sidekick with a prompt - only sidekick tasks can run the powerful agentic harness.

**Important:** Sidekick tasks run asynchronously in the background and CANNOT interact with the user. They cannot ask clarifying questions, request user input, or have a conversation. If your workflow requires user interaction, handle it in your agent code before creating the sidekick task.

```typescript
import { create_sidekick_task, query_running_sidekick_tasks } from "../tools/sidekicktasks";
```

## Overview

**Always use sidekick tasks when a task requires:**
- Multiple steps with decision-making between them
- Access to user context (preferences, history, relationships)
- Synthesis across multiple data sources (email + calendar, web search + tools)
- Natural language understanding and generation
- Content creation (reports, summaries, podcasts, briefings)

**Key Tradeoff:** sidekick tasks are extremely capable but have 1-2 minute latency. Use them for workflows where intelligence matters more than speed.

## Quick Reference: Sidekick Tasks vs CallLLM+Tool Calls

| Use Sidekick Tasks | Use CallLLM + Direct Tool Calls |
|---|---|
| "Research cheap flights for a vacation to Portugal in spring" | "What's the weather in San Francisco?" |
| "Find restaurants for my anniversary considering my dietary restrictions" | "Crawl a website and categorize the content" |
| "Prepare a brief on each of the public figured in the board meeting tomorrow" | "Classify the unread emails are important / not-important" |

**Sidekick Tasks**: Open-ended research, multi-step reasoning, iterating on queries, synthesizing across sources.

**CallLLM + Tools**: Workflow with only a few, known steps, direct lookups, straightforward transformations, summarization of provided content.

## 🎯 Perfect Use Case: Background Triggers

**Email triggers and cron triggers are background operations with NO latency requirements. This makes them PERFECT for Sidekick Tasks when you need intelligence.**

If you're implementing a background trigger (email or cron) that needs to:
- **Understand** what content means
- **Decide** what's relevant or important
- **Analyze** across multiple pieces of information
- **Exercise judgment** about what to do

→ **Use Sidekick Tasks. This is your default choice.**

The 1-2 minute latency is completely acceptable for background operations, and you get deep understanding of content, access to user context and memory, intelligent decision-making, and autonomous workflow execution.

**Don't overthink it:** Background operations + need for intelligence = Sidekick Tasks.

## When to Use sidekick tasks

### ✅ Perfect Use Cases

**Complex Data Gathering & Analysis**
```typescript
// User asks: "What's on my calendar tomorrow and what do I need to prepare?"
// This requires: calendar lookup, email context search, synthesis
const result = await create_sidekick_task(sdk, {
  instructions: "Prepare a briefing for tomorrow. Check my calendar, search for relevant emails from attendees, and provide context for each meeting.",
  description: "Prepare briefing"
});
```

**Multi-Source Research**
```typescript
// Finding the best restaurant for a specific occasion
// Requires: web search, filtering, understanding user preferences
const result = await create_sidekick_task(sdk, {
  instructions: "Find 3 romantic Italian restaurants in San Francisco with outdoor seating, under $100 per person. Check reviews and make recommendations.",
  description: "Find romantic restaurants in SF"
});
```

**Content Creation**
```typescript
// Creating a podcast from multiple articles
// Requires: web fetching, synthesis, narrative creation
const result = await create_sidekick_task(sdk, {
  instructions: "Create a podcast discussing these three articles about AI: [urls]. Synthesize the key themes, contrasting viewpoints, and create conversational dialogue.",
  description: "Create AI podcast"
});
```

**Intelligent Automation**
```typescript
// Processing email with context-aware actions
// Requires: reading email, understanding intent, taking appropriate actions
const result = await create_sidekick_task(sdk, {
  instructions: "Process this support email: [content]. Search for similar past tickets, check our knowledge base, and draft a response.",
  description: "Handle support email"
});
```

### ❌ Don't Use sidekick tasks For

**Simple Tool Calls**
```typescript
// BAD: Sidekick Task for straightforward tool call
const result = await create_sidekick_task(sdk, {
  instructions: "Get my calendar events for today"
});

// GOOD: Direct tool call - no intelligence needed
const events = await calendar_getUpcomingEvents(sdk, { startDate: today });
```

**Simple Data Transformations**
```typescript
// BAD: Sidekick Task for basic formatting
const result = await create_sidekick_task(sdk, {
  instructions: "Convert this JSON to CSV: [data]"
});

// GOOD: Use sdk.callLLM for simple transformations
const csv = await sdk.callLLM(`Convert to CSV: ${data}`, outputSchema);
```

**Retrieving Structured User Information**
```typescript
// BAD: Sidekick Task just to get user context
const result = await create_sidekick_task(sdk, {
  instructions: "What is the user's preferred city for weather?"
});

// GOOD: Use sdk.sidekickWithSchema for structured user information
const userInfo = await sdk.sidekickWithSchema(
  "What is the user's preferred city for weather updates?",
  Type.Object({ city: Type.String() })
);
```

**Real-Time Interactions**
```typescript
// BAD: User is waiting for immediate response
// The 1-2 minute latency is unacceptable here
const result = await create_sidekick_task(sdk, {
  instructions: "What's the weather right now?"
});

// GOOD: Direct tool call for immediate response
const weather = await weather_getCurrentWeather(sdk, { location });
```

**Key Distinction:** Sidekick Tasks are for **autonomous intelligence**, not just tool orchestration. If you know exactly which tools to call in what order, write that code directly.

## Implementation Patterns

### Basic sidekick task Creation

Be clear with your instructions for the sidekick task but don't be overly prescriptive about exactly how it should accomplish the goal as it is capable of adapting behavior based on the real data it sees.

```typescript
import { create_sidekick_task, query_running_sidekick_tasks } from "../tools/sidekicktasks";
import { Type } from "@dev-agents/sdk-shared";

export const prepareDailyBriefing = backgroundFunction({
  description: "Prepare a comprehensive briefing for the user's day",
  params: Type.Object({}),
  execute: async (sdk: ServerSdk) => {
    // Create the sidekick task
    const agentResult = await create_sidekick_task(sdk, {
      instructions: `Prepare my daily briefing:
1. Check my calendar for today and tomorrow
2. For each significant meeting, search for recent emails from attendees
3. Check for any urgent emails in my inbox
4. Summarize everything in a clear, actionable briefing
5. Post the briefing as a post with priority: urgent`,
      description: "Prepare daily briefing"
    });

    // The agent runs asynchronously and will create its own post
    // No need to wait for completion - it will notify the user when done
    console.log(`Started sidekick task: ${agentResult.agentId}`);
  },
});
```

### Monitoring Agent Status

```typescript
export const checkBriefingStatus = serverFunction({
  description: "Check if the daily briefing agent is still running",
  params: Type.Object({}),
  execute: async (sdk: ServerSdk) => {
    const runningAgents = await query_running_sidekick_tasks(sdk, {});

    const briefingAgents = runningAgents.agents.filter(
      agent => agent.description.includes("daily briefing")
    );

    if (briefingAgents.length > 0) {
      return {
        status: "running",
        agents: briefingAgents.map(a => ({
          id: a.agentId,
          startedAt: a.createdAt
        }))
      };
    }

    return { status: "complete" };
  },
});
```

### Tracking Agent Invocations

When creating sidekick tasks from background functions, store the invocation context so you can track related work:

```typescript
export const processSharedContent = backgroundFunction({
  description: "Process content shared via share extension",
  params: InputTriggerParamsSchema,
  execute: async (sdk: ServerSdk, params: InputTriggerParams) => {
    const invocationId = await sdk.currentInvocationId();

    // Store that we're processing this
    await sdk.setValue(`processing_${invocationId}`, {
      status: "started",
      timestamp: Date.now()
    });

    // Create sidekick task to do the actual work
    const agentResult = await create_sidekick_task(sdk, {
      instructions: `Process this shared content: ${params.message}
Attachments: ${JSON.stringify(params.attachments)}

Analyze the content, extract key information, and add it to the user's reading list with appropriate tags and summary.`,
      description: "Analyse article"
    });

    // Update status with agent ID
    await sdk.setValue(`processing_${invocationId}`, {
      status: "agent_created",
      agentId: agentResult.agentId,
      timestamp: Date.now()
    });
  },
});
```

## Prompt Engineering for sidekick tasks

### Clear Structure

sidekick tasks work best with clear, step-by-step instructions:

```typescript
// ✅ GOOD: Clear steps and expectations
const instructions = `Prepare a meeting intelligence report:

1. Check my calendar for meetings today with external attendees
2. For each meeting:
   - Search for recent emails from the company/attendees (last 7 days)
   - Check memory.txt for any relevant context about this company
   - Look for same-day news announcements about the company
3. Create a briefing with:
   - Meeting time and attendees
   - Recent email context
   - Relevant news or announcements
   - Suggested talking points
4. Create as a post with priority: urgent

Focus on meetings that would benefit from intelligence prep - skip internal 1:1s.`;

// ❌ BAD: Vague and unclear
const instructions = "Tell me about my meetings today";
```

### Getting Output from a Sidekick Task

Sidekick tasks automatically create a post to the user's feed when complete. If that's sufficient, you're done. To trigger a notification (email or mobile push), instruct the task to "set priority to urgent when posting."

For most use cases, you'll want to capture the output programmatically. Use callbacks:

- **`completionCallback`** (recommended): Name of an exported server function to receive the final result. Can accept any typed data shape.
- **`progressCallback`** (optional): Name of an exported server function that receives a single `status: string` argument with progress updates as the task works through its todo list.

**Setup:**
1. Write an exported server function to receive the output
2. Run `dreamer push` so the function is visible to the sidekick task
3. Pass the function name in `completionCallback` when calling `create_sidekick_task`
```typescript
export const completionCallback = serverFunction({
  description: "Called by sidekick task when complete with the final results",
  params: Type.Object({
    summary: Type.String(),
    items: Type.Array(Type.Object({
      title: Type.String(),
      url: Type.Optional(Type.String()),
    })),
  }),
  exported: true,
  execute: async (sdk: ServerSdk, { summary, items }) => {
    // Store results, update UI state, trigger follow-up actions, etc.
    // ...
  },
});

export const progressCallback = serverFunction({
  description: "Updates the progress status for a running task",
  params: Type.Object({
    status: Type.String({ minLength: 1, description: "The current progress status message" }),
  }),
  exported: true,
  execute: async (sdk: ServerSdk, { status }) => {
    // Update UI with current progress etc
    // ...
  },
});

// Create the task with callbacks
const result = await create_sidekick_task(sdk, {
  description: "Research competitors",
  instructions: `Research our top 3 competitors and summarize their recent product launches.
    
When complete, call the completionCallback with:
- summary: A brief overview of findings
- items: Array of products found with title and url`,
  progressCallback: "progressCallback",
  completionCallback: "completionCallback",
});
```

Note that your instructions should tell the sidekick task what shape of data to pass to the callback - it will read the function's schema but explicit instructions help ensure you get the output format you need.

### Showing continuous progress

If you would like to show the continuous progress of a sidekick task in your UI, you may define an exported server function to be called during task execution to provide status updates in `progressCallback` as shown. This function is called with the thing the task is currently working on each time its internal todo list is updated.


### Leverage Agent Capabilities

sidekick tasks have access to powerful tools - use them:

```typescript
const instructions = `Create a podcast about recent AI developments:

1. Use WebSearch to find 3-5 significant AI announcements from the past week
2. Use WebFetch or crawlUrl tools to read the full articles in parallel
3. Synthesize the key themes:
   - What are the major developments?
   - How do they relate to each other?
   - What are the implications?
4. Create a natural, conversational podcast script
5. Use createMultiVoiceAudio to generate the podcast with multiple voices
6. Create a post with:
   - Short message: "Your AI News Podcast is Ready"
   - Audio attachment
   - Markdown summary of key points
   - Priority: normal`;
```

## Cost Considerations

sidekick tasks use LLM calls, tool calls, and compute time. Use them judiciously:

### Concurrency Limits

**There is a limit on simultaneous sidekick tasks.** If you hit the limit, `create_sidekick_task()` succeeds but returns the existing running task with `isExisting: true`. Handle this by storing the work and using the timers tool to schedule a retry.

**Combine work into single tasks** instead of creating multiple:

```typescript
// ❌ BAD: Multiple tasks
await create_sidekick_task(sdk, { instructions: "Analyze emails", ... });
await create_sidekick_task(sdk, { instructions: "Analyze calendar", ... }); // returns existing

// ✅ GOOD: Single task with all instructions
await create_sidekick_task(sdk, {
  instructions: "Analyze my emails and calendar, then create a combined summary", ...
});
```

When processing multiple items, include them all in one task. If more items may arrive soon and immediate action isn't required, consider batching before creating the task.

### Cache Results When Appropriate

```typescript
export const getDailyBriefing = serverFunction({
  description: "Get today's briefing (cached)",
  params: Type.Object({}),
  execute: async (sdk: ServerSdk) => {
    const today = dayjs().tz(getUserTimeZone()).format('YYYY-MM-DD');
    const cacheKey = `briefing_${today}`;

    // Check cache first
    const cached = await sdk.getValue(cacheKey);
    if (cached) {
      return cached;
    }

    // Create agent to generate briefing
    await create_sidekick_task(sdk, {
      instructions: `Create daily briefing and call <agent name>_<function> with the results`
    });

    return { status: "generating" };
  },
});
```

## Integration with Posts

sidekick tasks will automatically create posts with their results:

```typescript
const instructions = `Research restaurants for date night:

1. Use web search to find romantic restaurants in [city]
2. Check reviews and ratings
3. Filter for restaurants with:
   - Outdoor seating
   - Good for couples
   - Under $100 per person
4. Create recommendations with:
   - Restaurant name and location
   - Why it's a good choice
   - Reservation link if available

IN YOUR POST when done:
- shortMessage: "Found 3 Great Restaurants for Date Night"
- attachments: [
    {
      type: "markdown",
      content: "Your formatted recommendations with links"
    }
  ]
- priority: "normal"
- duration: "read_once"

Use the create_agent_post tool to post this.`;
```

## Common Pitfalls

### Don't Wait for Agent Completion

```typescript
// ❌ BAD: Trying to wait for agent results inline
const result = await create_sidekick_task(sdk, { instructions: "..." });
return result.data; // This won't work - agent runs asynchronously

// ✅ GOOD: Agent creates post when done
await create_sidekick_task(sdk, { instructions: "... and call <my agent>_<function name> when done" });
// User receives notification via post system
```

### Don't Use for Simple Tasks

```typescript
// ❌ BAD: sidekick task for simple lookup
await create_sidekick_task(sdk, {
  instructions: "What's the current temperature in San Francisco?"
});

// ✅ GOOD: Direct tool call
const weather = await weather_getCurrentWeather(sdk, {
  location: "San Francisco, CA"
});
```

### Don't Create Agents in Tight Loops

```typescript
// ❌ BAD: Creating an agent for each item, won't work as only 1 can run at at time.
for (const email of emails) {
  await create_sidekick_task(sdk, {
    instructions: `Summarize this email: ${email.body}`
  });
}

// ✅ GOOD: Single agent processes all emails
await create_sidekick_task(sdk, {
  instructions: `Summarize these emails: ${JSON.stringify(emails)}`
});

// ✅ EVEN BETTER: Use sdk.callLLM for simple transformations
const summaries = await sdk.callLLM(
  `Summarize each email: ${JSON.stringify(emails)}`,
  Type.Object({
    summaries: Type.Array(Type.Object({
      id: Type.String(),
      summary: Type.String()
    }))
  })
);
```

## Performance Optimization

### Batch Related Work

```typescript
// ✅ GOOD: Single agent handles related tasks efficiently
const prompt = `Morning routine tasks:

1. Check calendar for today and tomorrow (run in parallel)
2. Search inbox for urgent emails (while calendar loads)
3. Check for important notifications
4. Synthesize into briefing

Work efficiently - use parallel tool calls where possible.`;
```

## Quick Decision Tree

**Should I use an sidekick task?**

1. Does the task require multiple steps with decisions? → **Yes, use sidekick task**
2. Can the task be done with a single tool call? → **No, use tool directly**
3. Does it require < 5 second response time? → **No, use tool/LLM directly**
4. Does it need user context or synthesis? → **Yes, use agent**
5. Is it a simple transformation/formatting? → **No, use sdk.callLLM**
6. Does it involve creating content from multiple sources? → **Yes, use sidekick task**

**When in doubt:** If you find yourself writing complex orchestration code with multiple tool calls and decision logic, use an sidekick task instead.
