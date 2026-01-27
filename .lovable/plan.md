

# Add Team Templates - Perspective-Style

## Summary

Expand the Team section from 1 basic template to 10 Perspective-style templates matching the reference screenshots. These showcase individual team members and team grids with consistent light-themed visual language.

---

## Template Patterns Identified

From the uploaded screenshots, I identified **10 distinct Team patterns**:

| Template | Layout | Key Elements |
|----------|--------|--------------|
| **Team Member Split - Text Left** | 50/50 | Name + blue role label + bio on left, large image on right |
| **Team Member Split - Image Left** | 50/50 | Large image on left, blue role label + name + bio on right |
| **Team Member Split + Features** | 50/50 | Name + role + icon features on left, image on right |
| **Team Grid Simple** | Centered | Title + subtext, 3-column grid of photo cards with name + description |
| **Team Grid + Label** | Centered | Blue "This is our Team" label + title, 3-column photo grid |
| **Team Grid No Description** | Centered | Same as simple but without description text under names |
| **Team Full Image** | Centered | Blue label + title + subtext + full-width team photo |
| **Team Grid Cards** | Centered | 2x3 white cards with avatar, name, role, description |
| **Team Grid Cards (Gray)** | Centered | Same but with gray background |
| **Team Split + CTA** | 50/50 | "Get to know our Team" + button on left, 2x2 team member grid on right |

---

## Visual Style Specifications

### Common Elements

| Element | Style |
|---------|-------|
| **Section Label** | Blue text "This is our Team" above title |
| **Headlines** | Bold slate-800 text (e.g., "Meet our Experts") |
| **Role Labels** | Blue text for job titles (e.g., "Head of Engineering") |
| **Subtext** | Light slate-400/500 text for descriptions |
| **Images** | Rounded corners, professional photos |
| **Cards** | White background with subtle borders/shadows |

---

## ASCII Template Layouts

### Team Member Split - Text Left (Philipp Schilling style)
```text
+------------------------+------------------------+
|  Philipp Schilling     |                        |
|  [Head of Engineering] |   [Large Professional  |
|  (blue text)           |    Photo]              |
|                        |                        |
|  Philipp is Head of    |                        |
|  Engineering at...     |                        |
|                        |                        |
|  He brings experience  |                        |
|  in software dev...    |                        |
+------------------------+------------------------+
```

### Team Member Split - Image Left (Julia Schmidt style)
```text
+------------------------+------------------------+
|                        |  [Digital Marketing]   |
|   [Large Professional  |  Julia Schmidt         |
|    Photo]              |                        |
|                        |  Julia is Head of      |
|                        |  Digital Marketing...  |
|                        |                        |
|                        |  With her experience   |
|                        |  in online marketing...|
+------------------------+------------------------+
```

### Team Member Split + Features (Maximilian Weber style)
```text
+------------------------+------------------------+
|  [Digital Marketing]   |                        |
|  Maximilian Weber      |   [Large Professional  |
|                        |    Photo]              |
|  💰 Financial Planning |                        |
|     Maximilian leads...|                        |
|                        |                        |
|  📊 Risk Management    |                        |
|     Monitors risk...   |                        |
|                        |                        |
|  📈 Investment Strategy|                        |
|     Develops strategy..|                        |
+------------------------+------------------------+
```

### Team Grid Simple
```text
+------------------------------------------------+
|          Meet our experts                       |
|  Discover our diverse, talented team...         |
|                                                 |
|  ┌──────┐    ┌──────┐    ┌──────┐             |
|  │ PHOTO│    │ PHOTO│    │ PHOTO│             |
|  │      │    │      │    │      │             |
|  └──────┘    └──────┘    └──────┘             |
|  Philipp     Julia       Maximilian            |
|  Schilling   Schmidt     Weber                 |
|  [bio text]  [bio text]  [bio text]            |
+------------------------------------------------+
```

