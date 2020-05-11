/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import URI from "vscode-uri";
import { LspDocuments } from './document';

export function uriToPath(stringUri: string): string | undefined {
    const uri = URI.parse(stringUri);
    if (uri.scheme !== 'file') {
        return undefined;
    }
    return uri.fsPath;
}

export function pathToUri(filepath: string, documents: LspDocuments | undefined): string {
    const fileUri = URI.file(filepath);
    const document = documents && documents.get(fileUri.fsPath);
    return document ? document.uri : fileUri.toString();
}
