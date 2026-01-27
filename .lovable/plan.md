

# Complete Funnel Builder System Refactor

## The Problem: Why It's Confusing Right Now

Looking at your screenshots, I can see the current state has **multiple overlapping systems** that don't work together clearly:

### What You're Seeing Now

```text
LEFT PANEL ("Add Content")               CANVAS                          RIGHT PANEL
┌─────────────────────────┐    ┌─────────────────────────────┐    ┌──────────────────────┐
│ ← Add Content       X   │    │  "Welcome to Your Funnel"   │    │  Section             │
│ ┌─────────────────────┐ │    │                             │    │  ──────────────────  │
│ │ 🔍 Search content...│ │    │  + Add content              │    │  General             │
│ └─────────────────────┘ │    │  ─────────────────────      │    │  Section Name        │
│                         │    │                             │    │  Section Width       │
│ ▼ Informative     4     │    │  + Add Section              │    │  Spacing             │
│ ▼ Embed           5     │    │                             │    │  Section Background  │
│ ▼ Questions       4     │    │  ─────────────────────      │    │                      │
│ ▼ Forms           9     │    │  "Add your content here"    │    │                      │
│ ▼ Scheduling      2     │    │                             │    │                      │
│ ▼ Flows           1     │    │  + Add content              │    │                      │
│ ▼ Premium         5     │    │  ─────────────────────      │    │                      │
│ ▼ Basic Blocks   12     │    │                             │    │                      │
│                         │    │  + (dotted circle)          │    │                      │
└─────────────────────────┘    └─────────────────────────────┘    └──────────────────────┘
```

**Problems:**
1. "Add Content" panel has 40+ items across 8 categories - overwhelming
2. Canvas has "Add content" AND "Add Section" - what's the difference?
3. No visual previews in the left panel - just text lists
4. Categories like "Questions", "Forms", "Embed" overlap conceptually
5. "Premium" and "Basic Blocks" are confusing labels
6. No guidance on what to add for high-converting funnels

---

## The Solution: Clear Three-Level Hierarchy

### New Mental Model

```text
FUNNEL → STEPS → SECTIONS → BLOCKS

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 1: Home                                                         │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ SECTION: Hero                                                  │   │
│ │ ┌────────────────────────────────────────────────────────────┐ │   │
│ │ │ BLOCK: Headline    │ BLOCK: Subtext   │ BLOCK: CTA Button │ │   │
│ │ └────────────────────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ SECTION: Social Proof                                          │   │
│ │ ┌────────────────────────────────────────────────────────────┐ │   │
│ │ │ BLOCK: Star Rating │ BLOCK: Testimonial                    │ │   │
│ │ └────────────────────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Two Simple Adding Actions

| Action | What It Does | Where It Shows |
|--------|--------------|----------------|
| **Add Section** | Adds a new container (Hero, CTA, Form, etc.) | Modal with visual previews |
| **Add Block** | Adds content inside a section | Inline popover with 10 options |

---

## New System Architecture

### 1. Simplified Left Panel (Navigation Only)

```text
LEFT PANEL - NAVIGATION FOCUSED
┌─────────────────────────────────┐
│ ← Pages                     X   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏠 Home                    ›│ │  ← Current step
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 📄 Qualification           ›│ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 📄 Booking                 ›│ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ + Add Step                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ ▼ Layers                        │  ← Collapsible tree view
│   Section: Hero                 │
│     ├ Headline                  │
│     ├ Subtext                   │
│     └ CTA Button                │
│   Section: Social Proof         │
│     ├ Star Rating               │
│     └ Quote                     │
└─────────────────────────────────┘
```

**What's removed:**
- All "Add Content" block categories
- Search functionality for blocks
- The confusion of blocks vs sections in the same panel

### 2. New Section Picker (Premium Visual Modal)

When user clicks "Add Section" anywhere, they get this modal:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Add Section                                                              ×  │
├────────────────────────┬─────────────────────────────────────────────────────┤
│                        │                                                     │
│  LAYOUT SECTIONS       │   ┌──────────────────┐  ┌──────────────────┐       │
│  ───────────────       │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │       │
│                        │   │ ░░░░░░░░░░░░░░░░ │  │ ░░ ▓▓▓▓▓▓▓▓ ░░░░ │       │
│  ● Hero           ›  3 │   │ ░░░ [CTA] ░░░░░░ │  │ ░░ ░░░░░░░░ ░░░░ │       │
│    Opening sections    │   │ ★★★★★            │  │ ░░░ [CTA] ░░░░░░ │       │
│                        │   ├──────────────────┤  ├──────────────────┤       │
│  ○ CTA             › 2 │   │ Simple Hero      │  │ Hero + CTA       │       │
│    Conversion buttons  │   │ Headline + text  │  │ With button      │       │
│                        │   └──────────────────┘  └──────────────────┘       │
│  ○ Media           › 2 │                                                     │
│    Video & images      │   ┌──────────────────┐                             │
│                        │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                             │
│  ○ Embed           › 2 │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                             │
│    Calendars & forms   │   │ ▓▓▓▓ IMAGE ▓▓▓▓▓ │                             │
│                        │   │ ░░░░░░░░░░░░░░░░ │                             │
│  ○ Social Proof    › 1 │   ├──────────────────┤                             │
│    Trust indicators    │   │ Hero + Image     │                             │
│                        │   │ Card layout      │                             │
│  ○ Features        › 1 │   └──────────────────┘                             │
│    Benefits & lists    │                                                     │
│                        │                                                     │
│  ───────────────       │                                                     │
│  CONVERSION SECTIONS   │   3 templates • Click to add                       │
│  ───────────────       │                                                     │
│                        │                                                     │
│  ○ Lead Capture    › 3 │                                                     │
│    Email, phone, name  │                                                     │
│                        │                                                     │
│  ○ Qualification   › 4 │                                                     │
│    Questions & choices │                                                     │
│                        │                                                     │
│  ○ Booking         › 2 │                                                     │
│    Calendar embeds     │                                                     │
│                        │                                                     │
└────────────────────────┴─────────────────────────────────────────────────────┘
```