### Team Grid + Label
```text
+------------------------------------------------+
|           [This is our Team]                    |
|          Meet our Experts                       |
|  Discover our diverse, talented team...         |
|                                                 |
|  ┌──────┐    ┌──────┐    ┌──────┐             |
|  │ PHOTO│    │ PHOTO│    │ PHOTO│             |
|  └──────┘    └──────┘    └──────┘             |
|  Name        Name        Name                  |
|  [bio]       [bio]       [bio]                 |
+------------------------------------------------+
```

### Team Grid No Description
```text
+------------------------------------------------+
|          Meet our experts                       |
|  Discover our diverse, talented team...         |
|                                                 |
|  ┌──────┐    ┌──────┐    ┌──────┐             |
|  │ PHOTO│    │ PHOTO│    │ PHOTO│             |
|  └──────┘    └──────┘    └──────┘             |
|  Philipp     Julia       Maximilian            |
|  Schilling   Schmidt     Weber                 |
+------------------------------------------------+
```

### Team Full Image
```text
+------------------------------------------------+
|           [This is our Team]                    |
|          Meet our Experts                       |
|  Discover our diverse, talented team...         |
|                                                 |
|   [Full-Width Office/Meeting Room Photo]        |
|                                                 |
+------------------------------------------------+
```

### Team Grid Cards (2x3)
```text
+------------------------------------------------+
|           [This is our Team]                    |
|          Meet our Experts                       |
|                                                 |
| ┌─────────────┐ ┌─────────────┐ ┌─────────────┐|
| │ (o) Name    │ │ (o) Name    │ │ (o) Name    │|
| │  Role       │ │  Role       │ │  Role       │|
| │             │ │             │ │             │|
| │ Description │ │ Description │ │ Description │|
| │ text...     │ │ text...     │ │ text...     │|
| └─────────────┘ └─────────────┘ └─────────────┘|
| ┌─────────────┐ ┌─────────────┐ ┌─────────────┐|
| │ (o) Name    │ │ (o) Name    │ │ (o) Name    │|
| │  Role       │ │  Role       │ │  Role       │|
| │ Description │ │ Description │ │ Description │|
| └─────────────┘ └─────────────┘ └─────────────┘|
+------------------------------------------------+
```

### Team Grid Cards (Gray BG)
```text
Same as above but with gray/slate-50 background
```

### Team Split + CTA
```text
+------------------------+------------------------+
| [Become part of the    |  ┌────┐    ┌────┐    |
|  community]            |  │PHOTO│   │PHOTO│    |
|                        |  │Name │   │Name │    |
| Get to know            |  │bio  │   │bio  │    |
| our Team               |  └────┘    └────┘    |
|                        |  ┌────┐    ┌────┐    |
| [Apply now]            |  │PHOTO│   │PHOTO│    |
|                        |  │Name │   │Name │    |
|                        |  │bio  │   │bio  │    |
|                        |  └────┘    └────┘    |
+------------------------+------------------------+
```

---

## File Changes

### 1. `sectionTemplates.ts`

Remove the single `teamSection` template and add 10 new Team templates:

| New Template ID | Name |
|-----------------|------|
| `team-member-text-left` | Team Member (Text Left) |
| `team-member-image-left` | Team Member (Image Left) |
| `team-member-features` | Team Member + Features |
| `team-grid-simple` | Team Grid |
| `team-grid-label` | Team Grid + Label |
| `team-grid-no-desc` | Team Grid (No Description) |
| `team-full-image` | Team Full Image |
| `team-grid-cards` | Team Grid Cards |
| `team-grid-cards-gray` | Team Grid Cards (Gray) |
| `team-split-cta` | Team + CTA |

Update:
- `allSectionTemplates` array
- `sectionTemplatesByCategory.team` array

### 2. `HighTicketPreviewCard.tsx`

Replace the single `TeamPreview` component with a multi-variant `TeamPreview` component:

