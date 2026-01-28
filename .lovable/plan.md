

# Funnel Builder Complexity Audit & Simplification Plan

## Current State: It's a Mess

After deep exploration, I've discovered the system is **over-engineered with redundant concepts** that create confusion. Here's the honest breakdown:

---

## 1. THREE Parallel Builder Implementations (Redundant)

| Location | Status | What it is |
|----------|--------|------------|
| `src/flow-canvas/builder/` | **ACTIVE** | Main builder, 2093-line EditorShell |
| `src/builder_v2/` | **LEGACY** | Separate builder with own EditorShell |
| `src/components/funnel-builder/` | **LEGACY** | Third EditorShell + 32 separate files |

**Problem**: Three different architectures trying to do the same thing.

---

## 2. FOUR Systems for "Interactive Content" (Redundant)

| System | File | Status | What it does |
|--------|------|--------|--------------|
| **CaptureFlow** | `captureFlow.ts` | Deprecated | Original lead capture (email, phone, name) |
| **ApplicationEngine** | `applicationEngine.ts` | Current | Unified interactive system |
| **ApplicationFlowSettings** | `infostack.ts` | Active | Flow Container settings |
| **FlowContainerContext** | `FlowContainerContext.tsx` | Active | Runtime logic for flows |

**Problem**: Same concept ("collect data from user") implemented 4 different ways with different APIs.

---

## 3. Block Categories: What Actually Collects Data?

### Data-Collecting Blocks (Actually do something)

| Block | Element Type | fieldKey | What it captures |
|-------|-------------|----------|------------------|
| `form` | `form-group` | name, email, phone | Multi-field form |
| `form-block` | `form-group` | full_name, email, phone, message | Same as form |
| `multiple-choice` | `multiple-choice` | multiple_choice | Selected options |
| `choice` | `single-choice` | single_choice | Selected option |
| `dropdown` | `select` | dropdown | Selected value |
| `message` | `input[textarea]` | message | Free text |
| `date` | `input[date]` | date | Date value |
| `upload` | `input[file]` | file_upload | File reference |
| `quiz` | `application-flow` | (flow steps) | Quiz answers |

### Display-Only Blocks (Don't collect anything)

| Block | What it shows |
|-------|---------------|
| `text` | Static text |
| `button` | Clickable action |
| `image` | Static image |
| `video` | Embedded video |
| `divider` | Visual separator |
| `spacer` | Empty space |
| `list` | Feature list |
| `faq` | Accordion Q&A |
| `testimonial` | Quote card |
| `reviews` | Avatar group |
| `logo-bar` | Logo marquee |
| `team` | Team photos |
| `gradient-text` | Styled text |
| `underline-text` | Styled text |
| `stat-number` | Large number |
| `avatar-group` | Social proof |
| `ticker` | Scrolling text |
| `badge` | Pill label |
| `process-step` | Process visual |
| `calendar` | Calendly embed (external collection) |
| `html` | Custom embed |
| `payment` | Stripe embed (external collection) |

### Ambiguous/Confusing Blocks

| Block | Problem |
|-------|---------|
| `video-question` | Is it a video or a question? Both - confusing |
| `appointment` | Just a Calendly wrapper - doesn't collect internally |
| `payment` | Just a Stripe wrapper - doesn't collect internally |

---

## 4. The "Application Flow" vs "Blocks" Confusion

### Current Mental Model (Confusing)
```text
User sees:
├── Basic Blocks (text, button, etc.)
├── Interactive Blocks (choice, form, etc.) ← Some create flows, some don't
├── Premium Blocks (gradient, badge, etc.)
└── Flow Container (application-flow) ← What's the difference from quiz?
```

### The Actual Problem
- `quiz` creates an `application-flow` block
- `multiple-choice` creates a standalone `multiple-choice` element
- Both collect user responses
- User doesn't know which to use when

---

## 5. What's ACTUALLY Needed (Simplified Model)

