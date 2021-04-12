import chokidar from "chokidar"
import fs from "fs"
import * as util from "./util"
import * as pipeline from "./pipeline"

interface BuildOpts {
  clean: boolean
  watch: boolean
  onUpdate: (fileName: string) => void | null
}

export async function buildDir(opts: BuildOpts) {
  const dir = await util.getCurrentDir()

  if (opts.clean)
    await fs.promises.rmdir(util.getDistDir(dir), { recursive: true })

  function maybeUpdate(path: string) {
    if (opts.onUpdate)
      opts.onUpdate(path)
  }

  function maybeRebuild(event: string) {
    return async function(path: string) {
      console.log(`${path} is ${event}.`)
      await pipeline.buildMarkdown(dir, path)
      maybeUpdate(util.getDistName(path))
    }
  }

  function removeDist(p: string) {
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
