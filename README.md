# Logic Forge — Supabase E-commerce Store

A React + TypeScript storefront with Supabase Auth and a PostgreSQL database. The database is the source of truth for products, categories, inventory, customer profiles, orders, coupons, reviews, and wishlists. Cart contents remain in local storage for convenience.

## Features

- Store browsing, category filters, search, sorting, and product reviews
- Persistent cart, coupon validation, and transactional checkout with stock checks
- Supabase email/password registration and login
- Password changes for signed-in customers and admins
- Customer order history and per-customer wishlist
- Admin dashboard, product/category/inventory management, order status changes, coupon management, all-user account management, and review moderation
- PKR price display throughout the storefront and admin screens
- Row Level Security policies for public catalog data, private customer data, and admin operations

## Supabase setup

1. In the Supabase dashboard for your project, open **SQL Editor**.
2. Run the complete [`supabase/schema.sql`](./supabase/schema.sql) script. It creates the tables, indexes, triggers, Row Level Security policies, checkout and inventory functions, and initial catalog/coupons. For an existing project, run the focused [`supabase/account-deletion-migration.sql`](./supabase/account-deletion-migration.sql) to apply the order-history-preserving account-deletion relationship without re-running the full schema.
3. In **Project Settings → API**, copy the project URL and the publishable key.
4. Copy `.env.example` to `.env.local` and set:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

   The publishable key is intended for browser use. Never put a Supabase `service_role` key in this app.
5. Run `npm install` and `npm run dev`.
6. In **Authentication → URL Configuration**, add your development URL (usually `http://localhost:5173`) to the redirect URLs. Set the Site URL to your deployed URL before production.
7. Create a user from the app's `/register` page. If email confirmation is enabled in Supabase Auth, confirm the message before signing in.
8. To grant admin access, run the intended admin-specific script [`supabase/grant-logicforge-admin.sql`](./supabase/grant-logicforge-admin.sql) in SQL Editor, or use this pattern for another account:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'THE-AUTH-USER-UUID';
   ```

   Sign out and sign in again to reload the role.

9. Link the Supabase CLI to this project and deploy the protected account-deletion Edge Function:

   ```sh
   npx supabase link --project-ref your-project-ref
   npx supabase functions deploy admin-delete-user
   ```

   Keep JWT verification enabled (the default). The hosted Edge Function reads the project's `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` secrets. Never copy the service-role key into the app or its environment file.

The SQL script seeds the storefront catalog plus `WELCOME10` and `SHIP20`. It does not create shared demo accounts or set a default administrator. Prices are displayed in PKR without converting the existing numeric amounts; enter new product prices and fixed coupon discounts in PKR. The schema allows account deletion while retaining historical order details without a link to the deleted profile; reviews and wishlists are removed with the account.

## Local development

```bash
npm install
npm run dev
```

Use `npm run build` to type-check and create the production bundle. `npm run preview` serves that bundle locally.

## Vercel deployment

Deploy the repository root with the **Vite** framework preset, `npm run build` as the build command, and `dist` as the output directory. These are Vite's standard settings; the root [`vercel.json`](./vercel.json) also rewrites client-side routes to `index.html` while leaving `/api`, `/assets`, and file requests untouched. This allows routes such as `/order-confirmation/:orderId` to load on direct visits and refreshes.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel's project environment variables for Production (and Preview if needed), then redeploy. Use only the publishable key in this browser app; never set a Supabase service-role key as a `VITE_` variable.

## Security notes

- Supabase Auth handles password storage and sessions; passwords are never stored in the application tables.
- RLS prevents customers from reading other customers' profiles, orders, or wishlists.
- Checkout runs in a PostgreSQL function that checks current prices, coupon eligibility, and stock while locking products, then inserts the order and decrements inventory atomically.
- Admin access is based on the `profiles.role` value and should only be granted by a trusted project administrator.
- Account deletion uses a server-side Edge Function that verifies the caller's current Auth session and admin profile before using the service-role key. Admins cannot delete their own account.
- The publishable key is public by design. Database access is controlled by RLS; do not add a service-role key to client environment variables.
