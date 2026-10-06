import { extractText, getDocumentProxy } from "unpdf";

export async function extractFileText(buffer, mime) {
  if (mime === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  return buffer.toString("utf8"); // text/plain
}