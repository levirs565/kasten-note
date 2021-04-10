const path = require("path")
const fs = require("fs").promises
const unified = require("unified")
const markdown = require("remark-parse")
const remark2rehype = require("remark-rehype")
const html = require("rehype-stringify")
const vfile = require("to-vfile")
const reporter = require("vfile-reporter")

const configFileName = "kasten.yml"

async function getCurrentDir() {
  let dirs = process.cwd().split(path.sep)
  let currentDir = null
  for (let i = dirs.length; i >= 0; i--) {
    const dir = dirs.slice(0, i).join(path.sep)
    const configFile = path.join(dir, configFileName)
    try {
      const fileStat = await fs.stat(configFile)
      if (fileStat.isFile) {
        currentDir = dir
        break
      }
    } catch (e) {
    }
  }

  if (!currentDir) throw "Could not find kasten directory"
  return currentDir
}

(async () => {
  const dir = await getCurrentDir()
  const distDir = path.join(dir, "dist")
  const file = path.join(dir, "index.md")
  const processor = unified()
    .use(markdown)
    .use(remark2rehype)
    .use(html)

  const resultFile = await processor.process(await vfile.read(file))
  console.log(reporter(resultFile))
  resultFile.dirname = distDir
  resultFile.extname = ".html"

  fs.mkdir(resultFile.dirname, { recursive: true })
  await vfile.write(resultFile)
})()
