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

- **🧠 Dynamic Trend Intelligence:** Advanced mathematical engines continuously calculate daily and monthly financial trajectories.
- **📄 Automated PDF Reporting:** Instantly generate and export comprehensive transaction histories into professionally formatted PDF documents.
- **🛡️ Bulletproof Cloud Security:** 100% serverless data persistence powered by Supabase with Row Level Security (RLS).
- **🔐 Enterprise Auth Flow:** Secure Google OAuth integration with a robust **Password/PIN Reset Mechanism** to ensure account recovery via encrypted email tokens.
- **🌍 Bilingual Architecture:** Built-in English and Tamil (தமிழ்) context switching.
- **🧮 Smart Embedded Calculator:** Tactical mathematical keypad embedded directly into the transaction forms.

---

## 📖 How to Use (User Guide)

1. **Dashboard:** Log Income/Expenses instantly with real-time trend updates.
2. **Analytics:** Use the **Filter System** to visualize your financial trajectory by Date, Month, or Year. 
3. **History & Export:** Access chronological ledgers and click **PDF** to download your financial report.
4. **Account Recovery:** If you forget your Security PIN, navigate to **Settings > Sign Out > Forgot Password** to trigger a secure reset link to your registered email.

---

## 🛠️ Technical Ecosystem

| Component | Technology Stack |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Lucide React |
| **Authentication** | Supabase Auth (OAuth + Email Reset Flow) |
| **Backend & DB** | Supabase (PostgreSQL) |
| **Document Engine** | React-to-PDF / JSPDF |

---

## 🚦 Getting Started (Local Setup)

### 1. Clone & Install
```bash
git clone [https://github.com/Gowtham380/Expense-tracker-2.git](https://github.com/Gowtham380/Expense-tracker-2.git)
cd Expense-tracker-2
npm install


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