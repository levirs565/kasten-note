const path = require("path")
const fs = require("fs")

const excludedFiles = ["dist/**", "**/.git/**"]
exports.excludedFiles = excludedFiles

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
exports.getCurrentDir = getCurrentDir

exports.getDistDir = function (dir) {
  return path.join(dir, "dist")
}

exports.getDistFile = function (dir, fileRel) {
  const parsed = path.parse(fileRel)
  return path.join(exports.getDistDir(dir), parsed.dir, parsed.name + ".html")
}
