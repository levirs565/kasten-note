import { getDistDir, getDistName, getDistFile, toUnixPath, getFileId } from "./util"
import { normalize } from "path"

test("should return correct dist dir", () => {
  expect(getDistDir("abc")).toBe(normalize("abc/dist"))
})

test("should return correct dist name", () => {
  const name = "a/a.md"
  expect(getDistName(name)).toBe(normalize("a/a.html"))
  expect(getDistName(name, "")).toBe(normalize("a/a"))
})

test("should return correct dist file", () => {
  expect(getDistFile("abcd", "se/abc.md"))
    .toBe(normalize("abcd/dist/se/abc.html"))
})

test("should convert path to unix", () => {
  expect(toUnixPath("a\\aaa/aa\\aa")).toBe("a/aaa/aa/aa")
})

test("should return correct file id", () => {
  expect(getFileId("abc.md")).toBe("abc")
  expect(getFileId("abc/cde.md")).toBe("cde")
  expect(getFileId("fgh/index.md")).toBe("fgh")
  expect(getFileId("fgh/ijk/index.md")).toBe("ijk")
})
