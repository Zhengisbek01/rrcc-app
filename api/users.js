import { sql } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

export default requireAuth(async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();
  const { rows } = await sql`select id, full_name, role from users order by full_name`;
  res.status(200).json({ users: rows });
});
