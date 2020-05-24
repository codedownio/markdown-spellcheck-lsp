import * as lsp from "vscode-languageserver";
import { Logger } from "./logger";
import { LspClient } from "./lsp-client";
export interface IServerOptions {
    logger: Logger;
    lspClient: LspClient;
}
export declare class LspServer {
    private options;
    private initializeParams;
    private initializeResult;
    private logger;
    private readonly documents;
    constructor(options: IServerOptions);
    closeAll(): void;
    initialize(params: lsp.InitializeParams): Promise<lsp.InitializeResult>;
    readonly requestDiagnostics: any;
    protected doRequestDiagnostics(): Promise<void>;
    didOpenTextDocument(params: lsp.DidOpenTextDocumentParams): void;
    didCloseTextDocument(params: lsp.DidCloseTextDocumentParams): void;
    protected closeDocument(file: string): void;
    didChangeTextDocument(params: lsp.DidChangeTextDocumentParams): void;
    didSaveTextDocument(params: lsp.DidChangeTextDocumentParams): void;
    codeAction(params: lsp.CodeActionParams): Promise<(lsp.Command | lsp.CodeAction)[]>;
    executeCommand(arg: lsp.ExecuteCommandParams): Promise<void>;
}
//# sourceMappingURL=lsp-server.d.ts.map