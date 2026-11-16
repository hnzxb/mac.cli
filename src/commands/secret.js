import { defineCommand } from 'citty'
import { runCmd, fail } from '../bridge/exec.js'

const SERVICE = 'mac.cli'

const execSecurity = async (subArgs) => {
  try {
    return await runCmd('/usr/bin/security', subArgs)
  } catch (e) {
    throw new Error(e.message.replace(/^security: /, ''))
  }
}

const setSecret = async ({ key, value }) => {
  await execSecurity([
    'add-generic-password',
    '-a',
    process.env.USER,
    '-s',
    `${SERVICE}.${key}`,
    '-w',
    value,
    '-U',
  ])
  console.log(`✓ ${key} 已存入钥匙串 (${SERVICE}.${key})`)
}

const getSecret = async ({ key }) => {
  const out = await execSecurity([
    'find-generic-password',
    '-a',
    process.env.USER,
    '-s',
    `${SERVICE}.${key}`,
    '-w',
  ])
  process.stdout.write(out)
}

const runWithSecrets = async ({ key, cmd }) => {
  const keys = key.split(',')
  const env = { ...process.env }
  for (const k of keys) {
    const v = (await execSecurity(['find-generic-password', '-a', process.env.USER, '-s', `${SERVICE}.${k}`, '-w'])).trim()
    env[k.toUpperCase().replace(/-/g, '_')] = v
  }
  const [bin, ...rest] = cmd.split(' ')
  const { spawn } = await import('node:child_process')
  const proc = spawn(bin, rest, { env, stdio: 'inherit' })
  proc.on('close', (code) => process.exit(code ?? 1))
}

export const secret = defineCommand({
  meta: { name: 'secret', description: 'macOS Keychain 凭证管理' },
  args: {
    action: { type: 'positional', description: 'set | get | run', required: true },
    key: { type: 'string', description: '凭证名（多个用逗号分隔）' },
    value: { type: 'string', description: 'set 时的凭证值，缺省读 stdin' },
    cmd: { type: 'string', description: 'run 时要执行的命令' },
  },
  run: async ({ args }) => {
    try {
      if (args.action === 'set') {
        const value = args.value ?? (await new Promise((r) => {
          let buf = ''
          process.stdin.on('data', (d) => (buf += d))
          process.stdin.on('end', () => r(buf))
        }))
        if (!args.key || !value.trim()) fail('用法: mac secret set --key <name> [--value <v>] (或管道输入)')
        await setSecret({ key: args.key, value: value.trim() })
      } else if (args.action === 'get') {
        if (!args.key) fail('用法: mac secret get --key <name>')
        await getSecret({ key: args.key })
      } else if (args.action === 'run') {
        if (!args.key || !args.cmd) fail('用法: mac secret run --key a,b --cmd "node app.js"')
        await runWithSecrets({ key: args.key, cmd: args.cmd })
      } else {
        fail(`未知操作: ${args.action}，支持 set | get | run`)
      }
    } catch (e) {
      fail(e.message)
    }
  },
})
