# Zyphora.ai

All-in-one AI business assistant — content creation, workflow automation, and social media growth.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes + Server Actions
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **AI:** Anthropic Claude API
- **Payments:** Stripe
- **Email:** Resend

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Enable Google OAuth in Supabase Auth settings (optional)

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (auth)/          Login & signup
  (dashboard)/     Protected app pages
  api/             API routes
components/        UI components
lib/               Supabase, Stripe, Anthropic, Resend clients
hooks/             Client-side data hooks
types/             TypeScript types
supabase/          Database migrations
```

## Features

- Landing page with pricing & FAQ
- Auth (email + Google OAuth)
- Onboarding wizard
- Dashboard with stats & credit meter
- AI Content Studio with live previews
- Content calendar
- Visual automation workflow builder
- AI chat assistant (streaming)
- Analytics with Recharts
- Integrations grid
- Settings (profile, billing, team, API keys)
- Stripe webhooks & n8n automation triggers

## Deployment

Deploy to [Vercel](https://vercel.com). Set all environment variables in the Vercel dashboard and configure the Stripe webhook endpoint to `/api/webhooks/stripe`.
