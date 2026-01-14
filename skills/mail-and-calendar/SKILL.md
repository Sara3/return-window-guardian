---
name: mail-and-calendar
description: Critical patterns for mail and calendar tools - multi-account handling (user preferences + smart defaults from triggering events), matching accounts across services, filtering calendar responses, and efficient email search strategies
---

# Mail and calendar

Many tasks will involve working with the user's mail and calendar. Always follow these golden rules.

## Multiple accounts

The system supports multiple accounts. You'll always find the same accounts connected throughout the lifetime of a function invocation so don't call `mail/listAccounts` and `calendar/listAccounts` more than once per task.

Most users with multiple accounts connected will have one work account and one personal account. Think hard about how to deliver the results they are looking for with that in mind.

### ⚠️ Getting Complete Calendar Data

**When checking the user's schedule or availability, you MUST query ALL connected calendar accounts.** Users often have important commitments across multiple calendars (work + personal).

**Use cases requiring ALL calendars:**
- Planning activities around existing commitments
- Finding free time slots
- Checking for scheduling conflicts
- Daily/weekly schedule summaries

**Use cases where one account may suffice:**
- Work meeting prep (when context clearly indicates work only)
- Email triggers where matching the triggering account makes sense

See "Checking availability or finding free time" pattern below for implementation details.

### Multi-account considerations

Many users connect multiple Google accounts (e.g., work + personal). When your agent performs operations across mail, calendar, or drive, think carefully about which account to use.

**Recommended approach: Give users control, with smart defaults**

The best user experience usually comes from:
1. **Providing account selection in settings** (if your agent has a UI)
2. **Using contextual defaults** when no preference is set
3. **Being consistent** within a single operation

**Smart contextual defaults:**

When a user hasn't configured an account preference, use context to make a reasonable choice:

```typescript
// Example: Email trigger handler
export const handleIncomingEmail = backgroundFunction({
  params: EmailTriggerParamsSchema,
  execute: async (sdk: ServerSdk, params: EmailTriggerParams) => {
    for (const email of params.messages) {
      // Option 1: Check if user has configured a preferred account
      const db = sdk.db<typeof schema>();
      const prefs = await db.select().from(settings)
        .where(eq(settings.key, "preferredCalendarAccount"))
        .limit(1);

      const calendarAccount = prefs[0]?.value || // Use preference if set
                              email.account || // Otherwise, same account as email
                              (await listCalendarAccounts(sdk, {})).accounts[0].email; // Last resort

      // Option 2: Simpler - just use the triggering email's account
      // This works well when you don't have settings UI
      const calendarAccount = email.account;

      await createEvent(sdk, {
        account: calendarAccount,
        // ...
      });
    }
  },
});
```

**Why this matters:**
- A work email about a meeting should probably create a work calendar event
- A personal email shouldn't clutter the work calendar
- Users appreciate consistency within a workflow

**When the simple approach is fine:**

Not every agent needs account selection settings. If your use case is straightforward, using the triggering account (like `email.account`) or the primary account is perfectly reasonable.

**Account matching pattern:**

When cross-referencing calendar and email data, implement a fallback chain that respects user preferences:

```typescript
const calendarAccounts = await listCalendarAccounts(sdk, {});
const mailAccounts = await listMailAccounts(sdk, {});

// 1. Load any user preferences for default accounts
//    (from your database, settings table, user config, etc.)
const userPreferredCalendarAccount = await loadUserPreference("defaultCalendarAccount");
const userPreferredMailAccount = await loadUserPreference("defaultMailAccount");

// 2. Get the triggering event account (from webhook, function input, etc.)
//    For email triggers, this is available in the EmailData.account field
const triggeringAccountEmail = "user@example.com"; // From the event that triggered this code
//    Example: const triggeringAccountEmail = params.messages[0]?.account;

// 3. Select accounts with proper fallback chain
const calendarAccount =
  userPreferredCalendarAccount || // User's saved preference (if they've set one)
  calendarAccounts.accounts.find(acc => acc.email === triggeringAccountEmail)?.email || // Same as trigger
  calendarAccounts.accounts[0].email; // Fallback to primary

const mailAccount =
  userPreferredMailAccount || // User's saved preference (if they've set one)
  mailAccounts.accounts.find(acc => acc.email === triggeringAccountEmail)?.email || // Same as trigger
  mailAccounts.accounts.find(acc => acc.email === calendarAccount)?.email || // Match calendar
  mailAccounts.accounts[0].email; // Fallback to primary
```

