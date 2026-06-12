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

**Expenza v3.0 Pro** is a high-performance, enterprise-grade personal finance and expense tracking application. Architected for maximum efficiency, this system solves real-world cash flow and expense management challenges with zero latency.

---

## ✨ Core Engine Capabilities

- **🧠 Dynamic Trend Intelligence:** Advanced mathematical engines continuously calculate daily and monthly financial trajectories. Features color-coded psychology indicators (🟢 Emerald for positive trends, 🔴 Rose for negative alerts).
- **📄 Automated PDF Reporting:** Instantly generate and export comprehensive transaction histories and financial summaries into professionally formatted PDF documents for offline auditing and sharing.
- **⚡ Zero-Failure Data Pipeline:** Robust PostgreSQL schema alignment guarantees flawless data hydration. Strict schema validation ensures a 0-error console environment during runtime.
- **🛡️ Bulletproof Cloud Security:** 100% serverless data persistence powered by Supabase. Implements strict Row Level Security (RLS) policies to guarantee absolute tenant data isolation.
- **🌗 Adaptive UI/UX Matrix:** Perfectly balanced Light/Dark mode matrices with high-contrast tactile interaction nodes. Seamless overflow scrolling for massive transaction logs.
- **🌍 Bilingual Architecture:** Built-in English and Tamil (தமிழ்) context switching, designed specifically for enhanced local accessibility and seamless user experience.
- **🧮 Smart Embedded Calculator:** Tactical mathematical keypad embedded directly into the transaction forms for instant evaluations.

---

## 📖 How to Use (User Guide)

**1. Dashboard Operations:**
- Click **Add Income** (Green button) to log daily revenue, salary, or credits.
- Click **Add Expense** (Red button) to log purchases, bills, or miscellaneous spending.
- View real-time "Today vs Yesterday" trends directly on the dashboard cards.

**2. Analytics & Reporting:**
- Navigate to the **Analytics** tab to view your Net Financial Status.
- Use the Date Filter (This Month, Last Month, Current Year) to dynamically calculate profit/loss margins.

**3. History & Export:**
- Go to the **History** tab to see a complete chronological ledger of all transactions.
- Click the **PDF** button at the top right to instantly download a formatted financial report for auditing.

**4. Settings & Localization:**
- Use the **Settings** tab to toggle between Light/Dark mode.
- Switch the app language between **English** and **Tamil (தமிழ்)** for better accessibility.

---

## 🛠️ Technical Ecosystem

| Component | Technology Stack |
| :--- | :--- |
| **Frontend Framework** | React.js, Custom Hooks (Context API) |
| **Styling & UI Elements** | Tailwind CSS, Lucide React (SVG Icons) |
| **Document Generation** | React-to-PDF / JSPDF |
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