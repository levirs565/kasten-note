const path = require("path")
const fs = require("fs").promises

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
    } catch(e) {
    }
  }

  if (!currentDir) throw "Could not find kasten directory"
  return currentDir
}

(async () => {
  console.log(await getCurrentDir())
})()
