#!/usr/bin/env node

import {spellcheckMarkdown} from './spellcheck-markdown';

/*** This is a test main function for running the spellchecker on a file via "npm run check" ***/

import {Nodehun} from "nodehun";
const fs = require("fs");

const affix = fs.readFileSync("/usr/share/hunspell/en_US.aff");
const dictionary = fs.readFileSync("/usr/share/hunspell/en_US.dic");
const nodehun = new Nodehun(affix, dictionary);

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

spellcheckMarkdown(nodehun, markdown).then((diagnostics) => {
  console.log("Diagnostics", JSON.stringify(diagnostics));
});
