
# Welcome to `markdown-spellcheck-lsp`

![markdown-spellcheck-lsp](https://github.com/codedownio/markdown-spellcheck-lsp/workflows/ci/badge.svg)

This project is an [LSP server](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/) implementation which provides spellchecking suggestions on a Markdown document.

It parses the document using [remarkable](https://github.com/jonschlinkert/remarkable), a powerful and flexible Markdown parsing library. Then it looks for spelling mistakes using [Hunspell](https://github.com/hunspell/hunspell), the industry-standard spellchecking library used in many browsers and OSes.

## Example

In the Markdown below, `markdown-spellcheck-lsp` will correctly find all the misspellings and suggest alternatives, understanding the Markdown syntax and ignoring any sections (such as the URL inside a link) that should not be checked.

```markdown
# Here's a missspelling

> An blockq quote
>with multiple linesz
> and a thrd

This link **iz** also [wronggly speled](www.github.com)
```

## CLI usage
