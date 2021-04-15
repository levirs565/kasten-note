import { NoteList } from "./base"
import { watchNotes } from "./util"

export function listNotes(dir: string, onReady: (list: NoteList) => void) {
  const list = new NoteList()
  watchNotes(dir, false)
    .on("add", (path) => {
      list.addFile(path)
    })
    .on("ready", () => {
      onReady(list)
    })
}
