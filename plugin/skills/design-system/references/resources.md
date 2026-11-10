# Design, UI, and CSS Resource Reference

A catalog of existing design systems, token standards, CSS engines, component
libraries, and the CLI commands that install them. The purpose is to replace
hand-rolled UI code with configuration of upstream tools.

Version numbers reflect the state of the ecosystem in August 2026. Verify the
current version before running any command. Every entry below has a canonical
documentation URL; read the docs rather than reconstructing the API from memory.

---

## 1. Operating rules

These rules govern how the rest of this document should be applied.

1. **Never hand-write a component that a registry can install.** If a button,
   dialog, combobox, or data table is needed, install it from shadcn, Nuxt UI,
   Basecoat, or an equivalent registry. Writing one from scratch is a defect.
2. **Never invent a spacing or type scale.** Use a generated fluid scale
   (Utopia), a published token set (Open Props), or a DTCG token file. Ad hoc
   pixel values are a defect.
3. **Never introduce a `px` breakpoint without justification.** Prefer
   `clamp()`, container queries, and intrinsic sizing. See section 8.
4. **Read the documentation before generating code.** Most projects listed here
   publish an LLM-optimized document set. UnoCSS serves every docs page as
   `.md`. shadcn publishes `llms.txt`. Cloudflare docs have a "Copy as
   Markdown" affordance on every page.
5. **Prefer the CLI over hand-edited configuration.** `shadcn init`,
   `npm create cloudflare@latest`, `astro add`, and `style-dictionary init` all
   produce a correct, current configuration. Hand-written `package.json`
   entries and config files drift from upstream defaults.
6. **Verify the rendered result.** Use a browser automation MCP server to
   screenshot the output and compare it against the intent. Code that compiles
   is not code that looks right.

---

## 2. Machine-readable design context

These are the files that carry design intent into an agent's context window.
They belong in the repository root.

### DESIGN.md

An open specification from Google Labs, extracted from the Stitch design tool
and released under Apache 2.0 in April 2026. The format pairs YAML frontmatter
containing design tokens (color, typography, spacing, radius, elevation) with
Markdown prose explaining design philosophy and constraints. The prose matters:
it gives the agent guidance for cases the tokens do not cover.

- Specification: <https://github.com/google-labs-code/design.md>
- Generator with live preview, contrast linting, and Tailwind/DTCG/CSS export:
  <https://design.dev/ai/design-md-generator/>
- Community library of brand-derived files:
  <https://github.com/voltagent/awesome-design-md>, <https://designmd.app>,
  <https://getdesign.md>
- Atlassian's production write-up on sizing and trade-offs:
  <https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice>

Install the Stitch authoring skill:

```
npx skills add google-labs-code/stitch-skills --skill design-md --global
```

The file is loaded whole, so size discipline matters. Atlassian's file is
roughly 80 KB, near 20,000 tokens, which they describe as large. Aim well below
that and push detail into an MCP server or a skill with progressive disclosure.

Reference `./DESIGN.md` explicitly from `AGENTS.md` or `CLAUDE.md` under a
heading such as "UI and design system" so discovery does not depend on the
agent guessing.

### The three-file split

| File | Carries | Standard |
|---|---|---|
| `AGENTS.md` / `CLAUDE.md` | Project conventions and agent behavior | <https://agents.md> |
| `SKILL.md` | Reusable procedures, loaded progressively | <https://agentskills.io> |
| `DESIGN.md` | Visual language and design constraints | Google Labs, Apache 2.0 |
| `tokens.json` | Machine-consumable token values | W3C DTCG |

### Agent skills distribution

Vercel's `skills` CLI installs SKILL.md packages from any Git repository or
local folder into the correct directory for the target agent.

```
npx skills add <owner>/<repo>
npx skills add shadcn/ui
```

Directories: <https://skills.sh>, <https://agenticskills.io>. The specification
lives at <https://agentskills.io>, and the well-known discovery path is
`/.well-known/skills/SKILL.md`.

---

## 3. Design tokens

### W3C DTCG Design Tokens Format Module

The Design Tokens Community Group published version 2025.10 on 28 October 2025,
the first stable release. This is a W3C Community Group specification rather
than a Recommendation, but it is production-ready and broadly implemented.
Tokens are JSON with `$value` and `$type` on every node, first-class composite
types for shadows, gradients, typography sets, transitions, and borders, plus
references that survive transformation.

