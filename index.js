const { program } = require("commander")
const build = require("./src/build")

program
  .name("kasten")
  .version("0.1")

program .command("build")
  .description("build all notes to HTML")
  .option("--no-clean", "clean dist directory before build")
  .option("-w, --watch", "watch directory for change", false)
  .action(build.buildDir)

program.parseAsync(process.argv)
