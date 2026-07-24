import { sql } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

export default requireAuth(async (req, res) => {
  if (req.method === "GET") {
    const { rows } = await sql`select * from objects order by created_at desc`;
    return res.status(200).json({ objects: rows });
  }

  if (req.method === "POST") {
    if (req.user.role !== "director") return res.status(403).json({ error: "Только руководитель может добавлять объекты" });
    const { name, address } = req.body || {};
    if (!name) return res.status(400).json({ error: "Укажите название объекта" });
    const { rows } = await sql`
      insert into objects (name, address, created_by) values (${name}, ${address || null}, ${req.user.id})
      returning *
    `;
    return res.status(200).json({ object: rows[0] });
  }

  if (req.method === "PATCH") {
    if (req.user.role !== "director") return res.status(403).json({ error: "Недостаточно прав" });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Не указан объект" });
    const { is_active } = req.body || {};
    const { rows } = await sql`update objects set is_active = ${is_active} where id = ${id} returning *`;
    return res.status(200).json({ object: rows[0] });
  }

  res.status(405).end();
});
