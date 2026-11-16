import { defineCommand } from 'citty'
import { spawn } from 'node:child_process'

const parseDuration = (s) => {
  const m = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/.exec(s ?? '')
  if (!m) return null
  const unit = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 }
  return Math.round(parseFloat(m[1]) * unit[m[2] ?? 's'])
}

export const stay = defineCommand({
  meta: { name: 'stay', description: '防休眠 (caffeinate)，默认 1h' },
  args: {
    duration: { type: 'positional', description: '时长，如 90m / 2h / 30s', required: false },
    wait: { type: 'string', description: '绑定 PID，进程结束自动恢复休眠' },
  },
  run: async ({ args }) => {
    const proc = spawn('/usr/bin/caffeinate', ['-dims'], { stdio: 'inherit' })
    const pid = args.wait
    const timer = parseDuration(args.duration ?? '1h')
    console.log(`☕ 防休眠已启动 (caffeinate pid=${proc.pid})`)

    if (pid) {
      const { setInterval } = await import('node:timers')
      const check = setInterval(() => {
        try {
          process.kill(Number(pid), 0)
        } catch {
          clearInterval(check)
          proc.kill('SIGTERM')
          console.log('☕ 绑定进程已结束，防休眠解除')
          process.exit(0)
        }
      }, 5000)
    } else if (timer) {
      setTimeout(() => {
        proc.kill('SIGTERM')
        console.log('☕ 时间到，防休眠解除')
        process.exit(0)
      }, timer)
    }
    proc.on('close', () => process.exit(0))
  },
})
