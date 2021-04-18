declare module "to-vfile" {
  export function read(path: any): Promise<any>
  export function write(vfile: any): Promise<void>
}

declare module "vfile-reporter" {
  export default function (vfile: any): string
}

declare module "remark-wiki-link" {
  export const wikiLinkPlugin: any
}

declare module "*.json";

declare module "ngraph.tojson" {
  export default function (graph: any): any
}
