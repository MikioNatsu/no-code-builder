import { PLANS } from "@ncb/core";

// Placeholder landing page. Login with Telegram and the dashboard arrive in Phase 1.
export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 16px" }}>
      <h1>Telegram botlarni kodsiz yarating</h1>
      <p>Создавайте Telegram-ботов без кода · Build Telegram bots without code</p>
      <p>
        Free: {PLANS.free.maxBots} bot, {PLANS.free.maxEndUsersPerBot} users
      </p>
    </main>
  );
}
