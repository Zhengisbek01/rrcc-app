import { sql } from "../../lib/db.js";
import { sendTelegram, money } from "../../lib/notify.js";
import { STATUS_LABELS_RU, DOC_STATUS_LABELS_RU } from "../../lib/labels.js";

// Vercel Cron вызывает этот роут по расписанию, заданному в vercel.json.
// Защита: заголовок Authorization: Bearer <CRON_SECRET>, который Vercel добавляет автоматически,
// сверяется с переменной окружения CRON_SECRET.
export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { rows: list } = await sql`
    select * from payment_requests_view
    where created_at >= now() - interval '7 days'
       or status in ('pending_director','approved','paid','awaiting_documents')
    order by created_at desc
  `;

  const totalSum = list.reduce((s, r) => s + Number(r.paid_amount || r.amount || 0), 0);
  const withDocs = list.filter((r) => r.documents_received);
  const overdue = list.filter((r) => r.documents_status === "documents_overdue");
  const pendingDocs = list.filter((r) => r.documents_status === "documents_pending");

  const contractorsProvided = [...new Set(withDocs.map((r) => r.contractor_name))];
  const contractorsOverdue = [...new Set(overdue.map((r) => r.contractor_name))];

  const lines = [];
  lines.push(`<b>Еженедельный отчёт по оплатам</b>`);
  lines.push(`Заявок за период: ${list.length}, сумма: ${money(totalSum)}`);
  lines.push("");
  list.slice(0, 25).forEach((r) => {
    lines.push(
      `• ${r.object_name} — ${r.contractor_name} — ${money(r.amount)} — ${r.purpose} — статус: ${STATUS_LABELS_RU[r.status] || r.status}${
        r.documents_status ? `, документы: ${DOC_STATUS_LABELS_RU[r.documents_status]}` : ""
      }`
    );
  });
  if (list.length > 25) lines.push(`… и ещё ${list.length - 25}`);
  lines.push("");
  lines.push(`✅ Документы предоставили: ${contractorsProvided.join(", ") || "—"}`);
  lines.push(`⛔ Просрочили документы: ${contractorsOverdue.join(", ") || "—"}`);
  lines.push(`⏳ Ожидается документов: ${pendingDocs.length}`);

  const reportText = lines.join("\n");
  const reportTextPlain = reportText.replace(/<\/?b>/g, "");

  const { rows: recipients } = await sql`
    select id, telegram_chat_id, role from users where role in ('director','accountant','site_manager')
  `;

  for (const r of recipients) {
    await sql`
      insert into notifications (user_id, title, body) values (${r.id}, 'Еженедельный отчёт', ${reportTextPlain})
    `;
    if (r.telegram_chat_id) await sendTelegram(r.telegram_chat_id, reportText);
  }

  res.status(200).json({ ok: true, requests: list.length, recipients: recipients.length });
}
