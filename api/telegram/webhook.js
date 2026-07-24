import { sql } from "../../lib/db.js";
import { sendTelegram } from "../../lib/notify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).end();

  try {
    const update = req.body || {};
    const message = update.message;
    if (!message?.text) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text.startsWith("/start")) {
      const code = text.replace("/start", "").trim();
      if (!code) {
        await sendTelegram(chatId, "Пришлите код привязки из приложения: /start ВАШ_КОД");
        return res.status(200).json({ ok: true });
      }

      const { rows } = await sql`select id, full_name from users where telegram_link_code = ${code}`;
      const user = rows[0];
      if (!user) {
        await sendTelegram(chatId, "Код не найден. Проверьте код в приложении (Профиль) и попробуйте снова.");
        return res.status(200).json({ ok: true });
      }

      await sql`update users set telegram_chat_id = ${String(chatId)} where id = ${user.id}`;
      await sendTelegram(
        chatId,
        `Готово, ${user.full_name}! Telegram привязан. Здесь будут приходить уведомления по оплатам и еженедельный отчёт.`
      );
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(200).json({ ok: true }); // Telegram ждёт 200 в любом случае
  }
}
