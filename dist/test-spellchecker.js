#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spellcheck_markdown_1 = require("./spellcheck-markdown");
/*** This is a test main function for running the spellchecker on a file via "npm run check" ***/
const nodehun_1 = require("nodehun");
const fs = require("fs");
const affix = fs.readFileSync("/usr/share/hunspell/en_US.aff");
const dictionary = fs.readFileSync("/usr/share/hunspell/en_US.dic");
const nodehun = new nodehun_1.Nodehun(affix, dictionary);
const file = process.argv[2];
console.log("File", file);
// const markdown = fs.readFileSync(file, "utf8");
// console.log("Markdown", markdown);
// let markdown = `
// > An blockq quote
// > with multiple lines
// > and a third`;
let markdown = `
# I've done a thing

  `;
(0, spellcheck_markdown_1.spellcheckMarkdown)(nodehun, markdown).then((diagnostics) => {
    console.log("Diagnostics", JSON.stringify(diagnostics));
});
//# sourceMappingURL=test-spellchecker.js.map