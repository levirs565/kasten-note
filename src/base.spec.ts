import { NoteList, Note } from "./base"

test("note list shold work in simple path", () => {
  const list = new NoteList()
  const note: Note = {
    fileName: "Yap.md",
    urlPath: "/Yap"
  }
  const id1 = "Yap"

  expect(list.getById(id1)).toBeUndefined()
  list.addFile(note.fileName)
  expect(list.getById(id1)).toEqual(note)
  expect(list.getByFileName(note.fileName)).toEqual(note)
  list.removeFile(note.fileName)
  expect(list.getById(id1)).toBeUndefined()
})

test("note list should work in complex path", () => {
  const list = new NoteList()
  const name = "abc/def ghi.md"
  const url = "/abc/def%20ghi"
  const id = "def ghi"

  list.addFile(name)
  expect(list.getById(id)).toEqual({
    fileName: name,
    urlPath: url
  })
})

test("note list should work when path is index.md", () => {
  const list = new NoteList()
  const note: Note = {
    fileName: "tai/bau/index.md",
    urlPath: "/tai/bau/"
  }
  const id = "bau"

  list.addFile(note.fileName)
  expect(list.getById(id)).toEqual(note)
})
