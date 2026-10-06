import { tool } from "langchain";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { getConnectorContext } from "../context/context.js";
import { buildPdf, sanitizeForPdf } from "../utils/pdf.util.js";
import { FileGenError, cleanName, fixNewlines, saveGeneratedFile } from "../services/generatedFiles.service.js";

const MAX_TXT_CHARS = 200_000;
const MAX_PDF_CHARS = 60_000;

/** Tool kabhi throw nahi karta: error text model ko jata hai, wo user ko batayega */
const safe = (name, fn) => async (args) => {
  const start = Date.now();
  logger.info({ tool: name }, "file tool called");
  try {
    const out = await fn(args);
    logger.info({ tool: name, ms: Date.now() - start }, "file tool done");
    return out;
  } catch (err) {
    if (err instanceof FileGenError) {
      logger.warn({ tool: name, error: err.message }, "file tool rejected");
      return `Error: ${err.message} Tell the user honestly that the file could not be created.`;
    }
    logger.error({ tool: name, error: err?.message }, "file tool failed");
    return "Error: the file could not be generated right now. Tell the user honestly it failed and to try again.";
  }
};

const ok = ({ name, url }) =>
  `File created. In your reply, show the user exactly this markdown link, unchanged: [${name}](${url})  Never invent or edit the URL.`;

const userId = () => getConnectorContext()?.userId;

const createTextFile = tool(
  safe("createTextFile", async ({ filename, content }) => {
    const text = fixNewlines(content);
    if (!text.trim()) throw new FileGenError("The content is empty.");
    if (text.length > MAX_TXT_CHARS) throw new FileGenError("The content is too long for a text file.");

    const name = cleanName(filename, "txt");
    return ok(await saveGeneratedFile({ userId: userId(), name, mime: "text/plain; charset=utf-8", data: Buffer.from(text, "utf8") }));
  }),
  {
    name: "createTextFile",
    description:
      "Create a downloadable .txt text file. Use ONLY when the user asks to create/generate/save a text file. Returns a download link to show the user.",
    schema: z.object({
      filename: z.string().describe("File name without path, e.g. diwali_greeting"),
      content: z.string().describe("Full text of the file. Use real line breaks, not the characters backslash-n"),
    }),
  },
);

const createPdfFile = tool(
  safe("createPdfFile", async ({ title, filename, content }) => {
    const raw = fixNewlines(content);
    if (!raw.trim()) throw new FileGenError("The content is empty.");
    if (raw.length > MAX_PDF_CHARS) throw new FileGenError("The content is too long for one PDF. Make it shorter.");

    const { text, badRatio } = sanitizeForPdf(raw);
    if (badRatio > 0.05) {
      throw new FileGenError("PDFs currently support English/Latin text only (not Hindi script or emoji). Offer a .txt file instead.");
    }

    const data = await buildPdf({ title: sanitizeForPdf(title).text, content: text });
    const name = cleanName(filename || title, "pdf");
    return ok(await saveGeneratedFile({ userId: userId(), name, mime: "application/pdf", data }));
  }),
  {
    name: "createPdfFile",
    description:
      "Create a downloadable PDF document (notes, report, summary). Use ONLY when the user asks for a PDF. Returns a download link to show the user.",
    schema: z.object({
      title: z.string().describe("Document title"),
      filename: z.string().optional().describe("File name without extension"),
      content: z
        .string()
        .describe("Body in simple Markdown: '# ' / '## ' headings, '- ' bullets, blank line between paragraphs. Use real line breaks."),
    }),
  },
);

export const generatedFileTools = [createTextFile, createPdfFile];