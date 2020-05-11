#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spellcheck_markdown_1 = require("./spellcheck-markdown");
/*** This is a test main function for running the spellchecker on a file via "npm run check" ***/
const fs = require("fs");
const file = process.argv[2];
console.log("File", file);
const markdown = fs.readFileSync(file, "utf8");
console.log("Markdown", markdown);
let diagnostics = spellcheck_markdown_1.spellcheckMarkdown(markdown);
console.log("Diagnostics", JSON.stringify(diagnostics));
//# sourceMappingURL=test-spellchecker.js.map