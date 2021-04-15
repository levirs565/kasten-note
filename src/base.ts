import { getDistName, toUnixPath } from "./util"
import { basename, dirname } from "path"

export interface Note {
  fileName: string
  urlPath: string
}

type NoteIdMap = {
  [key: string]: Note | undefined
}

function getFileUrl(p: string) {
  let fname = getDistName(p, "")
  if (basename(fname) == "index")
    fname = dirname(fname) + "/"
  if (fname == ".")
    return "/"
  return "/" + encodeURI(toUnixPath(fname))
}

function getFileId(p: string) {
  const name = basename(p, ".md")
  if (name != "index") return name

  return basename(dirname(p))
}

export class NoteList {
  private maps: NoteIdMap = {}

  addFile(fileName: string) {
    this.maps[getFileId(fileName)] = {
      fileName: fileName,
      urlPath: getFileUrl(fileName)
    }
  }

  removeFile(fileName: string) {
    delete this.maps[getFileId(fileName)]
  }

  getById(id: string) {
    return this.maps[id]
  }

  getAll() {
    return this.maps
  }
}
