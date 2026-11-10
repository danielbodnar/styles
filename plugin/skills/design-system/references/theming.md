# Theme system

Twenty-two theme families, light and dark, ported from
[openchamber](https://github.com/openchamber/openchamber) (MIT, Bohdan
Triapitsyn) into standards-conformant formats.

## The port

The upstream schema is a superset of the shadcn contract, not a competitor to
it. Its four core groups (`primary`, `surface`, `interactive`, `status`) map
one-to-one onto the variables shadcn components already read. The remaining five
groups (`syntax`, `markdown`, `chat`, `tools`, `pr`) are additional vocabulary.
Nothing was dropped in the port; the extra vocabulary was namespaced so it can
never collide.

```
assets/themes/src/*.json              upstream source, vendored unmodified
        |
        |  node scripts/build.mjs --src assets/themes/src --out assets/themes
        v
assets/themes/tokens/<id>.tokens.json DTCG 2025.10   standards source of truth
assets/themes/css/<id>.css            core layer     bundled, offline ready
assets/themes/css/<id>.code.css       code layer     bundled, additive
```

The same script also emits shadcn registry items (`r/theme-<id>.json`) and
DESIGN.md colour partials (`design-md/<id>.colors.md`). Those are not bundled
here because they belong to the published registry; regenerate them to any
directory with `--out` when needed.

## The two layers

| Layer | Tokens | Naming | When |
|---|---|---|---|
| `core` | 54 | Unprefixed | Always. Every project. |
| `code` | 85 | `code-`, `md-`, `chat-`, `tool-`, `pr-` | Any surface rendering code, diffs, Markdown, or agent conversation |

Verified to have zero name collisions between the layers. `core` is unprefixed
because those exact names are what shadcn components read; renaming them would
break the contract. `code` is fully prefixed because it is additive and must be
safe to drop into any project alongside anything else.

**Choosing the code layer.** Include it for documentation sites, changelogs,
blogs with code blocks, terminals, editors, chat interfaces, PR views, and
anything rendering Markdown. Skip it for a marketing page or a dashboard with
neither code nor prose rendering. When in doubt on a developer-facing product,
include it: 85 unused custom properties cost roughly 3 KB gzipped and nothing at
runtime.

The `-code` item declares the base theme as a `registryDependency`, so
installing the code layer pulls the core layer with it.

## Color format

OKLCH is the default output, matching the rest of the stack. The conversion is
**lossless at 8-bit precision**: round-tripping all 5,167 color values across the
42 source files produced zero channel drift. Format is therefore a presentation
choice, never a data-fidelity one.

```
node scripts/build.mjs --src assets/themes/src --out assets/themes                 # OKLCH, default
node scripts/build.mjs --src assets/themes/src --out assets/themes --format hex
node scripts/build.mjs --src assets/themes/src --out assets/themes --format rgb
```

Programmatic conversion, either direction:

```js
import { hexToOklch, oklchToHex, convert, toDtcgColor } from './scripts/color.mjs'

hexToOklch('#7aa2f7')                          // { l: 0.719, c: 0.1322, h: 264.2, alpha: 1 }
oklchToHex({ l: 0.719, c: 0.1322, h: 264.2 })  // '#7aa2f7'
convert('#7aa2f7', 'oklch')                    // 'oklch(0.719 0.1322 264.2)'
toDtcgColor('#7aa2f7')                         // DTCG 2025.10 color value object
```

Emit hex only when a downstream tool genuinely cannot parse OKLCH. The DTCG
output sidesteps the question: it stores OKLCH components and carries a 6-digit
hex fallback in the same value object, which is what the `hex` sub-field is for.

## DTCG output

