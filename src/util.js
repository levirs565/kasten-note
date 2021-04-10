const path = require("path")
const fs = require("fs")

function* readDirRecursive(dir, child) {
  const curDir = path.join(dir, child)
  const files = fs.readdirSync(curDir, { withFileTypes: true })
  for (file of files) {
    const fileRelative = path.join(child, file.name) 
    if (file.isDirectory()) {
      yield* readDirRecursive(dir, fileRelative)
    } else yield fileRelative
  }
}

function getMarkdownFiles(dir) {
  const result = []

  for (file of readDirRecursive(dir, ""))
    if (path.extname(file) == ".md")
      result.push(file)

  return result
}

exports.getMarkdownFiles = getMarkdownFiles
