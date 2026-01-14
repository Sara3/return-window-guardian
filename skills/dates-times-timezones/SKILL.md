---
name: dates-times-timezones
description: Critical guidance for handling dates, times, and timezones correctly using Day.js. MUST be consulted when implementing any features dealing with dates, times, or timezones.
---

# Dates, Times, and Timezones

When implementing any features that work with dates, times, or timezones, you MUST follow these patterns to avoid timezone bugs and data corruption.

## Golden Rule: Always Use Explicit Timezones

**Every date/time operation MUST use explicit timezone handling via Day.js:**
- Use `dayjs(input).tz(getUserTimeZone())` with immediate chaining
- Store timestamps as UTC ISO strings with `.utc().toISOString()`
- Store calendar dates as plain `YYYY-MM-DD` strings
- NEVER use native `Date` objects or `dayjs()` without `.tz()`

## Required Setup

Every file using dates MUST include:

```typescript
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getUserTimeZone } from '@dev-agents/sdk-shared';

dayjs.extend(utc);
dayjs.extend(timezone);
```

## Core Patterns

### Storage: Timestamps vs Calendar Dates

** CORRECT: Store specific instants as UTC ISO strings**
```typescript
// Timestamp: specific moment in time
const timestamp = dayjs().tz(getUserTimeZone()).utc().toISOString();
await sdk.setValue("meeting", timestamp); // "2025-10-21T18:30:00.000Z"

// Calendar date: date without specific time
await sdk.setValue("birthday", "2024-03-15");
await sdk.setValue("deadline", "2024-12-31");
```

** INCORRECT: Don't store Day.js objects or formatted strings**
```typescript
// Don't store Day.js objects
await sdk.setValue("meeting", dayjs().tz(getUserTimeZone()));

// Don't store local time strings
await sdk.setValue("time", dayjs().tz(getUserTimeZone()).format());
await sdk.setValue("time", dayjs().tz(getUserTimeZone()).toString());

// Don't store formatted strings for timestamps
await sdk.setValue("meeting", dayjs().tz(getUserTimeZone()).format('YYYY-MM-DD HH:mm:ss'));

// Don't use implicit timezone
await sdk.setValue("meeting", dayjs().toISOString()); // Missing explicit timezone!

// Don't use native Date
await sdk.setValue("meeting", new Date().toISOString());
```

### Display: Formatting for Users

** CORRECT: Display in user's timezone**
```typescript
// Display timestamp in user's timezone
const timestamp = "2025-10-21T18:30:00.000Z";
const date = dayjs(timestamp).tz(getUserTimeZone());

date.format('L');      // Localized date: 10/21/2025
date.format('LT');     // Localized time: 6:30 PM
date.format('LLLL');   // Full: Tuesday, October 21, 2025 6:30 PM
date.format('YYYY-MM-DD HH:mm'); // Custom format

// Or use native formatting via .toDate()
date.toDate().toLocaleDateString();
date.toDate().toLocaleTimeString();

// Display calendar dates without timezone conversion
const dateStr = "2024-03-15";
const formatted = dayjs(dateStr).tz(getUserTimeZone()).format('MMMM D, YYYY'); // March 15, 2024
```

** INCORRECT: Don't use implicit timezone or native Date**
```typescript
// Using dayjs() without explicit timezone
const display = dayjs(timestamp).format('YYYY-MM-DD HH:mm');

// Using dayjs.utc() for display (unless explicitly showing UTC)
const display = dayjs.utc(timestamp).format('YYYY-MM-DD HH:mm');

// Manual timezone conversion with offsets
const offset = -8 * 60 * 60 * 1000;
const localTime = dayjs.utc(timestamp).add(offset, 'milliseconds');

// Hardcoded timezone (unless it's a stored user preference)
const pstTime = dayjs.tz(timestamp, 'America/Los_Angeles');

// Using native Date
const display = new Date(timestamp).toLocaleDateString();
```

### Input Handling: Parsing User Input