- Home: <https://www.designtokens.org>
- Drafts: <https://www.designtokens.org/TR/drafts>
- Repository: <https://github.com/design-tokens/community-group>

Implementers include Figma, Penpot, Sketch, Tokens Studio, Style Dictionary,
Terrazzo, Supernova, Knapsack, and zeroheight.

### Terrazzo

DTCG-native token compiler. Supports the full format including 2025.10 features
ahead of the alternatives. CLI binary is `tz`.

```
npm install -D @terrazzo/cli @terrazzo/plugin-css
npx tz init
npx tz build
```

Docs: <https://terrazzo.app/docs/>

### Style Dictionary

The long-standing token build system, originally from Amazon. Version 4 added
first-class DTCG support; version 5 is current and continues the migration to
the 2025.10 format. Use it when output is needed for platforms beyond the web,
such as iOS, Android, or Flutter.

```
npm install -D style-dictionary
npx style-dictionary init basic
npx style-dictionary build
```

Docs: <https://styledictionary.com>, DTCG notes at
<https://styledictionary.com/info/dtcg/>

### Open Props

Roughly 350 curated CSS custom properties covering color, spacing, typography,
shadows, easings, animations, gradients, aspect ratios, and border radii.
Framework-agnostic, importable as whole or in subsets, and usable alongside
Tailwind. This is the fastest way to get a coherent scale into a project that
uses plain CSS, CSS Modules, or Lit.

```
npm install open-props
```

```css
@import "open-props/style";
@import "open-props/normalize";
```

Site: <https://open-props.style>. Repository:
<https://github.com/argyleink/open-props>.

Companion tools from the same author: `postcss-jit-props` for tree-shaken
output, and <https://gradient.style> for OKLCH gradients.

### Tokens Studio

Figma plugin that reads and writes DTCG token files, giving designers a path
into the same repository the code reads from.
<https://tokens.studio>

---

## 4. CSS engines

### Tailwind CSS v4

Current line is 4.3.x. The v4 engine is a Rust rewrite built on Lightning CSS.
Configuration moved out of `tailwind.config.js` into CSS via `@theme`, which
means the theme is a set of CSS custom properties and can be swapped at runtime
without a rebuild. Setup reduces to a single `@import`.

```
npm install tailwindcss @tailwindcss/vite
```

```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.6 0.2 250);
  --font-sans: "Inter Variable", sans-serif;
}
```

Migration from v3 is handled largely by the codemod:

```
npx @tailwindcss/upgrade
```

Docs: <https://tailwindcss.com/docs>. Note that v4.2 and v4.3 added extensive
logical-property utilities (`pbs-*`, `mbe-*`, `inline-s-*`, `border-bs-*`) and
deprecated `start-*` and `end-*` in favor of `inline-s-*` and `inline-e-*`.

### UnoCSS

Current version is in the 66.x line. The engine ships no utilities of its own;
everything comes from presets, which makes it the right choice when a bespoke
utility vocabulary is wanted. `preset-wind4` tracks Tailwind v4 semantics.
`preset-mini` is the minimal base for building a custom preset.
`preset-icons` turns any Iconify set into pure-CSS classes.

```
npm install -D unocss
```

```ts
// uno.config.ts
import { defineConfig, presetWind4, presetIcons } from 'unocss'

export default defineConfig({
  presets: [presetWind4(), presetIcons()],
})
```

Docs: <https://unocss.dev>. Every page is also served as Markdown by appending
`.md` to the path, for example <https://unocss.dev/guide/presets.md>. Use those
URLs when fetching documentation.

Note that `@unocss/preset-uno` is deprecated and renamed to
`@unocss/preset-wind3`.

### Build-time CSS-in-JS

For projects where a typed style API is preferred over utility classes. All
three extract to static CSS at build time, so none of them ship a runtime.

