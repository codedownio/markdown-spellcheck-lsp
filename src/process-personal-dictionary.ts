
import { createReadStream } from "fs";
import { createInterface } from "readline";


export async function processFileLineByLine(filePath: string, cb: (line: string) => void) {
  const fileStream = createReadStream(filePath);

  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity // Recognize all line endings (\r, \n, \r\n)
  });

  try {
    for await (const line of rl) {
      cb(line);
    }
  } catch (err) {
    console.error("Error reading file:", err);
  } finally {
    rl.close();
    fileStream.close();
  }
}