** CORRECT: Parse in user's timezone, convert to UTC**
```typescript
// Calendar dates: validate and store as-is
async function storeBirthday(dateString: string) {
  const parsed = dayjs(dateString).tz(getUserTimeZone());
  if (!parsed.isValid()) {
    throw new Error('Invalid date');
  }
  await sdk.setValue('birthday', dateString); // Store "2024-03-15" unchanged
}

// DateTime: parse in user's timezone, convert to UTC, store
async function storeMeeting(dateTime: string) {
  const parsed = dayjs(dateTime).tz(getUserTimeZone());
  const utcIso = parsed.utc().toISOString();
  await sdk.setValue('meeting', utcIso); // Store "2024-03-15T18:30:00.000Z"
}

// Relative time: calculate from current time, store as UTC
async function storeReminder(hoursFromNow: number) {
  const future = dayjs().tz(getUserTimeZone()).add(hoursFromNow, 'hours');
  await sdk.setValue('reminder', future.utc().toISOString());
}
```

**L INCORRECT: Don't use implicit timezone**
```typescript
// Using dayjs() without explicit timezone
function handleDateTimeInput(dateTime: string): string {
  return dayjs(dateTime).toISOString(); // Missing timezone!
}

// Using dayjs.utc() for parsing user input
function handleDateInput(dateString: string): string {
  return dayjs.utc(dateString).format('YYYY-MM-DD'); // Wrong timezone!
}
```

### Date Math: Calculations and Comparisons

** CORRECT: Use Day.js methods**
```typescript
// Use Day.js methods for date math
const tomorrow = dayjs("2024-03-15").tz(getUserTimeZone()).add(1, 'day').format('YYYY-MM-DD');
const nextWeek = dayjs().tz(getUserTimeZone()).add(7, 'days');
const lastMonth = dayjs().tz(getUserTimeZone()).subtract(1, 'month');
const endOfMonth = dayjs().tz(getUserTimeZone()).endOf('month');
const startOfYear = dayjs().tz(getUserTimeZone()).startOf('year');

// Use .diff() for time calculations
const hoursUntil = targetDate.diff(now, 'hours');
const daysUntil = targetDate.diff(now, 'days');
const age = dayjs().tz(getUserTimeZone()).diff(dayjs(birthday).tz(getUserTimeZone()), 'years');
```

** INCORRECT: Don't manipulate strings or timestamps manually**
```typescript
// String manipulation for date math
const today = "2024-03-15";
const tomorrow = today.replace("15", "16"); // Breaks on month boundaries!

// Manual arithmetic on timestamps
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

// Manual string parsing
const parts = today.split('-');
parts[2] = String(Number(parts[2]) + 1);
const tomorrow = parts.join('-');
```

## Critical Pitfalls to Avoid

### Pitfall #1: Missing Explicit Timezone

** WRONG: Implicit timezone (standalone calls)**
```typescript
dayjs()
dayjs('2024-03-15')
dayjs(timestamp)
dayjs.utc() // Unless explicitly displaying UTC
new Date()

// Not immediately chained (assignment breaks the chain)
const temp = dayjs(timestamp);
const date = temp.tz(getUserTimeZone());
```

** CORRECT: Immediate chaining with .tz()**
```typescript
dayjs().tz(getUserTimeZone())
dayjs('2024-03-15').tz(getUserTimeZone())
dayjs(timestamp).tz(getUserTimeZone())
dayjs('2024-03-15T18:30:00Z').tz(getUserTimeZone())
dayjs(isoString).tz(getUserTimeZone()).format('YYYY-MM-DD')
```

### Pitfall #2: Hardcoded Timezones

** WRONG: Hardcoded timezone**
```typescript
dayjs('2024-03-15').tz('America/New_York')
dayjs('2024-03-15').tz('UTC')
```

** CORRECT: Timezone from getUserTimeZone()**
```typescript
const userTz = getUserTimeZone();
dayjs('2024-03-15').tz(userTz)

// EXCEPTION: Hardcoded timezone OK if it's a stored user preference
const savedTz = await sdk.getValue('preferredTimezone'); // e.g., "Europe/London"
dayjs('2024-03-15').tz(savedTz)
```

### Pitfall #3: Mixing Calendar Dates with Timestamps

** WRONG: Parsing calendar date without explicit timezone**
```typescript
const dateStr = "2024-03-15";
const date = dayjs(dateStr); // Ambiguous! What timezone?

// ALSO WRONG: Treating calendar date as UTC midnight
const date2 = dayjs.utc(dateStr); // Shifts the day in user's timezone!
```

** CORRECT: Parse in user's timezone**
```typescript
const localDate = dayjs(dateStr).tz(getUserTimeZone());
const display = localDate.format('L'); // Shows correct day
```