### Perspective's Approach (Clear)
```text
├── Content Blocks (display only)
│   └── Text, Image, Video, Divider, etc.
├── Questions (collect answers)
│   └── Multiple Choice, Text, Date, etc.
├── Lead Capture (collect identity)
│   └── Email, Phone, Contact Form
└── Integrations (external)
    └── Calendar, Payment, HTML
```

### Key Insight: Every "Question" is really just a Form Field
- Multiple Choice = Form field with `type: radio/checkbox`
- Text Question = Form field with `type: text`
- Email Capture = Form field with `type: email`

---

## Simplification Plan

### Phase 1: Unify Mental Model (No Code Changes Yet)

**New Block Categories:**
| Category | Purpose | Collects Data? |
|----------|---------|----------------|
| **Content** | Display information | No |
| **Input** | Collect single value | Yes |
| **Form** | Collect multiple values | Yes |
| **Embed** | Third-party integration | External |

**Map Existing Blocks:**

Content: text, button, image, video, divider, spacer, list, faq, testimonial, reviews, logo-bar, team, gradient-text, underline-text, stat-number, avatar-group, ticker, badge, process-step

Input: multiple-choice, choice, dropdown, message, date, upload

Form: form, form-block, quiz (converts to multi-step form)

Embed: calendar, html, payment, appointment, video-question

### Phase 2: Consolidate Picker UI

**Current (Confusing):**
- Tab 1: Sections (hero, cta, etc.)
- Tab 2: Basic Blocks
- Tab 3: Interactive Blocks

**Proposed (Clear):**
- Tab 1: Sections (full templates)
- Tab 2: Blocks
  - Content (display only)
  - Inputs (single field)
  - Forms (multi-field)
  - Embeds (external)

### Phase 3: Deprecate Redundant Systems

1. **Keep**: `src/flow-canvas/builder/` as sole builder
2. **Deprecate**: `src/builder_v2/` (add deprecation notice)
3. **Deprecate**: `src/components/funnel-builder/` (audit for any active usage)
4. **Keep**: `ApplicationEngine` as the unified type system
5. **Deprecate**: `CaptureFlow` types (already marked deprecated)

### Phase 4: Simplify Block Factory

Instead of 30+ separate factory functions, use a **configuration-driven approach**:

```typescript
const BLOCK_CONFIGS = {
  // Content blocks
  text: { type: 'text-block', element: 'text', collectsData: false },
  image: { type: 'media', element: 'image', collectsData: false },
  
  // Input blocks
  'multiple-choice': { type: 'input', element: 'multiple-choice', collectsData: true, fieldKey: 'choice' },
  'email': { type: 'input', element: 'input', collectsData: true, fieldKey: 'email' },
  
  // Form blocks
  form: { type: 'form', element: 'form-group', collectsData: true, fields: ['name', 'email', 'phone'] },
};
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/flow-canvas/builder/components/SectionPicker/` | Reorganize tabs |
| `src/flow-canvas/builder/utils/blockFactory.ts` | Config-driven refactor |
| `src/flow-canvas/types/infostack.ts` | Add clear `collectsData` flag |
| `src/builder_v2/EditorShell.tsx` | Add deprecation banner |
| `src/components/funnel-builder/EditorShell.tsx` | Add deprecation banner |

---

## Success Criteria

1. User can instantly understand: "This block collects data, this one doesn't"
2. One clear path to add any content type
3. No duplicate ways to do the same thing
4. Remove confusion between "quiz", "form", and "flow"

---

## Summary: What's Redundant vs Essential

### Redundant (Remove/Deprecate)
- `builder_v2/EditorShell` (duplicate)
- `components/funnel-builder/EditorShell` (duplicate)
- `CaptureFlow` types (deprecated)
- `video-question` block (confusing hybrid)
- Separate `form` and `form-block` (identical)

### Essential (Keep)
- `flow-canvas/builder/EditorShell` (main)
- `ApplicationEngine` types (unified)
- `FlowContainerContext` (runtime logic)
- `blockFactory.ts` (unified creation)
- All individual element types (but organize better)

