import PDFDocument from "pdfkit";

// pdfkit ke built-in fonts sirf Latin text support karte hain
const UNSUPPORTED = /[^\t\n\r\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/g;
const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/`([^`]+)`/g, "$1");

/** Returns { text, badRatio } */
export function sanitizeForPdf(raw) {
  const bad = raw.match(UNSUPPORTED)?.length ?? 0;
  return { text: raw.replace(UNSUPPORTED, "?"), badRatio: raw.length ? bad / raw.length : 0 };
}

/** Simple markdown (# headings, - bullets, ``` code, paragraphs) -> PDF Buffer */
export function buildPdf({ title, content }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56, info: { Title: title } });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      doc.font("Helvetica-Bold").fontSize(20).fillColor("#111").text(title);
      doc.moveDown(0.8);

      let inCode = false;
      for (const raw of content.split(/\r?\n/)) {
        const line = raw.replace(/\t/g, "    ");
        const t = line.trim();

        if (t.startsWith("```")) { inCode = !inCode; continue; }
        if (inCode) { doc.font("Courier").fontSize(9.5).fillColor("#333").text(line || " "); continue; }
        if (!t) { doc.moveDown(0.5); continue; }

        const h = t.match(/^(#{1,3})\s+(.*)$/);
        if (h) {
          const size = { 1: 16, 2: 14, 3: 12 }[h[1].length];
          doc.moveDown(0.3).font("Helvetica-Bold").fontSize(size).fillColor("#111").text(inline(h[2]));
          doc.moveDown(0.2);
          continue;
        }
        const b = t.match(/^[-*]\s+(.*)$/);
        doc.font("Helvetica").fontSize(11).fillColor("#222");
        if (b) doc.text(`\u2022  ${inline(b[1])}`, { indent: 8, lineGap: 2 });
        else doc.text(inline(t), { lineGap: 2 });
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}