| Tool | Model | Notes |
|---|---|---|
| [vanilla-extract](https://vanilla-extract.style) | `.css.ts` files, typed | Leanest option, no utility layer, strong theming via CSS variables |
| [Panda CSS](https://panda-css.com) | Object styles plus recipes | From the Chakra team, pairs with Ark UI and Park UI |
| [StyleX](https://stylexjs.com) | Atomic extraction | Meta's engine, powers Facebook, Instagram, WhatsApp, and Threads |

Runtime CSS-in-JS (styled-components, Emotion) is in decline and interacts
badly with streaming server rendering. Do not choose it for new work.

### Classless and minimal CSS

For documentation sites, internal tools, and anything where semantic HTML plus
a stylesheet is sufficient.

- [Pico CSS](https://picocss.com), semantic elements styled by default
- [Water.css](https://watercss.kognise.dev), drop-in classless stylesheet
- [Open Props normalize](https://open-props.style/#normalize), adaptive
  light and dark normalization
- [modern-normalize](https://github.com/sindresorhus/modern-normalize)
- [Andy Bell's modern CSS reset](https://piccalil.li/blog/a-more-modern-css-reset/)

---

## 5. Headless primitives

The behavior layer: keyboard navigation, focus management, ARIA semantics, RTL,
and controlled or uncontrolled state. No styling.

| Library | Frameworks | Notes |
|---|---|---|
| [Base UI](https://base-ui.com) | React | Stable at v1.0. From the authors of Radix, Floating UI, and MUI. The most actively maintained React primitive layer. |
| [Radix Primitives](https://www.radix-ui.com/primitives) | React | The incumbent with the largest ecosystem. Acquired by WorkOS; maintenance has slowed on some primitives. |
| [Ark UI](https://ark-ui.com) | React, Vue, Solid, Svelte | Built on Zag state machines. The correct choice when one API must span multiple frameworks. |
| [Zag.js](https://zagjs.com) | Framework-agnostic | The state machines underneath Ark UI, usable directly. |
| [React Aria](https://react-spectrum.adobe.com/react-aria/) | React | Adobe. Deepest accessibility and internationalization coverage. Hooks rather than components. |
| [Reka UI](https://reka-ui.com) | Vue 3 | Formerly Radix Vue. Underpins both Nuxt UI and shadcn-vue. |
| [Bits UI](https://bits-ui.com) | Svelte 5 | Underpins shadcn-svelte. |
| [Melt UI](https://melt-ui.com) | Svelte | Builder-based, highly composable. |
| [Kobalte](https://kobalte.dev) | Solid | |
| [Corvu](https://corvu.dev) | Solid | |
| [Headless UI](https://headlessui.com) | React, Vue | From Tailwind Labs. Small surface, roughly ten components. |
| [Ariakit](https://ariakit.org) | React | |

---

## 6. Component distributions

Libraries that ship both behavior and styling. Distinguish two models: packages
installed from npm, and registries that copy source into the repository.

### The shadcn family and the registry model

`shadcn/cli` reached v4 in March 2026. This is the single most useful entry in
this document for agent-driven work, because the CLI, the registry format, and
the accompanying skill were designed together for agent consumption.

```
# install the agent skill first
npx skills add shadcn/ui

# scaffold a project; templates cover Next.js, Vite, TanStack Start,
# React Router, Astro, and Laravel
npx shadcn@latest init
npx shadcn@latest init -t vite --monorepo
npx shadcn@latest init --base radix          # or --base baseui
npx shadcn@latest init --preset <code>       # entire design system in one string

# inspect before writing anything
npx shadcn@latest add button --dry-run
npx shadcn@latest add button --view
npx shadcn@latest add button --diff          # also used to check for updates

# project and component context for the agent
npx shadcn@latest info
npx shadcn@latest docs combobox
```

Presets encode colors, theme, icon library, fonts, and radius into a short
code, built and previewed at <https://ui.shadcn.com/create>. They are portable
across agents and tools.

Registries are namespaced (`@acme/button`), can be private with header-based
authentication, and can distribute an entire design system as a single
`registry:base` payload including components, dependencies, CSS variables,
fonts, and config. Fonts are a first-class registry type.

- Docs: <https://ui.shadcn.com/docs>
- LLM index: <https://ui.shadcn.com/llms.txt>
- Registry directory: <https://ui.shadcn.com/docs/registry/registry-index>
- MCP server: <https://ui.shadcn.com/docs/registry/mcp>

Ports and siblings:

- [shadcn-vue](https://www.shadcn-vue.com), Vue 3 on Reka UI and Tailwind v4,
  with an official `shadcn-nuxt` module
- [shadcn-svelte](https://shadcn-svelte.com), Svelte 5 on Bits UI
- [shadcn-solid](https://shadcn-solid.com), Solid on Kobalte
- [Basecoat](https://basecoatui.com), the same design language as plain HTML
  classes plus small Alpine scripts, no framework required, theme-compatible
  with shadcn. This is the right answer for Astro, HTMX, Hono, or
  server-rendered templates.
- [Franken UI](https://franken-ui.dev), HTML-first, built on UIkit with shadcn
  styling
- [Park UI](https://park-ui.com), Ark UI plus Panda CSS

### Vue

[Nuxt UI v4](https://ui.nuxt.com) merged the previously commercial Pro tier
into the open-source library. Roughly 125 components built on Reka UI, Tailwind
CSS v4, and Tailwind Variants, plus a Figma kit and templates for landing,
docs, SaaS, dashboard, and chat. Despite the name it works in plain Vue with
Vite, not only Nuxt.

```
npx nuxi module add ui        # Nuxt
npm install @nuxt/ui          # plain Vue + Vite
```

Alternatives: [PrimeVue](https://primevue.org),
[Vuetify 4](https://vuetifyjs.com) for Material Design 3,
[Element Plus](https://element-plus.org),
[Quasar](https://quasar.dev) for web, mobile, and desktop from one source.

### Svelte

[Skeleton](https://www.skeleton.dev), [Flowbite Svelte](https://flowbite-svelte.com),
and shadcn-svelte. Skeleton v3 is framework-agnostic at the CSS layer.

### Web components and framework-free

- [Shoelace / Web Awesome](https://webawesome.com), Lit-based, works anywhere
- [Material Web](https://github.com/material-components/material-web),
  Google's Material 3 web components
- [Spectrum Web Components](https://opensource.adobe.com/spectrum-web-components/)
- [Carbon Web Components](https://web-components.carbondesignsystem.com)

### Utility-class component sets

- [daisyUI](https://daisyui.com), semantic class names on top of Tailwind
- [Flowbite](https://flowbite.com), [Preline](https://preline.co)
- [Tailwind Plus](https://tailwindcss.com/plus), commercial, from Tailwind Labs

### Astryx

Meta open-sourced Astryx in June 2026: a React 19 design system grown inside
their monorepo over eight years, powering more than 13,000 internal apps. MIT
licensed, currently in beta. It ships more than 150 typed components, seven
themes, page templates, and a CLI, and is explicitly designed so that a person
and an agent build from the same reference. Styles are authored in StyleX but
that is invisible to consumers; overrides go through `className` using Tailwind,
CSS Modules, or plain CSS. `swizzle` ejects a component's full source into the
project.

```
npm install @astryxdesign/core @astryxdesign/theme-neutral @stylexjs/stylex
npm install -D @astryxdesign/cli
```

Add a package script so agents invoke the CLI reliably:

```json
{ "scripts": { "astryx": "node node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs" } }
```

```
npm run astryx -- component --list
```

Docs: <https://astryx.atmeta.com>. Repository:
<https://github.com/facebook/astryx>. React 19 is a hard requirement, which
rules it out for Vue, Svelte, and Solid work.

---

## 7. Reference design systems

Read these for patterns, token architecture, and accessibility guidance rather
than installing them. Most publish their tokens in a consumable form.

| System | Owner | URL |
|---|---|---|
| U.S. Web Design System | GSA | <https://designsystem.digital.gov> |
| GOV.UK Design System | UK Government | <https://design-system.service.gov.uk> |
| Primer | GitHub | <https://primer.style> |
| Carbon | IBM | <https://carbondesignsystem.com> |
| Spectrum | Adobe | <https://spectrum.adobe.com> |
| Polaris | Shopify | <https://polaris.shopify.com> |
| Material 3 | Google | <https://m3.material.io> |
| Fluent 2 | Microsoft | <https://fluent2.microsoft.design> |
| Atlassian Design System | Atlassian | <https://atlassian.design> |
| Cloudscape | AWS | <https://cloudscape.design> |

USWDS and GOV.UK are the strongest references for accessible form patterns,
error messaging, and content design. GOV.UK in particular documents the user
research behind each pattern.

Pattern catalogs worth consulting before designing an interaction from scratch:

- [Every Layout](https://every-layout.dev), layout primitives derived from
  first principles
- [Inclusive Components](https://inclusive-components.design), accessible
  component patterns
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/), the
  normative reference for widget keyboard behavior
- [UI Patterns](https://ui-patterns.com)
- [Refactoring UI](https://refactoringui.com), visual design heuristics

---

## 8. Fluid layout

This section exists because breakpoint-driven pixel layouts are the most common
failure mode in generated UI. The rules below are not stylistic preferences;
they are the current baseline of the platform.

### Generate scales, do not invent them

[Utopia](https://utopia.fyi) produces fluid type and space scales as `clamp()`
expressions interpolating between a minimum and maximum viewport. The generated
CSS embeds a permalink back to the calculator inputs, so the scale stays
editable.

- Type scale: <https://utopia.fyi/type/calculator/>
- Space scale: <https://utopia.fyi/space/calculator/>
- Grid: <https://utopia.fyi/grid/calculator/>
- Single tokens without a full system: <https://utopia.fyi/clamp/calculator/>

Output takes this shape, with steps rather than named sizes:

```css
:root {
  --step--1: clamp(0.9375rem, 0.9119rem + 0.1136vw, 1rem);
  --step-0:  clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem);
  --step-1:  clamp(1.35rem, 1.2631rem + 0.3864vw, 1.5625rem);

  --space-s: clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem);
  --space-m: clamp(1.6875rem, 1.6108rem + 0.3409vw, 1.875rem);
  --space-s-m: clamp(1.125rem, 0.8182rem + 1.3636vw, 1.875rem);
}
```

The 9elements min-max interpolation calculator is a useful alternative for
one-off values: <https://min-max-calculator.9elements.com>.

### Size to content, not to viewport

Container queries make a component respond to the space it occupies rather than
to the width of the window. This is the correct default for anything reusable.

```css
.card-grid { container-type: inline-size; }

@container (min-width: 30rem) {
  .card { grid-template-columns: auto 1fr; }
}
```

Intrinsic sizing removes most remaining breakpoints:

```css
/* wraps automatically, no media query */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
  gap: var(--space-m);
}
```

### Use logical properties

Write `padding-inline`, `margin-block`, `border-inline-start`, and `inset-inline`
rather than their physical equivalents. Right-to-left and vertical writing modes
then work without a separate stylesheet. Tailwind v4.2 and later expose the full
set as utilities.

### Layout primitives

Every Layout defines a small set of composable layout components (Stack,
Cluster, Sidebar, Switcher, Cover, Grid, Frame, Reel, Imposter, Icon) that
solve the common cases without media queries. Implement them once as CSS
classes or components and reuse them. This is the single highest-leverage
substitute for ad hoc flexbox.

### Color

Use OKLCH for color definitions. It gives perceptually uniform lightness, which
makes generated palettes and hover or active states predictable, and it reaches
wide-gamut displays. `color-mix()` handles derived values without a
preprocessor.

```css
--brand: oklch(0.62 0.19 250);
--brand-hover: color-mix(in oklch, var(--brand) 85%, black);
```

Tools: <https://oklch.com>, <https://huetone.ardov.me>,
<https://gradient.style>.

### Respect user preferences

Honor `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`, and
`prefers-reduced-transparency`. Use `light-dark()` and `color-scheme` rather
than duplicating a full palette under a media query.

---

## 9. Accessibility

WCAG 2.2 Level AA is the operative bar. It is ISO/IEC 40500 and is referenced by
the ADA, Section 508, and the European Accessibility Act through EN 301 549.
WCAG 3.0 remains a Working Draft, most recently updated March 2026, and is not
expected to reach Recommendation before the late 2020s. Its Bronze tier is
roughly equivalent to WCAG 2.2 AA, so conforming today is the best preparation.
APCA is exploratory and is not normative in the WCAG 3.0 draft; treat it as
supplementary information when doing design system work, not as a replacement
for the 4.5:1 threshold.

- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>
- Quick reference: <https://www.w3.org/WAI/WCAG22/quickref/>
- ARIA Authoring Practices Guide: <https://www.w3.org/WAI/ARIA/apg/>

Automated tooling catches roughly a third of failures. Run it anyway, in CI.

```
npm install -D @axe-core/playwright
npm install -D jest-axe
npx @axe-core/cli http://localhost:5173
npx unlighthouse --site http://localhost:5173
npx pa11y-ci
```

- axe-core: <https://github.com/dequelabs/axe-core>
- Accessibility Insights: <https://accessibilityinsights.io>
- WebAIM contrast checker: <https://webaim.org/resources/contrastchecker/>

---

## 10. Scaffolding commands

Always scaffold with the upstream CLI. Do not hand-write `package.json`,
`tsconfig.json`, or build configuration.

### Cloudflare

C3 is the entry point for Workers and Pages, and it delegates to each
framework's own setup tool before applying Cloudflare configuration.

```
npm create cloudflare@latest
npm create cloudflare@latest -- my-app --framework=astro
npm create cloudflare@latest -- my-app --framework=vue
npm create cloudflare@latest -- my-app --framework=svelte
npm create cloudflare@latest -- my-app --framework=solid
npm create cloudflare@latest -- my-app --framework=hono
npm create cloudflare@latest -- my-app --framework=nuxt
npm create cloudflare@latest -- --platform=pages       # Pages requires the flag
npm create cloudflare@latest -- --template <git-source>
```

Supported frameworks include Analog, Angular, Astro, Docusaurus, Gatsby, Hono,
Next, Nuxt, Qwik, React, Remix, Solid, Svelte, and Vue. Docs:
<https://developers.cloudflare.com/pages/get-started/c3/>. Every Cloudflare docs
page offers "Copy as Markdown" and an "Agent setup" affordance; use those rather
than scraping HTML.

### Frameworks

```
npm create astro@latest
npx astro add tailwind          # also: vue, svelte, solid, alpinejs, mdx
npm create vue@latest
npx sv create                   # Svelte
npm create vite@latest
npm create hono@latest
npx nuxi init
```

### Styling and components, applied after scaffolding

```
npx shadcn@latest init
npx nuxi module add ui
npm install -D unocss
npm install open-props
npm install -D style-dictionary
```

### Full-stack scaffolding

[Better-T-Stack](https://better-t-stack.dev) generates typed full-stack
projects across Hono, Elysia, Next, TanStack Start, Nuxt, Svelte, Solid, and
Astro, with database, auth, and tooling wired in.

---

## 11. MCP servers and agent tooling

The minimum useful loop for interface work is: read the design source, write
the code, render it, compare, iterate.

| Server | Purpose |
|---|---|
| shadcn registry MCP | Search and install registry components without shelling out |
| Figma MCP (Dev Mode) | Read component hierarchy, variables, layout constraints, and tokens from a live file. Remote server hosted by Figma, or local at `http://127.0.0.1:3845/mcp` with the desktop app in Dev Mode. |
| Chrome DevTools MCP | Drive and inspect a live browser for debugging and performance |
| Playwright MCP | Render, screenshot, and compare against intent |
| Context7 | Version-specific library documentation, which prevents generating against a remembered API |
| Cloudflare MCP servers | Bindings, builds, docs, containers, AutoRAG |

Figma launched bidirectional Claude Code integration (design to code, and code
to canvas) in February 2026. Reading design context is generally available and
free; write-back to canvas remains in beta.

The screenshot-and-compare step is the part most often skipped and the part
that most reliably converts a one-shot generator into an iterative loop. Do not
skip it.

---

## 12. Selection guide

Read down the column that matches the project.

| Context | Engine | Behavior layer | Components |
|---|---|---|---|
| Astro, HTMX, Hono, server-rendered | Tailwind v4 or UnoCSS | Alpine where needed | Basecoat |
| Vue 3 or Nuxt | Tailwind v4 | Reka UI | Nuxt UI v4, or shadcn-vue for owned source |
| Svelte 5 | Tailwind v4 | Bits UI or Melt | shadcn-svelte, Skeleton |
| Solid | Tailwind v4 or UnoCSS | Kobalte or Corvu | shadcn-solid |
| Lit or web components | Open Props | native | Shoelace / Web Awesome |
| React 19 | Tailwind v4 | Base UI | shadcn/ui, or Astryx for breadth |
| Plain CSS, no build step | Open Props plus Utopia | native | Pico CSS |
| Multi-framework design system | Panda CSS or vanilla-extract | Ark UI or Zag | Park UI |

In every column, tokens come from a DTCG file or Open Props, and scales come
from Utopia. Those two choices are independent of the framework.

---

## 13. Failure modes to avoid

- Writing a dialog, combobox, or date picker by hand. Install one. The
  accessibility surface is larger than it appears.
- Emitting a `tailwind.config.js` for a v4 project. Configuration lives in CSS
  under `@theme`.
- Using `px` for font size or spacing. Use `rem` inside `clamp()`.
- Adding `sm:`, `md:`, `lg:` variants where a container query or
  `grid-template-columns: repeat(auto-fit, ...)` would remove the need.
- Defining a color palette in hex. Use OKLCH.
- Generating a component library when a registry already publishes one.
- Trusting a remembered API. Fetch the documentation, preferably the Markdown
  or `llms.txt` variant.
- Declaring the work finished without rendering it.
