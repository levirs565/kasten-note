import { program } from "commander"
import { buildDir } from "./build"
import { serveDir } from "./serve"
import { version } from "../package.json"

program
  .name("kasten")
  .version(version)

const cleanOpt = ["--no-clean", "clean dist directory before build"]

program.command("build")
  .description("build all notes to HTML")
  .option(cleanOpt[0], cleanOpt[1])
  .option("-w, --watch", "watch directory for change", false)
  .action(buildDir)

program.command("serve")
  .description("build and serve notes")
  .option(cleanOpt[0], cleanOpt[1])
  .action(serveDir)

program.parseAsync(process.argv)
