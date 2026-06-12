# 🚀 EXPENZA v3.0 Pro | Advanced Financial Management System

<p align="left">
  <a href="https://expense-tracker-2-six.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/View_Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/Gowtham380/Expense-tracker-2" target="_blank">
    <img src="https://img.shields.io/badge/GitHub_Repo-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" />
  </a>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</p>

**Expenza v3.0 Pro** is a high-performance, enterprise-grade personal finance and retail shop expense tracking application. Architected for maximum efficiency, this system solves real-world cash flow, inventory, and expense management challenges with zero latency.

---

## ✨ Core Engine Capabilities

- **🧠 Dynamic Trend Intelligence:** Advanced mathematical engines continuously calculate daily and monthly financial trajectories. Features color-coded psychology indicators (🟢 Emerald for positive trends, 🔴 Rose for negative alerts).
- **⚡ Zero-Failure Data Pipeline:** Robust PostgreSQL schema alignment guarantees flawless data hydration. Strict schema validation ensures a 0-error console environment during runtime.
- **🛡️ Bulletproof Cloud Security:** 100% serverless data persistence powered by Supabase. Implements strict Row Level Security (RLS) policies to guarantee absolute tenant data isolation.
- **🌗 Adaptive UI/UX Matrix:** Perfectly balanced Light/Dark mode matrices with high-contrast tactile interaction nodes. Seamless overflow scrolling for massive transaction logs.
- **🌍 Bilingual Architecture:** Built-in English and Tamil (தமிழ்) context switching, designed specifically for enhanced local accessibility in tier-2/tier-3 retail shop environments.
- **🧮 Smart Embedded Calculator:** Tactical mathematical keypad embedded directly into the transaction forms for instant evaluations.

---

## 🛠️ Technical Ecosystem

| Component | Technology Stack |
| :--- | :--- |
| **Frontend Framework** | React.js, Custom Hooks (Context API) |
| **Styling & UI Elements** | Tailwind CSS, Lucide React (SVG Icons) |
| **Backend & Database** | Supabase (PostgreSQL), RESTful PostgREST APIs |
| **Authentication** | Supabase Auth (Session Management) |
| **Deployment Pipeline** | Vercel (CI/CD optimized) |

---

## 👨‍💻 Architectural Engineering Impact

* **State Optimization:** Re-engineered deeply nested prop-drilling into a clean, centralized `ExpenseContext` architecture.
* **Network Efficiency:** Eliminated phantom API calls and PostgREST 400 Bad Requests by strictly syncing React hydration payloads with the live database schema.
* **Component Reusability:** Modularized dashboard, analytics, and history feeds to share the same dynamic timeframe-filtering logic.

---

## 🚦 Getting Started (Local Setup)

Follow these precise steps to spin up the architecture on your local machine:

### 1. Clone the repository
```bash
git clone [https://github.com/Gowtham380/Expense-tracker-2.git](https://github.com/Gowtham380/Expense-tracker-2.git)
cd Expense-tracker-2

2. Install Dependencies
```bash
npm install
```

3. Configure Supabase
Create a `.env` file in your root directory and add your Supabase credentials:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the Server
```bash
npm run dev
```