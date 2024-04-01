#!/usr/bin/env node
/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { program } from "commander";
import {MessageType} from "vscode-languageserver";

import { createLspConnection } from "./lsp-connection";

program
    .version(require("../package.json").version)

    .requiredOption("--affix-file <path>", "Path to hunspell affix file (like en_US.aff)")
    .requiredOption("--dic-file <path>", "Path to hunspell dictionary file (like en_US.dic)")

    .option("--personal-dic-file <path>", "Path to hunspell personal dictionary file")

    .option("--stdio", "use stdio")
    .option("--node-ipc", "use node-ipc")
    .option("--log-level <logLevel>", "A number indicating the log level (4 = log, 3 = info, 2 = warn, 1 = error). Defaults to `2`.")
    .option("--socket <port>", "use socket. example: --socket=5000")

program.parse();

const options = program.opts();

if (!(options.stdio || options.socket || options.nodeIpc)) {
    console.error("Connection type required (stdio, node-ipc, socket). Refer to --help for more details.");
    process.exit(1);
}

if (!options.logLevel) {
  options.logLevel = 2;
}

let logLevel = MessageType.Warning
if (options.logLevel) {
    logLevel = parseInt(options.logLevel, 10);
    if (logLevel && (logLevel < 1 || logLevel > 4)) {
        console.error("Invalid `--log-level " + logLevel + "`. Falling back to `info` level.");
        logLevel = MessageType.Warning;
    }
}

createLspConnection({
    showMessageLevel: options.logLevel,
    affixFile: options.affixFile,
    dicFile: options.dicFile,
    personalDicFile: options.personalDicFile,
}).listen();
