# Color Derivation Reference

How to compute derived palette colors from two brand hex values.

---

## Hex to HSL conversion (for manual derivation in code)

```ts
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)]
    .map(x => Math.round(x * 255).toString(16).padStart(2, '0'))
    .join('');
}
```

---

## Light theme derivation from primary hex

Given `primary = '#6C63FF'` → HSL is approximately `(245, 100%, 69%)`

| Token | HSL transform | Hex result |
|---|---|---|
| `primary` | as-is | `#6C63FF` |
| `primaryLight` | H same, S 70%, L 88% | `#C5C2FF` |
| `primaryDark` | H same, S 90%, L 38% | `#2A1FD6` |

Apply the same derivation for secondary.

---

## Dark theme adjustments

For dark mode, lighten mid-range colors and raise saturation slightly so they
remain visible against dark backgrounds:

| Token | Dark mode adjustment |
|---|---|
| `primary` | S 85%, L 65% (bring up from 69% to stay bright on dark bg) |
| `primaryLight` | S 60%, L 80% |
| `primaryDark` | S 95%, L 45% |

---

## Semantic color defaults

These are fixed and don't derive from brand colors:

### Light
```ts
error:        '#DC3545'
errorLight:   '#F8D7DA'
success:      '#28A745'
successLight: '#D4EDDA'
warning:      '#FFC107'
warningLight: '#FFF3CD'
info:         '#17A2B8'
infoLight:    '#D1ECF1'
background:   '#F8F9FA'
surface:      '#FFFFFF'
surfaceVariant: '#F1F3F5'
border:       '#DEE2E6'
text:         '#1A1A2E'
textSecondary:'#6C757D'
textDisabled: '#ADB5BD'
overlay:      'rgba(0,0,0,0.5)'
shadow:       'rgba(0,0,0,0.1)'
```

### Dark
```ts
error:        '#FF6B6B'
errorLight:   '#3D1A1A'
success:      '#4ADE80'
successLight: '#1A3D2B'
warning:      '#FFD60A'
warningLight: '#3D3000'
info:         '#38BDF8'
infoLight:    '#0C2D3D'
background:   '#0D1117'
surface:      '#161B22'
surfaceVariant: '#21262D'
border:       '#30363D'
text:         '#F0F6FC'
textSecondary:'#8B949E'
textDisabled: '#484F58'
overlay:      'rgba(0,0,0,0.7)'
shadow:       'rgba(0,0,0,0.4)'
```

---

## Complementary color derivation (when only one color provided)

Rotate hue by 150° on the HSL wheel:

```ts
const [h, s, l] = hexToHsl(primaryHex);
const secondaryH = (h + 150) % 360;
const secondaryHex = hslToHex(secondaryH, s, l);
```

150° gives a split-complementary feel (not directly opposite at 180°, which can
feel harsh) — good balance of contrast and harmony.

---

## Example: full generated palette for #6C63FF + #FF6584

### Light
```ts
primary:        '#6C63FF'
primaryLight:   '#C5C2FF'
primaryDark:    '#2A1FD6'
secondary:      '#FF6584'
secondaryLight: '#FFBDCA'
secondaryDark:  '#D61F43'
background:     '#F8F9FA'
surface:        '#FFFFFF'
surfaceVariant: '#F1F3F5'
border:         '#DEE2E6'
text:           '#1A1A2E'
textSecondary:  '#6C757D'
textDisabled:   '#ADB5BD'
```

### Dark
```ts
primary:        '#8B84FF'
primaryLight:   '#C5C2FF'
primaryDark:    '#4F47E8'
secondary:      '#FF8FA3'
secondaryLight: '#FFBDCA'
secondaryDark:  '#E84F69'
background:     '#0D1117'
surface:        '#161B22'
surfaceVariant: '#21262D'
border:         '#30363D'
text:           '#F0F6FC'
textSecondary:  '#8B949E'
textDisabled:   '#484F58'
```