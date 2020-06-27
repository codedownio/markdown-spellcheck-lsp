/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as lsp from "vscode-languageserver";
import debounce = require("p-debounce");

const child_process = require("child_process");

import { Logger, PrefixingLogger } from "./logger";

import { LspClient } from "./lsp-client";
import { uriToPath } from "./protocol-translation";
import { LspDocuments } from "./document";
import { initialText, spellcheckMarkdown } from "./spellcheck-markdown";

import { CodeActionKind, Command, CodeAction } from "vscode-languageserver";

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
        textDocumentSync: lsp.TextDocumentSyncKind.Incremental,

        codeActionProvider: {
          codeActionKinds: [
            CodeActionKind.QuickFix
          ]
        },

        executeCommandProvider: {
          commands: ["add-to-dictionary"]
        }
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

  async codeAction(params: lsp.CodeActionParams): Promise<(lsp.Command | lsp.CodeAction)[]> {
    const file = uriToPath(params.textDocument.uri);
    this.logger.info("codeAction", params, file);
    if (!file) {
      return [];
    }

    let diagnostics = params.context.diagnostics;
    let relevantDiagnostics = diagnostics.filter((x) => x.source === "spellchecker")
    if (relevantDiagnostics.length === 0) return [];

    let diagnostic = relevantDiagnostics[0];

    let joined = diagnostic.message.slice(initialText.length);
    let words = joined.split(", ");

    let result: lsp.CodeAction[] = words.map((x) => ({
      title: x,

      edit: {
        changes: {
          [params.textDocument.uri]: [{
            range: diagnostic.range,
            newText: x
          }]
        }
      }
    }));


    let document = this.documents.get(file);
    if (document) {
      let currentText = document.getText(diagnostic.range)
      let action: CodeAction = {
        title: "Add to dictionary",

        command: {
          title: "Add to dictionary",
          command: "add-to-dictionary",
          arguments: [currentText]
        }
      };
      result.unshift(action);
    }

    return result;
  }

  async executeCommand(arg: lsp.ExecuteCommandParams): Promise<void> {
    this.logger.info("executeCommand", arg);

    if (arg.command === "add-to-dictionary" && arg.arguments) {
      let wordToAdd = arg.arguments[0];

      try {
        child_process.execSync("hunspell -a", {
          input: "*" + wordToAdd + "\n#\n"
        }).toString().split("\n");

        this.requestDiagnostics();
      } catch (e) {
        this.logger.error("executeCommand", e);
      }
    }
  }
}
