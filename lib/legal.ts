import type { Locale } from "@/lib/config";

// Terms of Service, Privacy Policy and Refund Policy, in English and Arabic.
// "{site}" is replaced with SITE_NAME. A string is a paragraph, a string[] is a bullet list.
// When you change a document, also change LEGAL_UPDATED.

export const LEGAL_UPDATED = "2026-11-05";
export const LEGAL_DOCS = ["terms", "privacy", "refunds"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

type Block = string | string[];
type Doc = { title: string; intro: Block[]; sections: { h: string; body: Block[] }[] };

const en: Record<LegalDoc, Doc> = {
  terms: {
    title: "Terms of Service",
    intro: [
      "These Terms of Service (the \"Terms\") apply to your use of {site} (the \"Site\") and the betting predictions we publish on it. By creating an account, buying a plan or using the Site, you agree to these Terms, our Privacy Policy and our Refund Policy. If you don't agree, don't use the Site.",
    ],
    sections: [
      {
        h: "1. Who we are",
        body: [
          "{site} publishes sports betting predictions for single games (\"predictions\"), ready-made combinations of picks (\"slips\") and analysis. We are not a bookmaker or a gambling operator: we don't accept bets, hold money for betting, place bets for anyone or pay out winnings. We are not linked to, endorsed by or paid by any bookmaker or betting platform.",
        ],
      },
      {
        h: "2. Who can use the Site",
        body: [
          [
            "You must be at least 18 years old, or the minimum legal age for betting where you live if that is higher.",
            "You are responsible for making sure that betting, and using a predictions service like ours, is legal where you live. Don't use the Site where it isn't.",
            "You may not use the Site if we have previously banned or closed your account.",
          ],
        ],
      },
      {
        h: "3. Our predictions are not guarantees",
        body: [
          [
            "Predictions and slips are our opinions, based on our own research. They are predictions, not promises of any result.",
            "The confidence percentage on a prediction or slip is our own estimate of how strong we think it is. It isn't the probability of winning and it isn't a guarantee.",
            "Suggested stakes are shown in \"units\" to show how strongly we rate a slip compared with others. They are not financial advice. You alone decide whether to bet and how much.",
            "Results, win rates and statistics on the Site describe predictions and slips that are already settled. Past results don't predict future results.",
            "Odds shown on a prediction or slip are the odds we saw when we published it. The odds your bookmaker offers you may be different.",
            "Every bet you place is your own decision, made with your own bookmaker, at your own risk. We are not responsible for any money you lose.",
            "After its games finish, we mark each prediction as won, lost or void, and each slip as won, lost, partly won or void.",
          ],
        ],
      },
      {
        h: "4. Your account",
        body: [
          [
            "Give accurate information when you sign up, and keep your password secret.",
            "An account is for one person only. Don't share it, sell it or let anyone else use it.",
            "An account can be logged in on one device at a time. When you log in on a new device, any other device logged in to your account is logged out.",
            "You are responsible for everything done through your account.",
            "Tell us straight away if you think someone else has used your account.",
          ],
        ],
      },
      {
        h: "5. Plans, slips and payment",
        body: [
          [
            "A sport plan gives access to the predictions for one sport: football, basketball, tennis or darts. A VIP plan gives access to the predictions for every sport and to every slip. You choose a period of 1 week, 1 month, 3 months or 1 year. Prices are shown in US dollars on the Site.",
            "A sport plan doesn't include slips. Without VIP, you can buy a single slip at the price shown on it. Buying a slip gives you access to that slip only.",
            "You pay with one of the methods shown on the Site, then submit your transfer reference. Your plan or slip opens when we confirm that we have received your payment, not when you send it.",
            "A slip can only be bought until its first game starts. We check payments by hand, so a slip you bought may open for you after some of its games have already started. This doesn't entitle you to a refund.",
            "If we can't confirm a payment, for example because the reference is wrong or the money hasn't arrived, we reject the request and nothing opens.",
            "If you buy a plan while you already have an active plan of the same kind (the same sport, or VIP), the new period starts when your current one ends.",
            "Plans don't renew automatically and we never charge you automatically. When a plan ends, your access to what it includes stops. Slips you bought stay open.",
            "You must send the exact amount shown. Any fees charged by your payment provider or the crypto network are yours to pay.",
            "We may change prices at any time. A price change doesn't affect a plan or slip you have already paid for.",
            "New accounts may be offered one slip for free, once (the \"welcome gift\"). It has no cash value, and we may change or end it at any time.",
          ],
        ],
      },
      {
        h: "6. No refunds",
        body: ["All payments are final. We don't give refunds, in full or in part, for any reason. Our Refund Policy explains this in detail."],
      },
      {
        h: "7. Our content is for your personal use only",
        body: [
          [
            "Everything you see as a member, including predictions, slips, picks, analysis and slip images, is for your own personal use.",
            "You may not copy, share, forward, publish, resell or post our predictions, slips or slip images, in full or in part, anywhere, including WhatsApp, Telegram and social media, whether for free or for money.",
            "Slip images shown to you carry your account's email address. If our content is shared, we may use it to identify the account it came from.",
            "If you share our content, we may close your account immediately, without a refund.",
          ],
        ],
      },
      {
        h: "8. What you must not do",
        body: [
          [
            "Try to get around the paywall, the one-device rule or any other protection on the Site.",
            "Use bots, scrapers or other automated tools to access or copy the Site.",
            "Create more than one account or use false details, for example to claim the welcome gift more than once.",
            "Attack or interfere with the Site, or try to access other people's accounts or our systems.",
            "Pay with money that isn't yours, or use the Site for anything illegal.",
          ],
        ],
      },
      {
        h: "9. Suspending and closing accounts",
        body: [
          [
            "We may suspend or close your account, without notice and without a refund, if we reasonably believe you have broken these Terms.",
            "You can ask us to close your account at any time. Closing your account doesn't entitle you to a refund for any time left on your plan.",
          ],
        ],
      },
      {
        h: "10. Responsible gambling",
        body: [
          [
            "Only bet money you can afford to lose, and never bet to win back losses.",
            "Betting can be addictive. If it is affecting your health, money or relationships, stop and get help, for example from BeGambleAware (begambleaware.org).",
            "If you want to stop, contact us and we will close your account.",
          ],
        ],
      },
      {
        h: "11. Our content",
        body: [
          "The Site and its content, including our slips, analysis, texts, design and logo, belong to us. A plan gives you a personal, non-transferable right to view this content while your plan is active, and no other rights.",
        ],
      },
      {
        h: "12. Services run by others",
        body: [
          "The Site shows or links to services run by others, such as the live scores on the Live scores page (SoccersAPI and Flashscore) and the payment providers you pay through. We don't control these services and aren't responsible for them, including whether they are available or accurate. Their own terms apply.",
        ],
      },
      {
        h: "13. Availability",
        body: [
          "We work to keep the Site running and accurate, but we don't promise that it will always be available or free of errors, or that slips will be published on every day, at a certain time or in a certain number. We may change, pause or stop any part of the Site.",
        ],
      },
      {
        h: "14. Limits on our liability",
        body: [
          "To the extent the law allows:",
          [
            "We are not liable for any loss that comes from your betting, including money lost on bets based on our slips.",
            "We are not liable for indirect losses, such as lost profits or lost opportunities.",
            "Our total liability to you for any claim is limited to the amount you paid us for the plan the claim relates to.",
          ],
          "Nothing in these Terms limits any liability that the law doesn't allow us to limit.",
        ],
      },
      {
        h: "15. Changes to these Terms",
        body: [
          "We may update these Terms. The date at the top of this page shows when they last changed. If you keep using the Site after we post an update, the updated Terms apply to you.",
        ],
      },
      {
        h: "16. Law and disputes",
        body: ["These Terms are governed by the laws of Lebanon. The courts of Beirut, Lebanon, have jurisdiction over any dispute about them."],
      },
      {
        h: "17. Language",
        body: ["These Terms are available in English and Arabic. If the two versions differ, the English version applies."],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    intro: ["This Privacy Policy explains what personal data {site} (the \"Site\") collects, why we collect it, who can see it and what you can do about it."],
    sections: [
      {
        h: "1. What we collect",
        body: [
          [
            "Account details: your email address, name and preferred language, and your phone (WhatsApp) number if you add it on your account page. Your password is stored only in a scrambled (hashed) form that no one, including us, can read.",
            "Payment details: the plan or slip you chose, the payment method, your transfer reference or transaction ID, the amount, the receipt you upload (if any), and whether we approved or rejected the payment. We never ask for or store card numbers, bank account numbers, or your login details for Whish, OMT or a crypto wallet.",
            "Plan details: your plans and their start and end dates, the slips you bought, whether you have used the welcome gift, and an identifier for your current login, which we use for the one-device rule.",
            "Technical data: when you log in, our login provider records details such as your IP address, browser, device type and the time. Our hosting provider records similar details, such as your IP address, when you visit the Site.",
            "Messages: if you contact us by email or WhatsApp, we keep the conversation.",
          ],
        ],
      },
      {
        h: "2. How we use it",
        body: [
          [
            "To create and run your account and log you in.",
            "To check your payments and open the plans and slips you paid for.",
            "To show you the predictions and slips your plan or purchases include.",
            "To enforce one person and one device per account, and to protect the Site from abuse and fraud.",
            "To show your email address on the slip images you view, so that shared content can be traced back to the account it came from.",
            "To reply to you and contact you about your account, plan or payments.",
            "To keep the records we need and that the law requires.",
          ],
          "We don't sell your personal data, and we don't use it for advertising.",
        ],
      },
      {
        h: "3. Who can see it",
        body: [
          [
            "Our team: the {site} administrators can see account and payment details in order to run the service.",
            "Our service providers: Supabase (database, logins, file storage and account emails such as confirmation and password reset) and Netlify (website hosting). They handle your data only to provide their services to us.",
            "Payment providers: Whish Money, OMT, crypto networks and any other method you pay with handle your payment under their own privacy policies. USDT transactions are recorded publicly on the blockchain.",
            "Live scores: the scoreboard on the Live scores page is provided by SoccersAPI inside our page. When you open that page, SoccersAPI receives your IP address and may set its own cookies. Flashscore links open Flashscore's own website.",
            "Authorities: when the law requires it, or when needed to protect our rights, our members or others.",
          ],
        ],
      },
      {
        h: "4. Where it is stored",
        body: ["Our service providers store data on servers that may be outside Lebanon, including in other countries with different data protection laws."],
      },
      {
        h: "5. Cookies",
        body: [
          "We use only these cookies, which the Site needs to work:",
          [
            "Login cookies (names starting with \"sb-\"): keep you logged in.",
            "\"locale\": remembers your language, for 1 year.",
            "\"age_ok\": remembers that you confirmed you are 18 or older, for 1 year.",
            "\"welcome_seen\": remembers that you have seen the welcome offer, for 1 year.",
          ],
          "We don't use analytics, advertising or tracking cookies. The SoccersAPI scoreboard may set its own cookies, as explained above.",
        ],
      },
      {
        h: "6. How long we keep it",
        body: [
          [
            "Account, plan and payment details: for as long as your account exists.",
            "When your account is closed, we delete its data, except anything we must keep by law.",
            "Technical logs are kept by our providers for a limited time, under their own rules.",
          ],
        ],
      },
      {
        h: "7. Security",
        body: [
          "We protect your data with encrypted connections (HTTPS), database rules that let each member see only their own data, private file storage with links that expire, and hashed passwords. No system is completely secure, so we can't promise that your data will never be accessed without permission. Keep your password secret and tell us if you think your account is at risk.",
        ],
      },
      {
        h: "8. Your rights",
        body: [
          "You can ask us to:",
          [
            "tell you what personal data we hold about you and give you a copy;",
            "correct it (you can also change your name, phone and language yourself on your account page);",
            "delete your account and its data;",
            "stop using your data for a particular purpose.",
          ],
          "To make a request, contact us using the details below. We may ask you to confirm your identity first. These rights include those you have under Lebanese Law No. 81 of 2018 on Electronic Transactions and Personal Data.",
        ],
      },
      {
        h: "9. People under 18",
        body: ["The Site is only for people aged 18 or older. We don't knowingly collect data from anyone younger. If we learn that an account belongs to someone under 18, we will close it and delete its data."],
      },
      {
        h: "10. Changes to this policy",
        body: ["We may update this policy. The date at the top of this page shows when it last changed."],
      },
    ],
  },

  refunds: {
    title: "Refund Policy",
    intro: ["This Refund Policy is part of our Terms of Service. Please read it before you pay."],
    sections: [
      {
        h: "1. All payments are final",
        body: ["All payments to {site} are final and non-refundable. We don't give refunds, in full or in part, for any reason."],
      },
      {
        h: "2. Examples",
        body: [
          "This includes, for example, when:",
          [
            "predictions or slips lose, or win less than you hoped;",
            "you don't use your plan or slip, or use only part of it;",
            "you change your mind after paying;",
            "you bought the wrong plan, sport or slip;",
            "a slip you bought opened after some of its games had started, because your payment was confirmed later;",
            "you can't use the Site because of your device, your internet connection or where you live;",
            "you were logged out because your account was logged in on another device;",
            "your account is suspended or closed for breaking our Terms, for example for sharing slips;",
            "you ask us to close your account before your plan ends;",
            "we change our prices after you pay;",
            "the Site is temporarily unavailable, or fewer predictions or slips are published on some days.",
          ],
        ],
      },
      {
        h: "3. Nothing to cancel",
        body: ["Plans don't renew and we never charge you automatically, so there is nothing to cancel. Your plan simply ends on its end date."],
      },
      {
        h: "4. Payments we can't confirm",
        body: [
          "A plan or slip opens only after we confirm that we have received your payment. If we can't confirm it, for example because the transfer reference is wrong or the money hasn't arrived, we reject the request and nothing opens. If you believe your payment did arrive, contact us with your receipt and we will check again.",
        ],
      },
      {
        h: "5. Your legal rights",
        body: ["Nothing in this policy takes away any right that the law gives you and that can't be given up by agreement."],
      },
      {
        h: "6. Your agreement",
        body: ["When you submit a payment, you confirm that you have read this policy and that you accept that your payment is non-refundable."],
      },
    ],
  },
};

const ar: Record<LegalDoc, Doc> = {
  terms: {
    title: "شروط الخدمة",
    intro: [
      "تنطبق شروط الخدمة هذه (\"الشروط\") على استخدامك لموقع {site} (\"الموقع\") وعلى توقعات المراهنات التي ننشرها عليه. بإنشائك حساباً أو شرائك باقة أو استخدامك للموقع، فإنك توافق على هذه الشروط وعلى سياسة الخصوصية وسياسة الاسترداد. إذا كنت لا توافق عليها، فلا تستخدم الموقع.",
    ],
    sections: [
      {
        h: "1. من نحن",
        body: [
          "ينشر {site} توقعات للمراهنات الرياضية لمباريات منفردة (\"التوقعات\")، ومجموعات جاهزة من التوقعات (\"القسائم\")، وتحليلات لها. نحن لسنا شركة مراهنات ولا مشغّلاً للمقامرة: لا نقبل الرهانات، ولا نحتفظ بأموال للمراهنة، ولا نراهن نيابةً عن أحد، ولا ندفع أي أرباح. ولا نرتبط بأي شركة أو منصة مراهنات، ولا نحظى بتأييدها، ولا نتلقى منها أي مقابل.",
        ],
      },
      {
        h: "2. من يحق له استخدام الموقع",
        body: [
          [
            "يجب أن يكون عمرك 18 سنة على الأقل، أو الحد الأدنى القانوني لسن المراهنة في مكان إقامتك إذا كان أعلى من ذلك.",
            "أنت مسؤول عن التأكد من أن المراهنة، واستخدام خدمة توقعات مثل خدمتنا، أمر قانوني في مكان إقامتك. لا تستخدم الموقع حيث لا يكون ذلك قانونياً.",
            "لا يحق لك استخدام الموقع إذا سبق أن حظرنا حسابك أو أغلقناه.",
          ],
        ],
      },
      {
        h: "3. توقعاتنا ليست ضمانات",
        body: [
          [
            "التوقعات والقسائم هي آراؤنا المبنية على أبحاثنا الخاصة. إنها توقعات، وليست وعوداً بأي نتيجة.",
            "نسبة الثقة على كل توقّع أو قسيمة هي تقديرنا الخاص لمدى قوته. وهي ليست احتمال الفوز، وليست ضماناً.",
            "يُعرض الرهان المقترح بـ\"الوحدات\" لبيان مدى قوة تقييمنا للقسيمة مقارنةً بغيرها. وهو ليس نصيحة مالية. أنت وحدك من يقرّر ما إذا كان سيراهن وبأي مبلغ.",
            "النتائج ونسب الفوز والإحصاءات على الموقع تخصّ توقعات وقسائم محسومة. النتائج السابقة لا تتنبأ بالنتائج المستقبلية.",
            "الأودز المعروضة على التوقّع أو القسيمة هي الأودز التي رأيناها عند نشره. وقد تختلف الأودز التي تقدّمها لك شركة المراهنات.",
            "كل رهان تضعه هو قرارك الشخصي، لدى شركة المراهنات التي تختارها، وعلى مسؤوليتك. لسنا مسؤولين عن أي أموال تخسرها.",
            "بعد انتهاء المباريات، نصنّف كل توقّع رابحاً أو خاسراً أو ملغى، وكل قسيمة رابحة أو خاسرة أو رابحة جزئياً أو ملغاة.",
          ],
        ],
      },
      {
        h: "4. حسابك",
        body: [
          [
            "قدّم معلومات صحيحة عند التسجيل، وحافظ على سرية كلمة المرور.",
            "الحساب لشخص واحد فقط. لا تشاركه ولا تبعه ولا تسمح لأي شخص آخر باستخدامه.",
            "يمكن تسجيل الدخول إلى الحساب على جهاز واحد في الوقت نفسه. عندما تسجّل دخولك على جهاز جديد، يُسجَّل خروج أي جهاز آخر مسجّل الدخول إلى حسابك.",
            "أنت مسؤول عن كل ما يتم من خلال حسابك.",
            "أبلغنا فوراً إذا كنت تعتقد أن شخصاً آخر استخدم حسابك.",
          ],
        ],
      },
      {
        h: "5. الباقات والقسائم والدفع",
        body: [
          [
            "باقة الرياضة تتيح الوصول إلى توقعات رياضة واحدة: كرة القدم أو كرة السلة أو التنس أو السهام. وباقة VIP تتيح الوصول إلى توقعات كل الرياضات وإلى كل القسائم. تختار مدة أسبوع أو شهر أو 3 أشهر أو سنة. تُعرض الأسعار على الموقع بالدولار الأميركي.",
            "لا تشمل باقة الرياضة القسائم. ومن دون VIP، يمكنك شراء قسيمة واحدة بالسعر المعروض عليها. وشراء القسيمة يمنحك الوصول إلى تلك القسيمة فقط.",
            "تدفع بإحدى الطرق المعروضة على الموقع، ثم ترسل رقم مرجع التحويل. تُفتح باقتك أو قسيمتك عندما نؤكّد أننا استلمنا دفعتك، وليس عند إرسالك لها.",
            "لا يمكن شراء القسيمة إلا قبل بدء مباراتها الأولى. نراجع الدفعات يدوياً، لذا قد تُفتح لك قسيمة اشتريتها بعد أن تكون بعض مبارياتها قد بدأت. ولا يمنحك ذلك الحق في استرداد أي مبلغ.",
            "إذا لم نتمكن من تأكيد دفعة ما، مثلاً لأن رقم المرجع خاطئ أو لأن المبلغ لم يصل، نرفض الطلب ولا يُفتح أي شيء.",
            "إذا اشتريت باقة وكانت لديك باقة فعّالة من النوع نفسه (الرياضة نفسها، أو VIP)، تبدأ المدة الجديدة عند انتهاء باقتك الحالية.",
            "لا تتجدد الباقات تلقائياً، ولا نقتطع منك أي مبلغ تلقائياً أبداً. عند انتهاء الباقة، يتوقف وصولك إلى ما تشمله. وتبقى القسائم التي اشتريتها مفتوحة.",
            "يجب أن ترسل المبلغ المعروض بالضبط. وأي رسوم تفرضها جهة الدفع أو شبكة العملات الرقمية تقع على عاتقك.",
            "يحق لنا تغيير الأسعار في أي وقت. ولا يؤثر تغيير السعر على باقة أو قسيمة سبق أن دفعت ثمنها.",
            "قد تُمنح الحسابات الجديدة قسيمة واحدة مجاناً، لمرة واحدة (\"الهدية الترحيبية\"). ليست لها أي قيمة نقدية، ويحق لنا تغييرها أو إيقافها في أي وقت.",
          ],
        ],
      },
      {
        h: "6. لا استرداد للمبالغ",
        body: ["جميع المدفوعات نهائية. لا نردّ أي مبلغ، كلياً أو جزئياً، لأي سبب كان. وتشرح سياسة الاسترداد ذلك بالتفصيل."],
      },
      {
        h: "7. محتوانا لاستخدامك الشخصي فقط",
        body: [
          [
            "كل ما تراه بصفتك مشتركاً، بما في ذلك التوقعات والقسائم والتحليلات وصور القسائم، هو لاستخدامك الشخصي فقط.",
            "لا يحق لك نسخ توقعاتنا أو قسائمنا أو صورها أو مشاركتها أو إعادة إرسالها أو نشرها أو إعادة بيعها، كلياً أو جزئياً، في أي مكان، بما في ذلك واتساب وتيليغرام ووسائل التواصل الاجتماعي، سواء مجاناً أو مقابل مال.",
            "تحمل صور القسائم المعروضة لك عنوان البريد الإلكتروني لحسابك. وإذا تمت مشاركة محتوانا، يحق لنا استخدامه لمعرفة الحساب الذي صدر منه.",
            "إذا شاركت محتوانا، يحق لنا إغلاق حسابك فوراً ومن دون استرداد أي مبلغ.",
          ],
        ],
      },
      {
        h: "8. ما يُمنع عليك فعله",
        body: [
          [
            "محاولة تجاوز نظام الاشتراك أو قاعدة الجهاز الواحد أو أي حماية أخرى على الموقع.",
            "استخدام برامج آلية أو أدوات سحب البيانات أو أي أدوات آلية أخرى للوصول إلى الموقع أو نسخه.",
            "إنشاء أكثر من حساب أو استخدام بيانات غير صحيحة، مثلاً للحصول على الهدية الترحيبية أكثر من مرة.",
            "مهاجمة الموقع أو التدخل في عمله، أو محاولة الوصول إلى حسابات الآخرين أو إلى أنظمتنا.",
            "الدفع بأموال ليست لك، أو استخدام الموقع لأي غرض غير قانوني.",
          ],
        ],
      },
      {
        h: "9. تعليق الحسابات وإغلاقها",
        body: [
          [
            "يحق لنا تعليق حسابك أو إغلاقه، من دون إشعار ومن دون استرداد أي مبلغ، إذا كان لدينا سبب معقول للاعتقاد بأنك خالفت هذه الشروط.",
            "يمكنك أن تطلب منا إغلاق حسابك في أي وقت. ولا يمنحك إغلاق الحساب الحق في استرداد أي مبلغ عن المدة المتبقية من باقتك.",
          ],
        ],
      },
      {
        h: "10. المراهنة المسؤولة",
        body: [
          [
            "لا تراهن إلا بمال يمكنك تحمّل خسارته، ولا تراهن أبداً لتعويض خسائرك.",
            "قد تسبّب المراهنة الإدمان. إذا كانت تؤثر على صحتك أو أموالك أو علاقاتك، توقّف واطلب المساعدة، مثلاً من BeGambleAware (begambleaware.org).",
            "إذا أردت التوقف، تواصل معنا وسنغلق حسابك.",
          ],
        ],
      },
      {
        h: "11. محتوانا",
        body: [
          "الموقع ومحتواه، بما في ذلك القسائم والتحليلات والنصوص والتصميم والشعار، ملك لنا. تمنحك الباقة حقاً شخصياً غير قابل للتحويل في مشاهدة هذا المحتوى طوال مدة باقتك، ولا تمنحك أي حقوق أخرى.",
        ],
      },
      {
        h: "12. خدمات يديرها آخرون",
        body: [
          "يعرض الموقع خدمات يديرها آخرون أو يضع روابط إليها، مثل النتائج المباشرة في صفحة النتائج المباشرة (SoccersAPI وFlashscore) وجهات الدفع التي تدفع من خلالها. نحن لا نتحكم بهذه الخدمات ولسنا مسؤولين عنها، بما في ذلك مدى توفرها أو دقتها. وتنطبق عليها شروطها الخاصة.",
        ],
      },
      {
        h: "13. توفّر الموقع",
        body: [
          "نعمل على إبقاء الموقع متاحاً ودقيقاً، لكننا لا نتعهد بأن يكون متاحاً دائماً أو خالياً من الأخطاء، ولا بأن تُنشر القسائم كل يوم أو في وقت معيّن أو بعدد معيّن. ويحق لنا تغيير أي جزء من الموقع أو إيقافه مؤقتاً أو نهائياً.",
        ],
      },
      {
        h: "14. حدود مسؤوليتنا",
        body: [
          "إلى الحد الذي يسمح به القانون:",
          [
            "لسنا مسؤولين عن أي خسارة ناتجة عن مراهناتك، بما في ذلك الأموال التي تخسرها في رهانات مبنية على قسائمنا.",
            "لسنا مسؤولين عن الخسائر غير المباشرة، مثل الأرباح أو الفرص الضائعة.",
            "لا تتجاوز مسؤوليتنا الإجمالية تجاهك عن أي مطالبة المبلغ الذي دفعته لنا مقابل الباقة التي تتعلق بها المطالبة.",
          ],
          "لا يحدّ أي شيء في هذه الشروط من أي مسؤولية لا يسمح القانون بالحدّ منها.",
        ],
      },
      {
        h: "15. تعديل هذه الشروط",
        body: [
          "يحق لنا تعديل هذه الشروط. يبيّن التاريخ في أعلى هذه الصفحة آخر مرة عُدّلت فيها. وإذا واصلت استخدام الموقع بعد نشر التعديل، تنطبق عليك الشروط المعدّلة.",
        ],
      },
      {
        h: "16. القانون والنزاعات",
        body: ["تخضع هذه الشروط لقوانين لبنان. وتختص محاكم بيروت، لبنان، بالنظر في أي نزاع يتعلق بها."],
      },
      {
        h: "17. اللغة",
        body: ["هذه الشروط متوفرة باللغتين الإنجليزية والعربية. وفي حال وجود اختلاف بين النسختين، تُعتمد النسخة الإنجليزية."],
      },
    ],
  },

  privacy: {
    title: "سياسة الخصوصية",
    intro: ["توضح سياسة الخصوصية هذه البيانات الشخصية التي يجمعها موقع {site} (\"الموقع\")، وسبب جمعها، ومن يمكنه الاطلاع عليها، وما يمكنك فعله بشأنها."],
    sections: [
      {
        h: "1. ما نجمعه",
        body: [
          [
            "بيانات الحساب: بريدك الإلكتروني واسمك ولغتك المفضّلة، ورقم هاتفك (واتساب) إذا أضفته في صفحة حسابك. تُحفظ كلمة المرور فقط بصيغة مشفّرة (مُجزّأة) لا يستطيع أحد قراءتها، ولا حتى نحن.",
            "بيانات الدفع: الباقة أو القسيمة التي اخترتها، وطريقة الدفع، ورقم مرجع التحويل أو معرّف المعاملة، والمبلغ، والإيصال الذي ترفعه (إن وُجد)، وما إذا كنا قد قبلنا الدفعة أو رفضناها. لا نطلب أبداً أرقام البطاقات أو الحسابات المصرفية، ولا بيانات دخولك إلى Whish أو OMT أو محفظة العملات الرقمية، ولا نحفظها.",
            "بيانات الباقة: باقاتك وتواريخ بدئها وانتهائها، والقسائم التي اشتريتها، وما إذا كنت قد استخدمت الهدية الترحيبية، ومعرّف لجلسة دخولك الحالية نستخدمه لتطبيق قاعدة الجهاز الواحد.",
            "البيانات التقنية: عند تسجيل الدخول، تسجّل الجهة التي تدير تسجيل الدخول لدينا تفاصيل مثل عنوان IP والمتصفح ونوع الجهاز والوقت. وتسجّل جهة استضافة الموقع تفاصيل مشابهة، مثل عنوان IP، عند زيارتك للموقع.",
            "الرسائل: إذا تواصلت معنا عبر البريد الإلكتروني أو واتساب، نحتفظ بالمحادثة.",
          ],
        ],
      },
      {
        h: "2. كيف نستخدمها",
        body: [
          [
            "لإنشاء حسابك وإدارته وتسجيل دخولك.",
            "للتحقق من دفعاتك وفتح الباقات والقسائم التي دفعت ثمنها.",
            "لعرض التوقعات والقسائم التي تشملها باقتك أو مشترياتك.",
            "لتطبيق قاعدة الشخص الواحد والجهاز الواحد لكل حساب، ولحماية الموقع من سوء الاستخدام والاحتيال.",
            "لإظهار بريدك الإلكتروني على صور القسائم التي تشاهدها، بحيث يمكن معرفة الحساب الذي صدر منه أي محتوى تتم مشاركته.",
            "للرد عليك والتواصل معك بشأن حسابك أو باقتك أو دفعاتك.",
            "للاحتفاظ بالسجلات التي نحتاجها والتي يفرضها القانون.",
          ],
          "لا نبيع بياناتك الشخصية، ولا نستخدمها للإعلانات.",
        ],
      },
      {
        h: "3. من يمكنه الاطلاع عليها",
        body: [
          [
            "فريقنا: يمكن لمديري {site} الاطلاع على بيانات الحسابات والدفعات لتشغيل الخدمة.",
            "مزوّدو الخدمات لدينا: Supabase (قاعدة البيانات وتسجيل الدخول وتخزين الملفات ورسائل الحساب مثل تأكيد البريد وإعادة تعيين كلمة المرور) وNetlify (استضافة الموقع). لا يتعاملون مع بياناتك إلا لتقديم خدماتهم لنا.",
            "جهات الدفع: تتعامل Whish Money وOMT وشبكات العملات الرقمية وأي طريقة أخرى تدفع بها مع دفعتك وفق سياسات الخصوصية الخاصة بها. وتُسجَّل معاملات USDT علناً على سلسلة الكتل (البلوك تشين).",
            "النتائج المباشرة: لوحة النتائج في صفحة النتائج المباشرة تقدّمها SoccersAPI داخل صفحتنا. عند فتح تلك الصفحة، تتلقى SoccersAPI عنوان IP الخاص بك وقد تضع ملفات تعريف ارتباط خاصة بها. وتفتح روابط Flashscore موقع Flashscore نفسه.",
            "السلطات: عندما يفرض القانون ذلك، أو عند الحاجة لحماية حقوقنا أو حقوق مشتركينا أو غيرهم.",
          ],
        ],
      },
      {
        h: "4. أين تُخزَّن",
        body: ["يخزّن مزوّدو الخدمات لدينا البيانات على خوادم قد تكون خارج لبنان، بما في ذلك في دول لديها قوانين مختلفة لحماية البيانات."],
      },
      {
        h: "5. ملفات تعريف الارتباط (الكوكيز)",
        body: [
          "لا نستخدم إلا ملفات تعريف الارتباط التالية، التي يحتاجها الموقع ليعمل:",
          [
            // Invisible isolate marks (U+2066, U+2069) keep each English cookie name in left-to-right order inside the Arabic sentence.
            "ملفات تسجيل الدخول (تبدأ أسماؤها بـ ⁦sb-⁩): تُبقيك مسجّل الدخول.",
            "⁦locale⁩: تتذكّر لغتك، لمدة سنة.",
            "⁦age_ok⁩: تتذكّر أنك أكّدت أن عمرك 18 سنة أو أكثر، لمدة سنة.",
            "⁦welcome_seen⁩: تتذكّر أنك رأيت العرض الترحيبي، لمدة سنة.",
          ],
          "لا نستخدم ملفات تعريف ارتباط للتحليلات أو الإعلانات أو التتبّع. وقد تضع لوحة نتائج SoccersAPI ملفات خاصة بها، كما هو موضّح أعلاه.",
        ],
      },
      {
        h: "6. مدة الاحتفاظ بها",
        body: [
          [
            "بيانات الحساب والباقات والدفعات: طوال مدة وجود حسابك.",
            "عند إغلاق حسابك، نحذف بياناته، باستثناء ما يفرض القانون الاحتفاظ به.",
            "يحتفظ مزوّدو الخدمات بالسجلات التقنية لمدة محدودة وفق قواعدهم الخاصة.",
          ],
        ],
      },
      {
        h: "7. الأمان",
        body: [
          "نحمي بياناتك عبر اتصالات مشفّرة (HTTPS)، وقواعد في قاعدة البيانات لا تسمح لكل مشترك إلا برؤية بياناته، وتخزين خاص للملفات بروابط تنتهي صلاحيتها، وكلمات مرور مشفّرة. لا يوجد نظام آمن بالكامل، لذا لا يمكننا أن نعد بعدم الوصول إلى بياناتك من دون إذن أبداً. حافظ على سرية كلمة المرور وأبلغنا إذا كنت تعتقد أن حسابك في خطر.",
        ],
      },
      {
        h: "8. حقوقك",
        body: [
          "يمكنك أن تطلب منا:",
          [
            "إعلامك بالبيانات الشخصية التي نحتفظ بها عنك وتزويدك بنسخة منها؛",
            "تصحيحها (ويمكنك أيضاً تغيير اسمك وهاتفك ولغتك بنفسك من صفحة حسابك)؛",
            "حذف حسابك وبياناته؛",
            "التوقف عن استخدام بياناتك لغرض معيّن.",
          ],
          "لتقديم طلب، تواصل معنا عبر البيانات أدناه. قد نطلب منك أولاً تأكيد هويتك. وتشمل هذه الحقوق ما يمنحك إياه القانون اللبناني رقم 81 لعام 2018 المتعلق بالمعاملات الإلكترونية والبيانات ذات الطابع الشخصي.",
        ],
      },
      {
        h: "9. من هم دون 18 سنة",
        body: ["الموقع مخصّص فقط لمن بلغوا 18 سنة أو أكثر. لا نجمع عن قصد بيانات أي شخص أصغر سناً. وإذا علمنا أن حساباً يعود لشخص دون 18 سنة، سنغلقه ونحذف بياناته."],
      },
      {
        h: "10. تعديل هذه السياسة",
        body: ["يحق لنا تعديل هذه السياسة. يبيّن التاريخ في أعلى هذه الصفحة آخر مرة عُدّلت فيها."],
      },
    ],
  },

  refunds: {
    title: "سياسة الاسترداد",
    intro: ["سياسة الاسترداد هذه جزء من شروط الخدمة. يُرجى قراءتها قبل الدفع."],
    sections: [
      {
        h: "1. جميع المدفوعات نهائية",
        body: ["جميع المدفوعات إلى {site} نهائية وغير قابلة للاسترداد. لا نردّ أي مبلغ، كلياً أو جزئياً، لأي سبب كان."],
      },
      {
        h: "2. أمثلة",
        body: [
          "ويشمل ذلك مثلاً الحالات التالية:",
          [
            "خسارة التوقعات أو القسائم، أو ربحها أقل مما كنت تأمل؛",
            "عدم استخدامك لباقتك أو قسيمتك، أو استخدامك لجزء منها فقط؛",
            "تغيير رأيك بعد الدفع؛",
            "شراؤك الباقة أو الرياضة أو القسيمة الخطأ؛",
            "فتح قسيمة اشتريتها بعد أن بدأت بعض مبارياتها، لأن دفعتك أُكّدت لاحقاً؛",
            "عدم قدرتك على استخدام الموقع بسبب جهازك أو اتصالك بالإنترنت أو مكان إقامتك؛",
            "تسجيل خروجك لأن حسابك سُجّل دخوله على جهاز آخر؛",
            "تعليق حسابك أو إغلاقه بسبب مخالفة الشروط، مثلاً بسبب مشاركة القسائم؛",
            "طلبك إغلاق حسابك قبل انتهاء باقتك؛",
            "تغيير أسعارنا بعد أن تدفع؛",
            "عدم توفّر الموقع مؤقتاً، أو نشر عدد أقل من التوقعات أو القسائم في بعض الأيام.",
          ],
        ],
      },
      {
        h: "3. لا شيء لإلغائه",
        body: ["لا تتجدد الباقات ولا نقتطع منك أي مبلغ تلقائياً أبداً، لذا لا يوجد ما يُلغى. تنتهي باقتك ببساطة في تاريخ انتهائها."],
      },
      {
        h: "4. الدفعات التي لا يمكننا تأكيدها",
        body: [
          "لا تُفتح الباقة أو القسيمة إلا بعد أن نؤكّد أننا استلمنا دفعتك. إذا لم نتمكن من تأكيدها، مثلاً لأن رقم مرجع التحويل خاطئ أو لأن المبلغ لم يصل، نرفض الطلب ولا يُفتح أي شيء. وإذا كنت تعتقد أن دفعتك وصلت فعلاً، تواصل معنا مع الإيصال وسنتحقق مجدداً.",
        ],
      },
      {
        h: "5. حقوقك القانونية",
        body: ["لا يُسقط أي شيء في هذه السياسة أي حق يمنحك إياه القانون ولا يجوز التنازل عنه بالاتفاق."],
      },
      {
        h: "6. موافقتك",
        body: ["عند إرسال دفعة، فإنك تؤكّد أنك قرأت هذه السياسة وتقبل بأن دفعتك غير قابلة للاسترداد."],
      },
    ],
  },
};

export function legalDoc(locale: Locale, doc: LegalDoc): Doc {
  return (locale === "ar" ? ar : en)[doc];
}
