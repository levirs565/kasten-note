const { program } = require("commander")
const build = require("./src/build")

program
  .name("kasten")
  .version("0.1")

program .command("build")
  .description("build all notes to HTML")
  .action(build.buildDir)

program.parseAsync(process.argv)
