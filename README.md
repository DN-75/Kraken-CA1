# 🌐 ExpertConnect

> Built by **Team Kraken** — A full-stack mentor marketplace where users discover, book, and consult verified industry professionals, powered by AI, real-time video, and secure payments.

---

## 📌 What Is This Project?

**ExpertConnect** is a platform built by **Team Kraken** that bridges the gap between knowledge-seekers and verified industry professionals. Think of it as a marketplace for 1-on-1 mentorship — users can browse profiles of vetted experts (web developers, career coaches, data scientists, marketers, etc.), book private video consultation sessions, and get career guidance tailored to their goals.

The platform features:

- 🔍 **Browse & Search** — Explore verified professionals across multiple categories
- 📅 **Session Booking** — Book 1-on-1 private consultations with experts
- 💳 **Secure Payments** — Integrated payment flow for session fees
- 🤖 **AI Chat Assistant** — Powered by Google Gemini to help users navigate the platform
- 🛡️ **Admin Panel** — Approve/reject professional applications and manage the platform
- 📧 **Email Notifications** — Transactional emails via Resend
- 🌐 **3D Animated UI** — Immersive homepage built with Three.js + GSAP animations
- ⭐ **Reviews & Ratings** — Users can leave reviews after sessions

---

## 🚀 Why This Project Matters

The professional mentorship space is fragmented. Most people don't have access to experienced mentors in their field, and finding trustworthy guidance is hard. **ExpertConnect solves this by:**

1. **Democratizing access to expertise** — anyone can connect with a verified professional from their home
2. **Ensuring quality** — every mentor is vetted (automatic + manual review) before being listed
3. **Removing friction** — an AI chatbot guides users, smart search filters narrow results, and booking is instant
4. **Enabling career growth** — 1-on-1 sessions mean advice is personalized to the individual's goals, not generic
5. **Building trust** — transparent ratings, reviews, and a verified badge system make the platform credible

This is especially impactful for students, early-career professionals, and career-switchers who lack professional networks.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database & Auth** | Supabase (PostgreSQL + Row Level Security) |
| **Styling** | Tailwind CSS v4 |
| **AI** | Google Gemini (`@google/genai`) |
| **3D / Animation** | Three.js + GSAP |
| **Email** | Resend |
| **Testing** | Playwright (E2E) |
| **Deployment** | Vercel |

---

## ⚙️ Prerequisites

Before running the project, make sure you have:

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Supabase** project — [Create one free](https://supabase.com/)
- A **Google Gemini API key** — [Get one here](https://aistudio.google.com/app/apikey)
- A **Resend API key** (for emails) — [Get one here](https://resend.com/)

---

## 🔧 Environment Setup

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Resend (Email)
RESEND_API_KEY=your_resend_api_key
```

> ⚠️ Never commit `.env.local` to version control — it's already in `.gitignore`.

---

## 📦 Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Kraken-CA1.git
cd Kraken-CA1

# 2. Install dependencies
npm install
```

---

## ▶️ Running the Project

### Development (recommended)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app hot-reloads as you edit files.

### Production Build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

---

## 🧪 Running Tests

This project uses **Playwright** for end-to-end testing.

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Open the Playwright interactive UI
npm run test:e2e:ui

# Debug a specific test
npm run test:e2e:debug
```

---

## 📁 Project Structure

```
Kraken-CA1/
├── app/                    # Next.js App Router pages & API routes
│   ├── page.tsx            # Homepage
│   ├── browse/             # Browse professionals page
│   ├── session/            # Session management
│   ├── payment/            # Payment flow
│   ├── professional/       # Public professional profiles
│   ├── register/ & login/  # Auth pages
│   ├── admin/              # Admin dashboard (protected)
│   └── api/                # API routes (bookings, chat, reviews, etc.)
├── components/             # Reusable React components
│   ├── ChatWidget.tsx      # AI-powered chat assistant
│   ├── Navbar.tsx          # Navigation bar
│   ├── ProfessionalCard.tsx# Professional listing card
│   ├── BookingSessionPopup.tsx
│   └── home/               # Homepage-specific components (3D, GSAP)
├── lib/                    # Supabase client, utility libraries
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── utils/                  # Helper functions
├── supabase/               # Database migrations & schema
├── middleware.ts            # Auth & role-based access control
└── tests/                  # Playwright E2E test files
```

---

## 🔐 Authentication & Roles

The platform has **3 user roles**:

| Role | Access |
|---|---|
| `user` | Browse professionals, book sessions, leave reviews |
| `professional` | Manage their profile, availability, and bookings |
| `admin` | Full access — approve professionals, manage platform |

Admin routes (`/admin/*`) are protected by middleware that validates the session token and role via Supabase.

---

## 🌍 Deployment

The easiest way to deploy is via **Vercel**:

1. Push your code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables in Vercel's dashboard
4. Deploy — Vercel auto-detects Next.js

---

## 📬 Contact

For support or inquiries:

- 📧 **Email:** support@expertconnect.com
- 📞 **Phone:** +94 74 121 4833
- 📍 **Location:** Colombo, Sri Lanka
