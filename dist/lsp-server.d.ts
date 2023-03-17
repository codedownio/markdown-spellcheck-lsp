import { Logger } from "./logger";
import { LspClient } from "./lsp-client";
import { Command, CodeAction, CodeActionParams, DidOpenTextDocumentParams, DidCloseTextDocumentParams, DidChangeTextDocumentParams, ExecuteCommandParams, InitializeParams, InitializeResult } from "vscode-languageserver";
export interface IServerOptions {
    logger: Logger;
    lspClient: LspClient;
    affixFile: string;
    dicFile: string;
}
export declare class LspServer {
    private options;
    private initializeResult;
    private logger;
    private nodehun;
    private readonly documents;
    constructor(options: IServerOptions);
    closeAll(): void;
    initialize(params: InitializeParams): Promise<InitializeResult>;
    readonly requestDiagnostics: any;
    protected doRequestDiagnostics(): Promise<void>;
    didOpenTextDocument(params: DidOpenTextDocumentParams): void;
    didCloseTextDocument(params: DidCloseTextDocumentParams): void;
    protected closeDocument(file: string): void;
    didChangeTextDocument(params: DidChangeTextDocumentParams): void;
    didSaveTextDocument(params: DidChangeTextDocumentParams): void;
    codeAction(params: CodeActionParams): Promise<(Command | CodeAction)[]>;
    executeCommand(arg: ExecuteCommandParams): Promise<void>;
}
//# sourceMappingURL=lsp-server.d.ts.map