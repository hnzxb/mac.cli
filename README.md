# mac.cli

Bun + citty 打造的 macOS 专属高频自动化 CLI 工具箱，零 Homebrew 依赖，全部桥接系统原生命令（`osascript`、`security`、`mdfind`、`caffeinate`）。

## 安装

```bash
git clone https://github.com/hnzxb/mac.cli && cd mac.cli
bun install
bun link
```

## 命令 (P0)

| 命令 | 说明 | 依赖 |
| --- | --- | --- |
| `mac find <query> [--type pdf] [--live] [--limit 20]` | Spotlight 秒级检索 | mdfind |
| `mac secret set/get/run` | Keychain 凭证管理，`run` 以 `key=a,b --cmd "..."` 注入子进程环境变量 | security |
| `mac stay [2h\|--wait <pid>]` | 防休眠，可绑定进程 | caffeinate |
| `mac notify <text> [--title] [--sound Glass]` | 系统通知 | osascript |
| `mac note` | 备忘录 Upsert（P1 完整实现） | Notes.app |

## 开发

```bash
bun run check   # 确定性 guardrail：TS 语法 / 分层依赖 / 行数 / 子命令注册
bun bin/mac.js <cmd>
```

规则全部在 `scripts/check.js` 中以代码强制执行，报错信息即修复指引。

## Roadmap

- P1: `note` 完整实现（Markdown→HTML Upsert）、`clip html/img`、`unquarantine`
- P2: `ocr` (Vision)、`remind`/`cal` (EventKit)、`img` (sips)
