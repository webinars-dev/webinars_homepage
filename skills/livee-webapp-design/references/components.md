# Component Reference

Detailed API for shadcn/ui components in this project.

## Table of Contents

1. [Button](#button)
2. [Card](#card)
3. [Badge](#badge)
4. [Input](#input)
5. [Select](#select)
6. [Table](#table)
7. [DropdownMenu](#dropdownmenu)
8. [Separator](#separator)
9. [Label](#label)

---

## Button

**Import**: `import { Button } from '@/components/ui/button'`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Button style |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| `asChild` | `boolean` | `false` | Render as child element (for links) |

### Variant Styles

```tsx
// default: Purple background, white text
<Button>Primary Action</Button>

// secondary: Light gray background
<Button variant="secondary">Secondary</Button>

// outline: Border only
<Button variant="outline">Outline</Button>

// ghost: Transparent, hover shows background
<Button variant="ghost">Ghost</Button>

// destructive: Red for dangerous actions
<Button variant="destructive">Delete</Button>

// link: Text link style
<Button variant="link">Learn more</Button>
```

### Sizes

```tsx
<Button size="sm">Small (h-8)</Button>
<Button size="default">Default (h-9)</Button>
<Button size="lg">Large (h-10)</Button>
<Button size="icon">Icon only (h-9 w-9)</Button>
```

### As Link

```tsx
<Button asChild>
  <Link href="/path">Go to Page</Link>
</Button>
```

---

## Card

**Import**: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'`

### Components

| Component | Usage |
|-----------|-------|
| `Card` | Container with border and shadow |
| `CardHeader` | Top section with padding |
| `CardTitle` | h3 heading |
| `CardDescription` | Muted text description |
| `CardContent` | Main content area |
| `CardFooter` | Bottom section |

### Examples

```tsx
// Simple card
<Card className="p-4">
  <p>Content here</p>
</Card>

// Full structure
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

## Badge

**Import**: `import { Badge } from '@/components/ui/badge'`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline'` | `'default'` | Badge style |

### Variant Styles

```tsx
<Badge variant="default">LIVE</Badge>       // Purple bg
<Badge variant="secondary">READY</Badge>    // Gray bg
<Badge variant="outline">ENDED</Badge>      // Border only
<Badge variant="destructive">ERROR</Badge>  // Red bg
```

---

## Input

**Import**: `import { Input } from '@/components/ui/input'`

### Props

Standard HTML input props plus styling.

### Examples

```tsx
<Input placeholder="Enter text..." />
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input disabled placeholder="Disabled" />

// Controlled
const [value, setValue] = useState('');
<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// With custom width
<Input className="w-[300px]" placeholder="Fixed width" />
```

---

## Select

**Import**: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'`

### Components

| Component | Usage |
|-----------|-------|
| `Select` | Root container (controlled with `value`/`onValueChange`) |
| `SelectTrigger` | Button that opens dropdown |
| `SelectValue` | Displays selected value |
| `SelectContent` | Dropdown container |
| `SelectItem` | Individual option |
| `SelectGroup` | Group items |
| `SelectLabel` | Label for group |
| `SelectSeparator` | Divider between items |

### Example

```tsx
const [status, setStatus] = useState('all');

<Select value={status} onValueChange={setStatus}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All</SelectItem>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="inactive">Inactive</SelectItem>
  </SelectContent>
</Select>
```

---

## Table

**Import**: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, TableFooter } from '@/components/ui/table'`

### Example

```tsx
<Table>
  <TableCaption>List of items</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell><Badge>{item.status}</Badge></TableCell>
        <TableCell className="text-right">
          <Button size="sm" variant="ghost">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## DropdownMenu

**Import**: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'`

### Example

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Separator

**Import**: `import { Separator } from '@/components/ui/separator'`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Direction |
| `decorative` | `boolean` | `true` | Accessibility |

### Examples

```tsx
<Separator />                              // Full width horizontal
<Separator className="my-4" />             // With margin
<Separator orientation="vertical" className="h-6" />  // Vertical
```

---

## Label

**Import**: `import { Label } from '@/components/ui/label'`

### Example

```tsx
<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter email" />
</div>
```
