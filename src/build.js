const chokidar = require("chokidar")
const path = require("path")
const fs = require("fs")
const util = require("./util")
const pipeline = require("./pipeline")

async function buildDir(opts) {
  const dir = await util.getCurrentDir()
  const dest = path.join(dir, "dist") 

  if (opts.clean)
    await fs.promises.rmdir(dest, { recursive: true })

  for (file of util.getMarkdownFiles(dir)) {
    console.log(`Processing ${file}`)
    await pipeline.buildMarkdown(dir, file)
  }

  if (!opts.watch) return

  function isExcluded(p) {
    const component = p.split(path.sep)
    return util.excludedDirs.includes(component[0])
      || path.extname(p) != ".md"
  }

  function maybeRebuild(event) {
    return function(path) {
      if (isExcluded(path)) return

      console.log(`${path} is ${event}.`)
      pipeline.buildMarkdown(dir, path)
    }
  }

  function removeDist(p) {
    if (isExcluded(p)) return

    console.log(`${p} is removed.`)
    const paths = path.parse(p)
    paths.ext = ".html"
    paths.base = paths.name + paths.ext
    fs.unlinkSync(path.join(dest, path.format(paths))) 
  }

  const watcher = chokidar.watch(dir, { 
    cwd: dir,
    ignoreInitial: true,
  })
  watcher
    .on("change", maybeRebuild("changed"))
    .on("add", maybeRebuild("added"))
    .on("unlink", removeDist)
}

exports.buildDir = buildDir
