-- Plans (USD). Change prices any time from Admin → Settings.
insert into public.plans (tier, duration, price_usd) values
  ('regular', 'week',    5),
  ('regular', 'month',  15),
  ('regular', 'quarter', 39),
  ('regular', 'year',  129),
  ('vip',     'week',   12),
  ('vip',     'month',  35),
  ('vip',     'quarter', 89),
  ('vip',     'year',  299)
on conflict (tier, duration) do update set price_usd = excluded.price_usd;

-- Payment instructions shown on the Subscribe page (placeholders; edit in Admin → Settings).
insert into public.settings (key, value) values
  ('payment_methods', '{
    "whish": {"enabled": true,  "details": "Send to Whish number +961 XX XXX XXX"},
    "omt":   {"enabled": true,  "details": "OMT transfer to: <your full name>, +961 XX XXX XXX"},
    "usdt":  {"enabled": true,  "details": "USDT (TRC20) wallet: <your wallet address>"},
    "cash":  {"enabled": false, "details": "Contact us on WhatsApp to arrange cash payment"},
    "mock":  {"enabled": true,  "details": "DEV ONLY: simulated payment for local testing"}
  }'::jsonb),
  ('contact', '{"whatsapp": "+961 XX XXX XXX", "email": "support@example.com"}'::jsonb)
on conflict (key) do nothing;
