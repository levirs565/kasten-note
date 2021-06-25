import { Node, Literal } from "unist";
import visitNode from "unist-util-visit"
import { NoteList } from "../base"

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


/**
 * cursorOffset: zero based offset
 */
export function getNodeInCursor(tree: Node, cursorOffset: number): Node | undefined {
  let currentNode: Node | undefined = undefined;

  function visitor(node: Node) {
    const pos = node.position;
    if (cursorOffset > pos!.end.offset! || cursorOffset < pos!.start.offset!) 
      return visitNode.SKIP

    currentNode = node;
    if (!node.children)
      return visitNode.EXIT
  }

  visitNode(tree, visitor);

  return currentNode;
}

export function filterInvalidWikiLink(tree: Node, noteList: NoteList): WikiLinkNode[] {
  const invalidWikiLink: WikiLinkNode[] = []

  function check(node: WikiLinkNode) {
    const target = noteList.getById(node.value);
    if (target) return;

    invalidWikiLink.push(node)
  }

  visitNode(tree, wikiLinkNodeType, check);

  return invalidWikiLink
}
