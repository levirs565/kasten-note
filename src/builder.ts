import chokidar from "chokidar"
import fs from "fs"
import * as util from "./util"
import * as pipeline from "./pipeline"

export default class Builder {
  kastenDir: string
  clean: boolean
  watch: boolean
  onUpdate!: (fileName: string) => void

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
    await pipeline.buildMarkdown(this.kastenDir, path)
    this.maybeUpdate(util.getDistName(path))
  }

  private onChange(p: string) {
    console.log(`${p} is changed`)
    this.rebuild(p)
  }

  private onAdd(p: string) {
    console.log(`${p} is added`)
    this.rebuild(p)
  }

  private onUnlink(p: string) {
    console.log(`${p} is removed.`)
    fs.unlinkSync(util.getDistFile(this.kastenDir, p))
    this.maybeUpdate(util.getDistName(p))
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
  }
}
