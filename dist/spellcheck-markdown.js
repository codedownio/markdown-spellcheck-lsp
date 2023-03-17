"use strict";
// import { Nodehun } from "nodehun";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spellcheckMarkdown = exports.initialText = void 0;
const Remarkable = require("remarkable");
const wordRegex = /(\S+)/gm;
exports.initialText = "Misspelling. Suggestions: ";
function spellcheckMarkdown(nodehun, markdown) {
    return __awaiter(this, void 0, void 0, function* () {
        // Parse markdown to tokens
        let md = new Remarkable("commonmark");
        md.inline.ruler.enable(["footnote_inline", "del", "math"]);
        md.inline.validateLink = () => true;
        md.options.noTrimInline = true;
        let env = {};
        let tokens = md.parse(markdown, env);
        // console.log("Got tokens", JSON.stringify(tokens));
        // Get words from tokens
        let words = [];
        tokens.map((tok) => walkTokenTree(tok, (token) => {
            if (token.type === "text") {
                let content = token.content;
                let match;
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
        let diagnostics = [];
        for (let word of words) {
            const suggestions = yield nodehun.suggest(word.text);
            if (!suggestions)
                continue;
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
                severity: 2,
                source: "spellchecker",
                message: exports.initialText + suggestions.join(", ")
            });
        }
        return diagnostics;
    });
}
exports.spellcheckMarkdown = spellcheckMarkdown;
function walkTokenTree(token, fn) {
    fn(token);
    if (token.children) {
        token.children.map(fn);
    }
}
//# sourceMappingURL=spellcheck-markdown.js.map