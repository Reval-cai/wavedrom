# 第三方组件与许可 / Third-party components and licences

本仓库基于上游 **WaveDrom 3.7.0**（MIT，`Copyright (c) 2011-2026 Aliaksei Chapyzhenka`）。
下表列出本仓库包含或打包的第三方组件；中文说明见表格之后，English follows.

| 组件 / Component | 版本 / Version | 许可 / Licence | 出处 / Source |
|---|---|---|---|
| WaveDrom（上游 / upstream） | 3.7.0 | MIT | <https://github.com/wavedrom/wavedrom> |
| bit-field | 1.9.0 | MIT | <https://github.com/wavedrom/bitfield> |
| json5 | 2.2.3 | MIT | <https://github.com/json5/json5> |
| logidrom | 1.0.0 | MIT | <https://github.com/drom/logidrom> |
| onml | 2.3.0 | MIT | <https://github.com/drom/onml> |
| tspan | 0.4.0 | MIT | <https://github.com/drom/tspan> |

**中文** — `bit-field`、`json5`、`logidrom`、`onml`、`tspan` 是 `wavedrom` 的运行时依赖，会被打包
进 `wavedrom.min.js`、`wavedrom.js` 与 `wavedrom.unpkg*.js`。它们与上游一样采用 **MIT** 许可，
而 MIT 要求在软件的任何副本或实质性部分中保留其版权与许可声明。本分支**未修改**这些组件。

如果你再分发本分支的源码或构建产物，请同时保留：本文件、`LICENSE`（含上游版权声明）、以及本
README 顶部的分支说明（注明这是一个修改过的非官方分支）。各组件完整的许可文本随其 npm 包分发，
也可在 `node_modules/<name>/LICENSE` 查看（`node_modules` 不入库）。

**English** — `bit-field`, `json5`, `logidrom`, `onml` and `tspan` are runtime
dependencies of `wavedrom` and are bundled into `wavedrom.min.js`, `wavedrom.js`
and `wavedrom.unpkg*.js`. Like upstream they are **MIT** licensed, and the MIT
licence requires that their copyright and permission notices be kept in all copies
or substantial portions of the software. This fork does **not** modify them.

If you redistribute this fork's source or a build of it, keep this file, the
`LICENSE` (with the upstream copyright notice) and the fork notice at the top of
the README (stating that this is a modified, unofficial fork). The full licence
text of each component ships with its npm package and is visible at
`node_modules/<name>/LICENSE` (`node_modules` is not committed).
