# BetSlipz

A bilingual (English and Arabic, RTL) website where you publish daily betting slips and sell access to them through **Regular** and **VIP** plans. Each slip shows its picks, odds, suggested stake and a **confidence %**.

- **Stack:** Next.js 16 + TypeScript + Tailwind, with Supabase (Postgres, Auth, Storage)
- **Security model:** the paywall is enforced by **Postgres Row-Level Security**, so the database only returns today's slips to users with an active plan of the right tier. Images and receipts are in private buckets and served through short-lived signed links.
- **Payments:** manual. Users pay via Whish, OMT, USDT or cash and submit a reference, then you approve it in Admin, which activates the plan. Plans expire on their own with no auto-charge.

---

## 1. First-time setup (about 10 minutes)

### a) Create the Supabase project (free tier is fine for development)
1. Go to https://supabase.com, sign up and click **New project**. Pick a region close to Lebanon (e.g. *Frankfurt*), and save the database password somewhere safe.
2. When it's ready, open **SQL Editor → New query**, paste the whole contents of [`supabase/setup.sql`](supabase/setup.sql) and click **Run**. It should end with "Success".
3. Open **Project Settings → API** and copy the values into `.env.local` (already created, next to this README):
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**secret**: never share it or put it in the browser)
4. **Authentication → URL Configuration**: set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the Redirect URLs.

### b) Run it
```bash
npm install
npm run seed:demo     # creates 4 demo accounts + sample slips; logins saved to .dev-accounts.txt
npm run dev           # open http://localhost:3000
```

Demo accounts (passwords in `.dev-accounts.txt`): `admin@`, `vip@`, `regular@`, `free@example.com`.

---

## 2. Daily workflow (admin)
1. **Admin → Slips → New slip**: choose Regular or VIP, add selections (match, market, pick, odds). Total odds are calculated automatically. Then set confidence %, stake, analysis (EN/AR), an optional image, an optional **BetArabia code**, and a publish time (now or scheduled).
2. When the matches finish, open the slip in **Admin → Slips** and set it to won, lost, void or partly won. It then appears in the public **Results** and the win-rate stats.
3. **Admin → Payments**: check the reference or receipt against your Whish/OMT/USDT account, then **Approve** (the plan activates instantly and stacks on top of any remaining time) or **Reject** with a reason.
4. **Admin → Users**: search, grant or revoke plans manually, ban, promote to admin.
5. **Admin → Settings**: plan prices, enable or disable plans, payment instructions (your Whish number, OMT name, USDT wallet).

## 3. Who sees what
| | Today's Regular slips | Today's VIP slips | Results (settled) |
|---|---|---|---|
| Visitor / free account | 🔒 locked preview | 🔒 locked preview | ✅ |
| Regular member | ✅ | 🔒 | ✅ |
| VIP member | ✅ | ✅ | ✅ |
| Admin | ✅ (+ scheduled) | ✅ (+ scheduled) | ✅ |

The locked previews show only the tier, number of selections and total odds. Picks and confidence never leave the database.

## 4. Customising
- **Brand name:** `NEXT_PUBLIC_SITE_NAME` in `.env.local` (and the logo in `components/Logo.tsx`)
- **Colors:** the tokens at the top of `app/globals.css`
- **Texts:** `lib/i18n/en.ts` and `lib/i18n/ar.ts`

## 5. BetArabia
BetArabia (Casino du Liban) has **no public API**, so the site can't place bets or load slips into users' accounts. Each slip has an "Open BetArabia" button and an optional booking-code field users can copy. If you get a partner or affiliate link from Casino du Liban, put it in `BETARABIA_URL` in `lib/config.ts`.

---

## 6. Going live (Supabase Pro + Vercel Pro)
1. **Supabase:** upgrade the project to **Pro** (daily backups, no pausing). Then:
   - Authentication → Providers → Email: keep **Confirm email** ON; enable **leaked-password protection**.
   - Authentication → URL Configuration: Site URL = `https://yourdomain.com`, Redirect URL = `https://yourdomain.com/auth/callback`.
   - Set up custom SMTP (e.g. Resend) so confirmation/reset emails come from your domain.
   - Turn on **MFA** for your own Supabase dashboard account.
   - Delete the demo users (Authentication → Users), or run against a fresh project.
2. **Vercel:** import the project from GitHub, choose the **Pro** plan, and add the same environment variables. Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`; the service-role key is **not needed** in Vercel. Add your custom domain.
3. Remove the "Test payment (dev)" method in Admin → Settings (it's also automatically hidden in production).
4. Before launch, confirm with a Lebanese lawyer that selling tips is OK (Casino du Liban holds the gambling monopoly) and check Vercel/Supabase acceptable-use terms.

### Security checklist (already built in)
- RLS on every table; admin actions go through `SECURITY DEFINER` functions that re-check admin
- Prices are set by the database, never trusted from the browser
- Users can't change their own role/ban status (column-level privileges)
- Private storage buckets + signed URLs; receipt uploads limited to the user's own folder
- Max 3 pending payments per user; Supabase Auth's built-in login rate limits
- Strict security headers (CSP, HSTS, frame-deny); auth email links use the configured site URL
- Audit log of slip changes, approvals, grants and bans
