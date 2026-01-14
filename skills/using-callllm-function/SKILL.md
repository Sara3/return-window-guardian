---
name: using-callllm-function
description: When and how to use sdk.callLLM with FAST vs STANDARD model variants for optimal cost, speed, and quality tradeoffs.
---

# Using sdk.callLLM

The `sdk.callLLM` function provides access to a general-purpose LLM for structured transformations, extractions, and classifications. It supports three model variants: **STANDARD** (more capable), **FAST** (quicker, cheaper), and **POWERFUL** (most capable, slowest).

```typescript
import { Type } from "@dev-agents/sdk-shared";

// FAST variant - quick, cost-effective tasks
const result = await sdk.callLLM(prompt, schema, { modelVariant: "FAST" });

// STANDARD variant (default) - more capable model
const result = await sdk.callLLM(prompt, schema, { modelVariant: "STANDARD" });

// POWERFUL variant - most capable model
const result = await sdk.callLLM(prompt, schema, { modelVariant: "POWERFUL" });
```

## When NOT to Use sdk.callLLM

**Use `sdk.sidekickWithSchema` when you need:**
- Access to user context, memory, or preferences
- Tools from other agents the user has installed
- Understanding that considers the user's history

**Use Sidekick Tasks (`create_sidekick_task`) when you need:**
- Multi-step workflows with decisions between steps
- Autonomous execution
- Iteration and adaptation based on intermediate results

**Use direct code when:**
- Transformation is deterministic (regex, string manipulation)
- You have structured input already
- No interpretation needed

```typescript
// Need user context or memory → use sidekickWithSchema
const profile = await sdk.sidekickWithSchema(
  "What do you know about the user's favorite sports teams and interests?",
  Type.Object({
    favoriteTeams: Type.Optional(Type.Array(Type.String())),
    sportsInterests: Type.Optional(Type.Array(Type.String()))
  })
);

// Deterministic transformation → use code
const date = dayjs("2024-03-15").format("MMMM D, YYYY");
```

## When to Use Each Variant

### Use FAST for:

| Task Type | Examples |
|-----------|----------|
| **Classification** | Sentiment analysis, category assignment, binary decisions |
| **Extraction** | Pulling structured data from text, parsing dates/amounts |
| **Simple transformations** | Format conversion, field mapping, normalization |
| **Pattern matching** | Finding specific patterns, entity recognition |
| **Summarization (brief)** | One-line summaries, key points extraction |

### Use STANDARD for:

| Task Type | Examples |
|-----------|----------|
| **Creative content** | Writing poems, stories, marketing copy |
| **Complex reasoning** | Multi-step analysis, nuanced decisions |
| **Long-form generation** | Detailed summaries, reports, documentation |
| **Nuanced understanding** | Tone analysis, subtle context interpretation |
| **Quality-critical output** | User-facing content, important decisions |

### Use POWERFUL for:

| Task Type | Examples |
|-----------|----------|
| **Multi-document synthesis** | Analyzing 5+ documents together, cross-referencing reports |
| **Complex financial/legal analysis** | Contract review, regulatory compliance assessment |
| **Expert-level problem solving** | Debugging complex system issues, architectural decisions |
| **Quality-critical output** | Executive briefings, important personal communications, complex creative projects |
| **When STANDARD fails** | Tasks where STANDARD returns low-confidence or incorrect results |

## Code Examples

### ✅ FAST: Classification

```typescript
// Classify email priority - simple categorization
const { priority } = await sdk.callLLM(
  `Classify this email's priority:
   Subject: ${email.subject}
   From: ${email.from}`,
  Type.Object({
    priority: Type.Union([
      Type.Literal("urgent"),
      Type.Literal("normal"),
      Type.Literal("low")
    ])
  }),
  { modelVariant: "FAST" }
);
```


### ✅ STANDARD: Creative Writing

```typescript
// Generate a personalized poem - needs creativity
const { poem } = await sdk.callLLM(
  `Write a short birthday poem for ${name} who loves ${hobby}`,
  Type.Object({
    poem: Type.String()
  }),
  { modelVariant: "STANDARD" }
);
```

### ✅ POWERFUL: Complex Multi-Document Analysis

