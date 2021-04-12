const chokidar = require("chokidar")
const path = require("path")
const fs = require("fs")
const util = require("./util")
const pipeline = require("./pipeline")

async function buildDir(opts) {
  const dir = await util.getCurrentDir()

  if (opts.clean)
    await fs.promises.rmdir(util.getDistDir(dir), { recursive: true })

  function maybeUpdate(path) {
    if (opts.onUpdate)
      opts.onUpdate(path)
  }

  function maybeRebuild(event) {
    return async function(path) {
      console.log(`${path} is ${event}.`)
      await pipeline.buildMarkdown(dir, path)
      maybeUpdate(util.getDistName(path))
    }
  }

  function removeDist(p) {
    console.log(`${p} is removed.`)
    fs.unlinkSync(util.getDistFile(dir, p)) 
    maybeUpdate(util.getDistName(p))
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
