<div align="center">

# 🧘 CalmQuest

**Your Personal Mental Wellness Companion**

_An AI-powered platform that helps students and individuals track, understand, and improve their mental well-being through mood analysis, community support, and professional guidance._

[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Feature Details](#-feature-details)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Screenshots](#-screenshots)
- [Contributors](#-contributors)
- [Future Scope](#-future-scope)

---

## ✨ Features

| Category | Highlights |
|---|---|
| 🎭 **Emotion Analysis** | Facial emotion detection, voice analysis, mood tracking |
| 🤖 **AI-Powered Chat** | Mental health chatbot powered by Google Gemini |
| 📊 **Assessments & Reports** | Structured mental health assessments with AI-generated reports |
| 🏥 **Doctor Appointments** | Book, manage, and attend video appointments via Jitsi |
| 💬 **Community** | Create posts, react, comment, bookmark, and report content |
| 🔔 **Notifications** | Real-time in-app notifications |
| 🔐 **Auth** | JWT + OAuth2 (Google) authentication |
| 🛡️ **Role-Based Access** | Student, Doctor, College Admin, and Super Admin roles |
| 🌗 **Theming** | Light / Dark mode toggle |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** (Radix UI) | Accessible component primitives |
| **Redux Toolkit** | Global state management |
| **React Router v7** | Client-side routing |
| **face-api.js** | In-browser facial emotion detection |
| **Jitsi React SDK** | Video conferencing for appointments |
| **Yjs + y-websocket** | Real-time collaboration (whiteboard) |
| **tldraw** | Collaborative drawing canvas |

### Backend

| Technology | Purpose |
|---|---|
| **Spring Boot 3.2** | REST API framework |
| **Java 17** | Language runtime |
| **Spring Security** | Authentication & authorization |
| **Spring Data JPA** | ORM / database access |
| **PostgreSQL** | Relational database |
| **JWT (jjwt)** | Token-based auth |
| **OAuth2 Client** | Google social login |
| **Spring Mail** | Email notifications |
| **Cloudinary** | Image / media uploads |
| **Google Gemini API** | AI chat & report generation |
| **MapStruct** | DTO ↔ Entity mapping |
| **Lombok** | Boilerplate reduction |

---

## 📁 Folder Structure

```
CalmQuest/
├── frontend/                        # React + TypeScript SPA
│   ├── public/                      # Static assets & ML models
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui primitives (button, card, dialog …)
│   │   │   ├── landing/             # Hero, Features, Navbar, Footer
│   │   │   ├── community/           # PostCard, CreatePostForm, CommunitySidebar
│   │   │   └── ...                  # DashboardLayout, ProtectedRoute, VoiceRecorder …
│   │   ├── pages/
│   │   │   ├── dashboard/           # Overview, Chat, Community, Report, Admin …
│   │   │   │   └── doctor/          # BookAppointment, ManageAppointments, MeetingRoom
│   │   │   └── ...                  # HomePage, AuthPage, LoginPage
│   │   ├── services/                # API clients (auth, chat, community, doctor …)
│   │   ├── store/                   # Redux slices (auth, chat, sidebar, theme)
│   │   ├── hooks/                   # Custom hooks (useAuth, useDebounce, useMobile …)
│   │   ├── lib/                     # Utilities (dateUtils, cn helper)
│   │   └── App.tsx                  # Root component & route definitions
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                         # Spring Boot REST API
│   ├── src/main/java/com/calmquest/
│   │   ├── config/                  # SecurityConfig, CloudinaryConfig, DataSeeder
│   │   ├── controller/              # REST controllers (Auth, Chat, Community, Doctor …)
│   │   ├── dto/                     # Request / response DTOs
│   │   ├── entity/                  # JPA entities (User, Student, Doctor, ChatMessage …)
│   │   ├── repository/              # Spring Data JPA repositories
│   │   ├── security/                # JWT filter, OAuth2 handlers
│   │   ├── service/                 # Business logic (Gemini AI, Facial Analysis …)
│   │   ├── exception/               # Custom exception handling
│   │   └── CalmQuestApplication.java
│   ├── src/main/resources/
│   │   └── application.properties   # App configuration (DB, JWT, Mail, Cloudinary …)
│   └── pom.xml
│
├── .gitignore
└── README.md
```

---

## 🔍 Feature Details

<details>
<summary><strong>🎭 Emotion Analysis</strong></summary>

- **Facial Emotion Detection** — Uses `face-api.js` to analyze webcam input and detect emotions in real-time directly in the browser.
- **Voice Analysis** — Records voice samples and sends them to the backend for sentiment analysis.
- **Emotion Logging** — All detected emotions are persisted and visualized over time to reveal patterns.
</details>

<details>
<summary><strong>🤖 AI-Powered Chat</strong></summary>

- Chat sessions backed by **Google Gemini** for empathetic, context-aware responses.
- Conversation history is saved per user for continuity across sessions.
</details>

<details>
<summary><strong>📊 Assessments & Reports</strong></summary>

- Structured questionnaires that evaluate mental well-being.
- AI-generated reports with scores, insights, and recommendations.
- Full assessment history accessible from the dashboard.
</details>

<details>
<summary><strong>🏥 Doctor Appointments</strong></summary>

- Students can **browse available doctors** and **book appointments**.
- Doctors can **accept/reject** requests and manage their schedules.
- Video meetings powered by **Jitsi Meet** — join directly from the dashboard.
</details>

<details>
<summary><strong>💬 Community</strong></summary>

- Create text/media posts visible to the community.
- Like, react, comment, bookmark, and report posts.
- Community sidebar for quick navigation.
</details>

<details>
<summary><strong>🛡️ Role-Based Dashboards</strong></summary>

| Role | Capabilities |
|---|---|
| **Student** | Mood tracking, assessments, chat, community, book appointments |
| **Doctor** | Manage appointment requests, conduct meetings, write doctor reports |
| **College Admin** | Oversee students and doctors within a college |
| **Super Admin** | Platform-wide management, seeded on first run |
</details>

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| **Java** | 17+ |
| **Maven** | 3.8+ (wrapper included) |
| **Node.js** | 18+ |
| **npm** | 9+ |
| **PostgreSQL** | 14+ |

### 1 — Clone the repository

```bash
git clone https://github.com/ultimatrix2/CalmQuest.git
cd CalmQuest
```

### 2 — Setup the Backend

```bash
cd backend

# Create a .env file (see Environment Variables section below)
cp .env.example .env   # or create manually

# Run with Maven wrapper
./mvnw spring-boot:run
```

The API server starts on **http://localhost:8080**.

### 3 — Setup the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app opens at **http://localhost:5173**.

---

## 🔑 Environment Variables

Create a `.env` file inside the **`backend/`** directory with the following variables:

| Variable | Description | Example |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/calmquest` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `secret` |
| `JWT_SECRET` | Secret key for signing JWTs | _(any long random string)_ |
| `JWT_EXPIRATION` | Token expiry in milliseconds | `86400000` |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | SMTP email address | `you@gmail.com` |
| `MAIL_PASSWORD` | SMTP app password | _(app-specific password)_ |
| `GEMINI_API_KEY` | Google Gemini API key | _(your API key)_ |

> **Note:** Cloudinary credentials are configured in `application.properties`. Update them if you want to use your own Cloudinary account.

---

## 📸 Screenshots

> _Screenshots coming soon — contributions welcome!_

<!-- Add screenshots here -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![Community](docs/screenshots/community.png) -->

---

## 👥 Contributors

<a href="https://github.com/ultimatrix2/CalmQuest/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ultimatrix2/CalmQuest" />
</a>

---

## 🔮 Future Scope

- 📱 **Mobile App** — React Native or Flutter companion app
- 🧠 **Advanced AI** — Personalized therapy plans using fine-tuned models
- 📈 **Analytics Dashboard** — Aggregated anonymized insights for college admins
- 🌐 **Multi-Language Support** — i18n for broader accessibility
- 🎵 **Guided Meditation** — Integrated audio player with curated meditation sessions
- 🔗 **Wearable Integration** — Sync heart-rate and sleep data from smart devices
- 📝 **Journaling** — Private daily journal with AI-driven mood prompts

---

<div align="center">

Made with ❤️ for mental wellness

</div>
