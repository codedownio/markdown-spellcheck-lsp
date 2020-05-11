/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as lsp from "vscode-languageserver";
import debounce = require("p-debounce");

import { Logger, PrefixingLogger } from "./logger";

import { LspClient } from "./lsp-client";
import { uriToPath } from "./protocol-translation";
import { LspDocuments } from "./document";
import { spellcheckMarkdown } from "./spellcheck-markdown";

export interface IServerOptions {
  logger: Logger
  lspClient: LspClient;
}

export class LspServer {
  private initializeParams: lsp.InitializeParams;
  private initializeResult: lsp.InitializeResult;
  private logger: Logger;

  private readonly documents = new LspDocuments();

  constructor(private options: IServerOptions) {
    this.logger = new PrefixingLogger(options.logger, "[lspserver]")
  }

  closeAll(): void {
    for (const file of [...this.documents.files]) {
      this.closeDocument(file);
    }
  }

  async initialize(params: lsp.InitializeParams): Promise<lsp.InitializeResult> {
    this.logger.log("initialize", params);

    this.initializeParams = params;

    this.initializeResult = {
      capabilities: {
        textDocumentSync: lsp.TextDocumentSyncKind.Incremental
      }
    };

    this.logger.log("onInitialize result", this.initializeResult);

    return this.initializeResult;
  }

  readonly requestDiagnostics = debounce(() => this.doRequestDiagnostics(), 200);

  protected async doRequestDiagnostics() {
    const { files } = this.documents;

    for (let file of files) {
      this.logger.log("diagnostics", "TODO: do diagnostics for file " + file);
      let document = this.documents.get(file);
      if (!document) continue;
      let diagnostics = spellcheckMarkdown(document.getText());
      this.options.lspClient.publishDiagnostics({
        uri: document.uri,
        diagnostics,
      });
    }
  }

  didOpenTextDocument(params: lsp.DidOpenTextDocumentParams): void {
    const file = uriToPath(params.textDocument.uri);

    this.logger.log("onDidOpenTextDocument", params, file);

    if (!file) {
      return;
    }

    if (this.documents.open(file, params.textDocument)) {
      this.requestDiagnostics();
    } else {
      this.logger.log(`Cannot open already opened doc "${params.textDocument.uri}".`);
      this.didChangeTextDocument({
        textDocument: params.textDocument,
        contentChanges: [{
          text: params.textDocument.text
        }]
      });
    }
  }

  didCloseTextDocument(params: lsp.DidCloseTextDocumentParams): void {
    const file = uriToPath(params.textDocument.uri);
    this.logger.log("onDidCloseTextDocument", params, file);
    if (!file) {
      return;
    }
    this.closeDocument(file);
  }

  protected closeDocument(file: string): void {
    const document = this.documents.close(file);
    if (!document) {
      return;
    }

    // We won't be updating diagnostics anymore for that file, so clear them
    // so we don't leave stale ones.
    this.options.lspClient.publishDiagnostics({
      uri: document.uri,
      diagnostics: [],
    });
  }

  didChangeTextDocument(params: lsp.DidChangeTextDocumentParams): void {
    const { textDocument } = params;
    const file = uriToPath(textDocument.uri);
    this.logger.error("onDidChangeTextDocument", params, file);
    if (!file) {
      return;
    }

    const document = this.documents.get(file);
    if (!document) {
      this.logger.error("Received change on non-opened document " + textDocument.uri);
      throw new Error("Received change on non-opened document " + textDocument.uri);
    }

    if (textDocument.version === null) {
      throw new Error(`Received document change event for ${textDocument.uri} without valid version identifier`);
    }

    for (const change of params.contentChanges) {
      document.applyEdit(textDocument.version, change);
    }

    this.requestDiagnostics();
  }

  didSaveTextDocument(params: lsp.DidChangeTextDocumentParams): void {
    // do nothing
  }
}
