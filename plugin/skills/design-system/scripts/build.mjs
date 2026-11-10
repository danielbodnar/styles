#!/usr/bin/env node
// Build pipeline: openchamber theme JSON -> DTCG tokens, CSS, registry items.
//
//   node scripts/build.mjs [--format oklch|hex|rgb] [--namespace @ns]
//                          [--src <dir>] [--out <dir>]
//
// Outputs:
// Outputs, relative to --out (default '.'):
//   tokens/<id>.tokens.json        DTCG 2025.10, standards source of truth
//   css/<id>.css                   core layer, standalone fallback
//   css/<id>.code.css              code layer, additive
//   r/theme-<id>.json              shadcn registry:theme item
//   r/theme-<id>-code.json         shadcn registry:style item
//   r/themes.json                  index
//   design-md/<id>.colors.md       DESIGN.md colors block, partial

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { convert, toDtcgColor } from './color.mjs'
import { LAYERS } from './tokens.mjs'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}
const FORMAT = arg('format', 'oklch')
const NAMESPACE = arg('namespace', '@danielbodnar')
const BASE_URL = arg('base-url', 'https://styles.bitbuilder.cloud/r')
const SRC = arg('src', 'src/themes')
const OUT = arg('out', '.')

const read = (p) => JSON.parse(readFileSync(p, 'utf8'))
const write = (p, s) => writeFileSync(p, typeof s === 'string' ? s : JSON.stringify(s, null, 2) + '\n')
const dir = (d) => join(OUT, d)
for (const d of ['tokens', 'css', 'r', 'design-md']) mkdirSync(dir(d), { recursive: true })

/* ---------- load and group ---------- */

const families = new Map()
for (const f of readdirSync(SRC).filter((f) => f.endsWith('.json'))) {
  const t = read(join(SRC, f))
  const variant = t.metadata.variant === 'dark' ? 'dark' : 'light'
  const id = t.metadata.id.replace(new RegExp(`-${variant}$`), '')
  if (!families.has(id)) families.set(id, { id, name: t.metadata.name, tags: t.metadata.tags ?? [] })
  families.get(id)[variant] = t
}

/* ---------- emitters ---------- */

const vars = (theme, layer) => LAYERS[layer].build(theme.colors)

const cssBlock = (theme, layer, indent = '  ') =>
  Object.entries(vars(theme, layer))
    .filter(([, v]) => typeof v === 'string' && v)
    .map(([k, v]) => `${indent}--${k}: ${convert(v, FORMAT)};`)
    .join('\n')

const cssFile = (fam, layer) => {
  const sel = `[data-theme="${fam.id}"]`
  const head = `/* ${fam.name}${layer === 'code' ? ' — code layer' : ''}
 * Generated. Do not edit. Rebuild: node scripts/build.mjs
 * Source: openchamber (MIT, Bohdan Triapitsyn)
 * Format: ${FORMAT}. Fonts and radius omitted deliberately; set per project.
 */`
  const out = [head]
  if (fam.light) out.push(`${sel} {\n${cssBlock(fam.light, layer)}\n}`)
  if (fam.dark) {
    const s = fam.light ? `${sel}[data-scheme="dark"],\n.dark ${sel}` : sel
    out.push(`${s} {\n${cssBlock(fam.dark, layer)}\n}`)
  }
  return out.join('\n\n') + '\n'
}

// DTCG 2025.10. $type is declared on the group and inherited by its members.
const dtcg = (fam) => {
  const group = (theme, layer) => {
    const out = { $type: 'color' }
    for (const [k, v] of Object.entries(vars(theme, layer))) {
      const value = typeof v === 'string' ? toDtcgColor(v) : null
      if (value) out[k] = { $value: value }
    }
    return out
  }
  const doc = {
    $schema: 'https://www.designtokens.org/schemas/2025.10/format.json',
    $description: `${fam.name}. Ported from openchamber (MIT).`,
  }
  for (const variant of ['light', 'dark']) {
    if (!fam[variant]) continue
    doc[variant] = { core: group(fam[variant], 'core'), code: group(fam[variant], 'code') }
  }
  return doc
}

