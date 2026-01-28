
# Fix Font Rendering - Missing Google Fonts Import

## Problem

The builder allows users to select from 15+ fonts in the font family dropdown, but only 3 fonts are actually loaded via Google Fonts. When a user (or the AI) selects a font like "Oswald", "Montserrat", or "Playfair Display", the font fails to load and the browser falls back to its default serif font (Times New Roman), causing the ugly rendering shown in the screenshots.

### Current State

**Fonts imported in `src/flow-canvas/index.css`:**
- Inter
- JetBrains Mono
- DM Sans

**Fonts offered in `masterFontFamilies` (presets.ts):**
- inherit, system-ui (system fonts - OK)
- Inter, DM Sans (loaded - OK)
- Oswald, Anton, Bebas Neue, Archivo Black, Space Grotesk, Syne (NOT LOADED)
- Roboto, Open Sans, Poppins, Montserrat, Lato, Raleway (NOT LOADED)
- Playfair Display (NOT LOADED)

---

## Solution

Update the Google Fonts import in `src/flow-canvas/index.css` to include ALL fonts from the `masterFontFamilies` preset. This ensures that any font a user selects will actually render correctly.

### File to Modify

**`src/flow-canvas/index.css`**

Replace line 7:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
```

With comprehensive import:
```css
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Lato:wght@300;400;700&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@400;500;600;700&display=swap');
```

---

## Fonts Being Added

| Font | Category | Style |
|------|----------|-------|
| Oswald | Display | Bold, condensed |
| Anton | Display | Heavy, impactful |
| Bebas Neue | Display | All-caps, modern |
| Archivo Black | Display | Bold, geometric |
| Space Grotesk | Display | Tech, modern |
| Syne | Display | Artistic, expressive |
| Roboto | Standard | Google's flagship |
| Open Sans | Standard | Friendly, readable |
| Poppins | Standard | Geometric, clean |
| Montserrat | Standard | Elegant, versatile |
| Lato | Standard | Professional |
| Raleway | Standard | Elegant, thin weights |
| Playfair Display | Serif | Elegant headlines |

---

## Technical Details

- The Google Fonts API allows combining multiple fonts in a single request
- We include weight ranges (400-700) for most fonts to support normal and bold text
- The `display=swap` parameter ensures text is visible while fonts load
- This is a one-time CSS change - no JavaScript modifications needed

---

## Result

After this fix:
- All fonts in the dropdown will actually render
- No more fallback to Times New Roman
- Consistent typography across editor and published funnels
- AI-selected fonts will display correctly
