import { defineCommand } from 'citty'
import { runCmd, fail } from '../bridge/exec.js'
import { runJxa, readArg } from '../bridge/jxa.js'

const mdToHtml = async (markdown) => {
  // textutil 不认 Markdown，先用系统自带 HTML 渲染管线；此处简单转换保留给 P1 完整实现
  return markdown
}

const readStdinOrFile = async (file) => {
  if (!file || file === '-') {
    return await new Promise((r) => {
      let buf = ''
      process.stdin.on('data', (d) => (buf += d))
      process.stdin.on('end', () => r(buf))
    })
  }
  return (await import('node:fs/promises')).readFile(file, 'utf8')
}

const upsertNote = async (html, name, folder) => {
  await runJxa(
    `${readArg}
const notes = Application('Notes')
const folderName = readArg('folder') ? readArg('folder').js : null
const noteName = readArg('name').js
const html = readArg('html').js

let target = null
const folders = notes.folders
for (let i = 0; i < folders.length; i++) {
  const f = folders[i]
  if (folderName && f.name() !== folderName) continue
  const notesInFolder = f.notes
  for (let j = 0; j < notesInFolder.length; j++) {
    if (notesInFolder[j].name() === noteName) { target = notesInFolder[j]; break }
  }
  if (target) break
}

if (target) {
  target.body = html
} else {
  const dest = folderName ? folders.byName(folderName) : notes.folders[0]
  dest.notes.push({ name: noteName, body: html })
}
'ok'`,
    { name: name, html: html, ...(folder ? { folder } : {}) },
  )
}

export const note = defineCommand({
  meta: { name: 'note', description: '写入/更新备忘录 (Notes.app)' },
  args: {
    input: { type: 'positional', description: 'Markdown 文件路径，- 或缺省读 stdin' },
    name: { type: 'string', description: '备忘录标题' },
    folder: { type: 'string', description: '目标文件夹' },
  },
  run: async ({ args }) => {
    try {
      const md = await readStdinOrFile(args.input)
      if (!md.trim()) fail('输入为空')
      const noteName = args.name ?? 'Untitled'
      console.log('⏳ P0 占位：Markdown→HTML 渲染与 Upsert 完整实现排在 P1')
      console.log(`  目标: folder=${args.folder ?? '(默认)'} name=${noteName} (${md.length} chars)`)
    } catch (e) {
      fail(e.message)
    }
  },
})
