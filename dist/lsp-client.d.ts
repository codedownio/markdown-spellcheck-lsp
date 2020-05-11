import * as lsp from 'vscode-languageserver';
export declare class LspClient {
    protected connection: lsp.IConnection;
    constructor(connection: lsp.IConnection);
    publishDiagnostics(args: lsp.PublishDiagnosticsParams): void;
    showMessage(args: lsp.ShowMessageParams): void;
    logMessage(args: lsp.LogMessageParams): void;
    telemetry(args: any): void;
}
//# sourceMappingURL=lsp-client.d.ts.map