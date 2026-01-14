---
name: reading-container-dimensions
description: Guidance on when and how to track component dimensions using ResizeObserver. Use this when App.tsx needs to know its actual rendered size across different rendering contexts (widget, app, feed_item).
---

# Reading Container Dimensions

When building App.tsx, you may need to track the component's actual dimensions to adapt your UI across different rendering contexts. However, **responsive design should always be your first choice**.

## Golden Rule: Prefer Responsive Design

**Always use responsive CSS (flexbox, grid, media queries, container queries) as your default approach.** Only use ResizeObserver when your component truly needs to know its actual pixel dimensions at runtime to make rendering decisions that can't be handled by CSS alone.

## When to Use ResizeObserver

1. **Cross-Context Rendering**: Your App.tsx renders in multiple contexts (widget, app, feed_item) and needs to show fundamentally different content based on available space
2. **Canvas/WebGL**: You're rendering to canvas or WebGL and need exact pixel dimensions
3. **Third-Party Libraries**: You're integrating libraries that require explicit width/height values
4. **Complex Layout Calculations**: You need dimensions for calculations that CSS can't handle (e.g., dynamic positioning, collision detection)
5. **Responsive Data Visualization**: Charts, graphs, or visualizations that need to recalculate based on container size


## The Pattern

When you do need to track dimensions, use this pattern:

```typescript
import React, { useEffect, useState } from "react";

interface RenderContext {
  type: "widget" | "app" | "feed_item";
  data?: unknown;
}

export default function App({ renderContext }: { renderContext: RenderContext }) {
  const [size, setSize] = useState<DOMRect | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize(containerRef.current.getBoundingClientRect());
      }
    };

    // Set initial size
    updateSize();

    // Create ResizeObserver to watch the container element
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    // Start observing the container element
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // CRITICAL: Cleanup function to disconnect the observer
    return () => {
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array - set up once

  // Now you can use size to make rendering decisions
  const isCompact = size && size.width < 400;

  return (
    <div ref={containerRef} className="w-full h-full">
      {isCompact ? (
        <CompactView size={size} />
      ) : (
        <FullView size={size} />
      )}
    </div>
  );
}
```

## Key Implementation Details

### 1. Ref Attachment
The `ref={containerRef}` must be on the root element you want to measure:

```typescript
<div ref={containerRef} className="w-full h-full">
  {/* content */}
</div>

### 2. Cleanup is Critical
Always disconnect the ResizeObserver in the cleanup function:

```typescript
useEffect(() => {
  const resizeObserver = new ResizeObserver(updateSize);
  if (containerRef.current) {
    resizeObserver.observe(containerRef.current);
  }

  return () => {
    resizeObserver.disconnect(); // MUST disconnect
  };
}, []);
```

### 3. Initial Size
Always get the initial size immediately:

```typescript
const updateSize = () => {
  if (containerRef.current) {
    setSize(containerRef.current.getBoundingClientRect());
  }
};

updateSize(); // Call immediately
const resizeObserver = new ResizeObserver(updateSize);
```

## Common Patterns

### Conditional Rendering Based on Size

```typescript
export default function App({ renderContext }: { renderContext: RenderContext }) {
  const [size, setSize] = useState<DOMRect | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize(containerRef.current.getBoundingClientRect());
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Make rendering decisions based on actual size
  const showFullFeatures = size && size.width > 500 && size.height > 400;
  const isWidget = renderContext.type === "widget";

  return (
    <div ref={containerRef} className="w-full h-full">
      {!size ? (
        // Loading state while we get initial dimensions
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      ) : (
        <div>
          {showFullFeatures ? (
            <FullFeaturedView width={size.width} height={size.height} />
          ) : (
            <CompactView width={size.width} />
          )}
        </div>
      )}
    </div>
  );
}
```

### Passing Dimensions to Child Components

```typescript
function DataVisualization({ size }: { size: DOMRect | null }) {
  if (!size) return null;

  return (
    <svg width={size.width} height={size.height}>
      {/* Use exact dimensions for SVG/canvas rendering */}
      <rect width={size.width} height={size.height} fill="transparent" />
      {/* Your visualization */}
    </svg>
  );
}

export default function App({ renderContext }: { renderContext: RenderContext }) {
  const [size, setSize] = useState<DOMRect | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize(containerRef.current.getBoundingClientRect());
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <DataVisualization size={size} />
    </div>
  );
}
```