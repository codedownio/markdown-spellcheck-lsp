
import {spellcheckMarkdown} from "../src/spellcheck-markdown";

test('Works for a basic sentence', async () => {
  await spell(`A basicq sentence`, [[0, 2, 8]]);
});

test('Works for a level 1 heading', async () => {
  await spell(`# A headingq level 1`, [[0, 4, 12]]);
});

test('Works for a level 1 heading on the second line', async () => {
  await spell(`\n# A headingq level 1`, [[1, 4, 12]]);
});

test('Works for a level 2 heading', async () => {
  await spell(`## This headingq is level 2`, [[0, 8, 16]]);
});

test('Works for an unordered list', async () => {
  await spell(`* An unorderedq list`, [[0, 5, 15]]);
});

test('Works for an unordered list with more stuff in it', async () => {
  await spell(`* An unorderedq list with **bold**`, [[0, 5, 15]]);
});

test('Works for an even more elaborate unordered list', async () => {
  await spell("* Try adding a new code blockz by going to a blank line and typing `` ``` ``.", [[0, 24, 30]]);
});

test('Works for a misspelling after a bold', async () => {
  await spell("This **bold** is followedq by one", [[0, 17, 26]]);
});

test('Works for a misspelling inside a bold', async () => {
  await spell("This **boldz** is followedq by one", [
    [0, 7, 12],
    [0, 18, 27]
  ]);
});

test('Works for an ordered list', async () => {
  await spell("1. Here isq one", [[0, 8, 11]]);
});

test('Works for a multi-line ordered list', async () => {
  await spell(`
1. Here isq one
2. Andq another
  `, [
    [1, 8, 11],
    [2, 3, 7]
  ]);
});

test('Works for a block quote', async () => {
  await spell(`> A singlez line block quote`, [[0, 4, 11]]);
});

test('Works for a multi-line block quote', async () => {
  await spell(`> An blockq quote
>with multiple linesz
> and a thirdr`, [[0, 5, 11], [1, 15, 21], [2, 8, 14]]);
});

test('Works for a link', async () => {
  await spell(`Here is a [linkz](www.google.com)`, [[0, 11, 16]]);
});

test('Works for a link with stuff before it', async () => {
  await spell(`Here **is** a [linkz](www.google.com)`, [[0, 15, 20]]);
});

test('Works for a larger example', async () => {
  await spell(`
# Here's a headingz


> block quotez
> asnda
> here's one with a laterq misspel




  `, [[1, 11, 19],
      [4, 8, 14],
      [5, 2, 7],
      [6, 20, 26],
      [6, 27, 34]
  ])
});

test('Works for a link on a new line', async () => {
  await spell(`\nHere is a [linkz](www.google.com)`, [[1, 11, 16]]);
});

test(`Allows contractions`, async () => {
  await spell(`I've done a thing`, []);
  await spell(`I’ve done a thing`, []);
});

test(`Allows hyphens`, async () => {
  await spell(`The president is the commander-in-chief`, []);
});

test(`Tokenizes on punctuation`, async () => {
  await spell(`Oh good, it doesn't get confused by this`, []);
  await spell(`Oh good; it doesn't get confused by this`, []);
  await spell(`Oh good: it doesn't get confused by this`, []);
});


import {Nodehun} from "nodehun";
import * as fs from "fs";

// TODO: be able to pass these in when running tests
const affix = fs.readFileSync("/usr/share/hunspell/en_US.aff");
const dictionary = fs.readFileSync("/usr/share/hunspell/en_US.dic");

const nodehun = new Nodehun(affix, dictionary);

/**
 * Return a list of spelling error locations as a tuple,
 * [line number, start ch, end ch]
 */
async function sp(input: string): Array<[number, number, number]> {
  let diagnostics = await spellcheckMarkdown(nodehun, input);
  return diagnostics.map((x) =>
    [x.range.start.line, x.range.start.character, x.range.end.character]
  );
}

async function spell(input: string, locations: Array<[number, number, number]>) {
  const locs = await sp(input);
  expect(locs).toStrictEqual(locations);
}
