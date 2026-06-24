# Dakshyam Innovations — Physical-Digital Integrated Vocational Training Labs

> **Empowering 21st-Century Technology Education & Hands-On Engineering Mastery**
> Aligned with India's National Education Policy (NEP 2020) Guidelines for Cognitive & Vocational Development.

---

## 🌐 Overview

**Dakshyam Innovations** is a premier engineering educational technology developer and vocational skill incubator. We specialize in **physical-digital integrated vocational training**, making modern embedded hardware, IoT systems, microcontrollers, and full-stack software architectures accessible directly to classrooms, primary school setups, and regional schools.

By bridging hardware diagnostics with robust web consoles, we replace abstract examinations with **verifiable, project-based capstone submissions**. Students configure physical kits (ESP32, motors, sensors), stream telemetry into high-performance web dashboards, and receive blockchain-traceable, industry-approved, and customizable completion certificates.

---

## 🎖️ NEP 2020 Alignment

Under the visionary guidelines of **India's National Education Policy (NEP 2020)**, Dakshyam Innovations eliminates technical literacy barriers:
*   **Computational Thinking**: Core focus on algorithmic logic, variables, and sensor feedback loops.
*   **Physical-Digital Integration**: Traditional textbook learning is replaced with hands-on labs where students physically wire, code, and deploy real systems.
*   **Regional Democratization**: Bringing modern engineering resources directly to Tier-2, Tier-3, and rural communities.
*   **Verifiable Portfolios**: Graduating students carry a portfolio of interactive, verifiably hosted projects instead of simple paper reports.

---

## 🚀 Key Functional Modules

### 1. Public Portal & Syllabus Explorer
*   **Dynamic Landing Page**: Showcases live equipment kits, promotional training camps, dynamic project galleries, and active vocational campaigns.
*   **Syllabus Navigator**: Interactive catalog detailing learning targets across IoT, Full-Stack development, Robotics, and Computer Literacy.
*   **Certificate Verification Engine**: Instant public validator. Anyone (recruiters, institutions) can enter a credential serial code to pull up the official certificate, review project telemetry, and download a print-ready certified PDF.

### 2. Student Command Center
*   **Progress Tracking**: Visual representations of active course milestones and performance metrics.
*   **Peer Groups**: Displays registered laboratory team assignments and collaborative project designs.
*   **Interactive Telemetry**: Direct access to simulated real-time data streams representing hardware state configurations.
*   **Verifiable Certificates**: Direct download portal for earned certificates.

### 3. Trainer Dashboard
*   **Group Builder**: Easily bundle students into laboratory teams for collaborative capstones.
*   **Assessment Matrix**: Assign and record grades directly into the active leaderboard.
*   **Syllabus Guides**: Interactive diagnostic handbooks for physical kits and embedded registers.
*   **Credential Issuance Panel**: Generate secure credential serial codes for student applications, complete with customizable logos, seal files, and partnership options.

### 4. Admin Central Command
*   **Analytics Hub**: Aggregated counts of students, trainers, courses, and active certificate records.
*   **Course Editor**: Create, modify, or retire vocational courses.
*   **Trainer Approvals**: Guarded gatekeeper flow ensuring trainer safety before accessing assessable student grids.
*   **Promotional Campaign Manager**: Schedule promotional banners and gallery snapshots dynamically.
*   **Master Certificate Dashboard**: Edit master credentials, bulk-generate certified records, and fully configure custom branding parameters (custom logos, authorizing seals, and training partners).

---

## ⚙️ Technical Architecture

*   **Runtime Environment**: React 18+ powered by **Vite** for optimized assets.
*   **Styling Engine**: **Tailwind CSS** utilizing high-contrast, professional, responsive UI palettes (Slate dark tones, neon cyan borders, and soft amber accents).
*   **Motion & Micro-interactions**: Smooth state transitions, staggered layout entrances, and micro-animations via `motion`.
*   **Database & Persistence Layer**: Scalable **offline-first local state synchronizer** (`DakshyamDatabase` API) wrapped with storage error catchers to guarantee complete runtime stability and performance across browsers.
*   **Icons & Assets**: Scalable vector icons from `lucide-react`.

---

## 👥 Founding Team & Board of Directors

Our mission is directed by a dedicated board of technology engineers, curriculum developers, and regional coordinators:

*   **Himanshu Patle** — *Co-Founder & Chief Director*
    *   Directs strategic planning & corporate relations, aligning industrial skills development targets with institutions and regional secondary setups.
*   **Ankush Nandagouli** — *Co-Founder & Chief Software Architect*
    *   Directs physical/digital telemetry integrations, cloud-hosted API backends, real-time WebSocket pipelines, and educational platforms.
*   **Anand Gautam** — *Co-Founder & Embedded Hardware Head*
    *   Directs circuit diagnostics, micro-controller register calibrations, multi-H-bridge motor kinetics, sensor logic systems, and diagnostic kits.
*   **Shikhar Bisen** — *Co-Founder & Laboratory Setup Lead*
    *   Manages physical laboratory logistics, equipment distributions, electrical integrity checks, and field-stage support frameworks.
*   **Kunal Raut** — *Co-Founder & Director of Operations*
    *   Directs vocational logistics, community outreach campaigns, local school partnerships, and ensures flawless distribution of laboratory teaching kits.
*   **Rohit Bhajipale** — *Co-Founder & Regional Coordinator*
    *   Leads educational outreach programs, public relations, regional technical campaigns, and on-site training sessions.

---

## 🧪 Quick Sandbox Testing Accounts

To explore the role-based dashboards immediately in the browser, use the following pre-seeded test credentials:

| Dashboard | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@dakshyam.com` | `123456` | Course Management, Approvals, Custom Branding |
| **Trainer** | `trainer@dakshyam.com` | `123456` | Group Building, Grading, Certificate Issuance |
| **Student** | `ayush@example.com` | `123456` | Progress Logs, Peer Groups, Certificate Downloads |

---

## 🛠️ Development & Production Build Instructions

### Installation
Install the necessary workspace dependencies:
```bash
npm install
```

### Run Local Development Server
Boot the high-performance local web server:
```bash
npm run dev
```

### Production Bundling
Compile and bundle the React code into optimized, minified static files within `/dist`:
```bash
npm run build
```

### Code Quality Checking
Run the strict TypeScript type checker and syntax validator:
```bash
npm run lint
```
