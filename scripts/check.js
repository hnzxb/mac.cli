#!/usr/bin/env bun
// 确定性 guardrail：违反即 exit 1，报错文案直接写修复方式，替代 CLAUDE.md 说教
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const files = [...walk('src'), ...walk('bin')]
const errors = []
const err = (file, line, msg, fix) =>
  errors.push(`${file}:${line ?? '?'} ${msg}\n  ↳ 修复: ${fix}`)

for (const file of files) {
  if (!file.endsWith('.js')) continue
  const src = readFileSync(file, 'utf8')
  const lines = src.split('\n')

  // 1. 禁止 TypeScript 语法混入 JS
  lines.forEach((l, i) => {
    if (/:\s*(string|number|boolean|any|unknown)\b/.test(l))
      err(file, i + 1, '检测到 TS 类型标注', '删除类型标注，本仓库是纯 ES6+ JS')
    if (/\bas\s+(const|[A-Z]\w+)/.test(l))
      err(file, i + 1, '检测到 as 断言', '删除 as 断言')
    if (/\binterface\s+[A-Z]\w*\s*\{/.test(l))
      err(file, i + 1, '检测到 TS interface', '改用 JSDoc 或普通对象')
  })

  // 2. commands 层只能 import citty 和 bridge（胶水必须下沉）
  if (file.startsWith('src/commands/')) {
    lines.forEach((l, i) => {
      const m = /from\s+'(\.[^']+)'/.exec(l)
      if (m && !m[1].startsWith('../bridge/'))
        err(file, i + 1, `commands 层非法本地依赖 ${m[1]}`, '把系统调用逻辑移到 src/bridge/ 后再导入')
    })
  }

  // 3. 文件行数上限
  if (lines.length > 800) err(file, null, `文件 ${lines.length} 行超限`, '拆分为低耦合子模块')

  // 4. 禁止未处理的裸 throw / 禁 debug 残留
  lines.forEach((l, i) => {
    if (/\bdebugger\b/.test(l)) err(file, i + 1, 'debugger 残留', '删除')
  })
}

// 5. 每个子命令文件必须在 src/main.js 注册
const main = readFileSync('src/main.js', 'utf8')
for (const f of readdirSync('src/commands')) {
  const name = f.replace('.js', '')
  if (!main.includes(`./commands/${name}.js`))
    errors.push(`src/commands/${f} 未注册\n  ↳ 修复: 在 src/main.js 的 subCommands 中加入 ${name}`)
}

if (errors.length) {
  console.error(`✗ check 失败 (${errors.length} 项)\n\n${errors.join('\n\n')}`)
  process.exit(1)
}
console.log(`✓ check 通过 (${files.filter((f) => f.endsWith('.js')).length} 个文件)`)
