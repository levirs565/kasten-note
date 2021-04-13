import chokidar from "chokidar"
import fs from "fs"
import path from "path"
import * as util from "./util"
import * as pipeline from "./pipeline"

function getFileUrl(p: string) {
  let fname = util.getDistName(p, "")
  if (path.basename(fname) == "index")
    fname = path.dirname(fname) + "/"
  if (fname == ".")
    return "/"
  return "/" + encodeURI(util.toUnixPath(fname))
}

export default class Builder {
  kastenDir: string
  clean: boolean
  watch: boolean
  onUpdate!: (fileName: string) => void
  wikiLinks = new Set<string>()
  pendingBuild = new Array<string>()
  isReady = false

  constructor(dir: string, clean: boolean, watch: boolean) {
    this.kastenDir = dir
    this.clean = clean
    this.watch = watch
  }

  private maybeUpdate(path: string) {
    if (this.onUpdate)
      this.onUpdate(path)
  }

  private async rebuild(path: string) {
    await pipeline.buildMarkdown(this.kastenDir, path, Array.from(this.wikiLinks))
    this.maybeUpdate(util.getDistName(path))
  }

  private onChange(p: string) {
    console.log(`${p} is changed`)
    this.rebuild(p)
  }

  private onAdd(p: string) {
    console.log(`${p} is added`)
    this.wikiLinks.add(getFileUrl(p))
    if (this.isReady)
      this.rebuild(p)
    else this.pendingBuild.push(p)
  }

  private onUnlink(p: string) {
    console.log(`${p} is removed.`)
    this.wikiLinks.delete(getFileUrl(p))
    fs.unlinkSync(util.getDistFile(this.kastenDir, p))
    this.maybeUpdate(util.getDistName(p))
  }

  onReady = async () => {
    this.isReady = true
    console.log("Builder is ready now")
    console.log(`Wiki links is: ${Array.from(this.wikiLinks).join(",")}`)
    for (const file of this.pendingBuild) {
      this.rebuild(file)
    }
  }

  async run() {
    if (this.clean)
      await fs.promises.rmdir(util.getDistDir(this.kastenDir), { recursive: true })

    const watcher = chokidar.watch("**/*.md", {
      cwd: this.kastenDir,
      persistent: this.watch,
      ignored: util.excludedFiles
    })
    watcher
      .on("change", this.onChange.bind(this))
      .on("add", this.onAdd.bind(this))
      .on("unlink", this.onUnlink.bind(this))
      .on("ready", this.onReady)
  }
}
