import { KastenList, Kasten } from "./base"

test("kasten list shold work in simple path", () => {
  const list = new KastenList()
  const fname1 = "Yap.md"
  const url1 = "/Yap"
  const id1 = "Yap"

  expect(list.getById(id1)).toBeUndefined()
  list.addFile(fname1)
  expect(list.getById(id1)).toEqual({
    fileName: fname1,
    urlPath: url1
  })
  list.removeFile(fname1)
  expect(list.getById(id1)).toBeUndefined()
})

test("kasten list should work in complex path", () => {
  const list = new KastenList()
  const name = "abc/def ghi.md"
  const url = "/abc/def%20ghi"
  const id = "def ghi"

  list.addFile(name)
  expect(list.getById(id)).toEqual({
    fileName: name,
    urlPath: url
  })
})

test("kasten list should work when path is index.md", () => {
  const list = new KastenList()
  const kasten: Kasten = {
    fileName: "tai/bau/index.md",
    urlPath: "/tai/bau/"
  }
  const id = "bau"

  list.addFile(kasten.fileName)
  expect(list.getById(id)).toEqual(kasten)
})
