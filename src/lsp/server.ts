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
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

let connection = createConnection(ProposedFeatures.all);

let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

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
    },
  };
  if (hasWorkspaceFolderCapability)
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };

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

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) documentSettings.clear();
  else
    globalSettings = change.settings.languageServerExample || defaultSettings;

  documents.all().forEach(validateTextDocument);
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
});

documents.onDidChangeContent((change) => {
  connection.console.log("onDidChangeContent")
  validateTextDocument(change.document);
});

async function validateTextDocument(document: TextDocument) {
  let settings = await getDocumentSetting(document.uri);
  let text = document.getText();
  let diagnostics: Diagnostic[] = [];
  let pos = 0;
  for (const line of text.split('\n')) {
    const isEmpty = line.trim().length == 0;
    if (isEmpty) {
      let diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range: {
          start: document.positionAt(pos),
          end: document.positionAt(pos + line.length),
        },
        message: 'Line is blank',
        source: 'ex',
      };
      if (hasDiagnosticRelatedInformationCapability) {
        diagnostic.relatedInformation = [
          {
            location: {
              uri: document.uri,
              range: Object.assign({}, diagnostic.range),
            },
            message: 'This line is useles',
          },
        ];
      }
      diagnostics.push(diagnostic)
    }
    pos += line.length + 1; //Because newline not counted
  }

  connection.sendDiagnostics({
    uri: document.uri,
    diagnostics,
  });
}

connection.onDidChangeWatchedFiles((_change) => {
  connection.console.log('Received file change event');
});

connection.onCompletion(
  (_position: TextDocumentPositionParams): CompletionItem[] => {
    return [
      { label: 'Laho', kind: CompletionItemKind.Text, data: 1 },
      { label: 'Jaja', kind: CompletionItemKind.Text, data: 2 },
    ];
  }
);

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  connection.console.log("onCompletionResolve")
  if (item.data == 1) {
    item.detail = 'Laho detail';
    item.documentation = 'Laho documentation';
  } else if (item.data == 2) {
    item.detail = 'Jaja detail';
    item.documentation = 'Jaja documentation';
  }
  return item;
});

documents.listen(connection)

connection.listen()
