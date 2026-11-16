import { defineCommand } from 'citty'
import { runJxa, readArg } from '../bridge/jxa.js'
import { fail } from '../bridge/exec.js'

export const notify = defineCommand({
  meta: { name: 'notify', description: '发送 macOS 系统通知' },
  args: {
    text: { type: 'positional', description: '通知内容', required: true },
    title: { type: 'string', description: '标题' },
    sound: { type: 'string', description: '提示音名称，如 Glass, Ping' },
  },
  run: async ({ args }) => {
    try {
      await runJxa(
        `${readArg}
const app = Application.currentApplication()
app.includeStandardAdditions = true
app.displayNotification(readArg('text').js, {
  ${args.title ? "withTitle: readArg('title').js," : ''}
  ${args.sound ? "soundName: readArg('sound').js," : ''}
})`,
        { text: args.text, ...(args.title ? { title: args.title } : {}), ...(args.sound ? { sound: args.sound } : {}) },
      )
      console.log('✓ 通知已发送')
    } catch (e) {
      fail(e.message)
    }
  },
})
