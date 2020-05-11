/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as lsp from 'vscode-languageserver';

export class LspClient {
  constructor(protected connection: lsp.IConnection) {

  }

  publishDiagnostics(args: lsp.PublishDiagnosticsParams): void {
    this.connection.sendNotification(lsp.PublishDiagnosticsNotification.type, args);
  }

  showMessage(args: lsp.ShowMessageParams): void {
    this.connection.sendNotification(lsp.ShowMessageNotification.type, args);
  }

  logMessage(args: lsp.LogMessageParams): void {
    this.connection.sendNotification(lsp.LogMessageNotification.type, args);
  }

  telemetry(args: any): void {
    this.connection.sendNotification(lsp.TelemetryEventNotification.type, args);
  }
}
