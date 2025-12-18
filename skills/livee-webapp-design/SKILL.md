---
name: livee-webapp-design
description: Design and implement frontend UI for Livee Platform using shadcn radix-lyra style with zinc + indigo theme. Use when creating new pages, components, or UI features in apps/web/. Triggers for (1) Creating new Next.js pages or React components (2) Designing UI layouts and interfaces (3) Using shadcn/ui components (Button, Card, Badge, Input, Select, Table, etc.) (4) Applying Tailwind CSS with project theme variables (5) Building responsive and accessible interfaces.
---

# Livee Webapp Design

Frontend design skill using **shadcn radix-lyra** style with **zinc base + indigo accent**.

## Tech Stack

- **Framework**: Next.js 14+ (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS v4, CSS Variables (OKLch color space)
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Font**: Inter (`--font-sans`)
- **Theme**: radix-lyra + zinc + indigo
- **Design Style**: Squared/Boxy (no rounded corners, `--radius: 0`)

## Theme Preset

```bash
npx shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=lyra&baseColor=zinc&theme=indigo&iconLibrary=lucide&font=inter&menuAccent=subtle&menuColor=default&radius=default&template=next"
```

## Quick Start

### Import Pattern

```tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

### Basic Page Structure

```tsx
export default function PageName() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
          <p className="text-sm text-muted-foreground">Description</p>
        </div>
        <Button>Action</Button>
      </div>
      <Separator className="my-4" />
      {/* Content */}
    </div>
  );
}
```

## Available Components

| Component | Import | Usage |
|-----------|--------|-------|
| Button | `@/components/ui/button` | Actions, links with `asChild` |
| Card | `@/components/ui/card` | Content containers |
| Badge | `@/components/ui/badge` | Status indicators |
| Input | `@/components/ui/input` | Text input fields |
| Select | `@/components/ui/select` | Dropdown selection |
| Table | `@/components/ui/table` | Data tables |
| Separator | `@/components/ui/separator` | Visual dividers |
| DropdownMenu | `@/components/ui/dropdown-menu` | Context menus |
| Label | `@/components/ui/label` | Form labels |

## Theme Colors

Primary color is **Indigo** (oklch hue 277), base is **Zinc**.

| Purpose | Class Example | Color |
|---------|---------------|-------|
| Primary action | `bg-primary text-primary-foreground` | Indigo |
| Secondary | `bg-secondary text-secondary-foreground` | Zinc light |
| Muted text | `text-muted-foreground` | Zinc gray |
| Destructive | `bg-destructive text-destructive-foreground` | Red |
| Card background | `bg-card text-card-foreground` | White |
| Border | `border-border` | Zinc border |
| Background | `bg-background` | White |

## Component Examples

### Button Variants

```tsx
<Button variant="default">Primary</Button>      {/* Indigo bg */}
<Button variant="secondary">Secondary</Button>  {/* Zinc bg */}
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

{/* Link button */}
<Button asChild variant="secondary">
  <Link href="/path">Go</Link>
</Button>
```

### Badge Variants

```tsx
<Badge variant="default">LIVE</Badge>       {/* Indigo bg */}
<Badge variant="secondary">READY</Badge>    {/* Zinc bg */}
<Badge variant="outline">ENDED</Badge>
<Badge variant="destructive">ERROR</Badge>  {/* Red bg */}
```

### Card with Content

```tsx
<Card className="p-4">
  <div className="flex items-center justify-between">
    <div>
      <Badge variant="secondary">READY</Badge>
      <div className="text-sm font-medium">Title</div>
      <div className="text-xs text-muted-foreground">Subtitle</div>
    </div>
    <Button size="sm">Action</Button>
  </div>
</Card>
```

### Form Controls

```tsx
{/* Input */}
<Input placeholder="Search..." value={val} onChange={(e) => setVal(e.target.value)} />

{/* Select */}
<Select value={status} onValueChange={setStatus}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All</SelectItem>
    <SelectItem value="active">Active</SelectItem>
  </SelectContent>
</Select>
```

## Icons (Lucide)

```tsx
import { Check, ChevronDown, Menu, X, Search, Settings } from 'lucide-react';

<Check className="h-4 w-4" />
<Menu className="h-5 w-5" />
```

## Layout Patterns

### Header with Actions

```tsx
<div className="flex flex-wrap items-end justify-between gap-3">
  <div className="flex flex-col gap-2">
    <h1 className="text-2xl font-semibold tracking-tight">Title</h1>
    <p className="text-sm text-muted-foreground">Description</p>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="secondary">Secondary</Button>
    <Button>Primary</Button>
  </div>
</div>
```

### Card Grid

```tsx
<div className="grid gap-3">
  {items.map((item) => (
    <Card key={item.id} className="p-4">
      {/* Card content */}
    </Card>
  ))}
</div>
```

### Filter Bar

```tsx
<div className="flex flex-wrap gap-2">
  <div className="w-[180px]">
    <Select value={filter} onValueChange={setFilter}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{/* Items */}</SelectContent>
    </Select>
  </div>
  <div className="flex-1 min-w-[240px]">
    <Input placeholder="Search..." />
  </div>
</div>
```

## cn() Utility

Combine classes conditionally:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'large' ? 'large-classes' : 'small-classes'
)} />
```

## References

- **Theme Variables**: See `references/theme-variables.md` for complete CSS variable list and globals.css template
- **Component Details**: See `references/components.md` for detailed component API
