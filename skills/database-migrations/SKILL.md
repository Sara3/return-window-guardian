---
name: database-migrations
description: Understanding and safely handling database schema migrations in agent projects
---

# Database Migrations

## Table of Contents
- [Golden Rule](#golden-rule)
- [How Database Migrations Work](#how-database-migrations-work)
- [Understanding Ambiguous Migrations](#understanding-ambiguous-migrations)
- [Safe Migration Patterns](#safe-migration-patterns)
- [Unsafe Patterns to Avoid](#unsafe-patterns-to-avoid)
- [Handling Renames](#handling-renames)
- [Troubleshooting](#troubleshooting)
- [Testing Migrations](#testing-migrations)

## Golden Rule

** CRITICAL: `src/schema.ts` is the single source of truth for your database schema.**

- **ALWAYS** make schema changes by editing `src/schema.ts`
- **NEVER** directly edit files in the `drizzle/` directory
- **NEVER** make additions and deletions at the same time
- Migrations are automatically generated and applied when you run `dreamer push`

## How Database Migrations Work

### The Migration Pipeline

1. **Edit schema.ts**: You define or modify your database schema in `src/schema.ts`
2. **Run `dreamer push`**: This triggers the migration generation and application
3. **drizzle-kit generate**: Automatically analyzes changes in schema.ts and creates migration SQL files in `drizzle/`
4. **drizzle-kit migrate**: Automatically applies the generated migrations to your database

**Key Points:**
- The `drizzle/` directory contains generated migration files - these are created automatically
- `drizzle-kit generate` compares your current schema.ts with the existing migrations to detect what changed
- Migration files are SQL statements that transform your database from one state to another
- Once migrations are generated and pushed, they become the historical record of schema changes

### What Happens During `dreamer push`

```bash
dreamer push
  ↓
bun install              # Install dependencies
  ↓
bun run db:generate      # Run drizzle-kit generate
  ↓
[Creates migration files in drizzle/]
  ↓
[Builds and uploads your code]
  ↓
[Server runs drizzle-kit migrate to apply migrations]
```

## Understanding Ambiguous Migrations

### What Makes a Migration Ambiguous?

Drizzle-kit cannot always determine your intent when it sees certain schema changes. The most common ambiguous scenarios:

**1. Column Rename vs. Drop + Add**

```ts
// Before
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),  // Old column
});

// After - Is this a rename or drop + add?
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  fullName: text("full_name").notNull(),  // New column
});
```

Drizzle sees:
- Column `name` is missing (was it deleted?)
- Column `full_name` is new (was it added?)
- Or was `name` renamed to `full_name`?

**2. Table Rename vs. Drop + Create**

```ts
// Before
export const todos = sqliteTable("todos", { ... });

// After
export const tasks = sqliteTable("tasks", { ... });
```

**3. Type Changes with Data Transformation**

```ts
// Before
status: text("status").notNull()

// After
status: integer("status").notNull()
```

### Interactive Prompts

When ambiguous changes are detected, drizzle-kit shows an interactive prompt:

```
[?] There are multiple ways to interpret the schema change.
    Which one do you want to use?

    > Rename column "name" to "full_name"
      Drop column "name" and add column "full_name"
```

**Problem**: The dreamer push command runs in a non-interactive context and cannot answer these prompts, causing the push to fail.

### Error Message

When `dreamer push` detects an ambiguous migration, you'll see:

```
❌ Database migration generation failed due to an ambiguous schema change.

Drizzle-kit is asking:
  [?] Which one do you want to use?

This happens when drizzle-kit cannot determine your intent (e.g., renaming vs. dropping and adding).

To resolve this:
1. NEVER make additions and deletions at the same time - separate them into different pushes
2. For additions: Add the new column/table to schema.ts, then push
3. For deletions: Remove the column/table from schema.ts, then push (in a separate push)
4. For renames:
   a. Add the new column/table to schema.ts and push
   b. Migrate data using: dreamer database --query "UPDATE ..."
   c. Remove the old column/table from schema.ts and push

For more details, see the database-migrations skill
REMEMBER: schema.ts is the source of truth. NEVER edit files in drizzle/ directly.
```

## Safe Migration Patterns

### ✅ Adding a New Column

**Single push - completely safe:**

```ts
// schema.ts
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),  // NEW: Add nullable column
});
```

```bash
dreamer push  # Safe - only addition, no ambiguity
```

### ✅ Adding a New Table

**Single push - completely safe:**

```ts
// schema.ts
export const users = sqliteTable("users", { ... });

// NEW: Add entire table
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
});
```

```bash
dreamer push  # Safe - only addition
```

### ✅ Removing a Column

**Single push - completely safe:**

```ts
// schema.ts
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  // REMOVED: email column deleted
});
```

```bash
dreamer push  # Safe - only deletion
```

### ✅ Sequential Additions and Deletions

**Multiple pushes - completely safe:**

```ts
// Step 1: Add new column
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),        // Add email
  phoneNumber: text("phone"),  // Add phone
});
```

```bash
dreamer push  # Push 1: Additions only
```

```ts
// Step 2: Remove old column (separate push!)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  email: text("email"),
  phoneNumber: text("phone"),
  // REMOVED: name column
});
```

```bash
dreamer push  # Push 2: Deletion only
```

## Unsafe Patterns to Avoid

### ❌ Simultaneous Add and Delete

**DO NOT DO THIS:**

```ts
// Before
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  oldField: text("old_field"),
});

// After - WRONG: Add and delete in same change
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  newField: text("new_field"),  // Added
  // oldField removed
});
```

```bash
dreamer push  # ❌ FAILS: Ambiguous migration detected!
```

**Why it fails**: Drizzle can't tell if you renamed `oldField` to `newField` or if these are unrelated changes.

**Fix**: Separate into two pushes:

```ts
// Push 1: Add only
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  oldField: text("old_field"),
  newField: text("new_field"),  // Add first
});
```

```bash
dreamer push
```

```ts
// Push 2: Remove only
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  newField: text("new_field"),
  // Remove after successful add
});
```

```bash
dreamer push
```

### ❌ Direct Column Rename

**DO NOT DO THIS:**

```ts
// Before
export const users = sqliteTable("users", {
  name: text("name"),
});

// After - WRONG: Appears as rename
export const users = sqliteTable("users", {
  fullName: text("full_name"),  // Drizzle sees this as rename
});
```

```bash
dreamer push  # ❌ FAILS: Ambiguous - rename or replace?
```

**Fix**: Follow the rename procedure below.

## Handling Renames

Renames require a **three-step process** to preserve data:

### Renaming a Column

**Step 1: Add the new column**

```ts
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),        // Old column
  fullName: text("full_name"),         // NEW: Add new column
});
```

```bash
dreamer push  # Push 1: Add new column
```

**Step 2: Migrate the data**

```bash
dreamer database --query "UPDATE users SET full_name = name"
```

**Step 3: Remove the old column**

```ts
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  fullName: text("full_name").notNull(),  // Keep new
  // REMOVED: name column
});
```

```bash
dreamer push  # Push 2: Remove old column
```

### Renaming a Table

**Step 1: Create new table**

```ts
export const todos = sqliteTable("todos", { ... });  // Old table
export const tasks = sqliteTable("tasks", { ... });  // NEW: Add new table
```

```bash
dreamer push  # Push 1: Add new table
```

**Step 2: Migrate the data**

```bash
dreamer database --query "INSERT INTO tasks SELECT * FROM todos"
```

**Step 3: Remove old table**

```ts
export const tasks = sqliteTable("tasks", { ... });  // Keep new
// REMOVED: todos table definition
```

```bash
dreamer push  # Push 2: Remove old table
```

## Troubleshooting

### "Ambiguous migration" Error During Push

**Symptoms:**
- `dreamer push` fails during `db:generate` step
- Error message mentions interactive prompt or ambiguous change
- See output like `[?]` or `Which one do you want`

**Cause:**
You made changes that drizzle-kit interprets as potentially being a rename.

**Solution:**
1. Undo your schema changes
2. Separate additions and deletions into different commits
3. If renaming, follow the three-step rename procedure
4. Push incrementally

**Example Fix:**

```ts
// You tried this (WRONG):
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  newColumn: text("new_column"),  // Added
  // oldColumn removed - AMBIGUOUS!
});

// Do this instead:
// First push - add only
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  oldColumn: text("old_column"),
  newColumn: text("new_column"),  // Add first
});
// ... push ...

// Second push - remove only
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  newColumn: text("new_column"),
  // Remove oldColumn in separate push
});
// ... push again ...
```

### Migration Files Already Exist

**Symptoms:**
- `drizzle/` directory has migration files but they don't match schema.ts
- Confusion about what state the database is in

**Cause:**
Manual editing of drizzle/ files or incomplete migration process.

**Solution:**
**NEVER** manually edit files in `drizzle/` directory

**Prevention:**
Always let `dreamer push` generate migrations from schema.ts changes.


### Verifying Migrations After Push

```bash
# 1. Push your changes
dreamer push

# 2. Query the database to verify schema
dreamer database --query "PRAGMA table_info(users)"

# 3. Check migration history
dreamer database --query "SELECT * FROM __drizzle_migrations"

# 4. Verify data is intact
dreamer database --query "SELECT * FROM users LIMIT 5"
```

### Testing Data Migration Queries

Before running destructive data migrations, test with SELECT:

```bash
# Test what the update would affect
dreamer database --query "SELECT id, name, full_name FROM users WHERE full_name IS NULL"

# If results look good, run the actual update
dreamer database --query "UPDATE users SET full_name = name WHERE full_name IS NULL"

# Verify the results
dreamer database --query "SELECT id, name, full_name FROM users LIMIT 10"
```
