import path from "path"
import fs from "fs-extra"
import chokidar from "chokidar"
import { terminal, TextTable } from "terminal-kit"

export const excludedFiles = ["dist/**", "**/.git/**"]

const configFileName = "kasten.yml"

export async function getCurrentDir() {
  let dirs = process.cwd().split(path.sep)
  let currentDir = null
  for (let i = dirs.length; i >= 0; i--) {
    const dir = dirs.slice(0, i).join(path.sep)
    const configFile = path.join(dir, configFileName)
    try {
      const fileStat = await fs.stat(configFile)
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

export function getDistName(fileRel: string, extension = ".html") {
  const parsed = path.parse(fileRel)
  return path.join(parsed.dir, parsed.name + extension)
}

export function getDistFile(dir: string, fileRel: string) {
  return path.join(getDistDir(dir), getDistName(fileRel))
}

export function toUnixPath(fileName: string) {
  return fileName.replace(/\\/g, "/")
}

export function watchNotes(dir: string, persistent: boolean) {
  return chokidar.watch("**/*.md", {
    cwd: dir,
    persistent: persistent,
    ignored: excludedFiles
  })
}

export function printTable(table: string[][]) {
  const t = new TextTable({cellContents: table})
  terminal.table(table, {
    height: t.contentHeight
  });
}
