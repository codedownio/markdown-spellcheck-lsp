
import {Nodehun} from "nodehun";
import { spellcheckMarkdown } from "./spellcheck-markdown";
const fs = require("fs");


/*
 * Check a file and print the result.
 * Return process exit code.
 */
export async function checkFile(
  file: string,
  affix: string,
  dictionary: string,
  json=false,
): Promise<number> {
  const nodehun = new Nodehun(affix, dictionary);

  const markdown = fs.readFileSync(file, { encoding: "utf8", flag: "r" });

  const diagnostics = await spellcheckMarkdown(nodehun, markdown);
  if (diagnostics.length === 0) return 0;

  console.log("Got diagnostics", diagnostics);
}
