# OMS — Operations Management System (Enterprise ERP)

A centralized, scalable, production-ready **Operations Management System (OMS)** built with Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma ORM, and MySQL.

---

## 🌟 Project Overview

OMS provides a unified command center for corporate enterprise operations, including:

- **Authentication & Security**: JWT session management, bcrypt password hashing, server-side RBAC middleware protection.
- **Organization & Staffing**: Users, Employees Directory, Department Budgets, Admin Edit Modal, Deletion Blacklist.
- **HR & Attendance**: Punch In/Out Clock, Leave Application System, Formal HR Leave Letters, Monthly Payroll Approvals.
- **Daily Operations**: Mandatory EOD Work Submissions, Priority Matrix, Manager Review & Rating Desk.
- **Growth & Marketing**: Sales CRM Pipeline, Proposals & Quotation Generator, Marketing Ad Campaigns (ROAS), SEO Keyword Matrix.
- **Production Suite**: Dev Commit Tracker, Graphic Design Assets, Video Production Renders.
- **Treasury & Hardware**: IT Assets Inventory, Corporate Financial Ledger, 18% GST Tax Breakdown, Dynamic PDF Invoicing.
- **Resignation Desk**: Mandatory 15-Day Notice Calculator, Exit Confirmation Emails via Nodemailer SMTP.
- **Security & Governance**: Security Audit Event Log Ledger, SMTP Diagnostics Engine, Company Location Network.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16.2.12 (Turbopack, App Router)
- **UI & Styling**: React 19.2.4, TypeScript 5.x, Tailwind CSS v4, Material UI (`@mui/material`, `@mui/icons-material`), Lucide React
- **Database & ORM**: XAMPP MySQL / MariaDB, Prisma ORM v7.9.1 (`@prisma/client`, `@prisma/adapter-mariadb`)
- **Email Engine**: Real Nodemailer Transporter (`smtp.gmail.com:587`)
- **Auth**: `jsonwebtoken`, `bcryptjs`

---

## 📁 Folder Structure

```text
oms/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── auth/ (login, register, forgot-password)
│   ├── dashboard/ (Executive Command Center)
│   ├── employees/ (Staff Directory & Admin Edit Modal)
│   ├── departments/ (Department Budgets & Heads)
│   ├── attendance/ (Punch Clock & Log)
│   ├── leave/ (Leave Requests & Letter Generator)
│   ├── daily-work/ (Mandatory EOD & Manager Desk)
│   ├── projects/ (Roadmap & Dev Tracker)
│   ├── clients/ (Client Directory & Accounts)
│   ├── sales/ (Sales CRM & Quotation Generator)
│   ├── marketing/ (Ad Campaigns & ROAS)
│   ├── seo/ (SEO Keyword Ranking Matrix)
│   ├── development/ (Dev Commit Tracker Logs)
│   ├── design/ (Graphic Assets Suite)
│   ├── video-production/ (Video Shoots & 4K Renders)
│   ├── it-assets/ (Hardware Device Allocation)
│   ├── finance/ (Corporate Ledger & 18% GST Invoicing)
│   ├── payroll/ (Monthly Salary Approvals)
│   ├── interns/ (Intern Student Roster & Assignments)
│   ├── resignation/ (Notice Desk & 15-Day LWD)
│   ├── reports/ (Analytics & Exports)
│   ├── audit-logs/ (Security Audit Event Log Ledger)
│   ├── settings/ (Company Identity & SMTP Diagnostics)
│   └── api/ (Next.js Route Handlers for Prisma MySQL)
├── components/ (Sidebar, Header, AppLayout, ProfileAlertBanner, AICopilot, Icons, Modals)
├── lib/ (prisma.ts, authService.ts, rbac.ts, smtpTransporter.ts)
├── prisma/ (schema.prisma, seed.ts)
└── utils/ (employeeStore, leaveStore, workUpdateStore, companyStore, exportEngine)
```

---

## ⚙️ Environment Variables (`.env`)

```env
# XAMPP MySQL Database Connection
DATABASE_URL="mysql://root:@localhost:3306/oms"

# Real Nodemailer SMTP Email Credentials
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="hr.oms.enterprise@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_FROM_EMAIL="hr@oms.com"

# NextAuth / JWT Secret
NEXTAUTH_SECRET="super-secret-oms-jwt-token-key-2026"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Synchronize Database & Generate Prisma Client
```bash
npx prisma db push
npx prisma generate
```

### 3. Seed Production Development Data
```bash
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Development Credentials

| User Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@globalwebify.com` | `Admin@123456` |
| **HR Manager** | `priya.hr@globalwebify.com` | `Admin@123456` |
| **Developer** | `aditya.dev@globalwebify.com` | `Admin@123456` |

---

## 📦 Production Build Verification

To verify full static & dynamic route compilation:
```bash
npm run build
```
All **61 static & dynamic routes** compile cleanly with **0 TypeScript / ESLint errors**.