import { NoteList } from "./base"
import { watchNotes } from "./util"
import Builder from "./builder"
import Server from "./server"
import { join, dirname } from "path"
import { terminal } from "terminal-kit"
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

    if (oldNote.fileName.endsWith("index.md")) {
      const fromPath = dirname(oldPath)
      const newPath = join(dir, dirname(oldRelDir), newName)      
      
      console.log(`Moving from ${fromPath} to ${newPath}`)
      fs.move(fromPath, newPath)
      return
    }

    const newPath = join(dir, oldRelDir, newName + ".md")

    console.log(`Moving from ${oldPath} to ${newPath}`)
    fs.moveSync(oldNote.fileName, newPath)
  })
}

export class BuildAction {
  watch: boolean
  clean: boolean
  builder!: Builder
  dir: string

  constructor(watch: boolean, clean: boolean, dir: string) {
    this.watch = watch
    this.clean = clean
    this.dir = dir
  }

  async run() {
    if (this.watch)
      terminal.blue("Press CTRL-R for full rebuild\n")

    await this.start()

    if (this.watch) {
      terminal.grabInput(true)
      terminal.on("key", this.onKey)
    }
  }

  private onKey = async (key: string) => {
      if (key == "CTRL_C") terminal.processExit(0)
      if (key != "CTRL_R") return

      await this.stop()
      await this.start()
  }

  protected beforeRun() {
  }

  protected async start() {
    this.builder = new Builder(this.dir, this.clean, this.watch)
    this.beforeRun()
    await this.builder.run()
  }

  protected async stop() {
    await this.builder.stop()
  }
}

export class ServeAction extends BuildAction {
  server!: Server

  constructor(clean: boolean, dir: string) {
    super(true, clean, dir)
  }

  protected beforeRun() {
    this.builder.onUpdate = this.server.notifyUpdate
    this.builder.onAfterReady = this.server.run.bind(this.server)
  }

  protected async start() {
    this.server = new Server(this.dir) 
    await super.start()
  }

  protected async stop() {
    await super.stop()
    await this.server.stop()
  }
}
