import express from "express"
import ws from "ws"
import path from "path"
import { promises as fs } from "fs"
import * as util from "./util"

export default class Server {
  kastenDir: string
  distDir: string
  wsServer!: ws.Server

  constructor(dir: string) {
    this.kastenDir = dir
    this.distDir = util.getDistDir(dir)
  }

  private async sendHTML(fileName: string, res: express.Response) {
    try {
      let content = await fs.readFile(fileName, "utf-8")
      const relPath = util.toUnixPath(path.relative(this.distDir, fileName))
      content += `
        <script>window.currentFileName = "${relPath}"</script>
        <script src='/reloader.js'></script>
      `
      res.contentType("text/html")
      res.status(200).send(content)
    } catch (e) {
      if (e.code == "ENOENT") {
        res.status(404).end()
        return
      }

      throw e
    }
  }
  sendDistFile = async (req: express.Request, res: express.Response) => {
    let file = path.join(this.distDir, decodeURI(req.path))
    try {
      let stat = await fs.stat(file)
      if (stat.isFile()) {
        if (path.extname(file) == ".html") {
          await this.sendHTML(file, res)
        } else res.sendFile(file)
      } else if (stat.isDirectory()) {
        await this.sendHTML(path.join(file, "index.html"), res)
      }
    } catch (e) {
      if (e.code == "ENOENT")
        await this.sendHTML(file + ".html", res)
      else throw e
    }
  }

  async run() {
    const clientDir = path.resolve(__dirname, "../client")
    const app = express()
    app.use(express.static(clientDir))
    app.get("*", this.sendDistFile)

    const server = app.listen(8080, () => {
      console.log("Server is started at port 8080")
    })
    this.wsServer = new ws.Server({
      server: server
    })
  }

  notifyUpdate = (fileName: string) => {
    if (this.wsServer) {
      const path = util.toUnixPath(fileName)
      for (const client of this.wsServer.clients) {
        client.send(path)
      }
    }
  }
}

