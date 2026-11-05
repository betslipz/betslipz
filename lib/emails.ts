import "server-only";
import { SITE_NAME, type Locale } from "@/lib/config";
import { fmtDate } from "@/lib/format";
import { layout, siteUrl, type Email } from "@/lib/email";

// The emails the site sends, in English and Arabic. "{site}" is replaced with SITE_NAME.
const copy = {
  en: {
    footer: "18+ only. Our predictions and slips are opinions, not guarantees. Gamble responsibly. You're getting this email because you have an account at {site}.",
    welcome: {
      subject: "Welcome to {site}",
      title: "Welcome, {name}!",
      body: [
        "Your account is ready. Here's what you can do:",
        "• Predictions: our pick for each football, basketball, tennis and darts game, with the odds and a confidence score. Subscribe to one sport, or go VIP for every sport.",
        "• Slips: ready-made slips. Buy any slip on its own, or see them all with VIP.",
        "As a welcome gift, you can open one slip for free, once.",
      ],
      button: "See today's predictions",
    },
    reset: {
      subject: "Reset your {site} password",
      title: "Reset your password",
      body: [
        "We got a request to reset the password for your account. Tap the button below to choose a new one. The link works once and expires in 1 hour.",
        "If you didn't ask for this, you can ignore this email: your password stays the same.",
      ],
      button: "Choose a new password",
    },
    expiry: {
      subject: "Your {plan} plan ends on {date}",
      title: "Your plan ends soon",
      body: [
        "Hi {name}, your {plan} plan ends on {date}.",
        "Renew before then to keep seeing every pick without a break. If you renew now, the new period starts when the current one ends, so you don't lose any days.",
        "Plans never renew automatically, so nothing happens unless you choose to renew.",
      ],
      button: "Renew my plan",
    },
  },
  ar: {
    footer: "للبالغين 18 سنة وما فوق فقط. توقعاتنا وقسائمنا آراء وليست ضمانات. راهن بمسؤولية. وصلك هذا البريد لأن لديك حساباً على {site}.",
    welcome: {
      subject: "أهلاً بك في {site}",
      title: "أهلاً بك يا {name}!",
      body: [
        "حسابك جاهز. إليك ما يمكنك فعله:",
        "• التوقعات: توقّعنا لكل مباراة في كرة القدم وكرة السلة والتنس والسهام، مع الأودز ونسبة الثقة. اشترك في رياضة واحدة، أو اختر VIP لكل الرياضات.",
        "• القسائم: قسائم جاهزة. اشترِ أي قسيمة وحدها، أو شاهدها كلها مع VIP.",
        "وكهدية ترحيبية، يمكنك فتح قسيمة واحدة مجاناً، لمرة واحدة.",
      ],
      button: "شاهد توقعات اليوم",
    },
    reset: {
      subject: "إعادة تعيين كلمة المرور على {site}",
      title: "إعادة تعيين كلمة المرور",
      body: [
        "وصلنا طلب لإعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه لاختيار كلمة مرور جديدة. يعمل الرابط مرة واحدة وتنتهي صلاحيته خلال ساعة.",
        "إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد: تبقى كلمة المرور كما هي.",
      ],
      button: "اختر كلمة مرور جديدة",
    },
    expiry: {
      subject: "تنتهي باقة {plan} في {date}",
      title: "باقتك تنتهي قريباً",
      body: [
        "مرحباً {name}، تنتهي باقة {plan} الخاصة بك في {date}.",
        "جدّدها قبل ذلك لتواصل رؤية كل التوقعات من دون انقطاع. إذا جدّدت الآن، تبدأ المدة الجديدة عند انتهاء المدة الحالية، فلا تخسر أي يوم.",
        "لا تتجدد الباقات تلقائياً أبداً، لذا لا يحدث شيء إلا إذا اخترت التجديد.",
      ],
      button: "جدّد باقتي",
    },
  },
};

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
type Kind = "welcome" | "reset" | "expiry";

function build(kind: Kind, locale: Locale, vars: Record<string, string>, url: string): Omit<Email, "to"> {
  const c = copy[locale];
  const v = { site: SITE_NAME, ...vars };
  const { html, text } = layout({
    locale,
    title: fill(c[kind].title, v),
    paragraphs: c[kind].body.map((p) => fill(p, v)),
    button: { label: c[kind].button, url },
    footer: fill(c.footer, v),
  });
  return { subject: fill(c[kind].subject, v), html, text };
}

export const welcomeEmail = (locale: Locale, name: string) =>
  build("welcome", locale, { name: name || (locale === "ar" ? "صديقنا" : "there") }, `${siteUrl()}/${locale}/predictions`);

export const resetEmail = (locale: Locale, url: string) => build("reset", locale, {}, url);

export const expiryEmail = (locale: Locale, name: string, plan: string, endsAt: string, renewUrl: string) =>
  build("expiry", locale, { name: name || (locale === "ar" ? "صديقنا" : "there"), plan, date: fmtDate(endsAt, locale, false) }, renewUrl);

// For the admin only, so English. Everything needed to find the transfer and approve it.
export function adminPaymentEmail(p: {
  buyer: string;
  buyerName: string | null;
  phone: string | null;
  item: string;
  amount: string;
  method: string;
  reference: string;
  hasReceipt: boolean;
  warning?: string;
}): Omit<Email, "to"> {
  const { html, text } = layout({
    locale: "en",
    title: `New payment to review: ${p.amount}`,
    paragraphs: [
      `${p.buyerName ? `${p.buyerName} (${p.buyer})` : p.buyer}${p.phone ? ` · ${p.phone}` : ""} says they paid.`,
      `For: ${p.item}`,
      `Amount: ${p.amount} by ${p.method}`,
      `Transfer reference: ${p.reference}`,
      p.hasReceipt ? "A receipt screenshot is attached to the payment on the site." : "No receipt screenshot was uploaded.",
      ...(p.warning ? [`⚠ ${p.warning}`] : []),
      "Check that the money arrived, then approve or reject it.",
    ],
    button: { label: "Review payments", url: `${siteUrl()}/en/admin/payments` },
    footer: `${SITE_NAME} admin notification.`,
  });
  return { subject: `💰 New payment: ${p.amount} · ${p.item}`, html, text };
}
