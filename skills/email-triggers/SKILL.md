---
name: email-triggers
description: Essential guide for email triggers - covers substring filter matching (NOT wildcards!), using email.account for multi-account handling, deduplication, personal vs published triggers, and building user-facing email pattern UIs
---

# Email Triggers Skills Guide

Email triggers allow your agent to automatically process incoming Gmail messages. This guide covers when to use personal vs. published triggers, filtering strategies, and best practices.

## Table of Contents
1. [When to Use Personal vs Published Triggers](#when-to-use-personal-vs-published-triggers)
2. [Email Trigger Filters](#email-trigger-filters)
3. [Dynamic Personal Triggers Pattern](#dynamic-personal-triggers-pattern)
4. [Email Handler Function](#email-handler-function)
5. [Best Practices](#best-practices)
6. [Testing Email Triggers](#testing-email-triggers)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

## When to Use Personal vs Published Triggers

### Use Personal Triggers When:

- **Filtering criteria are user-specific**
  - Example: User configures specific email addresses to monitor through your UI
  - Example: User sets up personalized notification rules

- **Each user needs different trigger configurations**
  - Example: Different users monitor different teams/projects
  - Example: User-specific VIP sender lists

- **The agent UI allows users to customize what emails to monitor**
  - Example: Settings page where users add/remove monitored senders
  - Example: Dynamic rule builders for email filtering

**Key benefit:** Personal triggers are stored per-user and never copied when others install your agent from the gallery.

### Use Published Triggers (agent.yaml) When:

- **All users need identical trigger behavior**
  - Example: Processing all emails with a specific label like "agent-inbox"
  - Example: Monitoring a shared team mailbox

- **The trigger is core to the agent's functionality**
  - Example: An agent that processes ALL incoming emails the same way
  - Example: Automatic email classification for everyone

- **No user customization is needed**
  - Example: Fixed filtering rules that apply to all users

**Key benefit:** Published triggers are part of the agent definition and automatically set up for every user.

## Email Trigger Filters

Email triggers support these filter options:

| Filter | Type | Behavior | Example |
|--------|------|----------|---------|
| `from` | string | Sender email (substring match, case-insensitive) | `"boss@company.com"` |
| `to` | string | Recipient email (substring match, case-insensitive) | `"support@myapp.com"` |
| `subject` | string | Subject keyword (substring match, case-insensitive) | `"urgent"` |
| `labels` | string[] | Gmail labels (ALL must match) | `["INBOX", "UNREAD"]` |
| `hasAttachment` | boolean | Require attachments | `true` |

### Understanding Substring Matching

**IMPORTANT:** Email filters use **case-insensitive substring matching**, NOT wildcards, globs, or regex.

A filter matches if the filter string appears **anywhere** in the email field:

```typescript
// ✅ CORRECT: Match all emails from school.edu domain
filters: { from: "@school.edu" }
// Matches: teacher@school.edu, principal@school.edu, office@school.edu

// ✅ CORRECT: Match specific sender
filters: { from: "john.smith@company.com" }
// Matches: john.smith@company.com
// Also matches: john.smith@company.com.au (substring match!)

// ❌ WRONG: Wildcards don't work
filters: { from: "*@school.edu" }
// This literally looks for "*@school.edu" - will NOT match teacher@school.edu

// ❌ WRONG: Regex doesn't work
filters: { from: ".*@school\\.edu" }
// This is treated as a literal string, not a regex pattern
```

**Common use cases:**

```typescript
// Match entire domain
filters: { from: "@school.edu" }

// Match multiple possible senders (use multiple triggers)
// For "john@company.com" OR "jane@company.com", create two separate triggers
// There's no OR operator within a single filter

// Match emails containing a phrase in subject
filters: { subject: "parent teacher conference" }
// Matches: "Parent Teacher Conference Next Week"
// Matches: "Reminder: parent teacher conference"

// Match partial domain
filters: { from: "school" }
// Matches: anyone@school.edu, person@oldschool.com, admin@preschool.org
// Be careful - this might be too broad!
```

**Best practices for UI:**
- If users enter `*@school.edu`, strip the `*` to get `@school.edu`
- Show examples without wildcards: `@school.edu`, not `*@school.edu`
- Explain that `@school.edu` matches "any sender from school.edu"
- Warn about overly broad patterns like just `school`

### Important Filtering Behavior

- **Personal triggers** created via the triggers tool filter emails at the trigger level
  - Your handler function ONLY receives emails that match the filters
  - More efficient - unnecessary emails never reach your code

- **Published triggers** in agent.yaml without filters receive ALL emails
  - You must filter in code using the database or other logic
  - Less efficient but gives you full control

### Filter Optimization Best Practices

**Always use the narrowest filters possible** to minimize processing time and costs:

✅ **Good - Narrow filters:**
```typescript
// Only emails from specific sender
filters: { from: "boss@company.com" }

// Only support emails with attachments
filters: {
  to: "support@company.com",
  hasAttachment: true
}

// Only unread inbox emails from VIP
filters: {
  from: "vip@company.com",
  labels: ["INBOX", "UNREAD"]
}
```

❌ **Avoid - Broad filters:**
```typescript
// Triggers on ALL emails - very expensive!
filters: {}

// Triggers on all emails to you - still too broad
filters: { to: "me@company.com" }
```

**Why narrow filters matter:**
- **Reduced processing costs**: Fewer emails = fewer LLM calls = lower costs
- **Faster execution**: Your handler only processes relevant emails
- **Better user experience**: Agent responds quickly to important emails
- **Lower resource usage**: Less database queries, less compute time

**Optimization strategies:**
1. **Combine filters** when possible (e.g., `from` + `labels`)
2. **Use specific labels** instead of just "INBOX"
3. **Filter by sender** rather than recipient when monitoring specific people
4. **Add `hasAttachment: true`** if you only care about emails with attachments
5. **Use subject keywords** for category-specific emails (e.g., "invoice", "receipt")

## Dynamic Personal Triggers Pattern

### Adding a Trigger

```typescript
import { add_personal } from "../tools/triggers";

export const addMonitoredSender = serverFunction({
  description: "Add a new email sender to monitor",
  params: Type.Object({
    email: Type.String({ minLength: 1 }),
    name: Type.Optional(Type.String()),
  }),
  execute: async (sdk: ServerSdk, { email, name }) => {
    const db = sdk.db<typeof schema>();

    // Store in database
    await db.insert(monitoredSenders).values({
      email: email.toLowerCase(),
      name: name || null,
      createdAt: dayjs().tz(getUserTimeZone()).toDate(),
    });

    // Create personal email trigger
    try {
      const result = await add_personal(sdk, {
        trigger: {
          type: "email",
          name: `Monitor ${name || email}`,
          entrypoint: "handleIncomingEmail",
          filters: {
            from: email.toLowerCase(),
          },
        },
      });

      if (!result.success) {
        console.error("Failed to create trigger:", result.error);
      }
    } catch (error) {
      console.error("Error creating trigger:", error);
    }

    return { success: true };
  },
});
```

### Removing a Trigger

**CRITICAL:** To remove a personal trigger, you must match its **exact configuration** including the name and all filters.

```typescript
import { remove_personal } from "../tools/triggers";

export const removeMonitoredSender = serverFunction({
  description: "Remove a monitored sender",
  params: Type.Object({
    id: Type.Number(),
  }),
  execute: async (sdk: ServerSdk, { id }) => {
    const db = sdk.db<typeof schema>();

    // Get sender info BEFORE deleting (needed for trigger removal)
    const senderResults = await db
      .select()
      .from(monitoredSenders)
      .where(eq(monitoredSenders.id, id))
      .limit(1);

    if (senderResults.length === 0) {
      return { success: false };
    }

    const email = senderResults[0]!.email;
    const name = senderResults[0]!.name;

    // Remove from database
    await db.delete(monitoredSenders).where(eq(monitoredSenders.id, id));

    // Remove personal trigger (must match exact configuration)
    try {
      const result = await remove_personal(sdk, {
        trigger: {
          type: "email",
          name: `Monitor ${name || email}`, // Must match creation name
          entrypoint: "handleIncomingEmail",
          filters: {
            from: email.toLowerCase(), // Must match creation filters
          },
        },
      });

      if (!result.success) {
        console.error("Failed to remove trigger:", result.error);
      }
    } catch (error) {
      console.error("Error removing trigger:", error);
    }

    return { success: true };
  },
});
```

## Email Handler Function

### Function Signature

```typescript
import {
  backgroundFunction,
  EmailTriggerParamsSchema,
  type EmailTriggerParams,
  type ServerSdk,
} from "@dev-agents/sdk-server";

export const handleIncomingEmail = backgroundFunction({
  description: "Process incoming emails in batches and analyze them with AI",
  params: EmailTriggerParamsSchema,
  exported: true, // REQUIRED for triggers
  execute: async (sdk: ServerSdk, params: EmailTriggerParams) => {
    // Process emails
  },
});
```

### ⚠️ Background Processing Strategy: Use Sidekick Tasks

Email triggers are background functions with **NO latency requirements**. This makes them the **perfect use case for Sidekick Tasks** when your processing requires **intelligence and understanding**.

✅ **Use Sidekick Tasks for email processing when:**
- **Understanding natural language content** (extracting meaning from unstructured text)
- **Making intelligent decisions** (relevance, priority, categorization, filtering)
- **Synthesis across multiple sources** (email content + database + user context)
- **Multi-step workflows with decision points** (extract → evaluate → decide → act)
- **Content understanding that requires context** (what matters to this specific user?)

❌ **Only use sdk.callLLM for emails when:**
- Simple formatting/transformation with fixed logic
- Pattern matching or extraction with no decision-making
- Single-step processing with deterministic output

**The Key Difference:**
- `sdk.callLLM`: "Transform this text into this format"
- **Sidekick Task**: "Understand this content, decide what matters, and handle it appropriately"

**Example: Wrong Approach (sdk.callLLM)**
```typescript
// ❌ BAD: Trying to handle complex understanding with sdk.callLLM
const events = await sdk.callLLM(
  `Extract events from: ${email.body}.
   Only include events relevant to these students: ${JSON.stringify(students)}`,
  eventsSchema
);
// This puts too much burden on a single LLM call
// Sidekick Tasks can think through this step-by-step with full context
```

**Example: Right Approach (Sidekick Task)**
```typescript
// ✅ GOOD: Sidekick Task understands, decides, and acts
await create_sidekick_task(sdk, {
  instructions: `Process this school email intelligently:

  Email from: ${email.from}
  Subject: ${email.subject}
  Body: ${email.body}

  1. Understand what events or information this email contains
  2. Check our student profiles in the database to see who this applies to
  3. For each relevant event, create a calendar entry for the right student
  4. Let the user know what was added and why it matters

  Use your judgment about relevance - not everything mentioned is worth adding.`,
  description: "Process school email"
});
```

**Why Sidekick Tasks for Background Email Processing:**
- **Latency doesn't matter** - user isn't waiting
- **Context awareness** - understands user's specific situation
- **Better judgment** - makes nuanced decisions about relevance
- **Autonomous execution** - figures out the right steps dynamically

See `skills/sidekick-tasks/SKILL.md` for comprehensive guidance.

### Email Batch Structure

Emails arrive in **batches**, not individually:

```typescript
interface EmailTriggerParams {
  messages: EmailData[];      // Array of emails in this batch
  totalCount: number;          // Total emails that matched the trigger
  batchSize: number;           // Number of emails in this batch
}

interface EmailData {
  from: string;                // Sender email
  to: string;                  // Recipient email
  subject: string;             // Email subject
  body?: string;               // Email body (MAY BE UNDEFINED!)
  timestamp: string;           // ISO 8601 timestamp when email was sent
  messageId: string;           // Unique Gmail message ID
  account: string;             // Email address of the Gmail account that received this email
  labels?: string[];           // Gmail labels (e.g., ["INBOX", "UNREAD"])
  attachments?: Array<{        // Optional attachments
    filename: string;
    mimeType: string;
    size: number;
  }>;
}
```

**Critical Notes:**
- `body` may be `undefined` - always handle this case
- `messageId` is essential for deduplication
- `account` contains the Gmail account email address that received this email - use this when performing related operations (see mail-and-calendar skill)
- Use `timestamp` for when the email was sent, not when it was processed

### Using the account field

Each email includes an `account` field indicating which Gmail account received it. This is useful for providing smart defaults when performing related operations:

```typescript
for (const email of params.messages) {
  // When creating calendar events, using the same account often makes sense
  const calendarAccount = email.account;

  await createEvent(sdk, {
    account: calendarAccount,  // Same account as the email
    summary: "Meeting from email",
    // ...
  });
}
```

**When to use it:**

- Creating calendar events from email content - using the receiving account keeps work/personal events separate
- Searching for related emails - use the same account for consistency
- Any workflow that spans multiple Google services

**When you might not use it:**

- If your agent provides account selection in settings (user preference takes priority)
- If your agent only supports single-account scenarios
- If the logic requires a different account for a specific reason

**Best practice:** Consider providing account selection in your settings UI for agents where users might want control. Use `email.account` as a sensible default when no preference is configured.

See `skills/mail-and-calendar/SKILL.md` for more patterns on handling multiple accounts.

## Best Practices

### 1. Always Deduplicate Emails

Email triggers may fire multiple times for the same email. Always check if you've already processed an email:

```typescript
for (const email of params.messages) {
  // CRITICAL: Check for duplicates first
  const existing = await db
    .select()
    .from(processedEmails)
    .where(eq(processedEmails.messageId, email.messageId))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Email ${email.messageId} already processed, skipping`);
    continue;
  }

  // Process the email...
}
```

### 2. Handle Missing Email Body

```typescript
const emailContent = email.body || "(no body available)";

// When passing to LLM
const prompt = `
Analyze this email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body || "(email body not available)"}
`;
```

### 3. Defensive Error Handling

Don't let one email failure break the entire batch:

```typescript
for (const email of params.messages) {
  try {
    // Check for duplicates
    // Analyze email
    // Store results
  } catch (error) {
    console.error(`Failed to process email ${email.messageId}:`, error);
    continue; // Continue processing other emails
  }
}
```

### 4. Use Appropriate Database Schema

```typescript
export const processedEmails = sqliteTable("processed_emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  messageId: text("message_id").notNull().unique(), // UNIQUE for deduplication
  from: text("from").notNull(),
  subject: text("subject").notNull(),
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" }).notNull(),
  summary: text("summary"),
  tasks: text("tasks"), // JSON stringified array
});
```

## Testing Email Triggers

### Testing with dreamer call-server

```bash
# Single email test
dreamer call-server handleIncomingEmail '{
  "messages": [
    {
      "from": "boss@company.com",
      "to": "me@company.com",
      "subject": "Urgent: Project deadline",
      "body": "The client needs this by Friday.",
      "timestamp": "2024-01-15T10:00:00Z",
      "messageId": "test-msg-001",
      "account": "me@company.com",
      "labels": ["INBOX", "UNREAD"]
    }
  ],
  "totalCount": 1,
  "batchSize": 1
}'
```

### Testing Trigger Creation

```bash
# Add a monitored sender (creates trigger)
dreamer call-server addMonitoredSender '{
  "email": "test@example.com",
  "name": "Test Sender"
}'

