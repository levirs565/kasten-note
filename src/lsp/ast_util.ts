import { Node, Literal } from "unist";
import visitNode from "unist-util-visit"

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

  function test(node: unknown): node is Node {
    const pos = (node as Node).position;
    return (
      (pos?.start.offset ?? 0) <= cursorOffset &&
      (pos?.end.offset ?? 0) >= cursorOffset
    );
  }

  function visitor(node: Node) {
    currentNode = node;
  }

  visitNode(tree, test, visitor);

  return currentNode;
}
