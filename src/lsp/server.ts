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
import { SettingManager } from './setting_manager';

let connection = createConnection(ProposedFeatures.all);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

let provider: Provider | null = null;
let settingManager: SettingManager | null = null;

const COMMAND_CREATE_FILE_RELATIVE = 'kasten_note.applyCreateFile';

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
        commands: [COMMAND_CREATE_FILE_RELATIVE],
      },
    },
  };
  if (hasWorkspaceFolderCapability)
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };

  settingManager = new SettingManager(hasConfigurationCapability);
  settingManager.onGetConfiguration = (uri) =>
    connection.workspace.getConfiguration({
      scopeUri: uri,
      section: 'kasten_note',
    });

  provider = new Provider(params.rootPath!, settingManager);
  provider.onDiagnosticReady = connection.sendDiagnostics.bind(connection);
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
  settingManager!.configurationChange(change.settings.kasten_note);
  provider!.allDocumentChanged();
});

connection.onDidChangeWatchedFiles((_change) => {
  connection.console.log('Received file change event');
});

connection.onHover((params: HoverParams) => {
  return provider?.getHover(params.textDocument.uri, params.position);
});

connection.onDefinition((params: DefinitionParams) => {
  return provider?.getDefinition(params.textDocument.uri, params.position);
});

connection.onExecuteCommand((params: ExecuteCommandParams) => {
  if (params.command != COMMAND_CREATE_FILE_RELATIVE) return;

  const uri = params.arguments![0];
  const name = params.arguments![1]
  provider!.createFileRelative(uri, name);
});

/*
 * Error when using CreateFile WorkspaceEdit
 */
connection.onCodeAction((params: CodeActionParams) => {
  return provider!
    .getCreateFileRelativeCodeAction(params.textDocument.uri, params.range.start)
    ?.map((name) =>
      Command.create(
        `Create file ./${name}`,
        COMMAND_CREATE_FILE_RELATIVE,
        params.textDocument.uri,
        name
    )
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
