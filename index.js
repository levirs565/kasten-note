const { program } = require("commander")
const build = require("./src/build")
const serve = require("./src/serve")

program
  .name("kasten")
  .version("0.1")

const cleanOpt = ["--no-clean", "clean dist directory before build"]

program.command("build")
  .description("build all notes to HTML")
  .option(...cleanOpt)
  .option("-w, --watch", "watch directory for change", false)
  .action(build.buildDir)

program.command("serve")
  .description("build and serve notes")
  .option(...cleanOpt)
  .action(serve.serveDir)

program.parseAsync(process.argv)
