# FlatFlow – Roommate Chores & Bills Coordinator

FlatFlow helps roommates coordinate chores and split bills without 
the endless back-and-forth. Create a household, invite roommates via 
email or invite link, get fair chore assignments automatically, and 
track who owes whom.

## Live Demo
https://[your-app-name.vercel.app](https://flatflow-sooty.vercel.app/)

## Features
- **Auth** – Register and log in securely with email and password
- **Households** – Create a household and invite roommates via link or email
- **Chore Rotation** – Define chores and get auto-generated fair assignments
- **Mark Complete** – Mark your assigned chores as done
- **Expenses** – Log shared expenses split equally among all members
- **Balances** – See net balances and a minimal settle-up payment plan
- **Activity Feed** – See a live log of household actions

## Pages
- `/` – Landing page
- `/register` – Create an account
- `/login` – Sign in
- `/dashboard` – Your households and activity feed
- `/households/[id]/chores` – Chore assignments
- `/households/[id]/expenses` – Shared expenses
- `/households/[id]/balances` – Who owes whom

## Running Locally

### Prerequisites
- Node.js 18+
- A Supabase account (free) for the database
- A Resend account (free) for email invites

### Setup

**1. Clone the repo**

```
git clone https://github.com/YOURUSERNAME/flatflow.git
cd flatflow
```
**2. Install dependencies**
```
npm install
```
**3. Create a `.env.local` file in the root with:**
```
DATABASE_URL=your_supabase_connection_string
AUTH_SECRET=any_random_string_at_least_32_chars
AUTH_URL=http://localhost:3000
RESEND_API_KEY=your_resend_api_key
```
**4. Set up the database**
```
npx prisma migrate dev
```
**5. Run the app**
```
npm run dev
```
**6. Open http://localhost:3000**

## Environment Variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection String |
| `AUTH_SECRET` | Run `openssl rand -base64 32` in terminal |
| `AUTH_URL` | `http://localhost:3000` for local, your Vercel URL for production |
| `RESEND_API_KEY` | Resend dashboard → API Keys |

## Tech Stack
- **Frontend:** Next.js 16, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL via Prisma (hosted on Supabase)
- **Auth:** NextAuth.js v5
- **Email:** Resend
- **Deploy:** Vercel