const registryItem = (fam, layer) => {
  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: layer === 'core' ? `theme-${fam.id}` : `theme-${fam.id}-code`,
    title: layer === 'core' ? fam.name : `${fam.name} (code layer)`,
    type: layer === 'core' ? 'registry:theme' : 'registry:style',
    description:
      layer === 'core'
        ? `${fam.name} palette mapped to the shadcn variable contract.`
        : `Syntax, Markdown, chat, and tool tokens for ${fam.name}. Additive; safe alongside any theme.`,
    cssVars: {},
  }
  for (const variant of ['light', 'dark']) {
    if (!fam[variant]) continue
    item.cssVars[variant] = Object.fromEntries(
      Object.entries(vars(fam[variant], layer))
        .filter(([, v]) => typeof v === 'string' && v)
        .map(([k, v]) => [k, convert(v, FORMAT)]),
    )
  }
  if (layer === 'code') item.registryDependencies = [`${BASE_URL}/theme-${fam.id}.json`]
  return item
}

// DESIGN.md carries aesthetic intent for a whole product; a theme carries only
// a palette. Only the colors block is derivable. Everything else is emitted as
// an explicit gap rather than invented.
const designMdPartial = (fam) => {
  const src = fam.light ?? fam.dark
  const c = src.colors
  const line = (k, v) => `  ${k}: "${convert(v, FORMAT)}"`
  const rows = [
    line('primary', c.primary.base),
    line('primary-hover', c.primary.hover),
    line('primary-active', c.primary.active),
    line('on-primary', c.primary.foreground),
    line('canvas', c.surface.background),
    line('ink', c.surface.foreground),
    line('muted', c.surface.mutedForeground),
    line('surface-card', c.surface.elevated),
    line('surface-subtle', c.surface.subtle),
    line('hairline', c.interactive.border),
    line('focus', c.interactive.focus),
    line('success', c.status.success),
    line('warning', c.status.warning),
    line('error', c.status.error),
    line('info', c.status.info),
  ].join('\n')

  return `<!-- Partial. Paste into a DESIGN.md and complete the marked sections.
     Derived from the ${fam.name} theme; the palette is real, nothing else is.
     Do not invent the remaining values. Ask, or generate them from a scale. -->

colors:
${rows}

# TODO typography: no source data in a theme file.
#      Generate from https://utopia.fyi/type/calculator/ and paste the steps.
# TODO spacing: no source data. Generate from https://utopia.fyi/space/calculator/
# TODO rounded: no source data. Choose one radius and derive the rest.
# TODO components: no source data. Write these against the real components.
`
}

/* ---------- run ---------- */

const index = []
for (const fam of [...families.values()].sort((a, b) => a.id.localeCompare(b.id))) {
  write(dir(`tokens/${fam.id}.tokens.json`), dtcg(fam))
  write(dir(`css/${fam.id}.css`), cssFile(fam, 'core'))
  write(dir(`css/${fam.id}.code.css`), cssFile(fam, 'code'))
  write(dir(`r/theme-${fam.id}.json`), registryItem(fam, 'core'))
  write(dir(`r/theme-${fam.id}-code.json`), registryItem(fam, 'code'))
  write(dir(`design-md/${fam.id}.colors.md`), designMdPartial(fam))
  index.push({
    id: fam.id,
    name: fam.name,
    tags: fam.tags,
    variants: [fam.light && 'light', fam.dark && 'dark'].filter(Boolean),
    install: `npx shadcn@latest add ${NAMESPACE}/theme-${fam.id}`,
  })
}
write(dir('r/themes.json'), index)
console.log(`built ${index.length} themes in ${FORMAT}`)
