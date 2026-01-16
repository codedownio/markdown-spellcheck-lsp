/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as lsp from 'vscode-languageserver';

import { LspClientLogger } from './logger';
import { LspServer } from './lsp-server';
import { LspClient } from './lsp-client';

export interface IServerOptions {
    showMessageLevel: lsp.MessageType;
    affixFile: string;
    dicFile: string;
    personalDicFile: string | null | undefined;
}

export function createLspConnection(options: IServerOptions): lsp.IConnection {
    const connection = lsp.createConnection();
    const lspClient = new LspClient(connection);
    const logger = new LspClientLogger(lspClient, options.showMessageLevel);
    const server: LspServer = new LspServer({
        logger,
        lspClient,
        affixFile: options.affixFile,
        dicFile: options.dicFile,
        personalDicFile: options.personalDicFile,
    });

    connection.onInitialize(server.initialize.bind(server));
    connection.onShutdown(server.shutdown.bind(server));
    connection.onExit(() => {
        process.exit(server.didShutdown() ? 0 : 1);
    });

    connection.onDidOpenTextDocument(server.didOpenTextDocument.bind(server));
    connection.onDidSaveTextDocument(server.didSaveTextDocument.bind(server));
    connection.onDidCloseTextDocument(server.didCloseTextDocument.bind(server));
    connection.onDidChangeTextDocument(server.didChangeTextDocument.bind(server));

    connection.onCodeAction(server.codeAction.bind(server));
    connection.onExecuteCommand(server.executeCommand.bind(server));

    return connection;
}
