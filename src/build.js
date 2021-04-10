const util = require("./util")
const pipeline = require("./pipeline")

async function buildDir() {
  const dir = await util.getCurrentDir()
  for (file of util.getMarkdownFiles(dir)) {
    console.log(`Processing ${file}`)
    await pipeline.buildMarkdown(dir, file)
  }
}

exports.buildDir = buildDir