### 3. Inline Block Adder (Inside Sections)

When user clicks "+ Add content" inside a section:

```text
                    ┌─────────────────────────────────────┐
                    │  ADD BLOCK                          │
                    │                                     │
                    │  ┌─────────┐  ┌─────────┐          │
                    │  │   T     │  │   H     │          │
                    │  │  Text   │  │ Heading │          │
                    │  └─────────┘  └─────────┘          │
                    │  ┌─────────┐  ┌─────────┐          │
                    │  │   🖼    │  │   ▶     │          │
                    │  │  Image  │  │  Video  │          │
                    │  └─────────┘  └─────────┘          │
                    │  ┌─────────┐  ┌─────────┐          │
                    │  │   →     │  │   ✉     │          │
                    │  │ Button  │  │  Form   │          │
                    │  └─────────┘  └─────────┘          │
                    │  ┌─────────┐  ┌─────────┐          │
                    │  │   •     │  │   "     │          │
                    │  │  List   │  │  Quote  │          │
                    │  └─────────┘  └─────────┘          │
                    └─────────────────────────────────────┘
```

---

## High-Converting Template System

### Template Categories (Restructured)

| Old Category | New Category | Purpose |
|--------------|--------------|---------|
| Hero | **Hero** | Opening hook - headline, subtext, CTA |
| Content | **Content** | Text blocks, features |
| CTA | **CTA** | Conversion buttons |
| Media | **Media** | Videos, images |
| Embed | **Booking** | Calendly, Cal.com |
| Questions | **Qualification** | Single/multi choice |
| Forms | **Lead Capture** | Email, phone, name |
| Premium | *(merged into above)* | - |
| Basic Blocks | *(moved to block adder)* | - |

### New Template Library (High-Ticket Focused)

**Hero Sections (5 templates):**
```text
1. Impact Hero          - Bold headline + urgency badge + CTA
2. Video Hero           - VSL player + headline below
3. Authority Hero       - Photo + credentials + headline
4. Minimal Hero         - Clean text-only + CTA
5. Split Hero           - Image left, text right
```

**Social Proof Sections (4 templates):**
```text
1. Testimonial Carousel - Quote cards with photos
2. Logo Bar             - "As seen in" logos
3. Star Rating          - 5-star + review count
4. Results Stats        - 3-column numbers ($10M+, 500+, etc.)
```

**Lead Capture Sections (4 templates):**
```text
1. Email Only           - Minimal friction capture
2. Name + Email         - Personalization ready
3. Full Contact         - Name, email, phone
4. Quiz Lead            - Gamified capture
```

**Qualification Sections (4 templates):**
```text
1. Single Choice        - Radio button options
2. Multiple Choice      - Checkbox options
3. Budget Qualifier     - Price range selector
4. Timeline Qualifier   - Urgency indicator
```

**CTA Sections (3 templates):**
```text
1. Simple CTA           - Button only
2. CTA + Urgency        - Button + scarcity text
3. Dual CTA             - Primary + secondary options
```

**Booking Sections (3 templates):**
```text
1. Calendar Embed       - Calendly/Cal.com
2. Application Form     - Longer qualification
3. Call Scheduler       - Time slot picker
```

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `SectionPicker/SectionPicker.tsx` | Already created - needs template updates |
| `SectionPicker/TemplateGallery.tsx` | Grid of visual preview cards |
| `SectionPicker/categories.ts` | Category definitions with descriptions |
| `templates/heroTemplates.ts` | 5 hero section definitions |
| `templates/socialProofTemplates.ts` | 4 social proof definitions |
| `templates/leadCaptureTemplates.ts` | 4 lead capture definitions |
| `templates/qualificationTemplates.ts` | 4 qualification definitions |
| `templates/ctaTemplates.ts` | 3 CTA definitions |
| `templates/bookingTemplates.ts` | 3 booking definitions |

