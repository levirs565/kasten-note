import express from "express"
import ws from "ws"
import path from "path"
import { promises as fs } from "fs"
import * as build from "./build"
import * as util from "./util"

async function maybeSendHTML(dir: string, fileName: string, res: express.Response) {
  try {
    let content = await fs.readFile(fileName, "utf-8")
    const relPath = util.toUnixPath(path.relative(dir, fileName))
    content +=  `
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

interface ServeOpts {
  clean: boolean
}

export async function serveDir(opts: ServeOpts) {
  const dir = await util.getCurrentDir()
  const dist = util.getDistDir(dir)
  const clientDir = path.resolve(__dirname, "../client")
  let webSocket: ws.Server | null = null

  function onUpdate(fname: string) {
    if (webSocket) {
      const path = util.toUnixPath(fname) 
      for (const client of webSocket.clients) {
        client.send(path)
      }
    }
  }

  build.buildDir({
    watch: true,
    onUpdate,
    ...opts
  })
  const app = express()

  app.use(express.static(clientDir))

  app.get("*", async (req, res) => {
    let file = path.join(dist, req.path)
    try {
      let stat = await fs.stat(file)
      if (stat.isFile()) {
        if (path.extname(file) == ".html") {
          await maybeSendHTML(dist, file, res)
        } else res.sendFile(file)
      } else if (stat.isDirectory()) {
        await maybeSendHTML(dist, path.join(file, "index.html"), res)
      }
    } catch(e) {
      if (e.code == "ENOENT")
        await maybeSendHTML(dist, file + ".html", res)
      else throw e
    }
  })

  const server = app.listen(8080, () => {
    console.log("Server is started at port 8080")
  })
  webSocket = new ws.Server({
    server: server
  })
}