```tsx
const TeamPreview = React.forwardRef<HTMLDivElement, { template: SectionTemplate }>(
  ({ template }, ref) => {
    const id = template.id;
    
    // Shared components
    const BlueSectionLabel = () => (
      <div className="text-[6px] text-blue-500 font-medium">This is our Team</div>
    );
    
    const BlueRoleLabel = () => (
      <div className="text-[5px] text-blue-500 font-medium">Head of Engineering</div>
    );
    
    const TeamMemberCard = ({ hasDesc = true }: { hasDesc?: boolean }) => (
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 mb-1" />
        <div className="h-1 w-6 bg-slate-700 rounded mb-0.5" />
        {hasDesc && <div className="h-0.5 w-8 bg-slate-300 rounded" />}
      </div>
    );
    
    const TeamCardWithAvatar = () => (
      <div className="bg-white rounded border border-slate-100 p-1.5 flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-400" />
          <div>
            <div className="h-0.5 w-8 bg-slate-700 rounded" />
            <div className="h-0.5 w-5 bg-slate-400 rounded mt-0.5" />
          </div>
        </div>
        <div className="h-0.5 w-full bg-slate-200 rounded" />
      </div>
    );
    
    // Variant implementations based on id...
  }
);
```

Update `getPreviewComponent` to handle 10 variants:

```tsx
case 'team':
  return <TeamPreview template={template} />;
```

---

## Implementation Order

1. **Update `sectionTemplates.ts`**:
   - Remove `teamSection` 
   - Add 10 new team templates with proper `createNode` functions
   - Update `allSectionTemplates` array
   - Update `sectionTemplatesByCategory.team` array

2. **Update `HighTicketPreviewCard.tsx`**:
   - Replace simple `TeamPreview` with multi-variant component
   - Add shared components (BlueSectionLabel, BlueRoleLabel, TeamMemberCard, etc.)
   - Implement all 10 variant layouts
   - Update `getPreviewComponent` switch case

---

## New Preview Component Structure

### Shared Helper Components

```tsx
// Blue section label
const BlueSectionLabel = () => (
  <div className="text-[6px] text-blue-500 font-medium">This is our Team</div>
);

// Blue role label (for individual member templates)
const BlueRoleLabel = () => (
  <div className="text-[5px] text-blue-500 font-medium">Head of Engineering</div>
);

// Photo card for grid layouts
const TeamMemberCard = ({ hasDesc = true }: { hasDesc?: boolean }) => (
  <div className="flex flex-col items-center gap-0.5">
    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300" />
    <div className="h-1 w-5 bg-slate-700 rounded" />
    {hasDesc && <div className="h-0.5 w-7 bg-slate-300 rounded" />}
  </div>
);

// Avatar card for card grid layouts
const TeamCardWithAvatar = () => (
  <div className="bg-white rounded border border-slate-100 p-1 flex flex-col gap-0.5">
    <div className="flex items-center gap-1">
      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
      <div>
        <div className="h-0.5 w-6 bg-slate-700 rounded" />
        <div className="h-0.5 w-4 bg-slate-400 rounded mt-0.5" />
      </div>
    </div>
    <div className="h-0.5 w-full bg-slate-200 rounded" />
  </div>
);

// Icon feature row for team member + features
const FeatureRow = ({ color }: { color: string }) => (
  <div className="flex items-start gap-1">
    <div className={cn("w-2 h-2 rounded flex-shrink-0", color)} />
    <div className="flex-1">
      <div className="h-0.5 w-6 bg-slate-600 rounded" />
      <div className="h-0.5 w-10 bg-slate-300 rounded mt-0.5" />
    </div>
  </div>
);
```

---

## Result

After implementation:
- "Team" category expanded from 1 to 10 Perspective-style templates
- Light-themed previews matching the visual language of Hero, Features, CTA, About Us, and Quiz/Form
- Professional team showcasing layouts for individual members and team grids
- Consistent blue accent for role labels and section labels

