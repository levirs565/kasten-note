import { program } from "commander"
import { getCurrentDir } from "./util"
import Builder from "./builder"
import { serveDir } from "./serve"
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

program.command("serve")
  .description("build and serve notes")
  .option(cleanOpt[0], cleanOpt[1])
  .action(serveDir)

program.parseAsync(process.argv)
