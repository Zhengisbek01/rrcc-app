export const STATUS_LABELS = {
  created: "Создана",
  pending_director: "На согласовании у руководителя",
  approved: "Одобрена",
  rejected: "Отказана",
  paid: "Оплачена",
  awaiting_documents: "Ожидаются документы",
  closed: "Закрыта",
};

export const STATUS_COLORS = {
  created: "bg-gray-100 text-gray-700",
  pending_director: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-800",
  awaiting_documents: "bg-orange-100 text-orange-800",
  closed: "bg-green-100 text-green-800",
};

export const DOC_STATUS_LABELS = {
  documents_received: "Документы получены",
  documents_pending: "Документы ожидаются",
  documents_overdue: "Срок просрочен",
};

export const DOC_STATUS_COLORS = {
  documents_received: "bg-green-100 text-green-800",
  documents_pending: "bg-amber-100 text-amber-800",
  documents_overdue: "bg-red-100 text-red-700",
};

export const DOCUMENT_TYPES = [
  "Акт выполненных работ",
  "Счет-фактура",
  "Накладная",
  "Акт сверки",
];

export const ROLE_LABELS = {
  site_manager: "Начальник объекта",
  director: "Руководитель",
  accountant: "Бухгалтер",
};

export function formatMoney(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("ru-RU").format(n) + " ₸";
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}
