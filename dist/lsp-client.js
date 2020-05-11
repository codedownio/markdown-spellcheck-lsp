"use strict";
/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const lsp = require("vscode-languageserver");
class LspClient {
    constructor(connection) {
        this.connection = connection;
    }
    publishDiagnostics(args) {
        this.connection.sendNotification(lsp.PublishDiagnosticsNotification.type, args);
    }
    showMessage(args) {
        this.connection.sendNotification(lsp.ShowMessageNotification.type, args);
    }
    logMessage(args) {
        this.connection.sendNotification(lsp.LogMessageNotification.type, args);
    }
    telemetry(args) {
        this.connection.sendNotification(lsp.TelemetryEventNotification.type, args);
    }
}
exports.LspClient = LspClient;
//# sourceMappingURL=lsp-client.js.map