**Implementing user preferences:**

Consider allowing users to configure default accounts for different operations. This could be:
- A settings page where users select their preferred accounts
- Operation-specific preferences (e.g., "which account should I use for creating calendar events?")
- Per-service defaults (e.g., "always use work@company.com for calendar, personal@gmail.com for drive")

Store these preferences in your database so they persist across invocations. This gives users full control while the automatic "same account as trigger" behavior serves as a smart default when no preference is configured.

**Priority order for account selection:**
1. **User preference/settings**: Explicit user configuration from your settings UI
2. **User-specified in request**: If the user mentions which account to use
3. **Triggering event account**: Use the account from the triggering event (e.g., `email.account` for email triggers)
4. **Context-matched account**: When cross-referencing services, try to match accounts
5. **Primary account**: Fall back to the first account if no other context exists

**Anti-pattern to avoid:**
```typescript
// BAD: Don't arbitrarily mix accounts without reason
const calendarAccount = calendarAccounts.accounts[0].email;  // work@company.com
const mailAccount = mailAccounts.accounts[1].email;          // personal@gmail.com
// This could create calendar events on the wrong account!
```

The key is being thoughtful about which account makes sense for the operation, rather than always defaulting to the first account.

## Calendar event attendees

### Filtering resource calendars

Calendar events often include conference rooms and resources as "attendees". These have email addresses like `room-name@resource.calendar.google.com`. Filter these out when processing real attendees:

```typescript
const realAttendees = event.attendees?.filter(
  a => !a.email.includes("@resource.calendar.google.com")
) || [];
```

### Handling events without attendees

Not all calendar events have attendees (e.g., personal reminders, all-day events). Consider whether your use case should process these or skip them:

```typescript
if (realAttendees.length === 0) {
  console.log(`Skipping event "${event.summary}" - no real attendees`);
  continue;
}
```

### Time display fields

Calendar events return both:
- `start`/`end`: RFC3339 timestamps with timezone (e.g., `"2025-11-13T09:15:00-08:00"`)
- `startTimeLocal`/`endTimeLocal`: Human-readable time strings (e.g., `"9:15 AM"`)

Use `startTimeLocal`/`endTimeLocal` for display purposes and `start`/`end` for date calculations.

## Email search and filtering

### Gmail search syntax

The `searchMessages` tool supports Gmail's query syntax:

```typescript
// Search by sender and date range
const result = await searchMessages(sdk, {
  account: mailAccount,
  query: `from:${attendeeEmail} newer_than:7d`,
  maxResults: 10,
  pageToken: null,
});
```

Common query patterns:
- `from:email@example.com` - From specific sender
- `to:email@example.com` - To specific recipient
- `subject:"meeting notes"` - Subject contains phrase
- `newer_than:7d` - Last 7 days (also: `1d`, `1m`, `1y`)
- `older_than:30d` - Older than 30 days
- `has:attachment` - Has attachments

### Filtering calendar response emails

Gmail sends automated "Accepted:", "Declined:", "Tentative:" emails for calendar invitations. These rarely contain useful context and should typically be filtered:

```typescript
function isCalendarResponse(subject: string): boolean {
  const patterns = ["Accepted:", "Declined:", "Tentative:", "Invitation:"];
  return patterns.some(pattern => subject.includes(pattern));
}

const relevantEmails = searchResult.messages.filter(
  msg => msg.subject && !isCalendarResponse(msg.subject)
);
```

### Controlling email volume

For cost efficiency when processing many attendees:

