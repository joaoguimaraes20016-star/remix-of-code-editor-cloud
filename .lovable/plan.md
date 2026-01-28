
# Template & Canvas Inconsistency Audit: Complete Fix Plan

## Executive Summary

After thorough investigation, I found **12 major inconsistencies** between template previews and actual canvas rendering. The core issues fall into three categories:

1. **Missing Type Mappings** - Template node types aren't being converted to proper element types
2. **Missing Inspector Support** - Elements render but can't be edited
3. **Prop Data Loss** - Templates define data that gets dropped during conversion

---

## Issue Inventory

### Category A: Elements That Render But Can't Be Edited

| Element Type | Issue | Severity |
|-------------|-------|----------|
| `faq` | No inspector in RightPanel - shows "Add FAQ items in inspector" but no controls exist | HIGH |
| `form_group` | Converts to single `input` - loses multiple field structure | HIGH |
| `feature_list` | Converts to generic `text` - loses list structure and icons | MEDIUM |
| `testimonial_card` | Converts to generic `text` - loses avatar, name, quote structure | MEDIUM |
| `single-choice` / `multiple-choice` | Missing inspector in RightPanel (only renders, can't edit options) | HIGH |

### Category B: Data Loss During Conversion

| Template Type | What Gets Lost |
|--------------|----------------|
| `form_group` | Array of fields `[{type, placeholder, required}]` → becomes single input |
| `faq_accordion` | Items array structure (works, but items not editable in inspector) |
| `rating_display` | `source` text (e.g., "companies trust us") not displayed |
| `testimonial_card` | Author name, avatar, company, position |
| `feature_list` | Icon names, bullet point structure |

### Category C: Visual Mismatch

| Issue | Expected | Actual |
|-------|----------|--------|
| Logo Bar | Text wordmarks (Coca-Cola, IKEA, etc.) | Gray placeholder icons (FIXED in previous update) |
| Form inputs | Styled matching template | Generic unstyled inputs |
| FAQ accordion | Polished expand/collapse | Basic rendering (OK, but no edit) |

---

## Root Cause Analysis

```text
Template Definition (sectionTemplates.ts)
┌─────────────────────────────────────────┐
│ type: 'form_group'                      │
│ props: {                                │
│   fields: [                             │
│     { type: 'text', placeholder: 'Name' }│
│     { type: 'email', placeholder: 'E-Mail'}│
│   ]                                     │
│ }                                       │
└─────────────────────────────────────────┘
               │
               ▼ templateConverter.ts
┌─────────────────────────────────────────┐
│ mapNodeTypeToElementType('form_group')  │
│         → returns 'input'               │
│                                         │
│ // Props ARE passed through, but...     │
│ // Canvas only renders ONE input        │
│ // because element.type === 'input'     │
└─────────────────────────────────────────┘
               │
               ▼ CanvasRenderer.tsx
┌─────────────────────────────────────────┐
│ case 'input':                           │
│   // Renders single input               │
│   // fields[] prop ignored              │
└─────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Add Missing Inspector Controls (Priority: HIGH)

#### 1.1 Add FAQ Inspector to RightPanel.tsx

**File:** `src/flow-canvas/builder/components/RightPanel.tsx`

Add inspector section after the `trustpilot` section (~line 2989):

```typescript
{/* ========== FAQ SECTION ========== */}
{element.type === 'faq' && (
  <CollapsibleSection title="FAQ Items" icon={<HelpCircle className="w-4 h-4" />} defaultOpen>
    <div className="pt-3 space-y-3">
      <DndContext sensors={inspectorSensors} collisionDetection={closestCenter} onDragEnd={...}>
        <SortableContext items={...} strategy={verticalListSortingStrategy}>
          {((element.props?.items as Array<{ question: string; answer: string }>) || []).map((item, idx) => (
            <SortableRow key={idx} id={`faq-${idx}`}>
              <div className="space-y-2 flex-1">
                <Input
                  value={item.question}
                  onChange={(e) => updateFaqItem(idx, 'question', e.target.value)}
                  placeholder="Question..."
                  className="builder-input text-xs"
                />
                <Textarea
                  value={item.answer}
                  onChange={(e) => updateFaqItem(idx, 'answer', e.target.value)}
                  placeholder="Answer..."
                  className="builder-input text-xs min-h-[60px]"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeFaqItem(idx)}>
                <X className="w-4 h-4" />
              </Button>
            </SortableRow>
          ))}
        </SortableContext>
      </DndContext>
      <Button variant="outline" size="sm" onClick={addFaqItem} className="w-full">
        <Plus className="w-4 h-4 mr-1" /> Add FAQ Item
      </Button>
    </div>
  </CollapsibleSection>
)}
```

### Phase 2: Fix Form Group Conversion (Priority: HIGH)

#### 2.1 Create Proper Form Group Element Type

**File:** `src/flow-canvas/types/infostack.ts`

Add `form-group` to ElementType:

```typescript
export type ElementType =
  | 'heading'
  | 'text'
  // ...existing types...
  | 'form-group'  // NEW: Multi-field form container
```

#### 2.2 Update Template Converter

**File:** `src/flow-canvas/builder/utils/templateConverter.ts`

Change form_group mapping:

```typescript
// Before
'form_group': 'input',

// After
'form_group': 'form-group',