**Why this matters:** A date string like `"2024-03-15"` represents a calendar day, not a specific instant. If you parse it as UTC and the user is in PST (-8 hours), they'll see March 14th instead of March 15th.

### Pitfall #4: Storing Wrong Format

** WRONG: Storing Day.js objects or formatted strings**
```typescript
await sdk.setValue('meeting', date);                    // Day.js object
await sdk.setValue('meeting', date.format());          // Local string
await sdk.setValue('meeting', date.toString());        // Local string
await sdk.setValue('meeting', date.format('L'));       // Formatted string
await sdk.setValue('meeting', date.toISOString());     // Wrong if not UTC first!
```

** CORRECT: Parse � convert to UTC � store**
```typescript
const userInput = "2024-03-15 14:30";
const parsed = dayjs(userInput).tz(getUserTimeZone());
const stored = parsed.utc().toISOString();
await sdk.setValue('meeting', stored);

// Calendar dates stored as-is
const dateInput = "2024-03-15";
const parsed = dayjs(dateInput).tz(getUserTimeZone());
if (parsed.isValid()) {
  await sdk.setValue('birthday', dateInput);
}
```

### Pitfall #5: Misusing .toDate()

** WRONG: Storing or passing native Date around**
```typescript
const native = date.toDate();
await sdk.setValue('meeting', native);
someFunction(native);

// Storing .toDate() result in plain objects
const result = {
  timestamp: date.toDate() // Native Date object
};
```

** CORRECT: Only use .toDate() for immediate API consumption**
```typescript
// OK: Immediate consumption for APIs requiring native Date
element.valueAsDate = date.toDate();
datePickerLib.setDate(date.toDate());

// OK: Database columns in timestamp mode (Drizzle ORM)
// When column is defined as: integer("created_at", { mode: "timestamp" })
await db.insert(table).values({
  createdAt: dayjs().tz(getUserTimeZone()).toDate()
});
// Drizzle's timestamp mode expects a Date object and handles conversion

// BETTER: Pass Day.js object or ISO string instead for general use
someFunction(date.utc().toISOString());
const result = {
  timestamp: date.utc().toISOString()
};
```

## Server-Side Patterns

**Common server patterns:**
```typescript
// Get "today" at midnight in user's timezone
const todayStart = dayjs().tz(getUserTimeZone()).startOf('day');

// Get current time in user's timezone
const now = dayjs().tz(getUserTimeZone());

// Schedule for specific time in user's local timezone
const tomorrow9AM = dayjs().tz(getUserTimeZone())
  .add(1, 'day')
  .hour(9)
  .minute(0)
  .second(0)
  .millisecond(0);

// Store as UTC for database
const scheduleTime = tomorrow9AM.utc().toISOString();

// Get date range in user's timezone
const weekStart = dayjs().tz(getUserTimeZone()).startOf('week');
const weekEnd = dayjs().tz(getUserTimeZone()).endOf('week');
```

## Age Calculations & Date Comparisons

** CORRECT patterns:**
```typescript
// Calculate age from birthday (calendar date)
function calculateAge(birthdayStr: string): number {
  const birthday = dayjs(birthdayStr).tz(getUserTimeZone());
  const today = dayjs().tz(getUserTimeZone());
  return today.diff(birthday, 'years');
}

// Time until specific instant (timestamp)
function getTimeUntil(targetTimestamp: string): number {
  const target = dayjs(targetTimestamp).tz(getUserTimeZone());
  const now = dayjs().tz(getUserTimeZone());
  return target.diff(now, 'milliseconds');
}

// Days until a calendar date
function getDaysUntil(dateStr: string): number {
  const targetDate = dayjs(dateStr).tz(getUserTimeZone()).startOf('day');
  const today = dayjs().tz(getUserTimeZone()).startOf('day');
  return targetDate.diff(today, 'days');
}

// CONVENTION: When calculating time to a calendar date, use startOf('day')
// This treats the calendar date as midnight in the user's timezone
function getHoursUntilDate(dateStr: string): number {
  const targetMidnight = dayjs(dateStr).tz(getUserTimeZone()).startOf('day');
  const now = dayjs().tz(getUserTimeZone());
  return targetMidnight.diff(now, 'hours');
}

// Check if date is in the past
function isPast(dateStr: string): boolean {
  const date = dayjs(dateStr).tz(getUserTimeZone());
  const now = dayjs().tz(getUserTimeZone());
  return date.isBefore(now);
}

// Check if two dates are the same day
function isSameDay(date1: string, date2: string): boolean {
  const day1 = dayjs(date1).tz(getUserTimeZone()).startOf('day');
  const day2 = dayjs(date2).tz(getUserTimeZone()).startOf('day');
  return day1.isSame(day2);
}
```

