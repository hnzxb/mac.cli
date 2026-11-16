import { defineCommand } from 'citty'
import { note } from './commands/note.js'
import { find } from './commands/find.js'
import { secret } from './commands/secret.js'
import { stay } from './commands/stay.js'
import { notify } from './commands/notify.js'

export const main = defineCommand({
  subCommands: { note, find, secret, stay, notify },
})