// Add special handling
if (node.type === 'form_group') {
  const fields = (node.props?.fields as Array<{
    type: string;
    placeholder: string;
    required?: boolean;
  }>) || [];
  
  return {
    id: generateId(),
    type: 'form-group',
    content: '',
    props: {
      fields: fields.map((field, i) => ({
        id: `field-${i}`,
        type: field.type,
        placeholder: field.placeholder,
        required: field.required ?? false,
        fieldKey: `form_${field.type}_${i}`,
      })),
      layout: 'vertical',
      gap: 12,
    },
  };
}
```

#### 2.3 Add Form Group Renderer

**File:** `src/flow-canvas/builder/components/CanvasRenderer.tsx`

Add new case in element switch:

```typescript
case 'form-group': {
  const fields = (element.props?.fields as Array<{
    id: string;
    type: string;
    placeholder: string;
    required?: boolean;
    fieldKey?: string;
  }>) || [];
  const layout = (element.props?.layout as string) || 'vertical';
  const gap = (element.props?.gap as number) || 12;
  
  return (
    <div ref={combinedRef} style={style} className={cn(baseClasses, 'w-full relative')}>
      {/* Toolbar */}
      {!readOnly && (
        <UnifiedElementToolbar
          elementId={element.id}
          elementType="form-group"
          elementLabel="Form Fields"
          isSelected={isSelected}
          targetRef={wrapperRef}
          deviceMode={deviceMode}
          dragHandleProps={{ attributes, listeners }}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      )}
      <div 
        className={cn(
          'flex w-full',
          layout === 'vertical' ? 'flex-col' : 'flex-row'
        )}
        style={{ gap }}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        {fields.map((field) => (
          <input
            key={field.id}
            type={field.type}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border rounded-xl bg-transparent"
            style={{
              borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
              color: isDarkTheme ? '#fff' : '#1f2937',
            }}
            readOnly={!isPreviewMode}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 2.4 Add Form Group Inspector

**File:** `src/flow-canvas/builder/components/RightPanel.tsx`

Add inspector section:

```typescript
{element.type === 'form-group' && (
  <CollapsibleSection title="Form Fields" icon={<FormInput className="w-4 h-4" />} defaultOpen>
    <div className="pt-3 space-y-3">
      {/* Sortable list of fields */}
      {/* Add/remove field buttons */}
      {/* Field type selector (text, email, tel, etc.) */}
      {/* Placeholder input */}
      {/* Required toggle */}
    </div>
  </CollapsibleSection>
)}
```

### Phase 3: Fix Feature List & Testimonial (Priority: MEDIUM)

#### 3.1 Create Feature List Element Type

**File:** `src/flow-canvas/builder/utils/templateConverter.ts`

```typescript
if (node.type === 'feature_list') {
  const features = (node.props?.items as string[]) || ['Feature 1', 'Feature 2'];
  return {
    id: generateId(),
    type: 'feature-list',  // New element type
    content: '',
    props: {
      items: features.map((text, i) => ({
        id: `feature-${i}`,
        text,
        icon: 'Check',
      })),
      iconColor: '#22C55E',
      layout: 'vertical',
    },
  };
}
```

#### 3.2 Create Testimonial Element Type

```typescript
if (node.type === 'testimonial_card') {
  return {
    id: generateId(),
    type: 'testimonial',  // New element type
    content: node.props?.quote as string || 'Great product!',
    props: {
      author: node.props?.author as string || 'John Doe',
      role: node.props?.role as string || 'CEO',
      company: node.props?.company as string || 'Company',
      avatar: node.props?.avatar as string || '',
      rating: node.props?.rating as number || 5,
    },
  };
}
```

### Phase 4: Add Single/Multiple Choice Inspector

**File:** `src/flow-canvas/builder/components/RightPanel.tsx`

Add inspector for choice elements:

```typescript
{(element.type === 'single-choice' || element.type === 'multiple-choice') && (
  <CollapsibleSection title="Choice Options" icon={<List className="w-4 h-4" />} defaultOpen>
    <div className="pt-3 space-y-3">
      {/* Choice type toggle: single vs multiple */}
      {/* Sortable list of options */}
      {/* Add option button */}
      {/* Layout: vertical/horizontal/grid */}
    </div>
  </CollapsibleSection>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/flow-canvas/types/infostack.ts` | Add `form-group`, `feature-list`, `testimonial` to ElementType |
| `src/flow-canvas/builder/utils/templateConverter.ts` | Add special handling for form_group, feature_list, testimonial_card |
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Add render cases for new element types |
| `src/flow-canvas/builder/components/RightPanel.tsx` | Add inspector sections for `faq`, `form-group`, `feature-list`, `testimonial`, `single-choice`, `multiple-choice` |
| `src/flow-canvas/components/FlowCanvasRenderer.tsx` | Mirror new render cases for runtime |

---

## Expected Outcome

After implementation:

1. **FAQ sections** will have editable Q&A pairs in the inspector
2. **Form sections** will render all fields from the template and be editable
3. **Feature lists** will preserve icon + text structure
4. **Testimonials** will display author, role, avatar, quote
5. **Choice elements** will have option management in inspector
6. **Templates will look identical** on canvas as they do in the preview cards

---

## Technical Notes

- All new element types should extend the existing drag-and-drop infrastructure
- Inspector sections should use existing `SortableRow` pattern for reorderable items
- Runtime renderer (`FlowCanvasRenderer.tsx`) must be kept in sync with editor renderer
- Premium element pattern (PremiumElementInspector) can be extended for complex new types
