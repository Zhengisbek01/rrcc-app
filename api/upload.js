import { put } from "@vercel/blob";
import { requireAuth } from "../lib/auth.js";

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default requireAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const filename = req.query.filename || `file-${Date.now()}`;
  const contentType = req.headers["content-type"] || "application/octet-stream";

  try {
    const buffer = await readRawBody(req);
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: "Файл пустой" });
    }
    if (buffer.length > 4.5 * 1024 * 1024) {
      return res.status(400).json({ error: "Файл больше 4.5 МБ, сожмите фото" });
    }

    const blob = await put(`invoices/${req.user.id}/${Date.now()}-${filename}`, buffer, {
      access: "public",
      contentType,
    });

    res.status(200).json({ url: blob.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка загрузки файла" });
  }
});
