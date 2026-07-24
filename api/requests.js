import { sql } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";
import { notifyUsers, money } from "../lib/notify.js";

async function listRequests(req, res) {
  const { status } = req.query;
  let rows;
  if (req.user.role === "site_manager") {
    if (status && status !== "all") {
      ({ rows } = await sql`
        select * from payment_requests_view
        where status = ${status} and (created_by = ${req.user.id} or responsible_user_id = ${req.user.id})
        order by created_at desc
      `);
    } else {
      ({ rows } = await sql`
        select * from payment_requests_view
        where created_by = ${req.user.id} or responsible_user_id = ${req.user.id}
        order by created_at desc
      `);
    }
  } else {
    if (status && status !== "all") {
      ({ rows } = await sql`select * from payment_requests_view where status = ${status} order by created_at desc`);
    } else {
      ({ rows } = await sql`select * from payment_requests_view order by created_at desc`);
    }
  }
  res.status(200).json({ requests: rows });
}

async function createRequest(req, res) {
  if (req.user.role !== "site_manager") {
    return res.status(403).json({ error: "Только начальник объекта может создавать заявки" });
  }
  const { object_id, contractor_id, amount, purpose, responsible_user_id, invoice_photo_url } = req.body || {};
  if (!object_id || !contractor_id || !amount || !purpose || !responsible_user_id) {
    return res.status(400).json({ error: "Заполните все поля" });
  }

  const { rows } = await sql`
    insert into payment_requests
      (object_id, contractor_id, amount, purpose, responsible_user_id, created_by, invoice_photo_url, status)
    values
      (${object_id}, ${contractor_id}, ${amount}, ${purpose}, ${responsible_user_id}, ${req.user.id}, ${invoice_photo_url || null}, 'pending_director')
    returning id
  `;
  const requestId = rows[0].id;
  const { rows: viewRow } = await sql`select * from payment_requests_view where id = ${requestId}`;
  const full = viewRow[0];

  const { rows: directors } = await sql`select id from users where role = 'director'`;
  await notifyUsers(
    directors.map((d) => d.id),
    "Новая заявка на оплату",
    `Объект: ${full.object_name}\nПодрядчик: ${full.contractor_name}\nСумма: ${money(full.amount)}\nЗа что: ${full.purpose}\nОтветственный: ${full.responsible_name}`,
    requestId
  );

  res.status(200).json({ request: full });
}

async function decideRequest(req, res, id) {
  if (req.user.role !== "director") return res.status(403).json({ error: "Только руководитель может согласовывать заявки" });
  const { decision, comment } = req.body || {};
  if (!["approved", "rejected"].includes(decision)) return res.status(400).json({ error: "Неверное решение" });

  const { rows } = await sql`
    update payment_requests
    set status = ${decision}, decided_by = ${req.user.id}, decided_at = now(), decision_comment = ${comment || null}
    where id = ${id} and status = 'pending_director'
    returning id
  `;
  if (rows.length === 0) return res.status(400).json({ error: "Заявка уже обработана" });

  const { rows: viewRow } = await sql`select * from payment_requests_view where id = ${id}`;
  const full = viewRow[0];

  if (decision === "approved") {
    const { rows: accountants } = await sql`select id from users where role = 'accountant'`;
    await notifyUsers(
      accountants.map((a) => a.id),
      "Заявка одобрена, к оплате",
      `Объект: ${full.object_name}\nПодрядчик: ${full.contractor_name}\nСумма: ${money(full.amount)}\nЗа что: ${full.purpose}`,
      id
    );
  } else {
    await notifyUsers(
      [full.created_by],
      "Заявка отклонена",
      `Объект: ${full.object_name}\nПодрядчик: ${full.contractor_name}\nСумма: ${money(full.amount)}${comment ? `\nКомментарий: ${comment}` : ""}`,
      id
    );
  }

  res.status(200).json({ request: full });
}

async function payRequest(req, res, id) {
  if (req.user.role !== "accountant") return res.status(403).json({ error: "Только бухгалтер может отмечать оплату" });
  const { paid_amount, paid_at, required_documents, document_deadline } = req.body || {};
  if (!paid_amount || !paid_at || !required_documents?.length || !document_deadline) {
    return res.status(400).json({ error: "Заполните сумму, дату, документы и срок" });
  }

  const { rows } = await sql`
    update payment_requests
    set status = 'awaiting_documents', paid_at = ${paid_at}, paid_amount = ${paid_amount},
        required_documents = ${required_documents}, document_deadline = ${document_deadline}
    where id = ${id} and status = 'approved'
    returning id
  `;
  if (rows.length === 0) return res.status(400).json({ error: "Заявка не в статусе «Одобрена»" });

  const { rows: viewRow } = await sql`select * from payment_requests_view where id = ${id}`;
  const full = viewRow[0];

  await notifyUsers(
    [full.created_by, full.responsible_user_id],
    "Оплата произведена",
    `Объект: ${full.object_name}\nПодрядчик: ${full.contractor_name}\nСумма: ${money(full.paid_amount)}\nЗа что: ${full.purpose}\nНужны документы: ${(full.required_documents || []).join(", ")}\nПредоставить до: ${new Date(full.document_deadline).toLocaleDateString("ru-RU")}`,
    id
  );

  res.status(200).json({ request: full });
}

async function documentsReceived(req, res, id) {
  if (req.user.role !== "accountant") return res.status(403).json({ error: "Только бухгалтер может отмечать документы" });

  const { rows } = await sql`
    update payment_requests
    set documents_received = true, documents_received_at = now(), status = 'closed'
    where id = ${id} and status = 'awaiting_documents'
    returning id
  `;
  if (rows.length === 0) return res.status(400).json({ error: "Заявка не в статусе ожидания документов" });

  const { rows: viewRow } = await sql`select * from payment_requests_view where id = ${id}`;
  res.status(200).json({ request: viewRow[0] });
}

export default requireAuth(async (req, res) => {
  const { id, action } = req.query;

  try {
    if (req.method === "GET" && !id) return await listRequests(req, res);
    if (req.method === "POST" && !id) return await createRequest(req, res);
    if (req.method === "POST" && id && action === "decide") return await decideRequest(req, res, id);
    if (req.method === "POST" && id && action === "pay") return await payRequest(req, res, id);
    if (req.method === "POST" && id && action === "documents-received") return await documentsReceived(req, res, id);
    res.status(400).json({ error: "Неизвестное действие" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});
