import chokidar from "chokidar"
import fs from "fs"
import { KastenList } from "./base"
import * as util from "./util"
import * as pipeline from "./pipeline"

export default class Builder {
  kastenDir: string
  clean: boolean
  watch: boolean
  onUpdate!: (fileName: string) => void
  kastenList = new KastenList()
  pendingBuild = new Array<string>()
  isReady = false
  onAfterReady!: () => void

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
    await pipeline.buildMarkdown(this.kastenDir, path, this.kastenList)
    this.maybeUpdate(util.getDistName(path))
  }

  private onChange(p: string) {
    console.log(`${p} is changed`)
    this.rebuild(p)
  }

  private onAdd(p: string) {
    console.log(`${p} is added`)
    this.kastenList.addFile(p)
    if (this.isReady)
      this.rebuild(p)
    else this.pendingBuild.push(p)
  }

  private onUnlink(p: string) {
    console.log(`${p} is removed.`)
    this.kastenList.removeFile(p)
    fs.unlinkSync(util.getDistFile(this.kastenDir, p))
    this.maybeUpdate(util.getDistName(p))
  }

  onReady = async () => {
    this.isReady = true
    console.log("Builder is ready now")
    console.log(`Wiki links is: ${JSON.stringify(this.kastenList)}`)
    for (const file of this.pendingBuild) {
      await this.rebuild(file)
    }
    if (this.onAfterReady)
      this.onAfterReady()
  }

  async run() {
    if (this.clean)
      await fs.promises.rmdir(util.getDistDir(this.kastenDir), { recursive: true })

    util.watchNotes(this.kastenDir, this.watch)
      .on("change", this.onChange.bind(this))
      .on("add", this.onAdd.bind(this))
      .on("unlink", this.onUnlink.bind(this))
      .on("ready", this.onReady)
  }
}
