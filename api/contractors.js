import { sql } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

export default requireAuth(async (req, res) => {
  if (req.method === "GET") {
    const { rows } = await sql`select * from contractors order by name`;
    return res.status(200).json({ contractors: rows });
  }

  if (req.method === "POST") {
    const { name } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: "Укажите название подрядчика" });

    const { rows: existing } = await sql`select * from contractors where lower(name) = ${name.trim().toLowerCase()}`;
    if (existing.length > 0) return res.status(200).json({ contractor: existing[0] });

    const { rows } = await sql`insert into contractors (name) values (${name.trim()}) returning *`;
    return res.status(200).json({ contractor: rows[0] });
  }

  res.status(405).end();
});
