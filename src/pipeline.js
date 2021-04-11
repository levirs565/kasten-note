const path = require("path")
const fs = require("fs").promises
const util = require("./util")
const unified = require("unified")
const markdown = require("remark-parse")
const gfm = require("remark-gfm")
const math = require("remark-math")
const remark2rehype = require("remark-rehype")
const katex = require("rehype-katex")
const document = require("rehype-document")
const html = require("rehype-stringify")
const vfile = require("to-vfile")
const reporter = require("vfile-reporter")

/**
 * dir: Kasten root dir
 * fileRel: file name relative to root dir with extension
 */
async function buildMarkdown(dir, fileRel) {
  const file = path.join(dir, fileRel)
  const distFile = util.getDistFile(dir, fileRel)
  const processor = unified()
    .use(markdown)
    .use(gfm)
    .use(math)
    .use(remark2rehype)
    .use(katex)
    .use(document, {
      css: ["https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css"]
    })
    .use(html)

  const resultFile = await processor.process(await vfile.read(file))
  console.log(reporter(resultFile))
  resultFile.path = distFile

  await fs.mkdir(resultFile.dirname, { recursive: true })
  await vfile.write(resultFile)
}

exports.buildMarkdown = buildMarkdown
