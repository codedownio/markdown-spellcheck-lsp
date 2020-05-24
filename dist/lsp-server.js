"use strict";
/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lsp = require("vscode-languageserver");
const debounce = require("p-debounce");
const child_process = require("child_process");
const logger_1 = require("./logger");
const protocol_translation_1 = require("./protocol-translation");
const document_1 = require("./document");
const spellcheck_markdown_1 = require("./spellcheck-markdown");
const vscode_languageserver_1 = require("vscode-languageserver");
class LspServer {
    constructor(options) {
        this.options = options;
        this.documents = new document_1.LspDocuments();
        this.requestDiagnostics = debounce(() => this.doRequestDiagnostics(), 200);
        this.logger = new logger_1.PrefixingLogger(options.logger, "[lspserver]");
    }
    closeAll() {
        for (const file of [...this.documents.files]) {
            this.closeDocument(file);
        }
    }
    initialize(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log("initialize", params);
            this.initializeParams = params;
            this.initializeResult = {
                capabilities: {
                    textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
                    codeActionProvider: {
                        codeActionKinds: [
                            vscode_languageserver_1.CodeActionKind.QuickFix
                        ]
                    }
                }
            };
            this.logger.log("onInitialize result", this.initializeResult);
            return this.initializeResult;
        });
    }
    doRequestDiagnostics() {
        return __awaiter(this, void 0, void 0, function* () {
            const { files } = this.documents;
            for (let file of files) {
                this.logger.log("diagnostics", "TODO: do diagnostics for file " + file);
                let document = this.documents.get(file);
                if (!document)
                    continue;
                let diagnostics = spellcheck_markdown_1.spellcheckMarkdown(document.getText());
                this.options.lspClient.publishDiagnostics({
                    uri: document.uri,
                    diagnostics,
                });
            }
        });
    }
    didOpenTextDocument(params) {
        const file = protocol_translation_1.uriToPath(params.textDocument.uri);
        this.logger.log("onDidOpenTextDocument", params, file);
        if (!file) {
            return;
        }
        if (this.documents.open(file, params.textDocument)) {
            this.requestDiagnostics();
        }
        else {
            this.logger.log(`Cannot open already opened doc "${params.textDocument.uri}".`);
            this.didChangeTextDocument({
                textDocument: params.textDocument,
                contentChanges: [{
                        text: params.textDocument.text
                    }]
            });
        }
    }
    didCloseTextDocument(params) {
        const file = protocol_translation_1.uriToPath(params.textDocument.uri);
        this.logger.log("onDidCloseTextDocument", params, file);
        if (!file) {
            return;
        }
        this.closeDocument(file);
    }
    closeDocument(file) {
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
    didChangeTextDocument(params) {
        const { textDocument } = params;
        const file = protocol_translation_1.uriToPath(textDocument.uri);
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
    didSaveTextDocument(params) {
        // do nothing
    }
    codeAction(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = protocol_translation_1.uriToPath(params.textDocument.uri);
            this.logger.info("codeAction", params, file);
            if (!file) {
                return [];
            }
            let diagnostics = params.context.diagnostics;
            let relevantDiagnostics = diagnostics.filter((x) => x.source === "spellchecker");
            if (relevantDiagnostics.length === 0)
                return [];
            let diagnostic = relevantDiagnostics[0];
            let joined = diagnostic.message.slice(spellcheck_markdown_1.initialText.length);
            let words = joined.split(", ");
            let result = words.map((x) => ({
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
                let currentText = document.getText(diagnostic.range);
                let action = {
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
        });
    }
    executeCommand(arg) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("executeCommand", arg);
            if (arg.command === "add-to-dictionary" && arg.arguments) {
                let wordToAdd = arg.arguments[0];
                try {
                    child_process.execSync("hunspell -a", {
                        input: "*" + wordToAdd + "\n#\n"
                    }).toString().split("\n");
                    this.requestDiagnostics();
                }
                catch (e) {
                    this.logger.error("executeCommand", e);
                }
            }
        });
    }
}
exports.LspServer = LspServer;
//# sourceMappingURL=lsp-server.js.map