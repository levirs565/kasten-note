import { KastenList } from "./base"
import { watchNotes } from "./util"

export function listKasten(dir: string, onReady: (list: KastenList) => void) {
  const list = new KastenList()
  watchNotes(dir, false)
    .on("add", (path) => {
      list.addFile(path)
    })
    .on("ready", () => {
      onReady(list)
    })
}
