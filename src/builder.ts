import chokidar from "chokidar"
import fs from "fs-extra"
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

  private async rebuild(path: string) {
    console.log(`Building ${path}`)
    const lastImgList: NodeId[] = []

    this.imgGraph.forEachLinkedNode(path, (node, link) => {
      lastImgList.push(link.toId)
      this.imgGraph.removeLink(link)
    }, true)

    await pipeline.buildMarkdown(this.kastenDir, path, this.noteList, this.onImageFound)

    for (const img of lastImgList) {
      if (this.imgGraph.getLinks(img)!.length > 0)
        continue

      this.imgGraph.removeNode(img)
      this.watcher.unwatch(img as string)
      try {
        this.removeAsset(img as string)
      } catch {
      }
    }

    this.notifyPageChanged(path)
  }
  notifyPageChanged(path: string) {
    this.maybeUpdate(util.getDistName(path))
  }

  private onImageFound = (md: string, img: string) => {
    if (!this.imgGraph.hasLink(md, img)) {
      this.imgGraph.addLink(md, img)
      this.updateAsset(img)
    }
  }

  private onChange(path: string) {
    if (isMarkdown(path)) {
      this.rebuild(path)
    } else if (this.isAsset(path)) {
      this.updateAsset(path)
      this.notifyAssetChanged(path)
    }
  }

  private isAsset(path: string) {
    return this.imgGraph.hasNode(path)
  }

  private notifyAssetChanged(path: string) {
    this.imgGraph.forEachLinkedNode(path, (node, link) => {
      this.notifyPageChanged(node.id as string)
    }, false)
  }

  private updateAsset(path: string) {
    console.log(`Updating asset ${path}`)
    fs.copySync(join(this.kastenDir, path), join(util.getDistDir(this.kastenDir), path))
  }

  private removeAsset(path: string) {
    console.log(`Removing asset ${path}`)
    fs.removeSync(join(util.getDistDir(this.kastenDir), path))
  }

  private onAdd(path: string) {
    if (isMarkdown(path)) {
      this.noteList.addFile(path)
      if (this.isReady)
        this.rebuild(path)
      else this.pendingBuild.push(path)
    } else if (this.isAsset(path)) {
      this.updateAsset(path)
      this.notifyAssetChanged(path)
    }
  }

  private onUnlink(path: string) {
    if (isMarkdown(path)) {
      this.noteList.removeFile(path)
      fs.removeSync(util.getDistFile(this.kastenDir, path))
      this.maybeUpdate(util.getDistName(path))
    } else if (this.isAsset(path)) {
      this.removeAsset(path)
      this.notifyAssetChanged(path)
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
      await fs.emptyDir(util.getDistDir(this.kastenDir))

    this.watcher = chokidar.watch("**/*", {
      cwd: this.kastenDir,
      persistent: this.watch,
      ignored: util.excludedFiles
    })
      .on("change", this.onChange.bind(this))
      .on("add", this.onAdd.bind(this))
      .on("unlink", this.onUnlink.bind(this))
      .on("ready", this.onReady)
  }

  async stop() {
    await this.watcher.close()
  }
}
