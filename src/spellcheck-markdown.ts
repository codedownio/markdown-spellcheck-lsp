
type Nodehun = import("nodehun").Nodehun;
type Diagnostic = import("vscode-languageserver").Diagnostic;

const Remarkable = require("remarkable");

const wordRegex = /([\w-'’]+)/gm;


export const initialText = "Misspelling. Suggestions: ";

interface Word {
  text: string;
  line: number;
  start: number;
  end: number;
}

export async function spellcheckMarkdown(nodehun: Nodehun, markdown: string): Promise<Diagnostic[]> {
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

  let diagnostics: Diagnostic[] = [];

  for (let word of words) {
    const suggestions = await nodehun.suggest(word.text);
    if (!suggestions) continue;

    diagnostics.push({
      range: {
        start: {
          line: word.line || 0,
          character: word.start
        },
        end: {
          line: word.line,
          character: word.end
        }
      },

      severity: 2, // Warning

      source: "spellchecker",

      message: initialText + suggestions.join(", ")
    });
  }

  return diagnostics;
}

function walkTokenTree(token, fn) {
  fn(token);

  if (token.children) {
    token.children.map(fn);
  }
}