`assets/themes/tokens/<id>.tokens.json` conforms to Design Tokens Format Module 2025.10.
`$type` is declared once per group and inherited, per the spec. Color values are
objects with `colorSpace`, `components`, optional `alpha`, and a `hex` fallback.
A bare hex string is **not** a valid `$value` in 2025.10; do not hand-write
tokens that way.

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",
  "light": {
    "core": {
      "$type": "color",
      "primary": {
        "$value": { "colorSpace": "oklch", "components": [0.5944, 0.0772, 254.03], "hex": "#5e81ac" }
      }
    }
  }
}
```

Hand this file to Style Dictionary, Terrazzo, Tokens Studio, Figma, or Penpot.
It is the interchange format; CSS and registry items are derived artifacts.

## DESIGN.md and themes are different layers

A theme is a palette that swaps at runtime. A DESIGN.md is a statement of
aesthetic intent for one product: typography, spacing, radii, component
behavior, and the prose explaining why. A project has one DESIGN.md and many
available themes.

A theme file therefore cannot produce a complete DESIGN.md. Of the five required
frontmatter blocks, only `colors` is derivable. `typography`, `spacing`,
`rounded`, and `components` have no source data in a theme, and inventing them
would be fabrication dressed as generation.

`--out <dir>/design-md/<id>.colors.md` contains the honest subset: a real `colors` block
plus explicit gap markers. Complete it by generating type and space scales from
Utopia and writing component rules against the actual components.

A project DESIGN.md should name its theme rather than inline a palette:

```yaml
theme: flexoki
themes: [flexoki, tokyonight, nord]   # offered in the picker
```

## Installing

Primary path, registry reachable:

```
npx shadcn@latest add @danielbodnar/theme-picker
npx shadcn@latest add @danielbodnar/theme-flexoki
npx shadcn@latest add @danielbodnar/theme-flexoki-code
npx shadcn@latest add @danielbodnar/theme-flexoki --dry-run   # inspect first
```

Fallback path, when the registry is unreachable, the project does not use
shadcn, or the framework has no registry port: copy `assets/themes/css/<id>.css` into the
styles directory and import it. The CSS is standalone and depends on nothing.
See `references/offline.md` for the full manual procedure.

## Theme picker requirements

Two axes: family, and light or dark or system. Sets `data-theme` and
`data-scheme` on `<html>` and persists both.

Five non-negotiable behaviors:

1. **No flash of wrong theme.** Apply the stored value in a blocking inline
   script in `<head>`, before first paint.
2. **Default to system preference.** Three states for scheme: `light`, `dark`,
   `system`. `system` follows `prefers-color-scheme` live.
3. **Suppress transitions during the swap.** Add a class setting
   `transition: none` on everything, change the attributes, force a reflow, then
   remove it. Otherwise every themed property animates at once.
4. **Respect `prefers-reduced-motion`.**
5. **Set `color-scheme`** on the root so form controls, scrollbars, and the caret
   follow.

```html
<script>
  (() => {
    const d = document.documentElement
    const t = localStorage.getItem('theme') ?? 'flexoki'
    const s = localStorage.getItem('scheme') ?? 'system'
    const dark = s === 'dark' ||
      (s === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    d.dataset.theme = t
    d.dataset.scheme = dark ? 'dark' : 'light'
    d.style.colorScheme = dark ? 'dark' : 'light'
  })()
</script>
```

Ship one theme inline and lazy-load the rest on first interaction with the
picker, or narrow the offered set to three or four families. Do not ship all
twenty-two eagerly.

## Families

| id | Notes |
|---|---|
| `aura` | Saturated purple, high chroma |
| `ayu` | Warm amber accents, soft contrast |
| `carbonfox` | IBM Carbon derived, cool neutral |
| `catppuccin` | Pastel, very widely adopted |
| `dracula` | Purple and pink on charcoal |
| `fields-of-the-shire` | Warm green, earthy |
| `flexoki` | Ink on paper, designed for reading, strongest light variant |
| `gruvbox` | Retro warm, high contrast |
| `jetbrains` | IDE default, neutral and familiar |
| `kanagawa` | Muted ink wash, low chroma |
| `mono` | Achromatic |
| `mono-plus` | Achromatic with one accent |
| `monokai` | Vivid, high saturation |
| `nightowl` | Deep blue, tuned for low light |
| `nord` | Cool arctic blue-grey |
| `onedarkpro` | Atom derived, balanced |
| `openchamber` | Upstream default |
| `solarized` | The reference low-contrast pair |
| `tokyonight` | Blue-violet, most widely used |
| `vesper` | Minimal warm dark |
| `vitesse-dark` | Dark only |
| `vitesse-light` | Light only |

`flexoki`, `solarized`, and `mono` have the strongest light variants. The rest
were designed dark-first, so audit their light variants against WCAG 2.2 AA
before shipping one as a default.