# Check logs to verify
dreamer logs
```

## Common Patterns

### Pattern 1: User-Configured Sender Monitoring

Perfect for agents where users choose specific people to monitor:

- Users add/remove senders through UI
- Each sender gets a personal trigger
- Handler processes emails from any monitored sender

### Pattern 2: Label-Based Processing

Good for processing emails with specific Gmail labels:

```yaml
# agent.yaml
triggers:
  - type: email
    entrypoint: handleLabeledEmails
    name: "Process labeled emails"
    filters:
      labels: ["agent-inbox"]
```

### Pattern 3: Shared Mailbox Monitoring

For agents that monitor a shared support/team email:

```yaml
# agent.yaml
triggers:
  - type: email
    entrypoint: handleSupportEmails
    name: "Process support emails"
    filters:
      to: "support@company.com"
```

## Troubleshooting

### Trigger Not Firing

1. Check trigger was created:
   ```bash
   dreamer call-tool -s triggers -n list '{}'
   ```

2. Verify filter syntax - filters use substring matching (case-insensitive)

3. Check Gmail labels - must match exactly (case-sensitive)

### Duplicate Processing

- Always check `messageId` before processing
- Use UNIQUE constraint on messageId column
- Prevents duplicates even if trigger fires multiple times

### Trigger Won't Remove

- Requires exact match of configuration
- Name must match exactly
- All filters must match exactly

### Email Body is Undefined

- Gmail doesn't always provide the body
- Always handle: `email.body || "(no body available)"`
- Consider using subject line when body is missing

## Performance Considerations

- LLM calls cost money - use them wisely
- Skip non-important emails early
- Use structured output schemas
- Index messageId column (UNIQUE provides this)
- Consider archiving old emails

## Security Considerations

- Never expose sensitive email content without consent
- Sanitize email data before displaying in UI
- Validate email addresses before creating triggers
- Log all trigger operations for audit trail

## Summary Checklist

- [ ] Decide: Personal or published triggers?
- [ ] Define appropriate filters
- [ ] Implement deduplication using messageId
- [ ] Handle undefined email body
- [ ] Use defensive error handling
- [ ] Store sender info before removing
- [ ] Match exact config when removing triggers
- [ ] Test with dreamer call-server
- [ ] Set exported: true on handler function
