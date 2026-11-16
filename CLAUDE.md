# mac.cli

Bun + citty 的 macOS 系统 CLI。入口 `bin/mac.js`，子命令在 `src/commands/`，胶水只放 `src/bridge/`。

- 提交前跑：`bun run check`
- 验证命令：`bun bin/mac.js <cmd>`
- 规则细节全部在 `scripts/check.js` 里，报错信息即修复指引，本文件不重复
