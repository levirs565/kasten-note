#!/usr/bin/env node
import { program } from "commander"
import { getCurrentDir } from "./util"
import Builder from "./builder"
import Server from "./server"
import { listNotes, newNote, renameNote } from "./action"
import { version } from "../package.json"
import { terminal } from "terminal-kit"

program
  .name("kasten")
  .version(version)

const cleanOpt = ["--no-clean", "clean dist directory before build"]

interface BuildOpts {
  clean: boolean
  watch: boolean
}

program.command("build")
  .description("build all notes to HTML")
  .option(cleanOpt[0], cleanOpt[1])
  .option("-w, --watch", "watch directory for change", false)
  .action(async (opts: BuildOpts) => {
    terminal("Press CTRL-R for full rebuild\n")
    const dir = await getCurrentDir()
    let builder: Builder | null = null
    await runBuilder()

    terminal.grabInput(true)
    terminal.on("key", async (key: string) => {
      if (key == "CTRL_C") terminal.processExit(0)
      if (key != "CTRL_R") return

      await builder!.stop()
      await runBuilder()
    })

    async function runBuilder() {
      builder = new Builder(dir, opts.clean, opts.watch)
      await builder.run()
    }
  })

interface ServeOpts {
  clean: boolean
}

program.command("serve")
  .description("build and serve notes")
  .option(cleanOpt[0], cleanOpt[1])
  .action(async (opts: ServeOpts) => {
    const dir = await getCurrentDir()
    const builder = new Builder(dir, opts.clean, true)
    const server = new Server(dir)

    builder.onUpdate = server.notifyUpdate
    builder.onAfterReady = server.run.bind(server)
    builder.run()
  })

program.command("list")
  .description("list notes")
  .action(async () => {
    const dir = await getCurrentDir()
    listNotes(dir, (list) => {
      console.log("ID,Path,Url")
      for (const id in list.getAll()) {
        const note = list.getById(id)!
        console.log(`${id},${note.fileName},${note.urlPath}`)
      }
    })
  })

program.command("new")
  .description("create new note")
  .arguments("<path>")
  .action(async (path: string) => {
    console.log(`Creating note with name ${path}`)
    const dir = await getCurrentDir()
    newNote(dir, path)
  })

program.command("rename")
  .description("rename note")
  .arguments("<old-id> <new-id>")
  .action(async (oldId: string, newId: string) => {
    const dir = await getCurrentDir()
    renameNote(dir, oldId, newId)
  })

program.parseAsync(process.argv)
