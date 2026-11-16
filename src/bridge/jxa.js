import { spawn } from 'node:child_process'

const runOsascript = async (args, { env } = {}) =>
  new Promise((resolve, reject) => {
    const proc = spawn('/usr/bin/osascript', args, {
      env: { ...process.env, ...env },
    })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => (stdout += d))
    proc.stderr.on('data', (d) => (stderr += d))
    proc.on('close', (code) =>
      code === 0 ? resolve(stdout) : reject(new Error(stderr.trim() || `osascript exited with ${code}`)),
    )
  })

/**
 * 执行 JXA 脚本。参数通过 MAC_ARG_* 环境变量传入，避免 shell 转义问题。
 * 脚本内通过 $.NSProcessInfo.processInfo.environment.objectForKey('MAC_ARG_x') 读取。
 */
export const runJxa = async (script, args = {}) =>
  runOsascript(['-l', 'JavaScript', '-e', script], {
    env: Object.fromEntries(
      Object.entries(args).map(([k, v]) => [`MAC_ARG_${k.replace(/-/g, '_')}`, String(v)]),
    ),
  })

/** JXA 脚本内读取环境变量的辅助片段 */
export const readArg = `
const readArg = (k) => $.NSProcessInfo.processInfo.environment.objectForKey('MAC_ARG_' + k)
`
