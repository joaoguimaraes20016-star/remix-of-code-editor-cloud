# Remove All Sparkles Icons from UI

## Locations Found

1. **PublishModal.tsx** - Line 380: Still has Sparkles in success state
2. **LeftPanel.tsx** - Line 195: "Choose Template" button
3. **LeftPanel.tsx** - Line 211: "Stacker AI" badge
4. **AddBlockModal.tsx** - Line 45: "Interactive blocks" category icon
5. **AddBlockModal.tsx** - Line 67: "Quiz" section category icon
6. **TemplateGalleryModal.tsx** - Line 188: Header icon
7. **block-definitions.ts** - Line 702: Icon reference string

## Changes Required

### 1. PublishModal.tsx
- Remove Sparkles from import (line 12)
- Remove Sparkles icon from success state (line 380)

### 2. LeftPanel.tsx
- Remove Sparkles from import (line 18)
- Remove icon from "Choose Template" button (line 195)
- Remove icon from "Stacker AI" badge (line 211)

### 3. AddBlockModal.tsx
- Remove Sparkles from import (line 10)
- Replace with Zap for "Interactive blocks" (line 45)
- Replace with Target for "Quiz" section (line 67)

### 4. TemplateGalleryModal.tsx
- Remove Sparkles from import (line 14)
- Replace with LayoutTemplate (line 188)

### 5. block-definitions.ts
- Replace 'Sparkles' with 'Zap' (line 702)

## Note
Keep Sparkles in IconPicker.tsx as it's a user-selectable option, not a UI element.
