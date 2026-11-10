---
name: design-system
description: Wire up interface work from existing design systems instead of hand-rolling CSS. Use whenever starting a new frontend project or adding UI to an existing one, and whenever the task involves choosing a CSS framework, component library, color palette, theme, type scale, spacing scale, design tokens, or a theme picker. Also use when writing or reviewing a DESIGN.md, converting design tokens between formats, or auditing a layout for fixed breakpoints and hardcoded pixel values. Covers Tailwind v4, UnoCSS, shadcn registries, headless primitives, W3C DTCG tokens, fluid scales, 22 themes, and 26 DESIGN.md references.
---

# Design system

Stop reinventing interface foundations. Almost every decision below has an
upstream answer better tested than anything generated from scratch. The job is
to select and wire, not to author.

## Procedure

Work in order. Do not skip step 1.

### 1. Establish design context

Check the repository root for `DESIGN.md`. If present, read it; its tokens and
prose are binding.

If absent and the work is more than a single component, offer to create one
before writing code. Read `assets/design-md/INDEX.md`, pick the closest
reference to the stated aesthetic, adapt it. Load at most two full reference
files; each runs 8,000 to 13,000 tokens.

If no aesthetic has been stated, ask. Do not infer one.

### 2. Select the stack

`references/resources.md`, section 12, has the selection table. Confirm before
scaffolding. A stated framework preference beats the table.

Defaults when nothing is specified: Tailwind v4, a shadcn-family registry
matched to the framework, this theme system, a Utopia fluid scale, Cloudflare
Workers as target.

### 3. Scaffold with the upstream CLI

Never hand-write `package.json`, `tsconfig.json`, or build config. Commands are
in `references/resources.md`, section 10. Check current versions first; that
reference records August 2026 and will drift.

### 4. Install the theme system

Every project gets themes and a picker. This is a default, not a per-project
debate.

```
npx shadcn@latest add @danielbodnar/theme-picker
npx shadcn@latest add @danielbodnar/theme-<id>
```

Decide whether the project needs the code layer. Include `theme-<id>-code` for
anything rendering source code, diffs, Markdown, or agent conversation; skip it
for a marketing page or a code-free dashboard. The layers cannot collide: core
is unprefixed to match the shadcn contract, code is fully prefixed.

**The registry is not required.** This skill bundles everything needed to do the
same job by hand: 22 themes as standalone CSS in `assets/themes/css/`, DTCG
token files in `assets/themes/tokens/`, the vendored source in
`assets/themes/src/`, and a dependency-free build script. If the registry is
unreachable, the project does not use shadcn, or the framework has no registry
port, read `references/offline.md` and use the copy path. Registry
unavailability is never a reason to write a theme by hand.

Read `references/theming.md` for the token schema, the shadcn mapping, format
conversion, and the five non-negotiable picker behaviors. Implement all five.

### 5. Generate scales, do not invent them

Type and space come from Utopia as `clamp()` expressions. Never write a bare
pixel value for font size or spacing. See `references/resources.md`, section 8.

### 6. Install components, do not write them

Button, dialog, combobox, date picker, data table: install from a registry.
Hand-writing one is a defect; the accessibility surface is larger than it looks.

```
npx shadcn@latest add <component> --dry-run
npx shadcn@latest docs <component>
```

### 7. Verify the rendered result

Render, screenshot, compare against intent before reporting completion. Code
that compiles is not code that looks right.

## Reference files

Load on demand. Do not read them all.

| File | Contents |
|---|---|
| `references/resources.md` | Full catalog: CSS engines, headless primitives, registries, token tooling, reference design systems, fluid layout, accessibility, scaffolding commands, MCP servers, selection table |
| `references/theming.md` | Token schema, two-layer model, shadcn mapping, DTCG output, color conversion, picker requirements, family list |
| `references/offline.md` | Fallback procedure when the registry is unavailable |
| `assets/design-md/INDEX.md` | 26 DESIGN.md references indexed by intent |

## Bundled assets

| Path | Contents |
|---|---|
| `assets/themes/css/<id>.css` | 22 themes, core layer, standalone, ready to copy |
| `assets/themes/css/<id>.code.css` | Code layer, additive, prefixed |
| `assets/themes/tokens/<id>.tokens.json` | DTCG 2025.10 token files |
| `assets/themes/src/*.json` | Vendored upstream source, unmodified |
| `assets/design-md/<name>/DESIGN.md` | Full reference files, load at most two |
| `scripts/build.mjs` | Rebuild all outputs. No dependencies. |
| `scripts/color.mjs` | OKLCH and sRGB conversion, both directions |
| `scripts/tokens.mjs` | Core and code layer definitions |

Rebuild after editing any source theme:

```
node scripts/build.mjs --src assets/themes/src --out assets/themes
```

## Rules

These override convenience.

1. Ask before assuming an aesthetic, a framework, or a deploy target.
2. Look up current versions before generating code.
3. Prefer documentation over recall. Most projects in `references/resources.md`
   publish an LLM-optimized document set.
4. No `px` for font size or spacing. Use `rem` inside `clamp()`.
5. No `sm:` or `md:` variant where a container query or
   `grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr))`
   removes the need.
6. Colors in OKLCH. Derive states with `color-mix()`.
7. Logical properties, not physical.
8. WCAG 2.2 AA is the floor. Run axe in CI.
9. No `tailwind.config.js` in a v4 project. Config lives in CSS under `@theme`.
10. Additive beats overwriting. New token vocabulary gets a prefix.

## Attribution

Themes: [openchamber](https://github.com/openchamber/openchamber), MIT,
copyright 2025 Bohdan Triapitsyn.

DESIGN.md references:
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md),
MIT, copyright 2026 VoltAgent. Community analyses of public brand surfaces, not
licensed brand assets. Use for structure and proportion. Do not ship a clone of
another company's identity.

DESIGN.md specification: Google Labs, Apache 2.0.
Design Tokens Format Module 2025.10: W3C Design Tokens Community Group.
