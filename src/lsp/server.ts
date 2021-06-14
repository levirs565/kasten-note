import {
  createConnection,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  DidChangeConfigurationNotification,
  TextDocumentPositionParams,
  CompletionItem,
  CompletionItemKind,
  HoverParams,
  DefinitionParams,
  CodeActionParams,
  CodeAction,
  Command,
  ExecuteCommandParams,
} from 'vscode-languageserver/node';
import URI from 'vscode-uri';
import { join as joinPath, dirname } from 'path';
import { Provider } from './provider';

let connection = createConnection(ProposedFeatures.all);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let provider: Provider | null = null;

const COMMAND_CREATE_FILE = 'kasten_note.applyCreateFile';

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
      },
      hoverProvider: true,
      definitionProvider: true,
      codeActionProvider: true,
      executeCommandProvider: {
        commands: [COMMAND_CREATE_FILE],
      },
    },
  };
  if (hasWorkspaceFolderCapability)
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };

  provider = new Provider(params.rootPath!, hasConfigurationCapability);
  provider.onDiagnosticReady = connection.sendDiagnostics.bind(connection);
  provider.onGetConfiguration = (uri) =>
    connection.workspace.getConfiguration({
      scopeUri: uri,
      section: 'kasten_note',
    });
  provider.documents.listen(connection);
  provider.start();

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

connection.onDidChangeConfiguration((change) => {
  provider!.configurationChange(change.settings.kasten_note);
  provider!.allDocumentChanged();
});

connection.onDidChangeWatchedFiles((_change) => {
  connection.console.log('Received file change event');
});

connection.onHover((params: HoverParams) => {
  return provider?.getHover(params);
});

connection.onDefinition((params: DefinitionParams) => {
  return provider?.getDefinition(params);
});

connection.onExecuteCommand((params: ExecuteCommandParams) => {
  if (params.command != COMMAND_CREATE_FILE) return;

  const file = params.arguments![0];
  provider!.executeCreateFile(file);
});

/**
 * Create file action relative to current document folder
 */
function makeCreateFileActionRelative(uri: string, fileToCreate: string) {
  const dir = dirname(URI.parse(uri).fsPath);
  const fileName = joinPath(dir, fileToCreate);
  const command = Command.create('', COMMAND_CREATE_FILE, fileName);

  return CodeAction.create(`Create file ./${fileToCreate}`, command);
}

/*
 * Error when using CreateFile WorkspaceEdit
 */
connection.onCodeAction((params: CodeActionParams) => {
  return provider!
    .getCreateFileRelativeCodeAction(params)
    ?.map((name) =>
      makeCreateFileActionRelative(params.textDocument.uri, name)
    );
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

connection.listen();
