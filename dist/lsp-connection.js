"use strict";
/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLspConnection = void 0;
const lsp = require("vscode-languageserver");
const logger_1 = require("./logger");
const lsp_server_1 = require("./lsp-server");
const lsp_client_1 = require("./lsp-client");
function createLspConnection(options) {
    const connection = lsp.createConnection();
    const lspClient = new lsp_client_1.LspClient(connection);
    const logger = new logger_1.LspClientLogger(lspClient, options.showMessageLevel);
    const server = new lsp_server_1.LspServer({
        logger,
        lspClient,
        affixFile: options.affixFile,
        dicFile: options.dicFile,
    });
    connection.onInitialize(server.initialize.bind(server));
    connection.onDidOpenTextDocument(server.didOpenTextDocument.bind(server));
    connection.onDidSaveTextDocument(server.didSaveTextDocument.bind(server));
    connection.onDidCloseTextDocument(server.didCloseTextDocument.bind(server));
    connection.onDidChangeTextDocument(server.didChangeTextDocument.bind(server));
    connection.onCodeAction(server.codeAction.bind(server));
    connection.onExecuteCommand(server.executeCommand.bind(server));
    return connection;
}
exports.createLspConnection = createLspConnection;
//# sourceMappingURL=lsp-connection.js.map