# Changes in this fork — 3.7.2-dsh

Based on upstream `wavedrom/wavedrom` 3.7.0 (`trunk` @ `142dd41`). Licence stays
MIT; the items below are the only differences from upstream.

## Added

### `latency` — per-lane delay, as a percentage of one period

```json5
{ name: 'miso', wave: 'x..4x=x', data: '9F', latency: 50 }
```

* The value is a percentage of **one period**: `100` = one full period later,
  `-50` = half a period earlier. The input stays a percentage, the movement is
  applied at **pixel resolution** (no rounding to the half-period brick grid).
* The drawing is laid out on a finer grid: one period is exactly 100 units and
  the `viewBox` is scaled by the same factor with `width`/`height` untouched, so
  the picture keeps its size while `1%` of a period is exactly one unit
  (0.4 px with the default skin at `hscale: 1`).
* Every lane keeps the same left edge: a delayed waveform is pushed to the right
  and the gap is filled by wrapping the lane pattern around; an advanced waveform
  has its head clipped, and the clipped part never spills into the name column.
  No glyph is ever stretched.

### `config.cursor` — vertical cursor lines with annotations

```json5
config: { cursor: [
  { x: '25%', text: 'tSU', color: 3, textColor: 3 },
  { x: 9,     text: 'x=9', color: 'a' }
]}
```

* `x` is a brick position or `'NN%'` of the diagram width.
* `color` (line) and `textColor` (annotation) take the same colour codes as the
  wave data — `2`-`9`, the new letters below, or a literal `'#rrggbb'`.

### Lettered macaron colours `a b c e f g`

* Six extra low-saturation colours, usable wherever a data colour code is used
  (`wave: 'x.abcefgx'`) and as `config.cursor` colours.
* Implemented **without touching the skin files**: the variants are cloned from
  the skin's existing colour family when the skin is first used, and the new CSS
  classes are appended to the skin's `<style>`. All six skins work; the dark skin
  gets a darker set so its white text stays readable.
* `d` is deliberately **not** one of them — it is the "don't care" brick of the
  wave grammar.

## Fixed

* Lettered colour codes missed the two-colour transition glyphs whose **left**
  half is a letter (`vmv-a-5`) and the letter-to-letter ones (`vmv-a-b`), so two
  adjacent macaron cells referenced a glyph that did not exist and the crossing
  block between them was not drawn at all. All ordered pairs with a letter on
  either side are generated now, and a test asserts that every glyph referenced
  by a lane exists in the skin.
* `find-lane-markers.js` only recognised `vvv-2` .. `vvv-9` as value cells, so
  `data` labels on lettered cells were misplaced. The test is pattern based now.
* `dist.min` used a POSIX `/dev/null` redirect inside
  `child_process.execSync` (which always uses `cmd.exe` on Windows) and failed
  there. The redirect is gone, so the whole `prepare` chain works on Windows.

## Tests

`npm test` (eslint + c8/mocha) passes; new cases cover the latency offset, the
cursor output and the lettered colours. Rendering of the pre-existing diagrams is
unchanged — verified pixel by pixel against a pristine 3.7.0 checkout.

## Build notes

* `pnpm-workspace.yaml` records the pnpm 11 decision about esbuild's build script
  (`allowBuilds: esbuild: false`); esbuild 0.28.2 works without that script.
* `pnpm-lock.yaml` is not committed (see `.gitignore`).
