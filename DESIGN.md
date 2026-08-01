# Cursor IRL — Design System

Tokens extracted live from [cursor.com](https://www.cursor.com/) and [cursor.com/brand](https://www.cursor.com/brand) on 2026-08-01 via DevTools/Playwright.

Inspired by Cursor’s public marketing surface. Not a pixel copy of the marketing site.

## Mood

Warm cream editorial canvas, warm near-black ink, single orange accent. Pill CTAs. Hairline borders. Flat tonal surfaces (no heavy shadows). Compact monospace metadata for the “live room of cursors” feel.

## Light theme (default `data-theme="light"`)

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#f7f7f4` | Page canvas |
| `--color-text` | `#26251e` | Primary ink |
| `--color-text-muted` | `color-mix(in oklab, #26251e 60%, transparent)` | Secondary copy |
| `--color-accent` | `#f54e00` | Links / accent moments |
| `--color-card` | `#f2f1ed` | Elevated surface |
| `--color-card-hover` | `#ebeae5` | Hover surface |
| `--color-muted-surface` | `#e6e5e0` | Secondary button fill |
| `--color-border` | `color-mix(in oklab, #26251e 10%, transparent)` | Hairline |
| `--color-border-strong` | `color-mix(in oklab, #26251e 20%, transparent)` | Stronger edge |
| `--color-success` | `#1f8a65` | Active / met |
| `--color-error` | `#cf2d56` | Destructive |

### Timeline pastels (cursor identity palette)

Useful as distinct attendee cursor colors (also used on cursor.com product demos):

| Name | Hex |
| --- | --- |
| Peach | `#dfa88f` |
| Mint | `#9fc9a2` |
| Blue | `#9fbbe0` |
| Lavender | `#c0a8dd` |
| Gold | `#c08532` |
| Orange | `#f54e00` |
| Teal | `#267f99` |
| Rose | `#cf2d56` |

## Dark theme (`data-theme="dark"`)

| Token | Value |
| --- | --- |
| `--color-bg` | `#14120b` |
| `--color-text` | `#edecec` |
| `--color-text-muted` | `color-mix(in oklab, #edecec 60%, transparent)` |
| `--color-accent` | `#f54e00` (same) |
| `--color-card` | `#1b1913` |
| `--color-card-hover` | `#201e18` |
| `--color-border` | `color-mix(in oklab, #edecec 10%, transparent)` |

## Typography

Live stack on cursor.com:

```text
CursorGothic, "CursorGothic Fallback", system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif
```

Mono (metadata, cursor codes, handles):

```text
berkeleyMono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
```

**Licensing note:** CursorGothic is not a redistributable public font. For Cursor IRL we approximate with:

- UI / display: `Instrument Sans` (tight tracking on headlines)
- Mono: `JetBrains Mono`

Observed type treatment:

- Body: 16px / 24px / weight 400
- Compact actions: 14px / weight 400
- Hero-ish headings: weight 400 with negative letter-spacing (~`-0.02em` to `-0.03em`)
- Transitions: `0.14s`

## Components (from live CTAs)

**Primary pill**

- Fill `#26251e`, text `#f7f7f4`, 1px solid `#26251e`
- Radius: full pill
- Padding ~`12.5px 21.6px` (large) or `5.6px 10.5px` (compact)

**Secondary pill**

- Fill `#e6e5e0`, text `#26251e`, near-invisible border
- Same pill radius / padding as primary

**Ghost / outline pill**

- Transparent fill, 1px border at ~20% ink opacity

**Cards / IDE panels**

- Surface `#f2f1ed`
- Radius `4px` on marketing feature cards; product chrome uses softer larger radii
- For Cursor IRL attendee “IDE cards”: `4px`–`8px`, hairline border, no multi-layer shadow

## Motion for Cursor IRL

Keep Cursor’s restraint, then add 2–3 product-specific motions:

1. Soft cursor pointer drift on card hover
2. Subtle pulse on “Here now” presence
3. Connection spark when “I met this person” succeeds

Respect `prefers-reduced-motion`.

## Brand rules (from cursor.com/brand)

- Call the product **Cursor**, never “Cursor AI” / “Cursor Code”
- Our app name: **Cursor IRL**
- Tagline: **Turn handles into handshakes.**
- Hero: **Who’s actually here?**
