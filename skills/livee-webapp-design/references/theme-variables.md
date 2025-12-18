# Theme Variables

CSS variables based on shadcn preset: **radix-lyra style + zinc base + indigo theme**.

```
npx shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=lyra&baseColor=zinc&theme=indigo&iconLibrary=lucide&font=inter&menuAccent=subtle&menuColor=default&radius=default&template=next"
```

## Light Mode

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);

  --primary: oklch(0.51 0.23 277);                /* Indigo */
  --primary-foreground: oklch(0.96 0.02 272);

  --secondary: oklch(0.967 0.001 286.375);        /* Zinc light */
  --secondary-foreground: oklch(0.21 0.006 285.885);

  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);

  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);

  --destructive: oklch(0.577 0.245 27.325);       /* Red */

  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.705 0.015 286.067);

  --radius: 0;                                   /* Squared design */

  /* Sidebar */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.51 0.23 277);
  --sidebar-primary-foreground: oklch(0.96 0.02 272);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.705 0.015 286.067);

  /* Chart colors */
  --chart-1: oklch(0.51 0.23 277);
  --chart-2: oklch(0.623 0.214 259.815);
  --chart-3: oklch(0.546 0.245 262.881);
  --chart-4: oklch(0.488 0.243 264.376);
  --chart-5: oklch(0.424 0.199 265.638);
}
```

## Dark Mode

```css
.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);

  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);

  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);

  --primary: oklch(0.59 0.20 277);                /* Indigo lighter */
  --primary-foreground: oklch(0.96 0.02 272);

  --secondary: oklch(0.274 0.006 286.033);        /* Zinc dark */
  --secondary-foreground: oklch(0.985 0 0);

  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);

  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);

  --destructive: oklch(0.704 0.191 22.216);

  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.552 0.016 285.938);

  /* Sidebar */
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.68 0.16 277);
  --sidebar-primary-foreground: oklch(0.96 0.02 272);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.552 0.016 285.938);

  /* Chart colors */
  --chart-1: oklch(0.59 0.20 277);
  --chart-2: oklch(0.623 0.214 259.815);
  --chart-3: oklch(0.546 0.245 262.881);
  --chart-4: oklch(0.488 0.243 264.376);
  --chart-5: oklch(0.424 0.199 265.638);
}
```

## Complete globals.css Template

Copy this to `apps/web/app/globals.css`:

```css
@import "tw-animate-css";
@import "tailwindcss";

@config "../tailwind.config.ts";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);

  --primary: oklch(0.51 0.23 277);
  --primary-foreground: oklch(0.96 0.02 272);

  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);

  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);

  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);

  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);

  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.705 0.015 286.067);

  --radius: 0;                                   /* Squared design */

  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.51 0.23 277);
  --sidebar-primary-foreground: oklch(0.96 0.02 272);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.705 0.015 286.067);

  --chart-1: oklch(0.51 0.23 277);
  --chart-2: oklch(0.623 0.214 259.815);
  --chart-3: oklch(0.546 0.245 262.881);
  --chart-4: oklch(0.488 0.243 264.376);
  --chart-5: oklch(0.424 0.199 265.638);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);

  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);

  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);

  --primary: oklch(0.59 0.20 277);
  --primary-foreground: oklch(0.96 0.02 272);

  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);

  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);

  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);

  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);

  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.552 0.016 285.938);

  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.68 0.16 277);
  --sidebar-primary-foreground: oklch(0.96 0.02 272);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.552 0.016 285.938);

  --chart-1: oklch(0.59 0.20 277);
  --chart-2: oklch(0.623 0.214 259.815);
  --chart-3: oklch(0.546 0.245 262.881);
  --chart-4: oklch(0.488 0.243 264.376);
  --chart-5: oklch(0.424 0.199 265.638);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: var(--font-sans), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
}

@theme inline {
  --font-sans: var(--font-sans);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}
```

## Using Theme Colors in Tailwind

| Variable | Tailwind Class |
|----------|----------------|
| `--background` | `bg-background` |
| `--foreground` | `text-foreground` |
| `--primary` | `bg-primary`, `text-primary` |
| `--primary-foreground` | `text-primary-foreground` |
| `--secondary` | `bg-secondary`, `text-secondary` |
| `--secondary-foreground` | `text-secondary-foreground` |
| `--muted` | `bg-muted` |
| `--muted-foreground` | `text-muted-foreground` |
| `--accent` | `bg-accent` |
| `--accent-foreground` | `text-accent-foreground` |
| `--destructive` | `bg-destructive`, `text-destructive` |
| `--border` | `border-border` |
| `--input` | `border-input` |
| `--ring` | `ring-ring` |
| `--card` | `bg-card` |
| `--card-foreground` | `text-card-foreground` |

## Theme Characteristics

- **Style**: Lyra (radix-based) + **Squared/Boxy Design**
- **Base Color**: Zinc (neutral gray with slight warmth)
- **Accent Color**: Indigo (oklch hue 277)
- **Border Radius**: 0 (squared design - no rounded corners)
- **Color Space**: OKLch (perceptually uniform)
- **Font**: Inter
- **Icons**: Lucide

## Squared Design Note

All components use `rounded-sm` Tailwind class (which resolves to near-0px with `--radius: 0`):
- Button, Badge, Input, Textarea, Select, Card, DropdownMenu all use squared corners
