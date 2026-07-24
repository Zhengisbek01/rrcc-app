import { sql } from "../lib/db.js";
import {
  hashPassword,
  verifyPassword,
  signSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
} from "../lib/auth.js";

async function register(req, res) {
  const { email, password, full_name, role } = req.body || {};
  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: "Заполните все поля" });
  }
  if (!["site_manager", "director", "accountant"].includes(role)) {
    return res.status(400).json({ error: "Неверная роль" });
  }
  if (password.length < 6) return res.status(400).json({ error: "Пароль минимум 6 символов" });

  const { rows: existing } = await sql`select id from users where email = ${email.toLowerCase()}`;
  if (existing.length > 0) return res.status(400).json({ error: "Пользователь с таким email уже существует" });

  const passwordHash = await hashPassword(password);
  const { rows } = await sql`
    insert into users (email, password_hash, full_name, role)
    values (${email.toLowerCase()}, ${passwordHash}, ${full_name}, ${role})
    returning id, email, full_name, role, telegram_chat_id, telegram_link_code
  `;
  const user = rows[0];
  setSessionCookie(res, signSession(user));
  res.status(200).json({ user });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Введите email и пароль" });

  const { rows } = await sql`select * from users where email = ${email.toLowerCase()}`;
  const user = rows[0];
  if (!user) return res.status(400).json({ error: "Неверный email или пароль" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: "Неверный email или пароль" });

  setSessionCookie(res, signSession(user));
  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      telegram_chat_id: user.telegram_chat_id,
      telegram_link_code: user.telegram_link_code,
    },
  });
}

async function logout(req, res) {
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}

async function me(req, res) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: "Не авторизован" });

  const { rows } = await sql`
    select id, email, full_name, role, telegram_chat_id, telegram_link_code
    from users where id = ${sessionUser.id}
  `;
  if (rows.length === 0) return res.status(404).json({ error: "Не найден" });
  res.status(200).json({ user: rows[0] });
}

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    if (req.method === "POST" && action === "register") return await register(req, res);
    if (req.method === "POST" && action === "login") return await login(req, res);
    if (req.method === "POST" && action === "logout") return await logout(req, res);
    if (req.method === "GET" && action === "me") return await me(req, res);
    res.status(400).json({ error: "Неизвестное действие" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
}
