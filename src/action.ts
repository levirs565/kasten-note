import { NoteList } from "./base"
import { watchNotes } from "./util"
import { join, basename, dirname } from "path"
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
    const existingNote = list.getByFileName(path)

    if (existingNote) {
      console.error(`Error: Note ID is exist in ${existingNote.fileName}`)
      return
    }

    let fileName = join(dir, path)
    if (!path.endsWith(".md"))
      fileName += ".md"

    const content = `# ${basename(path)}\n`
    const fileDir = dirname(fileName)
    mkdirSync(fileDir, { recursive: true })
    writeFileSync(fileName, content)
  })
}
