# WaveDrom 3.7.3-dsh

[中文](README.md) | **English**

**Unofficial fork** — based on upstream [wavedrom/wavedrom](https://github.com/wavedrom/wavedrom)
**3.7.0** (`trunk` @ `142dd41`), MIT licensed.

> ### Disclaimer
>
> Maintained by [Reval-cai](https://github.com/Reval-cai). This is an **unofficial fork** of
> WaveDrom, **not affiliated with, nor endorsed by** the original author or the WaveDrom project:
> please do not report this fork's issues upstream, and do not present it as the original work.
>
> Upstream is MIT licensed; this repository **keeps** the original [LICENSE](LICENSE) and copyright
> notice (`Copyright (c) 2011-2026 Aliaksei Chapyzhenka`), and its own changes are MIT as well.
> Any redistribution must keep `LICENSE`, this notice and the upstream copyright notice, and must
> state what was changed.

---

## How to read this document

Every item is tagged so it is obvious what comes from upstream and what this fork changed:

| Tag | Meaning |
|---|---|
| 🟦 **Upstream** | present in upstream 3.7.0, **unchanged** here |
| 🟩 **Added** | added by this fork |
| 🟨 **Changed** | an upstream feature whose **behaviour changed** here |
| 🔧 **Fixed** | an upstream defect fixed here |

Structure: [upstream features](#2-upstream-features) → [what this fork adds](#3-added-in-this-fork) →
[behaviour changes](#4-behaviour-changes-vs-upstream) → [upgrade notes](#5-compatibility--upgrade) →
[usage](#6-install--usage) → [development](#7-development--testing) →
[licence](#9-licence--attribution).

> Chinese version: [README.md](README.md).

---

## 1. What this is

WaveDrom is an open-source engine that renders digital timing diagrams from a compact **WaveJSON**
text description using JavaScript, HTML5 and SVG. This repository is a fork of the library itself
(npm package `wavedrom`). It keeps everything upstream does and adds **per-lane `latency`**,
**`config.cursor` annotations** and **six lettered macaron colour codes**, plus three glyph/build
fixes. The `3.7.x-dsh` version suffix marks the derivative.

---

## 2. Upstream features

All of the following is upstream 3.7.0, **unchanged** here.

| 🟦 Feature | Notes |
|---|---|
| **WaveJSON input** | Object-literal (JSON5-ish) source; unquoted keys and `//` comments are allowed |
| **Wave characters** | Clocks `p n P N`, edges `h l H L`, levels `0 1`, unknown/hi-Z/pull `x z u d`, data cells `2`-`9` and `=`, `.` repeats the previous state, `\|` inserts a gap |
| **Groups and blank lanes** | Nested groups `['name', …]`, blank lane `{}` |
| **Period and phase** | Per-lane `period` and `phase` |
| **Data annotation** | `data` labels on data cells; `over` / `under` markers around buses |
| **Arrows** | `node` + `edge`: `~` curve, `-` line, `>`/`<` arrowheads, optional text |
| **Time axis** | `head` / `foot` with `tick` / `tock` / `every` and titles; `tspan` rich text |
| **Diagram config** | `config`: `hscale`, `skin`, `marks`, `hbounds` |
| **Skin mechanism** | [WaveDromSkin](unpacked/README.md); six built-in skins `default narrow narrower narrowerer dark lowkey` |
| **CLI** | `npx wavedrom --input source.json5 > out.svg`; `-t/--indent`, `-h` |
| **PNG export** | via `@resvg/resvg-js-cli`: `npx wavedrom -i s.json5 \| npx @resvg/resvg-js-cli - out.png` |
| **Web embedding** | load `wavedrom.min.js`, call `<body onload="WaveDrom.ProcessAll()">`, add `<script type="WaveDrom">…</script>` |
| **Server-side rendering** | `https://svg.wavedrom.com/…` renders WaveJSON URLs into images |
| **Editor / desktop app** | companion [WaveDrom Editor](https://github.com/wavedrom/wavedrom.github.io) |
| **Toolchain** | `eslint` + `c8`/`mocha` tests, `esbuild` bundles `wavedrom.js` / `.min.js` / `.unpkg*.js` |

---

## 3. Added in this fork

### 3.1 🟩 `latency` — per-lane delay (percentage of a period, pixel resolution)

```json5
{ name: 'miso', wave: 'x..4x=x', data: '9F', latency: 50 }     // half a period later
{ name: 'fine', wave: 'x.5x=xx', data: 'CMD ST', latency: 12 }  // 4.8 px (default skin)
```

The value is a **percentage of one period**, signed: `100` = one full period later, `50` = half a
period later, `-50` = half a period earlier. The shift is **not snapped to bricks**: the drawing is
laid out so one period is exactly 100 units (`viewBox` scaled, `width`/`height` unchanged), which
makes **1 % = 1 unit = 0.4 px** with the default skin at `hscale: 1` — so `latency: 12` really is
4.8 px.

**Every lane keeps the same left edge**: a delayed waveform is pushed out and the gap filled by
wrapping the lane pattern around; an advanced waveform has its head clipped and the clipped part
never spills into the name column. No glyph is ever stretched.

### 3.2 🟩 `config.cursor` — vertical cursor lines with annotations

```json5
config: { cursor: [
  { x: 5,     text: 'tSU', color: 3,      textColor: 3 },
  { x: '90%', text: 'tH',  color: '#c00', textColor: '#c00' }
]}
```

`x` is a brick position or `'NN%'` of the diagram width; `text` is the annotation (omit it to draw
just the line); `color` and `textColor` use **the same codes as the wave data**: `2`-`9`, the new
letters, or a literal `'#rrggbb'`.

### 3.3 🟩 Six lettered colour codes `a b c e f g` (low-saturation macaron colours)

```json5
{ name: 'macaron', wave: 'x.axbxcxexfxgx', data: 'a1 b1 c1 e1 f1 g1' }
```

| Code | Colour | Code | Colour |
|---|---|---|---|
| `a` | `#f6c8d0` pink | `e` | `#c3e8d0` green |
| `b` | `#d6c8f0` lilac | `f` | `#f0dfa8` sand |
| `c` | `#b9d4e8` blue | `g` | `#bfe3e0` teal |

Used exactly like the numeric codes (value cells and `config.cursor` colours). Implemented by
**cloning the skin's existing colour family at load time**, so **no skin file is modified** and all
six skins work (the dark skin gets a darker set). Note **`d` is not a colour** — it is the wave
grammar's "don't care" brick.

### 3.4 🔧 Fixes

| Defect | Notes | Fixed in |
|---|---|---|
| Misplaced `data` labels on lettered cells | `find-lane-markers.js` only recognised `vvv-2`…`vvv-9`, so lettered cells were not treated as data cells | 3.7.1-dsh |
| `dist.min` fails on Windows | the POSIX `/dev/null` redirect inside `execSync` always fails under `cmd.exe` | 3.7.1-dsh |
| Missing letter↔letter / letter→digit transitions | only `-3`-suffixed templates were cloned, so `vmv-a-b` and `vmv-a-5` did not exist and **the crossing block between two adjacent macaron colours was blank** | 3.7.2-dsh |
| Missing equal-neighbour letter connector | numeric codes use `vmv-5-5` between equal neighbours; the lettered `vmv-c-c` was not generated, so `x.ccx` was blank too | 3.7.3-dsh |

> **Upgrade note**: `3.7.1-dsh` and `3.7.2-dsh` have incomplete glyph families — use **`3.7.3-dsh`**
> or newer.

---

## 4. Behaviour changes vs upstream

| 🟨 Item | Notes |
|---|---|
| **Internal coordinate precision (PPI)** | To make "1 % of a period" an exact unit, the content is wrapped in `scale(K)` with `K = 100 / (2·hscale·xs)` and the `viewBox` is scaled to match; the `width`/`height` attributes are **unchanged**, so the **picture size and pixel appearance are identical** — only the coordinate numbers in the SVG source grow (×2.5 for the default skin at `hscale: 1`) |
| **`latency` resolution** | the shift is no longer rounded to the half-period brick grid: `latency: 6` (≈ no movement before) now means 6 % of a period = 2.4 px |
| **Glyph count in the SVG** | the extra definitions are **unreferenced** and change nothing visually; they are only referenced when lettered codes are used |
| **Regression gate** | because the `viewBox` changes, this fork's acceptance gate is **pixel-identical rendering** rather than byte-identical SVG |

**Compatibility guarantee**: every upstream syntax and every existing diagram renders
**pixel-identically** (verified by rasterising the six legacy cases before and after the changes).

---

## 5. Compatibility & upgrade

* From upstream `3.7.0`: drop-in. Documents that do not use the new fields behave the same (apart
  from the internal coordinate precision, which does not affect rendering).
* From this fork's `3.7.1-dsh` / `3.7.2-dsh`: go to `3.7.3-dsh`+ — those two have incomplete
  lettered glyph families.
* The old `latency: 6` (once interpreted as bricks → effectively no movement) now means 6 % of a
  period.

---

## 6. Install & usage

### Install

```sh
# this fork
npm install Reval-cai/wavedrom#v3.7.3-dsh

# or download the prebuilt wavedrom.min.js / wavedrom.js / wavedrom.unpkg*.js from Releases
```

The upstream npm package (`npm install wavedrom`) and the CDNs (jsDelivr / unpkg) do **not** contain
this fork's features.

### CLI (🟦 upstream, unchanged)

```sh
npx wavedrom -i source.json5 > output.svg
npx wavedrom -i source.json5 | npx @resvg/resvg-js-cli - output.png
```

### Web embedding (🟦 upstream; 🟩 marks the fields this fork adds)

```html
<script src="wavedrom.min.js" type="text/javascript"></script>
<body onload="WaveDrom.ProcessAll()">
<script type="WaveDrom">
{ signal: [
  { name: 'clk',  wave: 'p.......' },
  { name: 'miso', wave: 'x..4x=x.', data: '9F', latency: 50 },   // 🟩 this fork
  { name: 'macaron', wave: 'x.axbxcx', data: 'A B C' }           // 🟩 this fork
],
  config: { cursor: [{ x: '25%', text: 'tSU', color: 3 }] }        // 🟩 this fork
}
</script>
```

### Cell shapes

A cell's slants, crossing and connector depend on its **neighbours**, not on the colour code:

| Wave | Result |
|---|---|
| `x.axbxcx` | `x`-separated → slanted trapezoids |
| `xabcx` | adjacent, differing → straight boxes + two-colour crossing bricks |
| `x.ccx` | adjacent, equal → equal-colour connector (numeric `x.55x` behaves identically) |

---

## 7. Development & testing

| 🟦 Command | Notes |
|---|---|
| `npm test` | `eslint lib bin` + `c8`/`mocha` |
| `npm run dist` / `dist.min` | build `wavedrom.js` / `wavedrom.min.js` |
| `npm run unpkg` / `unpkg.min` | build the unpkg bundles |
| `npm run prepare` | all of the above (including tests) |
| `npm run skins` | regenerate `skins/*.js` from `unpacked/skins/*.svg` |
| `npm run clean` | remove build outputs |

Fork-specific notes:

* 🔧 `dist.min` no longer uses the `/dev/null` redirect that always fails on Windows.
* 🟩 On pnpm, `ERR_PNPM_IGNORED_BUILDS` is silenced by the committed `pnpm-workspace.yaml`
  (`allowBuilds: esbuild: false`; esbuild does not need its build script).
* 🟩 The test suite asserts that **every glyph referenced by a lane exists in the skin** and that a
  lettered lane uses the same shape sequence as the numeric one — the regression guard for the
  three glyph defects above.
* 🟩 The acceptance procedure for a rendering change: rasterise the legacy cases and compare
  **pixel by pixel** against upstream 3.7.0.

---

## 8. Versions and changelog

| Version | Content |
|---|---|
| `v3.7.3-dsh` | 🔧 equal-neighbour letter connector (`x.ccx`) |
| `v3.7.2-dsh` | 🔧 letter↔letter / letter→digit transitions |
| `v3.7.1-dsh` | 🟩 `latency`, `config.cursor`, lettered codes `a b c e f g`; 🔧 labels and the Windows build |
| upstream `3.7.0` | baseline |

* [Releases](https://github.com/Reval-cai/wavedrom/releases) · [CHANGES.md](CHANGES.md)

---

## 9. Licence & attribution

* Based on upstream **WaveDrom 3.7.0**, **MIT licensed**, keeping the original copyright notice
  `Copyright (c) 2011-2026 Aliaksei Chapyzhenka` **in full**; this fork's changes are MIT as well.
* Redistribution must keep `LICENSE` and the upstream copyright notice, keep the unofficial-fork
  notice at the top of this README, and state what was changed.
* This fork is **not affiliated with, nor endorsed by** the original author.
* Third-party dependencies (bit-field, json5, logidrom, onml, tspan — all MIT) are listed in
  [THIRD-PARTY.md](THIRD-PARTY.md).

## 10. Upstream community

Upstream discussions, tutorials and donations stay with the original project:
[WaveDrom user group](http://groups.google.com/group/wavedrom),
[EDITOR](http://wavedrom.com/editor.html) | [TUTORIAL](http://wavedrom.com/tutorial.html),
[WaveJSON spec](https://github.com/wavedrom/schema/blob/master/WaveJSON.md).

---

[中文](README.md) | **English**
