---
name: database-troubleshooting
description: Troubleshooting database migration errors and restoring migration files
---

# Database Troubleshooting

## Overview

This skill covers troubleshooting database migration errors in agent projects and how to recover from corrupted or out-of-sync migration files.

## Table of Contents
- [Critical Rules](#critical-rules)
- [Understanding the Migration System](#understanding-the-migration-system)
- [Common Migration Errors](#common-migration-errors)
- [Restoring Migration Files](#restoring-migration-files)
- [Recovery Workflow](#recovery-workflow)

## Critical Rules

**NEVER modify files in the `drizzle/` directory directly through any means:**
- DO NOT edit migration SQL files
- DO NOT delete migration files
- DO NOT rename migration files
- DO NOT create migration files manually
- DO NOT run `drizzle-kit` commands directly

**ALWAYS follow this hierarchy:**
1. `src/schema.ts` is the **single source of truth** for your database schema
2. `bun run push` (via `dreamer push`) automatically generates migration files in `drizzle/`
3. The push process automatically applies migrations to the database

## Understanding the Migration System

### How Migrations Work

```
src/schema.ts (source of truth)
      ↓
bun run push (dreamer push)
      ↓
drizzle-kit generate (automatic)
      ↓
drizzle/ directory (auto-generated files)
      ↓
drizzle-kit migrate (automatic)
      ↓
Database updated
```

**Key Points:**
- `src/schema.ts` defines what your database should look like
- Migration files in `drizzle/` are automatically generated from schema changes
- You should **never** interact directly with `drizzle/` contents
- The push process handles everything automatically

### What's in drizzle/?

The `drizzle/` directory contains:
- Migration SQL files (e.g., `0001_migration.sql`)
- Migration metadata (e.g., `meta/` directory)
- Schema snapshots

These files are:
- **Auto-generated** by drizzle-kit during push
- **Version controlled** to track database history
- **Backed up** to S3 on each successful push
- **Restored** when needed via `dreamer database restore`

## Common Migration Errors

### Error During Migration Step

**Symptoms:**
```
❌ Migration failed during push
Error: SQLITE_ERROR: no such column
Error: SQLITE_ERROR: duplicate column name
Error: table already exists
```

**Causes:**
- Your `drizzle/` files are out of sync with the actual database state
- You made conflicting schema changes
- Previous migration was partially applied

**DO NOT:**
- Edit migration files to "fix" the SQL
- Delete migration files
- Run drizzle-kit manually
- Try to manually repair the database

### Ambiguous Migration Errors

**Symptoms:**
```
❌ Database migration generation failed due to ambiguous schema change
Drizzle-kit is asking: [?] Which one do you want to use?
```

**Solution:**
This is covered in the `database-migrations` skill. Follow the guidance there about separating additions and deletions into different pushes.

## Restoring Migration Files

### When to Restore

Restore your migration files when:
- You get migration errors during `dreamer push`
- Your `drizzle/` directory is out of sync with the database
- You accidentally modified or deleted files in `drizzle/`
- Migration generation is failing unexpectedly

**DO NOT restore if:**
- You're just making normal schema changes (follow `database-migrations` skill instead)
- You haven't pushed the agent yet (no backup exists)

### Using dreamer database restore

The `dreamer database restore` command downloads and restores the last successfully pushed migration files from the server.

**Command:**
```bash
# From your project directory
dreamer database restore

# Or specify a different directory
dreamer database restore ./path/to/project
```

**What it does:**
1. Downloads the drizzle archive from the last successful push
2. **COMPLETELY REPLACES** the entire contents of your `drizzle/` directory
3. Restores the migration files to their last known good state

**Important:**
- This restores to the state of your **last successful push**
- Any local changes to `drizzle/` will be lost (which is fine - you shouldn't have any)
- Your `src/schema.ts` is NOT affected
- Your actual database is NOT affected

## Recovery Workflow

### When Migration Step Fails During Push

Follow this exact workflow:

**Step 1: Restore migration files**
```bash
dreamer database restore
```

This brings your `drizzle/` directory back to the last successful state.

**Step 2: Identify the schema issue**

The error occurred because of changes you made to `src/schema.ts`. Review the error message and your recent changes to identify the problem.

Common issues:
- Created conflicting constraints
- Changed column types incompatibly
- Added a constraint like `notNull()` to a table that already had data without a default.

**Step 3: Fix schema.ts**

Make corrections to `src/schema.ts` to address the error. Follow guidelines in the `database-migrations` skill.

**Step 4: Push again**
```bash
dreamer push
```

If successful, your changes are applied and new migrations are backed up.

**Step 5: If it fails again**

Repeat steps 1-4, adjusting your schema approach:
- Break changes into smaller increments
- Separate additions from deletions
- Follow the safe migration patterns in `database-migrations` skill

## Summary

**Remember:**
- `src/schema.ts` = source of truth (you edit this)
- `drizzle/` = auto-generated (never touch)
- `bun run push` = automatic migration generation and application
- `dreamer database restore` = recover from migration errors

**Workflow when migration fails:**
1. `dreamer database restore` - restore drizzle files
2. Fix the issue in `src/schema.ts`
3. `dreamer push` - try again

**Never:**
- Edit files in `drizzle/` directory
- Run `drizzle-kit` commands
- Try to manually repair migrations