**L INCORRECT patterns:**
```typescript
// Don't use implicit timezone
function calculateAge(birthdayStr: string): number {
  const birthday = dayjs(birthdayStr); // Implicit timezone!
  return dayjs().diff(birthday, 'years');
}

// Don't do manual timestamp arithmetic
function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
```

## Extended Examples

### Example 1: Scheduling a Future Event
```typescript
// User says: "Set reminder for tomorrow at 9 AM"
const tomorrow9AM = dayjs().tz(getUserTimeZone())
  .add(1, 'day')
  .hour(9)
  .minute(0)
  .second(0)
  .millisecond(0);

// Store as UTC
const reminderTime = tomorrow9AM.utc().toISOString();
await sdk.setValue('reminder', reminderTime);

// Later: Check if it's time
const now = dayjs().tz(getUserTimeZone());
const reminder = dayjs(await sdk.getValue('reminder')).tz(getUserTimeZone());
if (now.isAfter(reminder)) {
  // Trigger reminder
}
```

### Example 2: Birthday Tracking
```typescript
// Store birthday (calendar date, no timezone conversion)
await sdk.setValue('birthday', '1990-05-15');

// Check if birthday is today
const birthday = await sdk.getValue('birthday');
const birthdayThisYear = dayjs(birthday).tz(getUserTimeZone())
  .year(dayjs().tz(getUserTimeZone()).year());
const today = dayjs().tz(getUserTimeZone()).startOf('day');

if (birthdayThisYear.isSame(today, 'day')) {
  // It's their birthday!
}

// Calculate age
const age = dayjs().tz(getUserTimeZone())
  .diff(dayjs(birthday).tz(getUserTimeZone()), 'years');
```

### Example 3: Relative Time Display
```typescript
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const timestamp = await sdk.getValue('lastSeen');
const lastSeen = dayjs(timestamp).tz(getUserTimeZone());
const relative = lastSeen.fromNow(); // "2 hours ago"
```

### Example 4: Date Range Queries
```typescript
// Get all events from last week
const weekAgo = dayjs().tz(getUserTimeZone()).subtract(7, 'days').startOf('day');
const now = dayjs().tz(getUserTimeZone()).endOf('day');

const events = await queryEvents({
  where: {
    timestamp: {
      gte: weekAgo.utc().toISOString(),
      lte: now.utc().toISOString()
    }
  }
});
```

## Recommended Helper Functions

Consider creating a centralized datetime helper module:

```typescript
// datetime.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getUserTimeZone } from '@dev-agents/sdk-shared';

dayjs.extend(utc);
dayjs.extend(timezone);

export function now(): dayjs.Dayjs {
  return dayjs().tz(getUserTimeZone());
}

export function parse(input: string | number | Date): dayjs.Dayjs {
  return dayjs(input).tz(getUserTimeZone());
}

export function toStorage(date: dayjs.Dayjs): string {
  return date.utc().toISOString();
}

export function fromStorage(isoString: string): dayjs.Dayjs {
  return dayjs(isoString).tz(getUserTimeZone());
}

export function today(): dayjs.Dayjs {
  return dayjs().tz(getUserTimeZone()).startOf('day');
}
```

## Key Principles

1. **Always Use Explicit Timezone** - `dayjs(input).tz(getUserTimeZone())` with immediate chaining only
2. **Store Timestamps as UTC ISO Strings** - Use `.utc().toISOString()`
3. **Store Calendar Dates as Plain Strings** - Format as `YYYY-MM-DD`
4. **Use Day.js Methods for Date Math** - `.add()`, `.subtract()`, `.startOf()`, `.endOf()`
5. **Use .diff() for Time Calculations** - Never manual arithmetic
6. **getUserTimeZone() is Required** - Never hardcode timezones (except user preferences)
7. **Avoid .toDate()** - Except for immediate API consumption or Drizzle timestamp mode
8. **Immediate Chaining Only** - `dayjs(x).tz(tz)` is acceptable, but `const y = dayjs(x); y.tz(tz)` is not

Remember: Timezone bugs are subtle and often only appear for users in specific timezones. Following these patterns prevents bugs before they reach users.
