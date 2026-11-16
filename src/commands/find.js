import { defineCommand } from 'citty'
import { runCmd, fail } from '../bridge/exec.js'

export const find = defineCommand({
  meta: { name: 'find', description: 'Spotlight (mdfind) 秒级文件检索' },
  args: {
    query: { type: 'positional', description: '搜索词', required: true },
    type: { type: 'string', description: '文件类型，如 image/pdf/audio' },
    live: { type: 'boolean', description: '只搜文件名（默认全文索引）' },
    limit: { type: 'string', description: '限制输出条数', default: '20' },
  },
  run: async ({ args }) => {
    const mdfindArgs = []
    if (args.live) mdfindArgs.push('-name')
    if (args.type) mdfindArgs.push(`${args.query} kind:${args.type}`)
    else mdfindArgs.push(args.query)
    try {
      const out = await runCmd('/usr/bin/mdfind', mdfindArgs)
      const lines = out.trim().split('\n').filter(Boolean).slice(0, Number(args.limit))
      lines.forEach((l) => console.log(l))
      if (!lines.length) console.log('(无结果)')
    } catch (e) {
      fail(e.message)
    }
  },
})
