import path from "path"
import fs from "fs"

export const excludedFiles = ["dist/**", "**/.git/**"]

const configFileName = "kasten.yml"

export async function getCurrentDir() {
  let dirs = process.cwd().split(path.sep)
  let currentDir = null
  for (let i = dirs.length; i >= 0; i--) {
    const dir = dirs.slice(0, i).join(path.sep)
    const configFile = path.join(dir, configFileName)
    try {
      const fileStat = await fs.promises.stat(configFile)
      if (fileStat.isFile()) {
        currentDir = dir
        break
      }
    } catch (e) {
    }
  }

  if (!currentDir) throw "Could not find kasten directory"
  return currentDir
}

export function getDistDir(dir: string) {
  return path.join(dir, "dist")
}

export function getDistName(fileRel: string) {
  const parsed = path.parse(fileRel)
  return path.join(parsed.dir, parsed.name + ".html")
}

export function getDistFile(dir: string, fileRel: string) {
  return path.join(getDistDir(dir), getDistName(fileRel))
}

export function toUnixPath(fileName: string) {
  return fileName.replace("\\", "/")
}
