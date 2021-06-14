import { Node, Literal } from "unist";

export const wikiLinkNodeType = "wikiLink"

export interface WikiLinkNode extends Literal {
  type: "wikiLink"
  value: string
}

export function isWikiLinkNode(node: Node): node is WikiLinkNode {
  if (node.type == wikiLinkNodeType)
    return true
  return false
}
