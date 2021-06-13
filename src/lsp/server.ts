import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  DidChangeConfigurationNotification,
  Diagnostic,
  DiagnosticSeverity,
  TextDocumentPositionParams,
  CompletionItem,
  CompletionItemKind,
  HoverParams,
  Hover,
  MarkupKind,
  DefinitionParams,
  Position,
  Definition,
  Range
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import URI from "vscode-uri";
import { join as joinPath } from "path"
import unified from 'unified';
import remark from 'remark-parse';
import { wikiLinkPlugin } from 'remark-wiki-link';
import { Node } from 'unist';
import visitNode from 'unist-util-visit';
import { NoteList } from "../base"
import { watchNotes } from "../util";


let connection = createConnection(ProposedFeatures.all);

let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;
let rootPath: string | null | undefined = null
const noteList = new NoteList()

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
      },
      hoverProvider: true,
      definitionProvider: true
    },
  };
  if (hasWorkspaceFolderCapability)
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };

  rootPath = params.rootPath
  watchNotes(params.rootPath!, true)
    .on('add', (path) => {
      noteList.addFile(path)
    })
    .on('unlink', (path) => {
      noteList.removeFile(path)
    })

  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log('Workspace folder change event received');
    });
  }
});

interface ExampleSettings {
  maxNumberOfProblems: number;
}

const defaultSettings: ExampleSettings = {
  maxNumberOfProblems: 1000,
};
let globalSettings: ExampleSettings = defaultSettings;

let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();
let documentNodes: Map<string, Node> = new Map();

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) documentSettings.clear();
  else
    globalSettings = change.settings.languageServerExample || defaultSettings;

  documents.all().forEach(parseTextDocument);
});

function getDocumentSetting(resource: string): Thenable<ExampleSettings> {
  if (!hasConfigurationCapability) return Promise.resolve(globalSettings);

  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'languageServerExample',
    });
    documentSettings.set(resource, result);
  }
  return result;
}

documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
  documentNodes.delete(e.document.uri);
});

documents.onDidChangeContent((change) => {
  connection.console.log('onDidChangeContent');
  parseTextDocument(change.document);
});

async function parseTextDocument(document: TextDocument) {
  const parser = unified().use(remark).use(wikiLinkPlugin);

  const node = parser.parse(document.getText());
  documentNodes.set(document.uri, node);
  checkLink(document, node)
}

function checkLink(document: TextDocument, node: Node) {
  let diaganosticList: Diagnostic[] = []

  function checkLink(node: Node) {
    const value = node.value as string
    const target = noteList.getById(value)
    if (target) return

    const startPos = document.positionAt(node.position?.start.offset ?? 0)
    const endPos = document.positionAt(node.position?.end.offset ?? 0)
    diaganosticList.push({
      range: Range.create(startPos, endPos),
      severity: DiagnosticSeverity.Warning,
      message: `Note with id ${value} is not found`
    })
  }

  visitNode(node, "wikiLink", checkLink)
  
  connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: diaganosticList
  })
}

connection.onDidChangeWatchedFiles((_change) => {
  connection.console.log('Received file change event');
});

function getCurrentNode(uri: string, position: Position): Node | undefined {
  const nodes = documentNodes.get(uri);
  const document = documents.get(uri);
  if (!nodes || !document) return undefined;

  const cursorOffset = document.offsetAt(position);
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

  visitNode(nodes, test, visitor);

  return currentNode;
}

connection.onHover((params: HoverParams) => {
  const node = getCurrentNode(params.textDocument.uri, params.position);

  let text = 'Node information:\n\n```json\n' +
        JSON.stringify(node, undefined, 2) +
        '\n```'

  if (node?.type == "wikiLink") {
    const target = noteList.getById(node.value as string)
    if (target)
      text = `Link target: "${target.fileName}"\n` + text
  }
  
  const hover: Hover = {
    contents: {
      kind: MarkupKind.Markdown,
      value: text,
    },
  };

  return hover;
});

connection.onDefinition((params: DefinitionParams) => {
  const node = getCurrentNode(params.textDocument.uri, params.position)
  if (!node || node.type != "wikiLink")
    return undefined

  const target = noteList.getById(node.value as string)

  if (!target)
    return undefined

  const uri = URI.file(joinPath(rootPath!, target.fileName))
  const definition: Definition = {
    uri: uri.toString(),
    range: Range.create(0, 0, 0,0 )
  }
  return definition
})

connection.onCompletion(
  (_position: TextDocumentPositionParams): CompletionItem[] => {
    return [
      { label: 'Laho', kind: CompletionItemKind.Text, data: 1 },
      { label: 'Jaja', kind: CompletionItemKind.Text, data: 2 },
    ];
  }
);

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  connection.console.log('onCompletionResolve');
  if (item.data == 1) {
    item.detail = 'Laho detail';
    item.documentation = 'Laho documentation';
  } else if (item.data == 2) {
    item.detail = 'Jaja detail';
    item.documentation = 'Jaja documentation';
  }
  return item;
});

documents.listen(connection);

connection.listen();
