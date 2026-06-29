# INFINITIUM — Official Physical Sciences Society Portal

**Atma Ram Sanatan Dharma College, University of Delhi**

INFINITIUM is the premier digital portal designed for **INFINITIUM**, the prestigious Society of Physical Sciences at Atma Ram Sanatan Dharma (ARSD) College, University of Delhi. This responsive, full-stack web application serves as the core backend and frontend infrastructure for hosting fests, managing seminars, organizing research achievements, displaying rich galleries, and tracking event attendance.

---

## 🚀 Vision & Short Description

INFINITIUM acts as the digital headquarters for Physical Sciences students, faculty, and administrators. It empowers the society to showcase scientific excellence, maintain memories of hands-on physical science lab experiments, chronicle national webinars/exhibitions, and manage modern operational workloads (like real-time QR-based attendance tracking and automated credential sync) in a beautifully crafted interface.

---

## ✨ Features & Capabilities

The portal has been engineered with a desktop-first, highly responsive design using **React 18**, **Vite**, and **Tailwind CSS**, and backed by **Google Firebase**.

### 1. 📊 Advanced Admin Dashboard (`/admin`)
* **Real-time Quota Monitor**: Custom live monitor displaying Firestore daily document reads and writes (Spark free tier limits of 50K/20K) alongside total storage capacity, enabling clean infrastructure overhead management.
* **Database Reset Alerts**: Embedded diagnostic systems and guidelines explaining global daily resets at US Pacific Midnight (PST/PDT) and how Google gateways regulate blocks.
* **Comprehensive Back-office**: Fully centralized tabs for organizing and scheduling events, team members, achievements, and incoming query sheets.

### 2. 📅 Event & Fest Manager (`/events`)
* **Detailed Itineraries**: Interactive viewports displaying upcoming and archived workshops, exhibitions, and guest lecture sessions.
* **Rich Markdown Descriptions**: Implements standard, fluid rendering for custom-formatted event descriptions.
* **Attendance Coordination**: Built-in event selectors allowing administrators to toggle scanners for checking physical or online attendance.

### 3. 📷 Interactive Media Gallery (`/gallery`)
* **Masonry Canvas Grid**: Sleek responsive photo archive displaying science exhibition models, laboratory studies, and student moments.
* **Custom Dynamic Uploads**: Add, edit, or remove images securely in high-definition directly from the administrator console.

### 4. 🏆 Innovations & Achievements (`/achievements`)
* **Academic Milestones**: Commemorates university rankings, stellar research publications, research projects, and extracurricular triumphs of physical sciences department members.
* **Filterable Collections**: Organized catalog showing years, categories, and student accomplishments dynamically.

### 5. 👥 Executive Team Directory (`/team`)
* **Interactive Directory**: Displays detailed cards for faculty mentors, executive leaders, core student coordinators, and student executives.
* **Real-time Configuration**: Add social handles (Instagram, LinkedIn) and core profiles directly through backend panel.

### 6. 📱 QR Attendance Code Scanner (`/admin/scanner`)
* **Live Camera Feed**: Leverages the user’s camera permissions inside secure frame limits to read visitor credentials.
* **Instant Validation**: Scans QR codes to quickly verify registration, marking live physical attendance directly into the Firestore database.

### 7. 📬 Multi-channel Contact Portal (`/contact`)
* **Structured Query Forms**: Direct submission pipeline allowing college aspirants, students, and collaborators to log feedback or questions.
* **Automated Sync**: Integrates incoming student queries into the administration view for quick tracking and responses.

### 8. 🛠️ Under-the-Hood Technology Stack
* **Framework**: React 18+ (with TypeScript) and Vite.
* **Styling**: Tailwind CSS utilizing elegant display typography (custom-rendered vector symbols) and safe high-contrast palettes.
* **Animations**: Fluid page transitions and micro-animations handled dynamically with `motion`.
* **Database & Auth**: Google Firestore, Firebase Authentication, and Google Cloud Storage.
* **SEO Optimizations**: Auto-injects semantic page titles, keywords, dynamic meta description tags, and social OpenGraph tags per page routing for robust search visibility.

---

## 🛠️ Development & Local Setup

To run the application locally on your machine:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Duplicate `.env.example` as `.env` and fill in your Firebase configuration parameters:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

*Designed & Developed for INFINITIUM Society, ARSD College, University of Delhi.*
