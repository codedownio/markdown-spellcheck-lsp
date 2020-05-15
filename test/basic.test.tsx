
import {spellcheckMarkdown} from "../src/spellcheck-markdown";

test('Works for a basic sentence', () => {
  spell(`A basicq sentence`, [[0, 2, 8]]);
});

test('Works for a level 1 heading', () => {
  spell(`# A headingq level 1`, [[0, 4, 12]]);
});

test('Works for a level 1 heading on the second line', () => {
  spell(`\n# A headingq level 1`, [[1, 4, 12]]);
});

test('Works for a level 2 heading', () => {
  spell(`## This headingq is level 2`, [[0, 8, 16]]);
});

test('Works for an unordered list', () => {
  spell(`* An unorderedq list`, [[0, 5, 15]]);
});

test('Works for an unordered list with more stuff in it', () => {
  spell(`* An unorderedq list with **bold**`, [[0, 5, 15]]);
});

test('Works for an even more elaborate unordered list', () => {
  spell("* Try adding a new code blockz by going to a blank line and typing `` ``` ``.", [[0, 24, 30]]);
});

test('Works for a misspelling after a bold', () => {
  spell("This **bold** is followedq by one", [[0, 17, 26]]);
});

test('Works for a misspelling inside a bold', () => {
  spell("This **boldz** is followedq by one", [
    [0, 7, 12],
    [0, 18, 27]
  ]);
});

test('Works for an ordered list', () => {
  spell("1. Here isq one", [[0, 8, 11]]);
});

test('Works for a multi-line ordered list', () => {
  spell(`
1. Here isq one
2. Andq another
  `, [
    [1, 8, 11],
    [2, 3, 7]
  ]);
});

test('Works for a block quote', () => {
  spell(`> A singlez line block quote`, [[0, 4, 11]]);
});

test('Works for a link', () => {
  spell(`Here is a [linkz](www.google.com)`, [[0, 11, 16]]);
});

test('Works for a link with stuff before it', () => {
  spell(`Here **is** a [linkz](www.google.com)`, [[0, 15, 20]]);
});


test('Works for a link on a new line', () => {
  spell(`\nHere is a [linkz](www.google.com)`, [[1, 11, 16]]);
});

/**
 * Return a list of spelling error locations as a tuple,
 * [line number, start ch, end ch]
 */
function sp(input: string): Array<[number, number, number]> {
  let diagnostics = spellcheckMarkdown(input);
  return diagnostics.map((x) =>
    [x.range.start.line, x.range.start.character, x.range.end.character]
  );
}

function spell(input: string, locations: Array<[number, number, number]>) {
  expect(sp(input)).toStrictEqual(locations);
}
