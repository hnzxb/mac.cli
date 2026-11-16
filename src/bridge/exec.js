import { spawn } from 'node:child_process'

export const runCmd = async (cmd, args = [], { env } = {}) =>
  new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { env: { ...process.env, ...env } })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => (stdout += d))
    proc.stderr.on('data', (d) => (stderr += d))
    proc.on('close', (code) =>
      code === 0 ? resolve(stdout) : reject(new Error(stderr.trim() || `${cmd} exited with ${code}`)),
    )
  })

export const fail = (msg) => {
  console.error(`✗ ${msg}`)
  process.exit(1)
}
