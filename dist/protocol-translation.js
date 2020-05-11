"use strict";
/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_uri_1 = require("vscode-uri");
function uriToPath(stringUri) {
    const uri = vscode_uri_1.default.parse(stringUri);
    if (uri.scheme !== 'file') {
        return undefined;
    }
    return uri.fsPath;
}
exports.uriToPath = uriToPath;
function pathToUri(filepath, documents) {
    const fileUri = vscode_uri_1.default.file(filepath);
    const document = documents && documents.get(fileUri.fsPath);
    return document ? document.uri : fileUri.toString();
}
exports.pathToUri = pathToUri;
//# sourceMappingURL=protocol-translation.js.map