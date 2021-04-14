import { KastenList } from "./base"

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
