// Token layer definitions.
//
// Two layers, strictly additive:
//
//   core  The shadcn/ui variable contract plus semantic extensions.
//         Unprefixed names, because they must match what shadcn components read.
//
//   code  Editor and agent surfaces: syntax, markdown, chat, tools, PR state.
//         Every name is prefixed, so the layer can never collide with core,
//         with Tailwind, or with another registry item. Append, never overwrite.

/* ---------- core ---------- */

// Exactly the names shadcn/ui components consume. Do not rename these.
export const shadcnContract = (c) => ({
  background: c.surface.background,
  foreground: c.surface.foreground,
  card: c.surface.elevated,
  'card-foreground': c.surface.elevatedForeground,
  popover: c.surface.elevated,
  'popover-foreground': c.surface.elevatedForeground,
  primary: c.primary.base,
  'primary-foreground': c.primary.foreground,
  secondary: c.surface.subtle,
  'secondary-foreground': c.surface.foreground,
  muted: c.surface.muted,
  'muted-foreground': c.surface.mutedForeground,
  accent: c.interactive.hover,
  'accent-foreground': c.surface.foreground,
  destructive: c.status.error,
  'destructive-foreground': c.status.errorForeground,
  border: c.interactive.border,
  input: c.interactive.border,
  ring: c.interactive.focus,
  // Sidebar block, part of the contract since the sidebar component shipped.
  'sidebar': c.surface.muted,
  'sidebar-foreground': c.surface.foreground,
  'sidebar-primary': c.primary.base,
  'sidebar-primary-foreground': c.primary.foreground,
  'sidebar-accent': c.interactive.hover,
  'sidebar-accent-foreground': c.surface.foreground,
  'sidebar-border': c.interactive.border,
  'sidebar-ring': c.interactive.focus,
})

// Semantics the shadcn contract does not cover but most applications need.
export const semanticExtensions = (c) => ({
  'primary-hover': c.primary.hover,
  'primary-active': c.primary.active,
  'primary-muted': c.primary.muted,
  'primary-emphasis': c.primary.emphasis,
  'surface-subtle': c.surface.subtle,
  'surface-overlay': c.surface.overlay,
  'border-hover': c.interactive.borderHover,
  'border-focus': c.interactive.borderFocus,
  'focus-ring': c.interactive.focusRing,
  selection: c.interactive.selection,
  'selection-foreground': c.interactive.selectionForeground,
  ...Object.fromEntries(
    ['error', 'warning', 'success', 'info'].flatMap((k) => [
      [k, c.status[k]],
      [`${k}-foreground`, c.status[`${k}Foreground`]],
      [`${k}-background`, c.status[`${k}Background`]],
      [`${k}-border`, c.status[`${k}Border`]],
    ]),
  ),
})

/* ---------- code ---------- */

const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())

const flatten = (obj, prefix, out = {}) => {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = `${prefix}-${kebab(k)}`
    if (v && typeof v === 'object') flatten(v, key, out)
    else out[key] = v
  }
  return out
}

// Prefixed so the layer is safe to append to any project.
export const codeLayer = (c) => ({
  ...flatten(c.syntax?.base, 'code'),
  ...flatten(c.syntax?.tokens, 'code-token'),
  ...flatten(c.syntax?.highlights, 'code'),
  ...flatten(c.markdown, 'md'),
  ...flatten(c.chat, 'chat'),
  ...flatten(c.tools, 'tool'),
  ...flatten(c.pr, 'pr'),
})

/* ---------- selection guidance ---------- */

export const LAYERS = {
  core: {
    build: (c) => ({ ...shadcnContract(c), ...semanticExtensions(c) }),
    when: 'Always. Every project.',
  },
  code: {
    build: codeLayer,
    when:
      'Any surface that renders source code, diffs, rendered Markdown, or agent ' +
      'conversation. Documentation sites, changelogs, code blocks in a blog, ' +
      'terminals, editors, chat UI, PR views. Skip for a marketing page or a ' +
      'dashboard with no code and no prose rendering.',
  },
}
