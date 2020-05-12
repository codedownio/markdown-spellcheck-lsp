
import {spellcheckMarkdown} from "../src/spellcheck-markdown";

test('Works for a basic sentence', () => {
  const input = `A basicq sentence`;

  expect(sp(input)).toStrictEqual([
    [0, 2, 8]
  ]);
});

test('Works for a heading', () => {
  const input = `# A headingq level 1`;

  expect(sp(input)).toStrictEqual([
    [0, 4, 12]
  ]);
});

test('Works for an unordered list', () => {
  const input = `* An unorderedq list`;

  expect(sp(input)).toStrictEqual([
    [0, 5, 15]
  ]);
});

test('Works for an unordered list with more stuff in it', () => {
  const input = `* An unorderedq list with **bold**`;

  expect(sp(input)).toStrictEqual([
    [0, 5, 15]
  ]);
});

test('Works for an even more elaborate unordered list', () => {
  const input = "* Try adding a new code blockz by going to a blank line and typing `` ``` ``.";

  expect(sp(input)).toStrictEqual([
    [0, 24, 30]
  ]);
});

test('Works for a misspelling after a bold', () => {
  const input = "This **bold** is followedq by one";

  expect(sp(input)).toStrictEqual([
    [0, 17, 26]
  ]);
});

test('Works for a misspelling inside a bold', () => {
  const input = "This **boldz** is followedq by one";

  expect(sp(input)).toStrictEqual([
    [0, 7, 12],
    [0, 18, 27]
  ]);
});

test('Works for an ordered list', () => {
  const input = "1. Here isq one";

  expect(sp(input)).toStrictEqual([
    [0, 8, 11]
  ]);
});

test('Works for a multi-line ordered list', () => {
  const input = `
1. Here isq one
2. Andq another
  `;

  expect(sp(input)).toStrictEqual([
    [1, 8, 11],
    [2, 3, 7]
  ]);
});

test('Works for a block quote', () => {
  const input = `> A singlez line block quote`;

  expect(sp(input)).toStrictEqual([
    [0, 4, 11]
  ]);
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