1. **Limit per-attendee search**: `maxResults: 10` in `searchMessages`
2. **Filter before fetching full messages**: Use `snippet` from search results
3. **Limit final processing**: Slice results to top N most relevant
4. **Batch LLM analysis**: Analyze all emails for a meeting in one LLM call

```typescript
// Search with limit
const searchResult = await searchMessages(sdk, {
  account: mailAccount,
  query: `from:${attendeeEmail} newer_than:7d`,
  maxResults: 10,  // Limit API calls
  pageToken: null,
});

// Filter and limit before detailed processing
const relevantEmails = searchResult.messages
  .filter(msg => msg.subject && !isCalendarResponse(msg.subject))
  .slice(0, 5);  // Take only top 5
```

## Common patterns

### Checking availability or finding free time

When checking the user's schedule or availability, query ALL calendar accounts to avoid missing commitments:

```typescript
// Get all calendar accounts
const calendarAccounts = await listAccounts(sdk, {});

// Collect events from ALL calendars
const allEvents = [];
for (const account of calendarAccounts.accounts) {
  try {
    const events = await getEventsForDay(sdk, {
      account: account.email,
      day: targetDate,
      pageToken: null,
      maxResults: 100,
    });
    allEvents.push(...events.events.map(e => ({
      ...e,
      accountEmail: account.email // Track which calendar this came from
    })));
  } catch (error) {
    console.error(`Failed to fetch calendar for ${account.email}:`, error);
    // Continue with other calendars
  }
}

// Now you have the complete picture of the user's day
console.log(`Found ${allEvents.length} events across ${calendarAccounts.accounts.length} calendars`);

// ❌ WRONG: Only checking first calendar - misses events on other accounts!
const account = accounts.accounts[0]!.email;
const events = await getEventsForDay(sdk, { account, day: targetDate });
```

### Calendar + Email context pattern

A common pattern is to fetch calendar events and enrich them with email context from attendees:

```typescript
// 1. Get calendar events
const events = await getEventsForDay(sdk, {
  account: calendarAccount,
  day: tomorrow,
  maxResults: 250,
  pageToken: null,
});

// 2. For each event, collect emails from attendees
for (const event of events.events) {
  const realAttendees = event.attendees?.filter(
    a => !a.email.includes("@resource.calendar.google.com")
  ) || [];

  const emails = [];
  for (const attendee of realAttendees) {
    const attendeeEmails = await searchMessages(sdk, {
      account: mailAccount,
      query: `from:${attendee.email} newer_than:7d`,
      maxResults: 10,
      pageToken: null,
    });
    emails.push(...attendeeEmails.messages);
  }

  // 3. Analyze collected emails with LLM (batch for efficiency)
  if (emails.length > 0) {
    const analysis = await sdk.callLLM(
      `Analyze these emails in context of meeting "${event.summary}"...`,
      analysisSchema
    );
  }
}
```

### Cost-efficient caching

Since calendar and email data changes infrequently within a day, cache aggregated results in the database:

```typescript
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { cache } from "./schema"; // Assumes you've defined a cache table

const db = sdk.db<typeof schema>();
const cacheKey = `calendar_brief_${date}`;

// Check cache
const cached = await db.select().from(cache).where(eq(cache.key, cacheKey)).limit(1);
if (cached.length > 0 && cached[0].expiresAt > new Date()) {
  return JSON.parse(cached[0].value);
}

// ... fetch and process ...

// Store in cache with expiration
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
await db.insert(cache).values({
  key: cacheKey,
  value: JSON.stringify(result),
  expiresAt,
}).onConflictDoUpdate({
  target: cache.key,
  set: { value: JSON.stringify(result), expiresAt },
});
```

## Error handling

Both calendar and mail tools can fail (network issues, permission changes, rate limits). Wrap calls in try-catch and continue processing:

```typescript
try {
  const emails = await searchMessages(sdk, { ... });
  // Process emails
} catch (error) {
  console.error(`Failed to fetch emails from ${attendee.email}:`, error);
  // Continue with other attendees
}
```

Log errors but don't fail the entire operation if one attendee's emails can't be fetched.
