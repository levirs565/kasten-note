const util = require("./src/util")
const pipeline = require("./src/pipeline");

(async () => {
  const dir = await util.getCurrentDir()
  for (file of util.getMarkdownFiles(dir)) {
    console.log(`Processing ${file}`)
    await pipeline.buildMarkdown(dir, file)
  }
})()
