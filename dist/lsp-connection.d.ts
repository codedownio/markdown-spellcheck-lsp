import * as lsp from 'vscode-languageserver';
export interface IServerOptions {
    showMessageLevel: lsp.MessageType;
    affixFile: string;
    dicFile: string;
}
export declare function createLspConnection(options: IServerOptions): lsp.IConnection;
//# sourceMappingURL=lsp-connection.d.ts.map