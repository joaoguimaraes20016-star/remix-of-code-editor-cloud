

# Match Core Components to Interactive Block Style

## Current Problem

The Core Components icons (Text, Button, Image, List, etc.) are simpler in style than the interactive blocks. Looking at the reference:

**Interactive Block Structure (what we want everywhere):**
```text
┌─────────────────────────┐
│  ═══════════════════    │  ← Title bar (colored line)
│                         │
│   ┌─────────────────┐   │
│   │ Component       │   │  ← Rich visual preview
│   │ Preview         │   │
│   └─────────────────┘   │
│                         │
│        Label            │
└─────────────────────────┘
```

**Current Core Component Structure (too simple):**
```text
┌─────────────────────────┐
│                         │
│   Simple Icon           │  ← Just the icon, no title bar
│                         │
│        Label            │
└─────────────────────────┘
```

---

## Visual Reference Analysis

From the reference images, here's the exact pattern:

| Block | Title Bar Color | Preview Style |
|-------|----------------|---------------|
| Multiple-Choice | Green/olive line | Checkbox rows with checkmark |
| Choice | Blue line | Radio button rows |
| Quiz | Gray line | Two image cards side by side |
| Video question | Blue line | Video thumbnail with person |
| Form | Purple/indigo line | Input fields stacked |
| Appointment | Teal line | Calendar grid |
| Upload | Purple line | Dashed upload box |
| Message | Cyan line | Text area box |
| Date | Gray line | Calendar with nav arrows |
| Dropdown | Amber line | Select box + options |
| Payment | Amber line | Card inputs + Mastercard logo |

---

## Core Components - Updated Icons

Apply the same structure to content blocks:

| Block | Title Bar Color | Preview Style |
|-------|----------------|---------------|
| **Text** | Gray line | Text paragraph lines |
| **Button** | Blue line | Styled button shape |
| **Image** | Gray line | Image placeholder with landscape |
| **List** | Purple line | Bullet point rows |
| **Divider** | Gray line | Horizontal line with arrows |
| **Logo Bar** | Yellow line | Colorful shapes row |
| **Reviews** | Yellow line | Stars + avatars |
| **Spacer** | Gray line | Vertical arrows |
| **Video** | Dark/gray line | Video player frame |
| **Testimonial** | Orange line | Quote card with avatar |
| **FAQ** | Green line | Accordion rows |
| **Team** | Blue line | Person avatar circle |
| **Calendar** | Blue line | Calendar grid |
| **HTML** | Gray line | Code brackets |
| **Form** | Green line | Input fields |

---

## Implementation

### Update BlockIcons.tsx

Each icon needs the structure:
1. Title bar line at top (centered, colored)
2. Rich visual preview in center
3. Same proportions as interactive blocks

**Example - Updated TextIcon:**
```tsx
export function TextIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Title bar */}
      <div className="w-12 h-1.5 bg-slate-300 rounded" />
      {/* Rich preview */}
      <div className="flex flex-col gap-1 items-center">
        <div className="w-14 h-2 bg-slate-400 rounded" />
        <div className="w-12 h-1.5 bg-slate-300 rounded" />
        <div className="w-10 h-1.5 bg-slate-300 rounded" />
      </div>
    </div>
  );
}
```

**Example - Updated ButtonIcon:**
```tsx
export function ButtonIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Title bar */}
      <div className="w-10 h-1.5 bg-blue-300 rounded" />
      {/* Rich preview - styled button */}
      <div className="px-5 py-2 bg-blue-500 rounded-lg text-white text-xs font-medium shadow-sm">
        Button
      </div>
    </div>
  );
}
```

**Example - Updated ImageIcon:**
```tsx
export function ImageIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Title bar */}
      <div className="w-10 h-1.5 bg-slate-300 rounded" />
      {/* Rich preview - landscape image placeholder */}
      <div className="w-14 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg overflow-hidden">
        <div className="w-full h-full bg-gradient-to-t from-slate-400/40 to-transparent" />
      </div>
    </div>
  );
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `BlockIcons.tsx` | Update all Core Component icons to include title bar + consistent preview structure |

---

## Icon Updates Summary

### Core Components (8 icons to update)

1. **TextIcon** → Add gray title bar, keep text lines preview
2. **ButtonIcon** → Add blue title bar, keep button preview  
3. **ImageIcon** → Add gray title bar, use gradient landscape preview
4. **ListIcon** → Add purple title bar, keep bullet rows
5. **DividerIcon** → Add gray title bar, keep arrow + line
6. **LogoBarIcon** → Add yellow title bar, keep colorful shapes
7. **ReviewsIcon** → Add yellow title bar, keep stars + avatars
8. **SpacerIcon** → Add gray title bar, keep vertical arrows

### Media Elements (4 icons to update)

9. **VideoIcon** → Add dark title bar, enhance player preview
10. **TestimonialIcon** → Add orange title bar, enhance card
11. **FAQIcon** → Add green title bar, keep accordion rows
12. **TeamIcon** → Already has structure, verify consistency

### Embed Blocks (3 icons to update)

13. **CalendarIcon** → Already has structure (blue header), verify
14. **HTMLIcon** → Add gray title bar, enhance code preview
15. **FormIcon** → Add green title bar, keep input fields

---

## Result

After this update, all blocks will have:
- Consistent title bar + preview structure
- Visual parity with interactive blocks
- Same height/proportion feel across all cards
- Clear visual hierarchy within each tile

