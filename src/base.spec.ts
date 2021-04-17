import { NoteList, Note } from "./base"

test("note list shold work in simple path", () => {
  const list = new NoteList()
  const note: Note = {
    id: "Yap",
    fileName: "Yap.md",
    urlPath: "/Yap"
  }

  expect(list.getById(note.id)).toBeUndefined()
  expect(list.addFile(note.fileName)).toEqual(note.id)
  expect(list.getById(note.id)).toEqual(note)
  expect(list.getByFileName(note.fileName)).toEqual(note)
  list.removeFile(note.fileName)
  expect(list.getById(note.id)).toBeUndefined()
})

test("note list should work in complex path", () => {
  const list = new NoteList()
  const note: Note = {
    fileName: "abc/def ghi.md",
    urlPath: "/abc/def%20ghi",
    id: "def ghi"
  }

  list.addFile(note.fileName)
  expect(list.getById(note.id)).toEqual(note)
})

test("note list should work when path is index.md", () => {
  const list = new NoteList()
  const note: Note = {
    id: "bau",
    fileName: "tai/bau/index.md",
    urlPath: "/tai/bau/"
  }

  list.addFile(note.fileName)
  expect(list.getById(note.id)).toEqual(note)
})

test("note id should case insensitive", () => {
  const list = new NoteList()
  const path = "Case Insensitive.md"
  const id1 = "CASE INSENSITIVE"
  const id2 = "case insensitive"

  list.addFile(path)
  expect(list.getById(id1)?.fileName).toEqual(path)
  expect(list.getById(id2)?.fileName).toEqual(path)
})
