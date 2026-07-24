import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../lib/statuses";

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "your_bot";

export default function Profile() {
  const { profile, role, refreshProfile } = useAuth();

  const linkUrl = `https://t.me/${BOT_USERNAME}?start=${profile?.telegram_link_code}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-24 space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-1">
        <div className="text-sm text-gray-500">ФИО</div>
        <div className="font-medium text-gray-900">{profile?.full_name}</div>
        <div className="text-sm text-gray-500 pt-2">Роль</div>
        <div className="font-medium text-gray-900">{ROLE_LABELS[role]}</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <div className="font-medium text-gray-900 text-sm">Уведомления в Telegram</div>
        {profile?.telegram_chat_id ? (
          <p className="text-sm text-emerald-600">✓ Telegram привязан, уведомления приходят в бот</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Привяжите Telegram, чтобы получать уведомления об оплатах и еженедельный отчёт.
            </p>
            <a
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
              onClick={() => setTimeout(refreshProfile, 4000)}
            >
              Открыть бота и привязать
            </a>
          </>
        )}
      </div>
    </div>
  );
}
