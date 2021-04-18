import chokidar from "chokidar"
import fs from "fs"
import { NoteList } from "./base"
import * as util from "./util"
import * as pipeline from "./pipeline"
import { NodeId, default as createGraph } from "ngraph.graph"
import toJson from "ngraph.tojson"
import { join } from "path"

function isMarkdown(p: string) {
  return p.endsWith(".md")
}

export default class Builder {
  kastenDir: string
  clean: boolean
  watch: boolean
  onUpdate!: (fileName: string) => void
  noteList = new NoteList()
  pendingBuild = new Array<string>()
  isReady = false
  onAfterReady!: () => void
  imgGraph = createGraph()
  watcher!: chokidar.FSWatcher

  constructor(dir: string, clean: boolean, watch: boolean) {
    this.kastenDir = dir
    this.clean = clean
    this.watch = watch
  }

  private maybeUpdate(path: string) {
    if (this.onUpdate)
      this.onUpdate(path)
  }

  private async rebuild(p: string) {
    const lastImgList: NodeId[] = []

    this.imgGraph.forEachLinkedNode(p, (node, link) => {
      lastImgList.push(link.toId)
      this.imgGraph.removeLink(link)
    }, true)

    await pipeline.buildMarkdown(this.kastenDir, p, this.noteList, this.onImageFound)

    for (const img of lastImgList) {
      if (this.imgGraph.getLinks(img)!.length > 0)
        continue

      this.imgGraph.removeNode(img)
      this.watcher.unwatch(img as string)
      try {
        await fs.promises.unlink(join(util.getDistDir(this.kastenDir), img as string))
      } catch {
      }
    }

    this.maybeUpdate(util.getDistName(p))
  }

  private onImageFound = (md: string, img: string) => {
    if (!this.imgGraph.hasLink(md, img)) {
      this.imgGraph.addLink(md, img)
      this.watcher.add(img)
    }
  }

  private onChange(p: string) {
    console.log(`${p} is changed`)
    if (isMarkdown(p)) {
      this.rebuild(p)
    } else {
      this.updateAsset(p)
    }
  }

  private updateAsset(p: string) {
    fs.copyFileSync(join(this.kastenDir, p), join(util.getDistDir(this.kastenDir), p))
  }

  private onAdd(p: string) {
    console.log(`${p} is added`)

    if (isMarkdown(p)) {
      this.noteList.addFile(p)
      if (this.isReady)
        this.rebuild(p)
      else this.pendingBuild.push(p)
    } else {
      this.updateAsset(p)
    }
  }

  private onUnlink(p: string) {
    console.log(`${p} is removed.`)
    if (isMarkdown(p)) {
      this.noteList.removeFile(p)
      fs.unlinkSync(util.getDistFile(this.kastenDir, p))
      this.maybeUpdate(util.getDistName(p))
    }
  }

  onReady = async () => {
    this.isReady = true
    console.log("Builder is ready now")
    console.log(`Wiki links is: ${JSON.stringify(this.noteList)}`)
    for (const file of this.pendingBuild) {
      await this.rebuild(file)
    }
    if (this.onAfterReady)
      this.onAfterReady()
  }

  async run() {
    if (this.clean)
      await fs.promises.rmdir(util.getDistDir(this.kastenDir), { recursive: true })

    this.watcher = util.watchNotes(this.kastenDir, this.watch)
      .on("change", this.onChange.bind(this))
      .on("add", this.onAdd.bind(this))
      .on("unlink", this.onUnlink.bind(this))
      .on("ready", this.onReady)
  }
}
