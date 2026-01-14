---
name: triggers
description: Comprehensive guide and best practices for working with triggers in agents
---

# Agent Triggers

## Table of Contents
- [Overview](#overview)
- [Trigger Types](#trigger-types)
  - [Cron Triggers](#cron-triggers)
  - [Email Triggers](#email-triggers)
  - [Input Triggers](#input-triggers)
  - [Webhook Triggers](#webhook-triggers)
- [Personal vs Published Triggers](#personal-vs-published-triggers)
- [Managing Personal Triggers](#managing-personal-triggers)
- [Handler Functions](#handler-functions)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

Triggers are the mechanism for invoking agent background functions automatically or on demand. There are four types of triggers:

1. **Cron** - Time-based scheduling
2. **Email** - Incoming email matching filters
3. **Input** - Manual invocation with user-provided data
4. **Webhook** - HTTP requests from external services

Each trigger type can be either **published** (defined in `agent.yaml`, applies to all users) or **personal** (created at runtime, user-specific). Note that webhook triggers can only be personal.

## Trigger Types

### Cron Triggers

Execute functions on a schedule (computed in user's local timezone).

**Published (agent.yaml):**
```yaml
triggers:
  - type: cron
    defaultSchedule: "0 */2 * * *"  # Every 2 hours
    entrypoint: checkUpdates
    name: "Check for Updates"
```

**Personal (runtime):**
```typescript
import { add_personal } from "../tools/triggers";

await add_personal(sdk, {
  trigger: {
    type: "cron",
    name: "User's Custom Schedule",
    entrypoint: "processUserData",
    schedule: "0 9 * * *"  // Every day at 9 AM user's time
  }
});
```

**Cron syntax:** `minute hour day month day-of-week`
- `0 9 * * *` = 9:00 AM daily
- `*/15 * * * *` = Every 15 minutes
- `0 0 * * 0` = Midnight every Sunday

### Email Triggers

Fire when receiving emails that match specified filters.

**Published (agent.yaml):**
```yaml
triggers:
  - type: email
    entrypoint: handleSupportEmail
    name: "Support Emails"
    filters:
      from: "support@company.com"
      subject: "urgent"
```

**Personal (runtime):**
```typescript
await add_personal(sdk, {
  trigger: {
    type: "email",
    name: `Monitor ${senderEmail}`,
    entrypoint: "handleIncomingEmail",
    filters: {
      from: senderEmail.toLowerCase()
    }
  }
});
```

**Handler function:**
```typescript
import { EmailTriggerParamsSchema, backgroundFunction, type EmailTriggerParams } from "@dev-agents/sdk-server";

export const handleEmail = backgroundFunction({
  params: EmailTriggerParamsSchema,
  exported: true,
  execute: async (sdk: ServerSdk, params: EmailTriggerParams) => {
    // params.messages is an array of emails (batched delivery)
    for (const email of params.messages) {
      // Process email.from, email.subject, email.body, etc.
    }
  }
});
```

### Input Triggers

Manually invoked via API or share sheet with optional user-provided data.

**Published (agent.yaml):**
```yaml
triggers:
  - type: input
    contentTypes: ["text/uri-list", "text/markdown", "text/plain"]
    entrypoint: processUserInput
    name: "Process Content"
```

**Personal (runtime):**
```typescript
await add_personal(sdk, {
  trigger: {
    type: "input",
    name: "User's Custom Input Handler",
    entrypoint: "handleUserData",
    contentTypes: ["text/uri-list"]
  }
});
```

**Handler receives structured data:**
```typescript
import { InputTriggerParamsSchema, backgroundFunction, type InputTriggerParams } from "@dev-agents/sdk-server";

export const processInput = backgroundFunction({
  params: InputTriggerParamsSchema,
  exported: true,
  execute: async (sdk: ServerSdk, params: InputTriggerParams) => {
    if (params.message) {
      console.log("User instructions:", params.message);
    }

    for (const attachment of params.attachments || []) {
      if (attachment.contentType === "text/uri-list") {
        const urls = attachment.data.split("\n");
        // Process URLs
      } else if (attachment.contentType === "text/markdown") {
        // Process markdown
      }
    }
  }
});
```

**Common MIME types:**
- `text/uri-list` - URLs (newline-separated for multiple)
- `text/plain` - Plain text
- `text/markdown` - Markdown content
- `text/html` - HTML content

### Webhook Triggers

Receive HTTP requests from external services.

**Note:** Webhook triggers can **only** be created as personal triggers (at runtime). Published webhook triggers in `agent.yaml` are not supported.

**Personal (runtime):**
```typescript
await add_personal(sdk, {
  trigger: {
    type: "webhook",
    name: "User Webhook",
    entrypoint: "processWebhookData"
  }
});
```

**Handler receives HTTP request data:**
```typescript
import { WebhookTriggerParamsSchema, backgroundFunction, type WebhookTriggerParams } from "@dev-agents/sdk-server";

export const handleWebhook = backgroundFunction({
  params: WebhookTriggerParamsSchema,
  exported: true,
  execute: async (sdk: ServerSdk, params: WebhookTriggerParams) => {
    console.log("Method:", params.method);
    console.log("Headers:", params.headers);
    console.log("Body:", params.body);

    // Process webhook payload
  }
});
```

## Personal vs Published Triggers

### When to Use Personal Triggers

**Use personal triggers when:**
- Configuration is user-specific and set dynamically through the agent UI
- Users need to create/modify/delete triggers at runtime
- Each user needs different trigger configurations

**Example:** User configures custom cron schedule
```typescript
await add_personal(sdk, {
  trigger: {
    type: "cron",
    name: "User's Daily Report",
    entrypoint: "generateReport",
    schedule: userPreferredTime // e.g., "0 9 * * *"
  }
});
```

### When to Use Published Triggers

**Use published triggers when:**
- All users need the same trigger configuration
- Trigger is core to the agent's functionality
- No runtime modification needed
- Simpler for static, predefined workflows

**Example: Daily digest agent**
```yaml
triggers:
  - type: cron
    defaultSchedule: "0 8 * * *"  # 8 AM daily for all users
    entrypoint: sendDailyDigest
    name: "Daily Digest"
```

## Managing Personal Triggers

### Creating Personal Triggers

```typescript
import { add_personal } from "../tools/triggers";

const result = await add_personal(sdk, {
  trigger: {
    type: "cron",
    name: "Morning Report",
    entrypoint: "generateReport",
    schedule: "0 9 * * *"
  }
});

if (result.success) {
  console.log("Trigger created successfully");
} else {
  console.error("Failed:", result.error);
}
```

### Listing Personal Triggers

```typescript
import { list as listTriggers } from "../tools/triggers";

const triggers = await listTriggers(sdk, {});

for (const trigger of triggers.triggers) {
  console.log(`${trigger.name} (${trigger.type})`);
}
```

### Removing Personal Triggers

**CRITICAL: Must match exact configuration** (name, entrypoint, and all type-specific fields)

```typescript
import { remove_personal } from "../tools/triggers";

// WRONG - Name doesn't match creation
await remove_personal(sdk, {
  trigger: {
    type: "cron",
    name: "Different Name",  // Doesn't match
    entrypoint: "generateReport",
    schedule: "0 9 * * *"
  }
});

// CORRECT - Exact match required
await remove_personal(sdk, {
  trigger: {
    type: "cron",
    name: "Morning Report",  // Must match exactly
    entrypoint: "generateReport",
    schedule: "0 9 * * *"
  }
});
```

**💡 Best practice:** Store trigger configuration in your database when creating it, so you can reliably remove it later.

## Handler Functions

### Required Configuration

All trigger entrypoints MUST:
1. Use `backgroundFunction` (not `serverFunction`)
2. Set `exported: true`
3. Use appropriate params schema for trigger type

```typescript
import { backgroundFunction, EmailTriggerParamsSchema, type ServerSdk, type EmailTriggerParams } from "@dev-agents/sdk-server";

export const handleEmail = backgroundFunction({
  description: "Process incoming emails",
  params: EmailTriggerParamsSchema,  // Match trigger type
  exported: true,  // REQUIRED
  execute: async (sdk: ServerSdk, params: EmailTriggerParams) => {
    // Handler logic
  }
});
```

### Parameter Schemas by Type

```typescript
// Cron (no standard params, typically empty)
params: Type.Object({})

// Email
params: EmailTriggerParamsSchema

// Input
params: InputTriggerParamsSchema

// Webhook
params: WebhookTriggerParamsSchema
```

### Getting Invocation ID

```typescript
export const myHandler = backgroundFunction({
  execute: async (sdk: ServerSdk, params) => {
    const invocationId = await sdk.currentInvocationId();

    // Store for tracking
    await db.insert(jobs).values({
      invocationId,
      status: "processing",
      startedAt: dayjs().tz(getUserTimeZone()).toDate()
    });
  }
});
```

## Best Practices

### Naming

- **Be specific and descriptive**: "Monitor Boss Emails" not "Email Handler"
- **Include context**: "Daily Sales Report" not "Report"
- **User-facing names**: Personal triggers appear in user's trigger list

### Filtering

Use the narrowest filters possible at the trigger level to minimize processing costs and improve performance. Avoid broad triggers that receive all data and filter in code - this wastes resources.

### Deduplication

Prevent duplicate processing by checking unique identifiers:

```typescript
// Email triggers - use messageId
const existing = await db.select()
  .from(processedItems)
  .where(eq(processedItems.uniqueId, item.uniqueId))
  .limit(1);

if (existing.length > 0) {
  console.log("Already processed, skipping");
  continue;
}
```

### Error Handling

Defensive programming for batch processing:

```typescript
for (const email of params.messages) {
  try {
    // Process email
    await processEmail(email);
  } catch (error) {
    console.error(`Failed to process ${email.messageId}:`, error);
    // Continue with next email
    continue;
  }
}
```

### Database Patterns

Store trigger metadata for management:

```typescript
// When creating personal trigger
await db.insert(userTriggers).values({
  triggerType: "email",
  triggerName: name,
  entrypoint: "handleEmail",
  config: JSON.stringify({ filters: { from: email } }),
  createdAt: dayjs().tz(getUserTimeZone()).toDate()
});

// When removing
const trigger = await db.select()
  .from(userTriggers)
  .where(eq(userTriggers.id, id))
  .limit(1);

const config = JSON.parse(trigger[0].config);
await remove_personal(sdk, {
  trigger: {
    type: trigger[0].triggerType,
    name: trigger[0].triggerName,
    entrypoint: trigger[0].entrypoint,
    ...config
  }
});
```

## Testing

### Testing Published Triggers

```bash
# Test email trigger
dreamer call-server handleEmail '{
  "messages": [{
    "from": "test@example.com",
    "to": "me@example.com",
    "subject": "Test",
    "body": "Test body",
    "timestamp": "2024-01-01T12:00:00Z",
    "messageId": "test-123"
  }],
  "totalCount": 1,
  "batchSize": 1
}'

# Test input trigger
dreamer call-server processInput '{
  "message": "Process this URL",
  "attachments": [{
    "name": "Link",
    "contentType": "text/uri-list",
    "data": "https://example.com"
  }]
}'

# Test cron trigger (main function)
dreamer call-server main '{}'
```

### Testing Personal Triggers

1. Create trigger via agent UI, server function, or calling triggers tool directly
2. List triggers to verify creation:
   ```bash
   dreamer call-tool -s triggers -n list '{}'
   ```
3. Test handler with `call-server`
4. Check logs: `dreamer logs`

### Verifying Trigger Removal

```bash
# Before removal
dreamer call-tool -s triggers -n list '{}'

# Remove via agent function
dreamer call-server removeMonitoredSender '{"id": 1}'

# After removal - verify it's gone
dreamer call-tool -s triggers -n list '{}'
```

## Troubleshooting

### "Handler not found" Error

**Cause**: Function not exported or wrong entrypoint name

**Fix**:
```typescript
// Ensure exported: true
export const handleEmail = backgroundFunction({
  exported: true,  // MUST be true
  // ...
});

// Match entrypoint name exactly
triggers:
  - type: email
    entrypoint: handleEmail  # Must match function name
```

### "Trigger already exists" Error

**Cause**: Attempting to create duplicate personal trigger

**Fix**: List existing triggers first, or wrap in try/catch:
```typescript
const result = await add_personal(sdk, { trigger });
if (!result.success) {
  if (result.error?.includes("already exists")) {
    console.log("Trigger already exists, skipping creation");
  } else {
    console.error("Failed to create trigger:", result.error);
  }
}
```

### Trigger Removal Fails Silently

**Cause**: Configuration doesn't exactly match creation

**Fix**: Store exact configuration when creating:
```typescript
// Store this when creating
const triggerConfig = {
  type: "email",
  name: `Monitor ${email}`,
  entrypoint: "handleIncomingEmail",
  filters: { from: email.toLowerCase() }
};

await db.insert(triggers).values({
  config: JSON.stringify(triggerConfig)
});

// Use stored config when removing
const stored = JSON.parse(trigger.config);
await remove_personal(sdk, { trigger: stored });
```

### Cron Trigger Wrong Time

**Remember**: Cron schedules use **user's local timezone**, not UTC

**Fix**: Account for user timezone when setting schedule:
```yaml
# This runs at 9 AM in the user's timezone
defaultSchedule: "0 9 * * *"
```
