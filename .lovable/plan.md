
# Add Premium Elements to Interactive Blocks Grid

## Summary

Add the 7 premium element types to the Interactive Blocks grid in the SectionPicker. These are high-impact visual elements for premium funnel designs that should be easily accessible alongside questions and forms.

---

## Premium Elements to Add

| Element | Description | Use Case |
|---------|-------------|----------|
| **Gradient Text** | Text with gradient fill | Bold accent phrases, headlines |
| **Underline Text** | Text with styled underline | Emphasis, key terms |
| **Stat Number** | Big numbers with labels | Social proof metrics ("10K+ Users") |
| **Avatar Group** | Overlapping avatar circles | Social proof, team display |
| **Ticker** | Scrolling marquee text | Announcements, urgency |
| **Badge** | Label badges | Tags, status indicators |
| **Process Step** | Step indicators | How it works, processes |

---

## File Changes

### 1. Create Premium Element Mockups

**New file: `src/flow-canvas/builder/components/SectionPicker/PremiumBlockIcons.tsx`**

Create high-fidelity visual mockups matching the style of `InteractiveBlockIcons.tsx`:

```tsx
/**
 * PremiumBlockIcons - Visual mockups for premium elements
 * Match the visual style of InteractiveBlockIcons
 */

export function GradientTextMockup() {
  // Gradient text preview with purple-to-pink gradient
}

export function UnderlineTextMockup() {
  // Text with styled underline accent
}

export function StatNumberMockup() {
  // Big number like "10K+" with label
}

export function AvatarGroupMockup() {
  // 3 overlapping avatar circles
}

export function TickerMockup() {
  // Scrolling marquee bar preview
}

export function BadgeMockup() {
  // Small pill badge with icon
}

export function ProcessStepMockup() {
  // Step number circle with arrow
}
```

---

### 2. Update InteractiveBlockGrid

**File: `src/flow-canvas/builder/components/SectionPicker/InteractiveBlockGrid.tsx`**

Add a new "Premium Elements" section after Forms:

```tsx
import {
  GradientTextMockup,
  UnderlineTextMockup,
  StatNumberMockup,
  AvatarGroupMockup,
  TickerMockup,
  BadgeMockup,
  ProcessStepMockup,
} from './PremiumBlockIcons';

// Add new array
const PREMIUM_BLOCKS = [
  { id: 'gradient-text', name: 'Gradient Text', mockup: <GradientTextMockup /> },
  { id: 'underline-text', name: 'Underline Text', mockup: <UnderlineTextMockup /> },
  { id: 'stat-number', name: 'Stat Number', mockup: <StatNumberMockup /> },
  { id: 'avatar-group', name: 'Avatar Group', mockup: <AvatarGroupMockup /> },
  { id: 'ticker', name: 'Ticker', mockup: <TickerMockup /> },
  { id: 'badge', name: 'Badge', mockup: <BadgeMockup /> },
  { id: 'process-step', name: 'Process Step', mockup: <ProcessStepMockup /> },
];

// In the component render, add after Forms section:
{/* Premium Elements */}
<h3 className="text-sm font-semibold text-gray-700 mb-4">Premium Elements</h3>
<div className="grid grid-cols-2 gap-3">
  {PREMIUM_BLOCKS.map(block => (
    <InteractiveBlockCard
      key={block.id}
      id={block.id}
      name={block.name}
      mockup={block.mockup}
      onAdd={() => onAddBlock(block.id)}
    />
  ))}
</div>
```

---

## Visual Mockup Designs

Each mockup will follow the existing pattern from `InteractiveBlockIcons.tsx`:

```text
┌─────────────────────┐
│  ┌─Title bar──┐     │  ← Colored accent bar
│  └────────────┘     │
│                     │
│   [Visual preview]  │  ← Representative preview
│                     │
├─────────────────────┤
│     Label Name      │  ← Element name
└─────────────────────┘
```

**Gradient Text**: Purple-to-pink gradient text sample
**Stat Number**: "10K+" in large bold text with label
**Avatar Group**: 3 overlapping colored circles
**Ticker**: Horizontal scrolling bar with dots
**Badge**: Small rounded pill with checkmark
**Process Step**: Numbered circle (1) with arrow

---

## Result

- Premium elements visible in Interactive Blocks tab
- Consistent visual treatment with Questions and Forms
- Easy access to high-impact design elements
- No separate navigation needed
