import { program } from "commander"
import { getCurrentDir } from "./util"
import Builder from "./builder"
import Server from "./server"
import { listNotes, newNote } from "./action"
import { version } from "../package.json"

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
    await (new Builder(
      await getCurrentDir(),
      opts.clean,
      opts.watch
    )).run()
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

program.parseAsync(process.argv)
