
type Diagnostic = import("vscode-languageserver").Diagnostic;

const Remarkable = require("remarkable");
const child_process = require("child_process");

const wordRegex = /(\S+)/gm;
const misspellingRegex = /& (\S+) (\d+) (\d+): (.*)/gm;

export const initialText = "Misspelling. Suggestions: ";

interface Word {
  text: string;
  line: number;
  start: number;
  end: number;
}

export function spellcheckMarkdown(markdown: string) {
  // Parse markdown to tokens
  let md = new Remarkable("commonmark");
  md.inline.ruler.enable(["footnote_inline", "del", "math"]);
  md.inline.validateLink = () => true;
  md.options.noTrimInline = true;
  let env = {};
  let tokens = md.parse(markdown, env);

  // console.log("Got tokens", JSON.stringify(tokens));

  // Get words from tokens
  let words: Word[] = [];
  tokens.map((tok) => walkTokenTree(tok, (token) => {
    if (token.type === "text") {

      let content: string = token.content;
      let match: RegExpExecArray | null;

      while ((match = wordRegex.exec(content)) !== null) {
        words.push({
          text: match[0],
          line: token.line,
          start: match.index + (token.start || 0),
          end: wordRegex.lastIndex + (token.start || 0)
        });
      }
    }
  }));

  // console.log("Got words", words.length, words);

  // Run hunspell and parse the output to get diagnostics
  let diagnostics: Diagnostic[] = [];
  let lines: string[] = child_process.execSync("hunspell -a", {
    input: words.map((x) => x.text).join("\n")
  }).toString().split("\n");

  let curLine = 0;
  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i];
    if (line === "") {
      curLine += 1;
    } else if (line[0] === "*") {
      // Correct word, ignore
    } else if (line[0] === "&") {
      let misspellingInfo = misspellingRegex.exec(line);
      misspellingRegex.lastIndex = 0;
      if (!misspellingInfo) continue;
      let word = misspellingInfo[1];
      let unknown = Number.parseInt(misspellingInfo[2] || "0");
      let startCh = Number.parseInt(misspellingInfo[3] || "0");
      let rest = misspellingInfo[4] || "";
      let suggestions = rest.split(", ");

      let originalWord = words[curLine];

      diagnostics.push({
        range: {
          start: {
            line: originalWord.line || 0,
            character: originalWord.start + startCh
          },
          end: {
            line: originalWord.line,
            character: originalWord.end
          }
        },

        severity: 2, // Warning

        source: "spellchecker",

        message: initialText + rest
      });
    }
  }

  return diagnostics;
}

function walkTokenTree(token, fn) {
  fn(token);

  if (token.children) {
    token.children.map(fn);
  }
}
