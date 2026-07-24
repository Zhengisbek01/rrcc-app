import { sql } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

export default requireAuth(async (req, res) => {
  if (req.method === "GET") {
    const { rows } = await sql`
      select * from notifications where user_id = ${req.user.id} order by created_at desc limit 30
    `;
    return res.status(200).json({ notifications: rows });
  }

  if (req.method === "PATCH") {
    await sql`update notifications set is_read = true where user_id = ${req.user.id} and is_read = false`;
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
});
