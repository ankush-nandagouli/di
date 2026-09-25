# Dakshyam Innovations — Vocational Technology Platforms
> **Empowering Hands-On Engineering, Embedded Systems, IoT, & Full-Stack Mastery**
> *Fully aligned with India's National Education Policy (NEP 2020) Guidelines for Skill-Based & Project-Led Cognitive Development.*

---

## 🌐 1. Overview & Vision

**Dakshyam Innovations** is an industry-leading physical-digital integrated vocational training provider and software-hardware platform. We build modular, hands-on educational technology to bridge the gap between abstract academic theory and physical, verifiable vocational engineering.

By deploying robust web dashboards coupled with physical kits (sensors, ESP32 microcontrollers, actuators), we replace traditional testing models with **verifiable, telemetry-rich project portfolios**. Students learn to wire, code, and debug real systems, and receive publicly verifiable, tamper-resistant certificates that display their actual program metrics, project titles, and evaluation lead.

---

## 🔒 2. Enterprise Authentication & Security Architecture

The platform enforces a modern, server-authoritative security model:

1. **Server-Side Authentication & Session Tokens**:
   - Authentication is performed via `POST /api/auth/login` and `POST /api/auth/register`.
   - Passwords are encrypted server-side using **bcrypt** with salted hashing. Passwords are never sent back in API responses under any circumstances.
   - Successful authentication issues a cryptographically signed **JSON Web Token (JWT)**, verified on every state-changing route using Bearer authentication.

2. **Role-Based Access Control (RBAC)**:
   - **Administrator**: Full programmatic control over courses, banners, gallery exhibition items, trainer moderation, and system settings. Access is granted via authenticated credentials or server-validated admin signature passcodes.
   - **Trainer / Faculty**: Access to active classroom groups, workshop grading matrices, and certificate issuance engines. Trainer accounts require administrator vetting or a secure organization registration code.
   - **Student / Candidate**: Access restricted strictly to the student's personal laboratory profile, enrolled courses, and earned certification credentials.

3. **Rate Limiting & Anti-Abuse Controls**:
   - `express-rate-limit` guards login endpoints against brute-force attacks.
   - OTP verification triggers and confirmations enforce a strict 10-minute expiry and attempt quota.

4. **Secure Media & 3D Model Uploads**:
   - File uploads via `/api/upload` enforce authentication and strict magic-byte file signature validation (PNG, JPEG, WebP, MP4, WebM, GLB).
   - Executable, script, HTML, and unvalidated SVG uploads are rejected.

---

## 🛠️ 3. How to Update & Manage Details via the Admin Dashboard

The **Administrator Console** provides intuitive visual management for authorized operators:

### A. Creating or Updating a Course Syllabus
1. Navigate to the **Admin Dashboard** and click on the **Courses** tab.
2. Click the **Add New Course** button to open the Syllabus Creator modal.
3. Configure the Course Title, Duration Block, Description, Tags, Features, and Microcontroller kit leasing status.
4. Click **Publish New Course** to live-mount it immediately.

### B. Managing Banners and Public Campaigns
1. Go to the **Promotions** tab in the Admin panel.
2. Click **Create Promo Banner** to launch a new slideshow campaign with image URL, title, and target action.
3. Under **Exhibition Gallery**, click **Post New Photo Snapshot** to showcase active laboratory sessions.

### C. Approving Trainers & Managing Faculty
- Instructors who register without an organization invitation code are placed into the "Pending Approval" queue.
- Administrators review faculty credentials in the **Trainers** tab and click **Approve Trainer** to grant workspace access.

### D. Protected System Operations
- Destructive operations such as clearing collections require an authenticated administrator session along with an explicit server-side confirmation phrase to prevent accidental data loss.

---

## 🎓 4. Branded Certificate Customization & Verification Engine

1. **Customization**:
   - Trainers and Administrators customize certifying authority titles, digital signature seals, institution logos, and partner credentials.
2. **Public Verification**:
   - The public `/api/certificates/:serial` endpoint allows employers and institutions to verify student credentials without exposing private account details.
   - Generates tamper-proof print-ready PDF certificates with unique serial numbers.

---

## 👥 5. Board of Directors & Core Executive Team

*   **Himanshu Patle** — *Co-Founder & Chief Director*
    *   Leads institutional partnerships, corporate collaborations, and NEP-aligned skill initiatives.
*   **Ankush Nandagouli** — *Co-Founder & Chief Software Architect*
    *   Architects the full-stack telemetry dashboards, real-time sync databases, and certificate verification systems.
*   **Anand Gautam** — *Co-Founder & Embedded Hardware Head*
    *   Designs and calibrates the physical kits, diagnostic instruments, and firmware registers.
*   **Shikhar Bisen** — *Co-Founder & Laboratory Setup Lead*
    *   Manages on-site school laboratory deployment logistics and hardware safety compliance.
*   **Kunal Raut** — *Co-Founder & Director of Operations*
    *   Coordinates regional technology campaigns, field distributions, and logistics.
*   **Rohit Bhajipale** — *Co-Founder & Regional Coordinator*
    *   Directs educational public outreach and coordinates localized boot camps.

---

## ⚙️ 6. Environment Configuration & Setup

### Environment Variables (.env)
Define these parameters in your local `.env` file (refer to `.env.example`):

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/dakshyam_db?retryWrites=true&w=majority
MONGODB_DB_NAME=dakshyam_db

# Cryptographic & Authentication Secrets
JWT_SECRET=your_strong_random_jwt_secret_here
ADMIN_PASSCODE=your_custom_admin_signature_passcode
ADMIN_PASSWORD=your_custom_admin_login_password
SUPERVISOR_PIN=your_6_digit_supervisor_pin
TRAINER_REG_CODE=your_custom_trainer_invitation_code

# Mail Dispatch (Optional for live email OTP delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Dakshyam Academy" <your_email@gmail.com>

# Cloud Storage (Optional for Cloudinary asset storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Development & Build Commands
```bash
# Install dependencies
npm install

# Start development full-stack server
npm run dev

# Compile TypeScript & production bundle
npm run build

# Run type check validation
npm run lint
```
