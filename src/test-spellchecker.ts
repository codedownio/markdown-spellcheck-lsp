#!/usr/bin/env node

import {spellcheckMarkdown} from './spellcheck-markdown';

/*** This is a test main function for running the spellchecker on a file via "npm run check" ***/

const fs = require("fs");

const file = process.argv[2];

console.log("File", file);

// const markdown = fs.readFileSync(file, "utf8");
// console.log("Markdown", markdown);

let markdown = `> An blockq quote
> with multiple lines
> and a third`;

let diagnostics = spellcheckMarkdown(markdown);

console.log("Diagnostics", JSON.stringify(diagnostics));
