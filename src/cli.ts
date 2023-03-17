#!/usr/bin/env node
/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as lsp from "vscode-languageserver";
import { Command } from "commander";
import { createLspConnection } from "./lsp-connection";

const program = new Command("markdown-spellchecker")
    .version(require("../package.json").version)

    .option("--affix-file", "Path to hunspell affix file (like en_US.aff)")
    .option("--dic-file", "Path to hunspell dictionary file (like en_US.dic)")

    .option("--stdio", "use stdio")
    .option("--node-ipc", "use node-ipc")
    .option("--log-level <logLevel>", "A number indicating the log level (4 = log, 3 = info, 2 = warn, 1 = error). Defaults to `2`.")
    .option("--socket <port>", "use socket. example: --socket=5000")
    .parse(process.argv);

if (!(program.stdio || program.socket || program.nodeIpc)) {
    console.error("Connection type required (stdio, node-ipc, socket). Refer to --help for more details.");
    process.exit(1);
}

if (!program.logLevel) {
  program.logLevel = 2;
}

let logLevel = lsp.MessageType.Warning
if (program.logLevel) {
    logLevel = parseInt(program.logLevel, 10);
    if (logLevel && (logLevel < 1 || logLevel > 4)) {
        console.error("Invalid `--log-level " + logLevel + "`. Falling back to `info` level.");
        logLevel = lsp.MessageType.Warning;
    }
}

createLspConnection({
    showMessageLevel: program.logLevel,
    affixFile: program.affixFile,
    dicFile: program.dicFile,
}).listen();
