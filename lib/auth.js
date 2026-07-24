import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { parse, serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "session";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signSession(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
  );
}

export function getSessionUser(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Обёртка для защищённых API-роутов. roles = ['director', ...] или null (любой авторизованный)
export function requireAuth(handler, roles = null) {
  return async (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Не авторизован" });
      return;
    }
    if (roles && !roles.includes(user.role)) {
      res.status(403).json({ error: "Недостаточно прав" });
      return;
    }
    req.user = user;
    return handler(req, res);
  };
}
