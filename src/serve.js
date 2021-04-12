const express = require("express")
const ws = require("ws")
const path = require("path")
const fs = require("fs").promises
const build = require("./build")
const util = require("./util")

async function maybeSendHTML(dir, fileName, res) {
  try {
    let content = await fs.readFile(fileName, "utf-8")
    const relPath = path.relative(dir, fileName).replace("\\", "/")
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

exports.serveDir = async function(opts) {
  const dir = await util.getCurrentDir()
  const dist = util.getDistDir(dir)
  const clientDir = path.resolve(__dirname, "../client")
  let webSocket = null

  function onUpdate(path) {
    if (webSocket) {
      for (client of webSocket.clients) {
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
