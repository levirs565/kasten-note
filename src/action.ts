import { NoteList } from "./base"
import { watchNotes } from "./util"
import { join, dirname } from "path"
import fs from "fs-extra"

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

    const id = list.addFile(completePath)
    const fileName = join(dir, completePath)
    const content = `# ${id}\n`

    fs.ensureFileSync(fileName)
    fs.writeFileSync(fileName, content)
  })
}

export function renameNote(dir: string, oldName: string, newName: string) {
  listNotes(dir, (list) => {
    const oldNote = list.getById(oldName)
    if (!oldNote) {
      console.error(`Error: Note with id ${oldName} is not exist`)
      return
    }
    const newNote = list.getById(newName)
    if (newNote) {
      console.error(`Error: Note with id ${newName} already exist in ${newNote.fileName}}`)
      return
    }

    const oldRelDir = dirname(oldNote.fileName) 
    const oldPath = join(dir, oldNote.fileName)
    const newPath = join(dir, oldRelDir, newName + ".md")

    console.log(`Moving from ${oldPath} to ${newPath}`)

    fs.moveSync(oldNote.fileName, newPath)
  })
}
