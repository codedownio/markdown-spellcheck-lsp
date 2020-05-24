#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spellcheck_markdown_1 = require("./spellcheck-markdown");
/*** This is a test main function for running the spellchecker on a file via "npm run check" ***/
const fs = require("fs");
const file = process.argv[2];
console.log("File", file);
// const markdown = fs.readFileSync(file, "utf8");
// console.log("Markdown", markdown);
// let markdown = `
// > An blockq quote
// > with multiple lines
// > and a third`;
let markdown = `
# Here's a headingz


> block quotez
> asnda
> here's one with a laterq misspel




  `;
let diagnostics = spellcheck_markdown_1.spellcheckMarkdown(markdown);
console.log("Diagnostics", JSON.stringify(diagnostics));
//# sourceMappingURL=test-spellchecker.js.map