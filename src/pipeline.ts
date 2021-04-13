import path from "path"
import { promises as fs } from "fs"
import * as util from "./util"
import unified from "unified"
import markdown from "remark-parse"
import gfm from "remark-gfm"
import math from "remark-math"
import { wikiLinkPlugin } from "remark-wiki-link"
import remark2rehype from "remark-rehype"
import katex from "rehype-katex"
import document from "rehype-document"
import html from "rehype-stringify"
import vfile from "to-vfile"
import reporter from "vfile-reporter"

/**
 * dir: Kasten root dir
 * fileRel: file name relative to root dir with extension
 */
export async function buildMarkdown(dir: string, fileRel: string, permalinks: string[]) {
  const file = path.join(dir, fileRel)
  const distFile = util.getDistFile(dir, fileRel)
  const processor = unified()
    .use(markdown)
    .use(gfm)
    .use(math)
    .use(wikiLinkPlugin, {
      permalinks,
      hrefTemplate: (permalink: string) => permalink,
      pageResolver: (name: string) => [
        permalinks.find((p) => path.basename(p) == encodeURIComponent(name))
      ]
    })
    .use(remark2rehype)
    .use(katex)
    .use(document, {
      css: ["https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css"]
    })
    .use(html)

  const resultFile = await processor.process(await vfile.read(file))
  console.log(reporter(resultFile))
  resultFile.path = distFile

  await fs.mkdir(resultFile.dirname as string, { recursive: true })
  await vfile.write(resultFile)
}