```typescript
// Synthesize insights from multiple quarterly reports - requires deep reasoning
const { analysis } = await sdk.callLLM(
  `Analyze these quarterly financial reports and provide:
   1. Key strategic trends across all quarters
   2. Risks with severity assessment
   3. Actionable recommendations

   Reports: ${JSON.stringify(quarterlyReports)}`,
  Type.Object({
    trends: Type.Array(Type.Object({
      trend: Type.String(),
      evidence: Type.String(),
      quarters: Type.Array(Type.String())
    })),
    risks: Type.Array(Type.Object({
      risk: Type.String(),
      severity: Type.Union([Type.Literal("low"), Type.Literal("medium"), Type.Literal("high")]),
      mitigation: Type.String()
    })),
    recommendations: Type.Array(Type.Object({
      action: Type.String(),
      priority: Type.Union([Type.Literal("immediate"), Type.Literal("short-term"), Type.Literal("long-term")]),
      rationale: Type.String()
    }))
  }),
  { modelVariant: "POWERFUL" }
);
```

## Quick Decision Tree

```
Is this task...

├── Classification/categorization? → FAST
├── Data extraction from text? → FAST
├── Format conversion? → FAST
├── Sentiment/boolean check? → FAST
├── Brief summary (1-2 sentences)? → FAST
│
├── Creative content generation? → STANDARD
├── Multi-step reasoning needed? → STANDARD
├── Long-form writing? → STANDARD
├── Quality-critical output? → STANDARD
├── Nuanced/subjective decision? → STANDARD
│
├── Highly complex reasoning? → POWERFUL
├── Research-grade analysis? → POWERFUL
├── Mission-critical output? → POWERFUL
├── Expert-level problem solving? → POWERFUL
│
└── Unsure? → Start with FAST, upgrade to STANDARD or POWERFUL if quality insufficient
```

## Cost Considerations

**FAST variant:**
- ~3-5x cheaper per call than STANDARD
- Lower latency
- Best for high-volume operations
- Use in loops and batch processing

**STANDARD variant:**
- Higher cost, higher capability
- Better for user-facing content
- Use sparingly in background functions
- Worth it when quality matters

**POWERFUL variant:**
- ~5x more expensive per call than STANDARD
- Most capable, slowest
- Best for mission-critical and expert-level tasks
- Use only when STANDARD is insufficient
- Reserved for highest-stakes decisions

### Cost-Efficient Patterns

```typescript
// ✅ GOOD: Use FAST in loops
for (const email of emails) {
  const { category } = await sdk.callLLM(
    `Categorize: ${email.subject}`,
    categorySchema,
    { modelVariant: "FAST" }  // Cheaper for batch operations
  );
}

// ✅ GOOD: FAST for filtering, STANDARD for final output
const relevantItems = [];
for (const item of items) {
  const { isRelevant } = await sdk.callLLM(
    `Is relevant: ${item.title}`,
    Type.Object({ isRelevant: Type.Boolean() }),
    { modelVariant: "FAST" }
  );
  if (isRelevant) relevantItems.push(item);
}

// Only use STANDARD for the final user-facing summary
const { summary } = await sdk.callLLM(
  `Create engaging summary of: ${JSON.stringify(relevantItems)}`,
  Type.Object({ summary: Type.String() }),
  { modelVariant: "STANDARD" }
);
```

## Common Patterns

### Pattern 1: Fallback to STANDARD

```typescript
// Try FAST first, upgrade if quality is insufficient
let result = await sdk.callLLM(prompt, schema, { modelVariant: "FAST" });

if (!result || result.confidence < 0.7) {
  result = await sdk.callLLM(prompt, schema, { modelVariant: "STANDARD" });
}
```

### Pattern 2: Task-Based Selection

```typescript
type TaskType = "classify" | "extract" | "generate" | "analyze";

function getModelVariant(task: TaskType): "FAST" | "STANDARD" {
  const fastTasks: TaskType[] = ["classify", "extract"];
  return fastTasks.includes(task) ? "FAST" : "STANDARD";
}
```

### Pattern 3: Volume-Based Selection

```typescript
// Use FAST for high-volume, STANDARD for single important items
const modelVariant = items.length > 10 ? "FAST" : "STANDARD";

for (const item of items) {
  await sdk.callLLM(prompt, schema, { modelVariant });
}
```

## Summary

| Variant | Best For | Cost | Speed |
|---------|----------|------|-------|
| **FAST** | Classification, extraction, formatting, filtering | Low | Fast |
| **STANDARD** | Creative writing, complex reasoning, quality-critical content | Higher | Slower |
| **POWERFUL** | Expert-level reasoning, research-grade analysis, mission-critical tasks | Highest | Slowest |

**Default behavior:** When `modelVariant` is not specified, STANDARD is used.

**Rule of thumb:** If the task has a clear "right answer" that could be verified programmatically, use FAST. If quality is subjective or requires creativity, use STANDARD. If the task requires expert-level reasoning or is mission-critical, use POWERFUL.

