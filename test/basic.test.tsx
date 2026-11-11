
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

test('Works for a nested unordered list', async () => {
  // Regression: the indent of the nested item was counted twice when locating the word, which
  // pushed the diagnostic onto the following line at character 0.
  await spell(`* Here's a heading
    * asdfz
## And here's a heading`, [[1, 6, 11]]);
});

test('Works for a multi-line paragraph in a nested unordered list', async () => {
  await spell(`* Here's a heading
    * asdfz
      morez`, [[1, 6, 11], [2, 6, 11]]);
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

test('Locates a misspelling after a bold followed by a colon', async () => {
  // Regression: ':' immediately after emphasis close used to shift the text
  // token's offsets by one, so "ECE" was flagged starting on the "C".
  await spell(`**Course**: ECE 370 and Systemsz`, [[0, 12, 15], [0, 24, 32]]);
});

test('Does not flag a standalone hyphen', async () => {
  await spell(`370 - Signalsz`, [[0, 6, 14]]);
});

test(`Allows contractions`, async () => {
  await spell(`I've done a thing`, []);
  await spell(`I’ve done a thing`, []);
});

test(`Allows hyphens`, async () => {
  await spell(`The president is the commander-in-chief`, []);
});

test('Keeps accented words whole (does not split on the accent)', async () => {
  // With an ASCII-only word regex this would flag "rdz" (or "w"); the whole "wördz" should be one span.
  await spell(`A wördz here`, [[0, 2, 7]]);
});

test('Ignores a display math block', async () => {
  await spell(`Some prose here.

$$
\\alpha_{ij} + \\beta^{kl} = \\gamma
$$

More prosez after.`, [[6, 5, 11]]);
});

test('Ignores a display math block with no blank line around it', async () => {
  await spell(`Some prosez here.
$$
\\alpha_{ij}
$$
More prosey after.`, [
    [0, 5, 11],
    [4, 5, 11]
  ]);
});

test('Ignores a display math block written on one line', async () => {
  await spell(`Herez we go

$$\\alpha_{ij}$$

andz more`, [
    [0, 0, 5],
    [4, 0, 4]
  ]);
});

test('Ignores a one-line display math block with spaces inside the delimiters', async () => {
  await spell(`Herez we go

$$ f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\, e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}} $$

andz more`, [
    [0, 0, 5],
    [4, 0, 4]
  ]);
});

test('Ignores inline math', async () => {
  await spell(`Herez is \\(\\frac{a}{b} + \\sqrt{x}\\) inlinez`, [
    [0, 0, 5],
    [0, 36, 43]
  ]);
});

test('Ignores inline math in a list item and a heading', async () => {
  await spell(`* itemz \\(\\frac{1}{2}\\) z

# Headz \\(\\sqrt{x}\\)`, [
    [0, 2, 7],
    [2, 2, 7]
  ]);
});

test('Positions words after inline math that spans lines', async () => {
  await spell(`a \\(\\alpha
\\beta\\) wordz
morez`, [
    [1, 8, 13],
    [2, 0, 5]
  ]);
});

test('Checks around dollar signs in prose', async () => {
  await spell(`It costs $5 and $10, whichz is a lot`, [[0, 21, 27]]);
});

test(`Tokenizes on punctuation`, async () => {
  await spell(`Oh good, it doesn't get confused by this`, []);
  await spell(`Oh good; it doesn't get confused by this`, []);
  await spell(`Oh good: it doesn't get confused by this`, []);
});


import {Nodehun} from "nodehun";
import * as fs from "fs";

const affix = fs.readFileSync(process.env.HUNSPELL_AFF);
const dictionary = fs.readFileSync(process.env.HUNSPELL_DIC);

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
