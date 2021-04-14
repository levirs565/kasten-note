import { getFileId, getDistName, toUnixPath } from "./util"
import { basename, dirname } from "path"

export interface Kasten {
  fileName: string
  urlPath: string
}

type KastenIdMap = {
  [key: string]: Kasten | undefined
}

function getFileUrl(p: string) {
  let fname = getDistName(p, "")
  if (basename(fname) == "index")
    fname = dirname(fname) + "/"
  if (fname == ".")
    return "/"
  return "/" + encodeURI(toUnixPath(fname))
}

export class KastenList {
  private maps: KastenIdMap = {}

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
}
