
## Update Integration Logos to Match Official Brand Assets

This plan replaces the existing placeholder/simplified logos for Calendly, Fathom, Google Ads, and Slack with accurate official brand SVGs.

---

### Summary

**Current Issue**: The existing logos are simplified approximations that don't match the official brand assets you've provided.

**Solution**: Replace each SVG file in `src/assets/integrations/` with properly crafted SVGs that match the official brand guidelines.

---

### Files to Update

| Logo | Current State | Update Needed |
|------|--------------|---------------|
| **Calendly** | Blue circle with clock elements | Concentric "C" rings with cyan wave accent |
| **Fathom** | Purple box with white lines | Cyan icon-only mark (no wordmark for icon use) |
| **Google Ads** | Simplified colored shapes | Official 3-bar design with proper geometry |
| **Slack** | Mono-purple pinwheel | Multi-color pinwheel (pink, blue, green, yellow) |

---

### Implementation Steps

**Step 1: Update Calendly Logo**
- File: `src/assets/integrations/calendly.svg`
- Replace with official Calendly "C" mark featuring:
  - Outer white ring
  - Blue (#006BFF) concentric circle
  - Cyan (#00D4FF) wave accent
  - viewBox set to 48x48 for consistency

**Step 2: Update Fathom Logo**
- File: `src/assets/integrations/fathom.svg`
- Replace with the cyan icon portion only (not the wordmark)
- Use #00BEFF as the primary color
- Extract just the icon mark for square display

**Step 3: Update Google Ads Logo**
- File: `src/assets/integrations/google-ads.svg`
- Replace with the official Google Ads icon from your uploaded file
- Maintain proper aspect ratio and colors:
  - Blue (#3C8BD9)
  - Yellow (#FABC04)
  - Green (#34A852)

**Step 4: Update Slack Logo**
- File: `src/assets/integrations/slack.svg`
- Replace with multi-color version using official brand colors:
  - Pink: #E01E5A
  - Blue: #36C5F0
  - Green: #2EB67D
  - Yellow: #ECB22E

---

### Technical Details

All SVGs will:
- Use `viewBox="0 0 48 48"` for consistent sizing
- Render cleanly at the `h-8 w-8` size used in AppsPortal
- Be self-contained with no external dependencies
- Use official brand hex colors

**No changes needed** to AppsPortal.tsx or IntegrationsPortal.tsx - the updated SVG files will be automatically reflected through existing imports.
