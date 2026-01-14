---
name: text-to-speech
description: Best practices for converting text into natural, listenable speech output that sounds professional and human-like.
---

# Text-to-Speech Output

When generating text that will be converted to speech, always apply these transformations to create a natural listening experience.

## Golden Rule: Always Post-Process

**Always** make a final `callLLM` pass to clean up your output before sending it to TTS. Never send raw data directly to speech synthesis.

## Required Transformations

### Numbers and Times
- Times: Convert to natural spoken form
  - `10:00am` → "ten o'clock A M"
  - `3:30pm` → "three thirty P M"
  - `12:00pm` → "noon"
  - `12:00am` → "midnight"
  - `9:45` → "nine forty-five"
  
- Numbers: Write out in complete words
  - `100,000` → "one hundred thousand"
  - `$42.50` → "forty-two dollars and fifty cents"
  - `3.5%` → "three point five percent"
  - Phone numbers: `555-1234` → "five five five, one two three four"
  - Years: `2025` → "twenty twenty-five"
  - Ordinals: `3rd` → "third"

### Simplify Visual Elements
Remove or simplify content that works visually but not aurally:
- URLs: `https://example.com/blog/article` → "example dot com link"
- Email addresses: `john.doe@company.com` → "john doe at company dot com"
- Room names: `334-2-WOPR (10) [VC]` → "room WOPR"
- File paths: `/Users/john/Documents/report.pdf` → "report P D F file"
- Hashtags: `#TechNews` → "hashtag tech news"

### Lists and Data
- Long lists: Summarize or limit to top 3-5 items
- Table data: Convert to natural sentences
- Bullet points: Use transition words like "first," "next," "finally"
- Parenthetical information: Often better to omit or integrate naturally

## Forbidden Elements

**Never include:**
- Stage directions: *(dramatic pause)*, *[cheerfully]*
- Sound effects: *ding*, *whoosh*
- Markup or formatting: **bold**, _italic_, <tags>
- ASCII art or visual symbols
- Emoji descriptions unless essential

## Natural Speech Patterns

### Abbreviations and Acronyms
- Common: `USA` → "U S A" (spelled out)
- Pronounceable: `NASA` → "NASA" (as word)
- Technical: `API` → "A P I" (spelled out)
- Units: `km` → "kilometers", `lbs` → "pounds"

### Punctuation and Flow
- Use commas for natural pauses
- Break long sentences into shorter ones
- Avoid semicolons and complex punctuation
- Replace dashes with commas or "which is"

## LLM Cleaning Schema Pattern

Use structured output for reliable text cleaning:

EXAMPLE
```typescript
const cleanedResult = await sdk.callLLM(
  `Convert this content for natural speech synthesis:

${rawContent}

Rules:
1. Write out all numbers and times in words (9:00 AM → "nine o'clock A M")
2. Simplify complex room names and locations to be easy to understand when spoken
3. Remove technical details that would be tedious to hear (email addresses, URLs, room codes)
4. Make times natural ("nine thirty A M" not "09:30")
5. Make it conversational and natural, like a helpful assistant briefing someone
6. Remove visual formatting and special characters
7. Keep the content clear and concise
8. Use "and" instead of "&"

Output only the cleaned text ready for TTS, nothing else.`,
  Type.Object({
    cleanedText: Type.String({ description: "The cleaned text ready for TTS" })
  })
);

// Always check the result before using
if (!cleanedResult || !cleanedResult.cleanedText) {
  throw new Error("Failed to clean script with LLM");
}

const cleanedScript = cleanedResult.cleanedText;
```

## Implementation Patterns

### Multi-Voice Audio Generation

When using the `createMultiVoiceAudio` tool, structure your script as an array of segments with voice assignments:

```typescript
import { createMultiVoiceAudio } from "../tools/text-to-speech";

// Clean and prepare your script first
const cleanedResult = await sdk.callLLM(
  `Convert this text for natural speech synthesis:\n\n${rawContent}\n\nRules: ...`,
  Type.Object({
    cleanedText: Type.String({ description: "The cleaned text ready for TTS" })
  })
);

// Split into paragraphs for parallel processing
const paragraphs = cleanedResult.cleanedText
  .split("\n\n")
  .filter((p: string) => p.trim().length > 0)
  .map((text: string) => ({
    text: text.trim(),
    voice: "female-1" as const, // Type-safe voice selection
  }));

// Generate audio
const audioResult = await createMultiVoiceAudio(sdk, {
  script: paragraphs,
});

if (!audioResult.success || !audioResult.audioUrl) {
  return {
    audioUrl: null,
    error: audioResult.error?.message || "Failed to generate audio"
  };
}

return { audioUrl: audioResult.audioUrl };
```

## Common Pitfalls to Avoid

- Don't leave mathematical symbols: `+` should be "plus"
- Don't use visual separators like `---` or `***`
- Don't include citation numbers like `[1]` or `(Smith, 2024)`
- Don't spell out words letter-by-letter unless necessary
- Don't include metadata like timestamps or usernames unless relevant
- Don't use overly formal language when casual would be more natural

## Performance Considerations

- **Parallel Processing**: Split content into paragraphs to enable parallel TTS generation
- **Content Length**: Very long scripts may need chunking for optimal performance
- **Caching**: Consider caching generated audio URLs if the same content is requested frequently
- **Cost Control**: LLM cleaning + TTS generation costs real money - avoid regenerating unnecessarily
