import { program } from "commander"
import { getCurrentDir } from "./util"
import Builder from "./builder"
import Server from "./server"
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
    builder.run()
    server.run()
  })

program.parseAsync(process.argv)
