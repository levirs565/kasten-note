const chokidar = require("chokidar")
const path = require("path")
const fs = require("fs")
const util = require("./util")
const pipeline = require("./pipeline")

async function buildDir(opts) {
  const dir = await util.getCurrentDir()

  if (opts.clean)
    await fs.promises.rmdir(util.getDistDir(dir), { recursive: true })

  function maybeRebuild(event) {
    return function(path) {
      console.log(`${path} is ${event}.`)
      pipeline.buildMarkdown(dir, path)
    }
  }

  function removeDist(p) {
    console.log(`${p} is removed.`)
    fs.unlinkSync(util.getDistFile(dir, p)) 
  }

  const watcher = chokidar.watch("**/*.md", { 
    cwd: dir,
    persistent: opts.watch,
    ignored: util.excludedFiles
  })
  watcher
    .on("change", maybeRebuild("changed"))
    .on("add", maybeRebuild("added"))
    .on("unlink", removeDist)
}

exports.buildDir = buildDir