### Files to Modify

| File | Changes |
|------|---------|
| `LeftPanel.tsx` | Remove all block picking, focus on pages + layers |
| `EditorShell.tsx` | Remove BlockPickerPanel integration |
| `TopToolbar.tsx` | Single "+" button opens SectionPicker |
| `BlockAdder.tsx` | Already created - wire to sections |
| `sectionTemplates.ts` | Replace with new high-converting templates |
| `HighTicketPreviewCard.tsx` | Update previews to match new templates |

### Files to Delete

| File | Reason |
|------|--------|
| `BlockPickerPanel.tsx` | Replaced by SectionPicker + BlockAdder |
| `AddSectionPopover.tsx` | Merged into SectionPicker |
| `InlineSectionPicker.tsx` | Merged into SectionPicker |

---

## Visual Style Guide

### Template Preview Cards

All previews use the "high-ticket coaching" aesthetic:

```css
/* Premium coaching palette */
--template-dark: hsl(220 20% 8%);      /* Deep dark background */
--template-surface: hsl(220 15% 12%);   /* Card background */
--template-accent: hsl(217 91% 60%);    /* Blue accent */
--template-gold: hsl(45 90% 55%);       /* Premium gold */
--template-emerald: hsl(160 70% 45%);   /* Success green */

/* Preview card styling */
.template-preview {
  aspect-ratio: 4/3;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--template-dark), var(--template-surface));
  border: 2px solid transparent;
  transition: all 0.2s;
}

.template-preview:hover {
  border-color: var(--template-accent);
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
```

### Empty State Design

```text
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    ┌────────────────────┐                      │
│                    │                    │                      │
│                    │   📱              │                      │
│                    │                    │                      │
│                    └────────────────────┘                      │
│                                                                │
│              Start Building Your Funnel                        │
│                                                                │
│     Choose a section template to create high-converting        │
│              landing pages in minutes                          │
│                                                                │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │   █████████  │  │   █████████  │  │   █████████  │        │
│   │   ░░░░░░░░░  │  │   ███ EMAIL  │  │   ███CHOICE  │        │
│   │   [  CTA  ]  │  │   ░░░░░░░░░  │  │   ███CHOICE  │        │
│   ├──────────────┤  ├──────────────┤  ├──────────────┤        │
│   │  Hero        │  │  Lead Form   │  │  Quiz        │        │
│   └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│              [ Browse All Templates ]                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## User Flow After Refactor

### Adding a Hero Section

```text
1. User clicks "+ Add Section" (canvas or toolbar)
   ↓
2. SectionPicker modal opens
   ↓
3. "Hero" category is selected by default
   ↓
4. User sees 5 visual preview cards
   ↓
5. User clicks "Hero + CTA" template
   ↓
6. Section appears on canvas with:
   - Headline: "Your headline here"
   - Subtext: "Supporting text"
   - CTA Button: "Get Started"
   ↓
7. User clicks any element to edit in place
```

### Adding a Form Field Inside a Section

```text
1. User clicks "+ Add content" inside a section
   ↓
2. BlockAdder popover appears (10 block types)
   ↓
3. User clicks "Form" block
   ↓
4. Email input appears in the section
   ↓
5. User configures in right panel:
   - Field type (email, phone, name, text)
   - Placeholder text
   - Required toggle
```

---

## Success Metrics

After this refactor:

| Before | After |
|--------|-------|
| 40+ items in Add Content | 10 blocks in inline picker |
| 8 confusing categories | 6 clear purpose-driven categories |
| No visual previews | Every template has a rich preview |
| Text-only block lists | Perspective-style visual gallery |
| "What's the difference?" | Clear Section vs Block hierarchy |
| Generic templates | High-ticket coaching focused |

---

## Implementation Priority

```text
Phase 1: Template Library (Foundation)
├─► Create 23 high-converting templates
├─► Update HighTicketPreviewCard previews
└─► Organize into 6 categories

Phase 2: Section Picker (Main Interface)
├─► Update SectionPicker with new categories
├─► Connect to new template library
└─► Ensure visual previews work

Phase 3: Left Panel Cleanup
├─► Remove block picking entirely
├─► Focus on pages + layers only
└─► Clean navigation experience

Phase 4: Canvas Integration
├─► Wire BlockAdder to sections
├─► Remove redundant "Add Content" triggers
└─► Test full flow

Phase 5: Cleanup
├─► Delete deprecated files
├─► Remove dead code
└─► Document the system
```

