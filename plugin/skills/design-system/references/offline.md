# Offline and fallback procedure

Everything the registry installs can be reproduced by hand from this repository.
The registry is a convenience, not a dependency. Use this path when the registry
is unreachable, the project does not use shadcn, the framework has no shadcn
port, or the person prefers vendored files.

## Decision

| Situation | Path |
|---|---|
| Project has `components.json`, registry reachable | `npx shadcn@latest add @danielbodnar/theme-<id>` |
| Project has `components.json`, registry unreachable | Fetch the item JSON from GitHub raw and pass the URL to `shadcn add` |
| No shadcn, any framework | Copy the CSS, section 2 below |
| Needs tokens for a non-web target | Use the DTCG file with Style Dictionary or Terrazzo, section 3 |
| Nothing available, no network | Regenerate from source, section 4 |

## 1. Registry item by direct URL

`shadcn add` accepts a URL as well as a namespaced name, so a bare GitHub raw
URL works without registry configuration:

```
npx shadcn@latest add https://raw.githubusercontent.com/<owner>/<repo>/main/public/r/theme-flexoki.json
```

Add `--dry-run` first to see what it will write.

## 2. Copy the CSS

The generated CSS is standalone. It declares custom properties and nothing else,
so it works with Tailwind, UnoCSS, CSS Modules, Lit, or plain CSS.

```
cp assets/themes/css/flexoki.css      <project>/src/styles/themes/
cp assets/themes/css/flexoki.code.css <project>/src/styles/themes/   # only if needed
```

```css
/* src/styles/app.css */
@import "tailwindcss";
@import "./themes/flexoki.css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}
```

Then set `data-theme` and `data-scheme` on `<html>` per the picker requirements
in `theming.md`.

Without Tailwind, skip the `@theme inline` block entirely and reference the
custom properties directly: `background: var(--background)`.

## 3. Non-web targets

`assets/themes/tokens/<id>.tokens.json` is DTCG 2025.10 and feeds any conformant build tool.

```
npx tz build                      # Terrazzo, fullest DTCG support
npx style-dictionary build        # Style Dictionary v5
```

Point the tool's source glob at `assets/themes/tokens/*.tokens.json`.

## 4. Regenerate from source

The build has no dependencies and runs under node 18 or later, or bun.

```
node scripts/build.mjs --src assets/themes/src --out assets/themes
node scripts/build.mjs --src assets/themes/src --out assets/themes --format hex
node scripts/build.mjs --src assets/themes/src --out /tmp/build --namespace @acme
```

The upstream source in `assets/themes/src/` is vendored unmodified, so the
whole pipeline reproduces offline with no network and no dependencies.

## 5. Building a picker without the registry component

The picker is roughly forty lines in any framework. The behavior, not the code,
is what matters. Implement all five requirements from `theming.md`, in this
order:

1. Inline blocking script in `<head>` reads `localStorage` and sets
   `data-theme`, `data-scheme`, and `style.colorScheme` before first paint.
2. A control writes both keys back to `localStorage` and updates the same three
   properties.
3. A `matchMedia('(prefers-color-scheme: dark)')` listener updates the scheme
   while the stored value is `system`.
4. Around every attribute change, add a class that sets `transition: none !important`
   on `*`, force a reflow by reading `document.body.offsetHeight`, then remove it
   on the next frame.
5. Import only the theme CSS files actually offered.

Do not skip step 4. Without it, changing the attribute animates every themed
property at once, which reads as a visual glitch rather than a theme change.
