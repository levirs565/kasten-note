import {
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  Position,
  Range,
  PublishDiagnosticsParams,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import URI from 'vscode-uri';
import unified from 'unified';
import remark from 'remark-parse';
import { Node } from 'unist';
import { join as joinPath, dirname } from 'path';
import fs from 'fs-extra';
import { wikiLinkPlugin } from 'remark-wiki-link';
import { NoteList } from '../base';
import {
  filterInvalidWikiLink,
  getNodeInCursor,
  isWikiLinkNode,
} from './ast_util';
import { watchNotes } from '../util';
import { SettingManager } from './setting_manager'

export class Provider {
  rootPath: string;
  settingManager: SettingManager
  noteList = new NoteList();
  noteListReady = false;
  pendingLinkCheckUri: string[] = [];
  documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
  documentNodes: Map<string, Node> = new Map();

  onDiagnosticReady?: (params: PublishDiagnosticsParams) => void;

  constructor(rootPath: string, settingManager: SettingManager) {
    this.rootPath = rootPath;
    this.settingManager = settingManager

    this.documents.onDidClose((e) => {
      settingManager.deleteSetting(e.document.uri)
      this.documentNodes.delete(e.document.uri);
    });

    this.documents.onDidChangeContent((change) => {
      this.documentChanged(change.document);
    });
  }

  start() {
    watchNotes(this.rootPath, true)
      .on('add', (path) => {
        this.noteList.addFile(path);
        if (this.noteListReady) this.checkAllDocumentsLink();
      })
      .on('unlink', (path) => {
        this.noteList.removeFile(path);
        if (this.noteListReady) this.checkAllDocumentsLink();
      })
      .on('ready', () => {
        this.noteListReady = true;
        for (const uri of this.pendingLinkCheckUri) {
          const document = this.documents.get(uri);
          if (!document) continue;

          this.checkLink(document);
        }
      });
  }

  documentChanged = (document: TextDocument) => {
    this.parseTextDocument(document);
    if (this.noteListReady) this.checkLink(document);
    else this.pendingLinkCheckUri.push(document.uri);
  }

  allDocumentChanged() {
    this.documents.all().forEach(this.documentChanged)
  }

  parseTextDocument(document: TextDocument) {
    const parser = unified().use(remark).use(wikiLinkPlugin);

    const node = parser.parse(document.getText());
    this.documentNodes.set(document.uri, node);
  }

  checkLink = (document: TextDocument) => {
    const node = this.documentNodes.get(document.uri);
    if (!node) return;

    let diaganosticList: Diagnostic[] = filterInvalidWikiLink(
      node,
      this.noteList
    ).map((node) => {
      const startPos = document.positionAt(node.position?.start.offset ?? 0);
      const endPos = document.positionAt(node.position?.end.offset ?? 0);
      return {
        range: Range.create(startPos, endPos),
        severity: DiagnosticSeverity.Warning,
        message: `Note with id ${node.value} is not found`,
      };
    });

    if (this.onDiagnosticReady)
      this.onDiagnosticReady({
        uri: document.uri,
        diagnostics: diaganosticList,
      });
  }

  checkAllDocumentsLink() {
    this.documents.all().forEach(this.checkLink);
  }

  getCurrentNode(uri: string, position: Position): Node | undefined {
    const nodes = this.documentNodes.get(uri);
    const document = this.documents.get(uri);
    if (!nodes || !document) return undefined;

    const cursorOffset = document.offsetAt(position);

    return getNodeInCursor(nodes, cursorOffset);
  }

  getHoverText(docUri: string, position: Position) {
    const node = this.getCurrentNode(docUri, position);

    let text =
      'Node information:\n\n```json\n' +
      JSON.stringify(node, undefined, 2) +
      '\n```';

    if (node && isWikiLinkNode(node)) {
      const target = this.noteList.getById(node.value);
      if (target) text = `Link target: "${target.fileName}"\n` + text;
    }

    return text;
  }

  getDefinitionUri(docUri: string, position: Position) {
    const node = this.getCurrentNode(docUri, position);
    if (!node || !isWikiLinkNode(node)) return undefined;

    const target = this.noteList.getById(node.value);

    if (!target) return undefined;

    const uri = URI.file(joinPath(this.rootPath, target.fileName));
    return uri.toString();
  }

  /**
   * Create file relative to directory of file from uri
   */
  createFileRelative(uri: string, name: string) {
    const uriPath = URI.parse(uri).fsPath
    const path = joinPath(dirname(uriPath), name)
    fs.ensureFileSync(path);
  }

  getCreateFileRelativeCodeAction(docUri: string, position: Position) {
    const node = this.getCurrentNode(docUri, position);
    if (!node || !isWikiLinkNode(node) || this.noteList.getById(node.value))
      return undefined;

    return [
      node.value + ".md",
      node.value + "/index.md"
    ];
  }
}
