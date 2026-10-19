# WaveDrom 3.7.4-dsh

**中文** | [English](README.en.md)

**非官方分支** — 基于上游 [wavedrom/wavedrom](https://github.com/wavedrom/wavedrom) **3.7.0**（`trunk` @ `142dd41`），MIT 许可。

> ### 免责声明
>
> 本仓库由 [Reval-cai](https://github.com/Reval-cai) 维护，是 WaveDrom 的**非官方分支**，与原作者
> Aliaksei Chapyzhenka 及 WaveDrom 项目**无从属关系，也未获其背书**：请勿把本分支的问题反馈给上游，
> 也请勿以原作者名义宣传本分支。
>
> 上游以 **MIT 许可证**发布，本仓库**完整保留**原始 [LICENSE](LICENSE) 与版权声明
> （`Copyright (c) 2011-2026 Aliaksei Chapyzhenka`），本分支新增与修改的部分同样以 **MIT** 发布。
> 任何再分发都必须保留 `LICENSE`、本说明与上游版权声明，并注明修改内容。

---

## 阅读约定

本文用标记区分「原项目就有」和「本分支改的」：

| 标记 | 含义 |
|---|---|
| 🟦 **上游** | 上游 3.7.0 已有，本分支**未修改** |
| 🟩 **本分支新增** | 本分支新增的功能 |
| 🟨 **本分支修改** | 上游功能，但本分支**改动了行为** |
| 🔧 **本分支修复** | 上游缺陷，本分支修复 |

全篇结构：[上游功能](#2-上游原项目功能) → [本分支新增](#3-本分支新增的功能) →
[行为差异](#4-本分支对原有行为的修改) → [兼容升级](#5-兼容性与升级) →
[使用](#6-安装与使用) → [开发](#7-开发与测试) → [许可](#9-许可与署名)。

> 英文版见 [README.en.md](README.en.md)。

---

## 1. 这是什么

WaveDrom 是一个用 JavaScript + HTML5 + SVG 把 **WaveJSON** 文本描述渲染成数字时序图（波形图）的
开源引擎。本仓库是它的库本体（npm 包名 `wavedrom`）的分支：在保持上游全部功能的前提下，增加了
**通道延迟 `latency`**、**游标标注 `config.cursor`**、**6 个字母马卡龙色码**，并修复了三处字形与构建
问题。版本号用 `3.7.x-dsh` 后缀标明这是衍生版本。

---

## 2. 上游原项目功能

以下全部来自上游 3.7.0，本分支**未作修改**。

| 🟦 功能 | 说明 |
|---|---|
| **WaveJSON 输入** | 用类 JSON5 的对象字面量描述波形（允许不写引号、允许 `//` 注释） |
| **波形字符** | `p n P N` 时钟、`h l H L` 电平边沿、`0 1` 电平、`x z u d` 未知/高阻/上拉/下拉、`2`-`9` 数据格、`=` 数据格、`.` 延长上一状态、`\|` 波形断开 |
| **分组与空行** | `['名字', …]` 可嵌套分组；`{}` 空行 |
| **周期与相位** | 每 lane 的 `period`、`phase` |
| **数据标注** | `data` 文本标注在数据格上；`over` / `under` 在总线上下的标记 |
| **箭头** | `node` + `edge` 连线：`~` 曲线、`-` 直线、`>` `<` 箭头，可带文字 |
| **时间轴** | `head` / `foot` 的 `tick` / `tock` / `every` 刻度与标题，文字支持 `tspan` 富文本 |
| **图级配置** | `config`：`hscale`、`skin`、`marks`、`hbounds` |
| **皮肤机制** | [WaveDromSkin](unpacked/README.md)，内置 `default narrow narrower narrowerer dark lowkey` 六种 |
| **CLI** | `npx wavedrom --input source.json5 > out.svg`；`-t/--indent` 缩进、`-h` 帮助 |
| **PNG 导出** | 配合 `@resvg/resvg-js-cli`：`npx wavedrom -i s.json5 \| npx @resvg/resvg-js-cli - out.png` |
| **网页嵌入** | 引入 `wavedrom.min.js`，`<body onload="WaveDrom.ProcessAll()">`，再放 `<script type="WaveDrom">…</script>` |
| **服务端渲染** | `https://svg.wavedrom.com/…` 直接把 WaveJSON 变成图片 |
| **编辑器 / 桌面应用** | 配套 [WaveDrom Editor](https://github.com/wavedrom/wavedrom.github.io) |
| **开发工具链** | `eslint` + `c8`/`mocha` 测试、`esbuild` 打包出 `wavedrom.js` / `.min.js` / `.unpkg*.js` |

---

## 3. 本分支新增的功能

### 3.1 🟩 `latency` — 通道延迟（按周期百分比，像素级精度）

```json5
{ name: 'miso', wave: 'x..4x=x', data: '9F', latency: 50 }     // 延后半个周期
{ name: 'fine', wave: 'x.5x=xx', data: 'CMD ST', latency: 12 }  // 4.8px（默认皮肤）
```

取值是「**一个周期的百分比**」，可正可负：`100` = 延后一整周期，`50` = 半个周期，
`-50` = 提前半个周期。位移**不量化到砖块**：图纸内部按「1 个周期 = 100 单位」排布
（`viewBox` 等比放大、`width`/`height` 不变），于是 **1% = 1 单位 = 0.4px**
（默认皮肤、`hscale: 1`），`latency: 12` 就是 4.8px。

**所有 lane 的左边界始终对齐**：正延迟把波形整体推出、起始区用波形自身回绕填充；负延迟裁掉头部，
被裁部分不会画进左侧名字列；**不拉伸任何字形**。

### 3.2 🟩 `config.cursor` — 竖直游标线 + 文字标注

```json5
config: { cursor: [
  { x: 5,     text: 'tSU', color: 3,      textColor: 3 },
  { x: '90%', text: 'tH',  color: '#c00', textColor: '#c00' }
]}
```

`x` 可以是格数或 `'NN%'`（整图宽度的百分比）；`text` 为标注文字（可省略，只画线）；
`color`（线色）与 `textColor`（字色）**与数据色码同一套**：`2`-`9`、下面的新字母、或直接写 `'#rrggbb'`。

### 3.3 🟩 6 个字母色码 `a b c e f g`（低饱和马卡龙色）

```json5
{ name: 'macaron', wave: 'x.axbxcxexfxgx', data: 'a1 b1 c1 e1 f1 g1' }
```

| 码 | 颜色 | 码 | 颜色 |
|---|---|---|---|
| `a` | `#f6c8d0` 粉 | `e` | `#c3e8d0` 绿 |
| `b` | `#d6c8f0` 紫 | `f` | `#f0dfa8` 沙 |
| `c` | `#b9d4e8` 蓝 | `g` | `#bfe3e0` 青 |

用法与数字色码完全一致（数值格、`config.cursor` 颜色都可用）。实现方式是**在加载时从皮肤已有的彩色
字形家族克隆**，因此**不改动任何皮肤文件**，六种皮肤都可用（深色皮肤自动换成暗色调）。
注意 **`d` 不是颜色** —— 它是波形语法里的 don't care 格。

### 3.4 🔧 修复

| 问题 | 说明 | 修复版本 |
|---|---|---|
| 字母开头的色码被画成未知块 | 首砖块查找表（`gen-first-wave-brick.js`）没有 `a b c e f g`，落到 `default: 'xxx'` → 第一个格子变斜线块、其上的 `data` 标签消失 | 3.7.4-dsh |
| 字母格上的 `data` 标注错位 | `find-lane-markers.js` 原来硬编码只认 `vvv-2`…`vvv-9`，字母格不算数据格 | 3.7.1-dsh |
| `dist.min` 在 Windows 上失败 | `execSync` 里的 POSIX `/dev/null` 重定向在 `cmd.exe` 下必然失败 | 3.7.1-dsh |
| 字母↔字母 / 字母→数字 过渡格缺失 | 只克隆了 id 以 `-3` 结尾的模板，导致 `vmv-a-b`、`vmv-a-5` 不存在，**相邻两个马卡龙色之间的交叉块整块画不出来** | 3.7.2-dsh |
| 同色相邻的字母相连格缺失 | 数字码在相邻同值时用 `vmv-5-5` 连接格，字母的 `vmv-c-c` 没生成 → `x.ccx` 同样空白 | 3.7.4-dsh |

> **升级建议**：`3.7.1-dsh`/`3.7.2-dsh` 字形家族不完整；`3.7.1`–`3.7.3` 会把「波形开头的字母色码」画成未知块。请使用 **`3.7.4-dsh`** 或更新版本。

---

## 4. 本分支对原有行为的修改

| 🟨 项目 | 说明 |
|---|---|
| **内部坐标精度（PPI）** | 为了让「1% 周期」= 一个整数单位，输出内容包了一层 `scale(K)`（`K = 100 / (2·hscale·xs)`），并把 `viewBox` 放大同样倍数；`width`/`height` 属性**不变**，所以**图片尺寸与像素级外观完全不变**，只是 SVG 源码里的坐标数字变大了（默认皮肤 `hscale: 1` 时 ×2.5） |
| **`latency` 分辨率** | 位移不再四舍五入到「半周期」的砖块网格：`latency: 6`（旧语义下约等于不动）现在是 6% 周期 = 2.4px |
| **SVG 里的字形数量** | 增加的是**未被引用**的定义，渲染结果不变（只有使用字母色码时才会被引用） |
| **回归验证方式** | 因为 `viewBox` 会变，本仓库的验收门从「SVG 字节一致」改成「渲染后**逐像素一致**」 |

**兼容性保证**：所有上游语法与既有图片的渲染结果**逐像素不变**（本仓库的 6 张历史用例图在改动前后
做了像素级比对验证）。

---

## 5. 兼容性与升级

* 从上游 `3.7.0` 升级：直接替换即可，未使用新字段的文档行为不变（除上面「内部坐标精度」一项，
  它不影响渲染结果）。
* 从本分支 `3.7.1-dsh` / `3.7.2-dsh` 升级：建议升到 `3.7.4-dsh`+，那两版在字母色码上有字形缺失的缺陷。
* 旧写法 `latency: 6`（曾经被当成 6 砖块 → 实际不动）现在的语义是 6% 周期。

---

## 6. 安装与使用

### 安装

```sh
# 本分支
npm install Reval-cai/wavedrom#v3.7.4-dsh

# 或直接下载 Releases 里构建好的 wavedrom.min.js / wavedrom.js / wavedrom.unpkg*.js
```

上游 npm 包（`npm install wavedrom`）与 CDN（jsDelivr / unpkg）**不包含**本分支的新功能。

### CLI（🟦 上游功能，用法不变）

```sh
npx wavedrom -i source.json5 > output.svg
npx wavedrom -i source.json5 | npx @resvg/resvg-js-cli - output.png
```

### 网页嵌入（🟦 上游功能，🟩 标记的是本分支新增字段）

```html
<script src="wavedrom.min.js" type="text/javascript"></script>
<body onload="WaveDrom.ProcessAll()">
<script type="WaveDrom">
{ signal: [
  { name: 'clk',  wave: 'p.......' },
  { name: 'miso', wave: 'x..4x=x.', data: '9F', latency: 50 },   // 🟩 本分支
  { name: 'macaron', wave: 'x.axbxcx', data: 'A B C' }           // 🟩 本分支
],
  config: { cursor: [{ x: '25%', text: 'tSU', color: 3 }] }        // 🟩 本分支
}
</script>
```

### 单元格形状

数值格两侧的斜边、交叉、相连**取决于它相邻的字符**，与颜色码无关：

| 写法 | 效果 |
|---|---|
| `x.axbxcx` | `x` 分隔 → 斜边梯形 |
| `xabcx` | 相邻异值 → 直边格 + 两色交叉过渡格 |
| `x.ccx` | 相邻同值 → 同色相连格（数字码 `x.55x` 完全同理） |

---

## 7. 开发与测试

| 🟦 命令 | 说明 |
|---|---|
| `npm test` | `eslint lib bin` + `c8`/`mocha` 测试 |
| `npm run dist` / `dist.min` | 打包 `wavedrom.js` / `wavedrom.min.js` |
| `npm run unpkg` / `unpkg.min` | 打包 unpkg 版本 |
| `npm run prepare` | 上面全部（含测试） |
| `npm run skins` | 由 `unpacked/skins/*.svg` 生成 `skins/*.js` |
| `npm run clean` | 清理构建产物 |

本分支的开发说明：

* 🔧 `dist.min` 已去掉 Windows 下必然失败的 `/dev/null` 重定向。
* 🟩 用 pnpm 安装时若遇到 `ERR_PNPM_IGNORED_BUILDS`，仓库内的 `pnpm-workspace.yaml` 已记录
  `allowBuilds: esbuild: false`（esbuild 不需要它的构建脚本）。
* 🟩 测试包含两条断言：「**lane 引用的每个字形都必须在皮肤里存在**」与「字母 lane 与数字 lane
  形状序列相同」—— 正是上面三次字形缺陷的回归保护。
* 🟩 验收渲染改动的标准做法：渲染历史用例图并与上游 3.7.0 **逐像素比对**。

---

## 8. 版本与变更

| 版本 | 内容 |
|---|---|
| `v3.7.4-dsh` | 🔧 字母开头的色码（首砖块查找表）；发布完整示例 `demo.json` |
| `v3.7.3-dsh` | 🔧 同色相邻字母相连格（`x.ccx`） |
| `v3.7.2-dsh` | 🔧 字母↔字母 / 字母→数字 过渡格 |
| `v3.7.1-dsh` | 🟩 `latency`、`config.cursor`、字母色码 `a b c e f g`；🔧 标注与 Windows 构建 |
| 上游 `3.7.0` | 基线 |

* [Releases](https://github.com/Reval-cai/wavedrom/releases) · [CHANGES.md](CHANGES.md)

---

## 9. 许可与署名

* 本仓库基于上游 **WaveDrom 3.7.0**，采用 **MIT 许可证**，原始版权声明
  `Copyright (c) 2011-2026 Aliaksei Chapyzhenka` **完整保留**；本分支新增与修改的部分同样以 MIT 发布。
* 再分发时必须：保留 `LICENSE` 与上游版权声明、保留本 README 顶部的非官方分支说明、注明修改内容。
* 本分支与原作者**无从属关系，也未获其背书**。
* 第三方依赖（bit-field、json5、logidrom、onml、tspan，均为 MIT）见 [THIRD-PARTY.md](THIRD-PARTY.md)。

## 10. 上游社区

上游的讨论、教程与捐赠入口仍在原项目：[WaveDrom user group](http://groups.google.com/group/wavedrom)、
[EDITOR](http://wavedrom.com/editor.html) | [TUTORIAL](http://wavedrom.com/tutorial.html)、
[WaveJSON 规范](https://github.com/wavedrom/schema/blob/master/WaveJSON.md)。

---

**中文** | [English](README.en.md)
