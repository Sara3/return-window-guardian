---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build user interfaces. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

## Design Thinking

Before writing code, answer these questions:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Commit to a specific aesthetic direction: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Differentiation**: What single element will someone remember?

**Key principle**: Bold maximalism and refined minimalism both work. The key is *intentionality*, not intensity. Match implementation complexity to the vision—elaborate animations for maximalist designs, restraint and precision for minimal ones.

## Frontend Aesthetics Guidelines

### Typography
Choose distinctive fonts that match the aesthetic. Avoid generic fonts like Arial and Inter. 

**Using custom fonts:**
```tsx
<style>{`
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');
`}</style>
```
Then use with Tailwind: `font-['Space_Grotesk']`

**Font pairing strategies by mood** (examples for inspiration—explore Google Fonts for alternatives):
- **Professional/Clean**: Neutral sans (DM Sans, Plus Jakarta Sans, Geist) + clean mono for data
- **Editorial/Sophisticated**: Refined serif (Crimson Pro, Playfair Display) + neutral sans for UI
- **Playful/Friendly**: Rounded sans (Nunito, Quicksand) + quirky display (Fredoka, Baloo)
- **Tech/Modern**: Geometric sans (Space Grotesk, Outfit, Syne) + monospace accents
- **Luxury/Refined**: High-contrast serif (Cormorant, Bodoni Moda) + elegant sans (Jost, Tenor Sans)
- **Entertainment/Gaming**: Angular/aggressive (Rajdhani, Audiowide, Orbitron) + technical sans

Explore Google Fonts—these are starting points, not the only options

### Color & Theme
Use semantic Tailwind colors as your foundation:  `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, etc.

**When to add expressive color:**

- **Professional/Productivity**: Subtle accents for status. Data-driven palettes (emerald/amber).
- **Social/Community**: Bold, saturated primaries. Signature brand colors.
- **Creative**: Unexpected combinations. Let content inspire the palette.
- **Health/Wellness**: Soft, organic palettes. Muted greens, warm neutrals.
- **Entertainment/Gaming**: Vibrant accents (neon cyan, electric purple). Glow effects like `shadow-[0_0_20px_rgba(34,211,238,0.5)]`.

**Gradients add energy:**
```tsx
// Dramatic hero gradient
<div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">

// Text gradient
<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
```

### Visual Style Patterns

**Glassmorphism:**
```tsx
<div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
```

**Gradient border:**
```tsx
<div className="p-[1px] bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl">
  <div className="bg-background rounded-xl p-4">Content</div>
</div>
```

**Colored shadows:** `shadow-lg shadow-violet-500/25`

**Hover glow:** `hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]`

### Motion
Prioritize high-impact moments over scattered micro-interactions.

**Best approaches:**
- One well-orchestrated page load with staggered reveals (`animation-delay`)
- Scroll-triggered animations that surprise
- Hover states with personality
- CSS animations when possible; Motion library for complex sequences

### Spatial Composition
Break predictable patterns:
- Asymmetric layouts
- Overlapping elements
- Diagonal flow
- Grid-breaking focal points
- Generous negative space OR controlled density (commit to one)

### Domain-Driven Aesthetics
**Let the app's purpose shape its visual identity.** Draw inspiration from the domain:

**Social/Community:** Personality-forward (avatars, reactions), playful animations, bold colors, card-heavy layouts, rounded shapes.

**Finance/Productivity:** Dense information hierarchy, green/red for gains/losses, monospace for numbers, precise grid layouts, minimal decoration.

**Creative/Design:** Bold whitespace, artistic palettes, large typography, grain textures, delightful micro-animations.

**Health/Fitness:** Organic shapes, calming palettes (sage, terracotta), generous padding, progress visualizations, friendly typography.

**Music/Audio:** Waveform elements, dark + vibrant accents, equalizer visualizations, album-art color extraction.

**Entertainment/Gaming:** Dark backgrounds + neon accents, angular shapes, glow effects on interaction, HUD-inspired layouts, aggressive typography.

## Creative License

**You have permission to be bold.** The semantic color system and component libraries are guardrails, not cages. For apps with strong personality—entertainment, social, creative tools—feel free to:

- Break from minimal aesthetics when the domain calls for it
- Use dramatic color combinations that match the app's energy
- Add atmospheric effects (glows, gradients, textures)
- Embrace maximalism when it serves the experience

Conservative design fits productivity tools and enterprise software. For apps meant to engage or excite—**lean into the aesthetic**. Trust your judgment about what the app wants to be.

**The goal is memorable, not safe.** Each project should feel distinct—vary your font choices, color approaches, and layouts. If you find yourself reaching for the same patterns repeatedly, push yourself to explore something new.

## Responsive Design & Render Modes

Your app renders in different modes (check `renderContext.type`):

**Widget Mode** (`type: "widget"`): ~300x300px dashboard widget. Show only essential information, compact text, content starts at top. Design for passive consumption, not active use. Avoid scrolling unless necessary.

**Full Screen Mode** (`type: "app"` or `type: "feed_item"`): Full screen, must be responsive across mobile and desktop.

### Shared Logic Pattern

**CRITICAL:** Share business logic between widget and app modes. Only separate the presentation layer. If you duplicate logic, bugs only get fixed in one view.

```tsx
function useItemsData() {
  const { data, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => call<typeof getItems>('getItems', {}),
  });
  return { data, isLoading };
}

export default function App({ renderContext }: { renderContext: RenderContext }) {
  const { data, isLoading } = useItemsData();
  if (isLoading) return <LoadingIcon />;

  if (renderContext.type === "widget") {
    return <CompactWidgetView data={data} />;
  }
  return <FullInteractiveView data={data} />;
}
```

## Dark and Light Mode

All interfaces must work in both themes. The system handles switching—never add a theme toggle.

**Semantic colors available:**
`bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `text-secondary-foreground`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `text-accent-foreground`, `bg-destructive`, `text-destructive-foreground`, `border`

Use explicit colors only for data visualization or when users specifically request them. When using explicit colors, include dark mode variants: `text-emerald-600 dark:text-emerald-400`.

## Rendering Markdown

When displaying markdown content, use `react-markdown` with custom component styling:

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-6">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>,
    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
    a: ({ href, children }) => <a href={href} className="text-primary underline">{children}</a>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-muted pl-4 italic">{children}</blockquote>,
  }}
>
  {content}
</ReactMarkdown>
```

Install with: `bun add react-markdown remark-gfm`

## UI Polish & Best Practices

### Loading States
- Use the `LoadingIcon` component from `examples/components/LoadingIcon.tsx`
- Always show loading feedback for async operations
- Consider skeleton screens for content-heavy views

### Icons & Visual Elements
- **Use Lucide icons** (`lucide-react`) for all interface icons
- **Never use emoji** as decoration or interface icons unless explicitly requested
- Maintain consistent icon sizing throughout the UI

### Component Libraries
- **Use shadcn/ui components** when available
- Standard components are in `examples/components/`—use these first
- Customize components to match your aesthetic vision

### Empty States & Error Handling
- Design thoughtful empty states ("No items yet" with helpful next steps)
- Handle error states gracefully with clear, actionable messages
- Use `text-destructive` color for error messages

### Micro-interactions & Feedback
- Button states: hover, active, disabled, loading
- Form validation: inline feedback, clear error messages
- Smooth transitions between states
