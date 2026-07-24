import { sql } from "./db.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function sendTelegram(chatId, text) {
  if (!chatId || !BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.error("telegram send error", e);
  }
}

export function money(n) {
  return new Intl.NumberFormat("ru-RU").format(n || 0) + " \u20B8";
}

// Создаёт in-app уведомления для списка пользователей + шлёт в Telegram, если привязан
export async function notifyUsers(userIds, title, body, paymentRequestId = null) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return;

  for (const userId of ids) {
    await sql`
      insert into notifications (user_id, title, body, payment_request_id)
      values (${userId}, ${title}, ${body}, ${paymentRequestId})
    `;
  }

  const { rows: profiles } = await sql`
    select telegram_chat_id from users where id = ANY(${ids}) and telegram_chat_id is not null
  `;
  for (const p of profiles) {
    await sendTelegram(p.telegram_chat_id, `<b>${title}</b>\n${body}`);
  }
}
