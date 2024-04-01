/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import debounce = require("p-debounce");
import {Nodehun} from "nodehun";

import * as fs from "fs";

import { Logger, PrefixingLogger } from "./logger";

import { LspClient } from "./lsp-client";
import { uriToPath } from "./protocol-translation";
import { LspDocuments } from "./document";
import { initialText, spellcheckMarkdown } from "./spellcheck-markdown";

import { CodeActionKind, Command, CodeAction, CodeActionParams, DidOpenTextDocumentParams, DidCloseTextDocumentParams, DidChangeTextDocumentParams, ExecuteCommandParams, InitializeParams, InitializeResult, TextDocumentSyncKind } from "vscode-languageserver";


export interface IServerOptions {
  logger: Logger
  lspClient: LspClient;
  affixFile: string;
  dicFile: string;
  personalDicFile: string | null | undefined;
}

export class LspServer {
  private initializeResult: InitializeResult;
  private logger: Logger;
  private nodehun: Nodehun;

  private readonly documents = new LspDocuments();

  constructor(private options: IServerOptions) {
    this.logger = new PrefixingLogger(options.logger, "[lspserver]")

    const affix = fs.readFileSync(options.affixFile);
    const dictionary = fs.readFileSync(options.dicFile);
    this.nodehun = new Nodehun(affix, dictionary);

    if (options.personalDicFile) {
      const personalDictionary = fs.readFileSync(options.personalDicFile);
      this.nodehun.addDictionarySync(personalDictionary);
    }
  }

  closeAll(): void {
    for (const file of [...this.documents.files]) {
      this.closeDocument(file);
    }
  }

  async initialize(params: InitializeParams): Promise<InitializeResult> {
    this.initializeResult = {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,

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

    return this.initializeResult;
  }

  readonly requestDiagnostics = debounce(() => this.doRequestDiagnostics(), 200);

  protected async doRequestDiagnostics() {
    const { files } = this.documents;

    for (let file of files) {
      let document = this.documents.get(file);
      if (!document) continue;
      const diagnostics = await spellcheckMarkdown(this.nodehun, document.getText());
      this.options.lspClient.publishDiagnostics({
        uri: document.uri,
        diagnostics,
      });
    }
  }

  didOpenTextDocument(params: DidOpenTextDocumentParams): void {
    const file = uriToPath(params.textDocument.uri);

    if (!file) {
      return;
    }

    if (this.documents.open(file, params.textDocument)) {
      this.requestDiagnostics();
    } else {
      this.logger.warn(`Cannot open already opened doc "${params.textDocument.uri}".`);
      this.didChangeTextDocument({
        textDocument: params.textDocument,
        contentChanges: [{
          text: params.textDocument.text
        }]
      });
    }
  }

  didCloseTextDocument(params: DidCloseTextDocumentParams): void {
    const file = uriToPath(params.textDocument.uri);
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

  didChangeTextDocument(params: DidChangeTextDocumentParams): void {
    const { textDocument } = params;
    const file = uriToPath(textDocument.uri);
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

  didSaveTextDocument(params: DidChangeTextDocumentParams): void {
    // do nothing
  }

  async codeAction(params: CodeActionParams): Promise<(Command | CodeAction)[]> {
    const file = uriToPath(params.textDocument.uri);
    if (!file) {
      return [];
    }

    let diagnostics = params.context.diagnostics;
    let relevantDiagnostics = diagnostics.filter((x) => x.source === "spellchecker")
    if (relevantDiagnostics.length === 0) return [];

    let diagnostic = relevantDiagnostics[0];

    let joined = diagnostic.message.slice(initialText.length);
    let words = joined.split(", ");

    let result: CodeAction[] = words.map((x) => ({
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

  async executeCommand(arg: ExecuteCommandParams): Promise<void> {
    if (arg.command === "add-to-dictionary" && arg.arguments) {
      let wordToAdd = arg.arguments[0];

      try {
        if (!this.options.personalDicFile) {
          throw new Error("markdown-spellcheck-lsp was not configured with a personal dictionary file");
        }

        fs.appendFileSync(this.options.personalDicFile, "\n" + wordToAdd);
        this.nodehun.add(wordToAdd);

        this.requestDiagnostics();
      } catch (e) {
        this.logger.error("executeCommand", e);
      }
    }
  }
}
