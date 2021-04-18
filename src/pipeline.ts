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
import toVfile from "to-vfile"
import reporter from "vfile-reporter"
import visit from "unist-util-visit"
import mdastToString from "mdast-util-to-string"
import unist from "unist"
import { Heading, Image } from "mdast"
import vfile from "vfile"

type ImageFoundListener = (md: string, img: string) => void

function analyzerAttacker(doc: document.Options, onImageFound: ImageFoundListener) {
  return analyzer

  function analyzer(tree: unist.Node, file: vfile.VFile) {
    visit(tree, ["heading", "image"], visitor)

    function visitor(node: unist.Node, index: number, parent: unist.Node | undefined) {
      if (node.type == "heading") {
        if ((node as Heading).depth == 1) {
          doc.title = mdastToString(node)
        }
      } else if (node.type == "image") {
        const image = node as Image
        if (image.url.indexOf("://") >= 0)
          return

        let imgPath = image.url
        if (imgPath[0] == '/')
          imgPath = imgPath.substring(1)
        else
          imgPath = path.join(file.dirname!!, imgPath)
        imgPath = path.normalize(imgPath)
        onImageFound(file.path!, imgPath)
      }
    }
  }

}

/**
 * dir: Kasten root dir
 * fileRel: file name relative to root dir with extension
 */
export async function buildMarkdown(dir: string, fileRel: string, noteList: NoteList, onImageFound: ImageFoundListener) {
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
    .use(analyzerAttacker, docSettings, onImageFound)
    .use(remark2rehype, { allowDangerousHtml: true })
    .use(raw)
    .use(katex)
    .use(document, docSettings)
    .use(html)

  const resultFile = await processor.process(
    await toVfile.read({ path: fileRel, cwd: dir })
  )
  console.log(reporter(resultFile))
  resultFile.path = distFile

  await fs.mkdir(resultFile.dirname as string, { recursive: true })
  await toVfile.write(resultFile)
}
