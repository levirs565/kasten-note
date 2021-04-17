import { NoteList } from "./base"
import { watchNotes } from "./util"
import { join, dirname } from "path"
import { writeFileSync, mkdirSync } from "fs"

export function listNotes(dir: string, onReady: (list: NoteList) => void) {
  const list = new NoteList()
  watchNotes(dir, false)
    .on("add", (path) => {
      list.addFile(path)
    })
    .on("ready", () => {
      onReady(list)
    })
}

export function newNote(dir: string, path: string) {
  listNotes(dir, (list) => {
    let completePath = path
    if (["/", "\\"].includes(completePath[completePath.length - 1]))
      completePath += "index"
    if (!completePath.endsWith(".md"))
      completePath += ".md"

    const existingNote = list.getByFileName(completePath)

    if (existingNote) {
      console.error(`Error: Note ID is exist in ${existingNote.fileName}`)
      return
    }

    const note = list.addFile(completePath)
    const fileName = join(dir, completePath)
    const content = `# ${note}\n`
    const fileDir = dirname(fileName)

    mkdirSync(fileDir, { recursive: true })
    writeFileSync(fileName, content)
  })
}
