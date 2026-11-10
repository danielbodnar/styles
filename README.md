# @danielbodnar design registry

A shadcn-compatible registry of themes and design tokens, plus the Claude skill
that knows how to use them. The registry is the product; the skill ships inside
it.

## Install a theme

```
npx shadcn@latest add @danielbodnar/theme-flexoki
npx shadcn@latest add @danielbodnar/theme-flexoki-code   # optional code layer
```

Configure the namespace once, in `components.json`:

```json
{ "registries": { "@danielbodnar": "https://styles.bitbuilder.cloud/r/{name}.json" } }
```

## Install the skill

```
/plugin marketplace add danielbodnar/<repo>
/plugin install design-system@danielbodnar-design
```

## Layout

| Path | Contents |
|---|---|
| `src/themes/` | Upstream openchamber theme JSON, vendored unmodified |
| `scripts/` | Build pipeline. No dependencies. |
| `tokens/` | DTCG 2025.10 token files, the standards source of truth |
| `dist/css/` | Standalone CSS, the offline fallback |
| `public/r/` | Built shadcn registry items |
| `design-md/` | DESIGN.md color-block partials |
| `plugin/` | Claude Code plugin containing the design-system skill |

## Build

```
node scripts/build.mjs                    # OKLCH, default
node scripts/build.mjs --format hex
node scripts/build.mjs --namespace @acme
```

Requires node 18 or later, or bun. Nothing else.

## Licensing

This repository: MIT.
Themes ported from [openchamber](https://github.com/openchamber/openchamber),
MIT, copyright 2025 Bohdan Triapitsyn.
DESIGN.md references from
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md),
MIT, copyright 2026 VoltAgent.
