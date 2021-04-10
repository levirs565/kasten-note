const path = require("path")
const fs = require("fs")

function* readDirRecursive(dir, child) {
  const curDir = path.join(dir, child)
  const files = fs.readdirSync(curDir, { withFileTypes: true })
  for (file of files) {
    const fileRelative = path.join(child, file.name) 
    if (file.isDirectory()) {
      yield* readDirRecursive(dir, fileRelative)
    } else yield fileRelative
  }
}

function getMarkdownFiles(dir) {
  const result = []

  for (file of readDirRecursive(dir, ""))
    if (path.extname(file) == ".md")
      result.push(file)

  return result
}

const configFileName = "kasten.yml"

async function getCurrentDir() {
  let dirs = process.cwd().split(path.sep)
  let currentDir = null
  for (let i = dirs.length; i >= 0; i--) {
    const dir = dirs.slice(0, i).join(path.sep)
    const configFile = path.join(dir, configFileName)
    try {
      const fileStat = await fs.promises.stat(configFile)
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

exports.getMarkdownFiles = getMarkdownFiles
exports.getCurrentDir = getCurrentDir
