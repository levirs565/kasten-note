import path from "path"
import { promises as fs } from "fs"
import { NoteList } from "./base"
import * as util from "./util"
import unified from "unified"
import markdown from "remark-parse"
import gfm from "remark-gfm"
import math from "remark-math"
import { wikiLinkPlugin } from "remark-wiki-link"
import remark2rehype from "remark-rehype"
import raw from "rehype-raw"
import katex from "rehype-katex"
import document from "rehype-document"
import html from "rehype-stringify"
import vfile from "to-vfile"
import reporter from "vfile-reporter"
import visit from "unist-util-visit"
import mdastToString from "mdast-util-to-string"

function analyzerAttacker(doc: document.Options) {
  return analyzer

  function analyzer(tree: any, file: any) {
    visit(tree, "heading", visitor)

  }

  function visitor(node: any, index: number, parent: any) {
    if (node.depth == 1) {
      doc.title = mdastToString(node)
    }
  }
}

/**
 * dir: Kasten root dir
 * fileRel: file name relative to root dir with extension
 */
export async function buildMarkdown(dir: string, fileRel: string, noteList: NoteList) {
  const file = path.join(dir, fileRel)
  const distFile = util.getDistFile(dir, fileRel)
  const docSettings: document.Options = {
    css: [
      "https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css",
      // "https://unpkg.com/mvp.css"
      "https://cdn.jsdelivr.net/npm/water.css@2/out/water.css"
    ],
    style: `
    .katex-display > .katex {
      overflow-x: auto;
      overflow-y: hidden;
    }
    .katex .base {
      margin-top: 2px;
      margin-bottom: 2px;
    }`
  }
  const processor = unified()
    .use(markdown)
    .use(gfm)
    .use(math)
    .use(wikiLinkPlugin, {
      hrefTemplate: (permalink: string) => permalink,
      pageResolver: (name: string) => [
        noteList.getById(name)?.urlPath
      ]
    })
    .use(analyzerAttacker, docSettings)
    .use(remark2rehype, { allowDangerousHtml: true })
    .use(raw)
    .use(katex)
    .use(document, docSettings)
    .use(html)

  const resultFile = await processor.process(await vfile.read(file))
  console.log(reporter(resultFile))
  resultFile.path = distFile

  await fs.mkdir(resultFile.dirname as string, { recursive: true })
  await vfile.write(resultFile)
}
