<div align="center">

# Inquis

**An AI assistant that answers questions, creates files, and works with your Gmail, Google Calendar and Google Drive.**

[Live App](https://app.techy.fun) · [Privacy Policy](https://app.techy.fun/privacy) · [Terms of Service](https://app.techy.fun/terms)

<p align="center">
  <img src="https://img.shields.io/badge/status-live-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-61dafb?logo=react&logoColor=white" alt="Frontend" />
  <img src="https://img.shields.io/badge/backend-Node.js%20%2B%20Express%205-339933?logo=nodedotjs&logoColor=white" alt="Backend" />
  <img src="https://img.shields.io/badge/database-MongoDB-47a248?logo=mongodb&logoColor=white" alt="Database" />
</p>

<!-- Add a screenshot or GIF of the app here -->
<!-- ![Inquis preview](./docs/preview.png) -->

</div>

---

## What is Inquis?

Inquis is a full-stack, privacy-first conversational AI platform. It connects plain-language chat to real-world productivity tools, web knowledge, image generation, and personal cloud workspace services. 

Powered by an autonomous multi-agent loop with multi-provider model fallback, Inquis can search the live web, execute mathematical operations, generate images, create downloadable files, and interact directly with your Google Workspace (Gmail, Google Calendar, and Google Drive). Every write action—such as sending an email, scheduling an event, or trashing a file—features a strict **Human-in-the-Loop** confirmation card, ensuring total user control and data privacy.

> **Try it:** 
> - *"Summarise my latest 3 unread emails from Gmail"*
> - *"What events do I have scheduled on my calendar tomorrow?"*
> - *"Create a text file called meeting_notes.txt with action items from our sprint"*
> - *"Generate a modern digital artwork of an astronaut studying in a greenhouse"*
> - *"Search the latest updates about Next.js 15 and calculate the days until release"*

## Features

**AI chat**
- **Autonomous Multi-Agent Loop:** Powered by LangChain, the agent reasons across multiple tools in an iterative loop with recursion limits, streaming step-by-step reasoning and status updates directly to the client.
- **Multi-Model Intelligent Fallback Cascade:** Resilient model routing across 5 distinct AI providers: Google Gemini (`gemini-3.5-flash-lite`), Groq (`openai/gpt-oss-120b`), Mistral (`ministral-3b-2512`), OpenRouter (`nvidia/nemotron-3.5-lightning:free`), and Cohere (`command-r7b-12-2024`).
- **Automated Health & Circuit Breaker Cooldowns:** Seamlessly detects provider rate limits (`429`), temporary outages (`503`), and authentication issues, temporarily cooling down degraded endpoints and routing queries to healthy providers with zero downtime.
- **Real-Time Web Search:** Integrates Tavily AI search to retrieve up-to-date internet news, publication dates, and source citations.
- **AI Image Generation:** Cloudflare Workers AI with the Flux-1-schnell model (`@cf/black-forest-labs/flux-1-schnell`) to generate high-resolution images from natural language descriptions.
- **Mathematical Calculation & Date-Time Intelligence:** Built-in deterministic calculator powered by Math.js, alongside timezone-aware date and time arithmetic using `date-fns-tz`.
- **Multimodal File Uploads:** Upload and analyze PDF documents, plain text, and images (`PNG`, `JPG`, `WEBP`) up to 5MB, validated with magic-byte detection and processed via background queues.
- **Downloadable File Generation:** The assistant dynamically creates formatted `.pdf` documents (via PDFKit) and `.txt` files with secure cloud links.
- **Rich Interactive UI:** LaTeX math rendering via KaTeX, syntax-highlighted code blocks, one-click copy, and real-time streaming abort controls.
- **Session & Chat Management:** Persistent chat history, automated chat titling powered by Mistral, pinned chats, search dialogs, inline renaming, deletions, and incognito sessions.

**Google connectors** (optional, connect or disconnect anytime)

| Connector | Read Capabilities | Write Capabilities (Requires Explicit User Confirmation) |
|---|---|---|
| **Gmail** | Search emails with standard query syntax (`from:`, `is:unread`), read threads and message bodies | Compose and send emails (`gmail.send`) with recipient validation and anti-header injection safeguards |
| **Google Calendar** | List and filter calendar events across date ranges and timezones | Schedule new events (`calendar.create`), update existing events (`calendar.update`), and delete events (`calendar.delete`) |
| **Google Drive** | Search files and folders, read file contents and document metadata | Create folders (`drive.create_folder`), generate docs (`drive.create_doc`), rename files (`drive.rename`), move items (`drive.move`), and trash files (`drive.trash`) |

*Human-in-the-Loop Security:* The AI agent is restricted from performing write actions autonomously. It issues an interactive proposal card in the chat interface where users must manually click **Confirm** or **Cancel** before any Google API mutation is executed.

**Authentication and accounts**
- Email and password registration with secure bcrypt salt hashing (`BCRYPT_GEN_SALT`) and mandatory email verification.
- One-click Google OAuth 2.0 authentication (`google-auth-library`), separate from Workspace Connectors.
- Secure password reset flow using time-limited, encrypted JWT tokens delivered via email.
- Resend email verification mechanism.
- Comprehensive security architecture: CSRF validation tokens, secure HTTP-only cookie sessions, and multi-tier Redis-backed rate limiters (global, authentication, forgot-password, and per-user message burst/daily limits).

**Privacy by design**
- **Zero Third-Party Training:** User personal Google data is strictly never used to train machine learning models and is never shared or sold.
- **Ephemeral Processing:** Email bodies, calendar events, and drive contents are streamed directly to the active LLM context and are **never stored** in the database.
- **Encrypted Refresh Tokens:** Google OAuth refresh tokens are encrypted at rest with AES encryption using `CONNECTOR_ENCRYPTION_KEY` prior to database storage.
- **One-Click Disconnect & Revocation:** Disconnecting any Google connector instantly deletes the stored encrypted credentials and tokens from the database.
- **Incognito Mode:** Run unrecorded chat sessions without saving prompts or responses to your chat history.

## Tech stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 19, Vite | Modern, high-performance user interface |
| **State & Routing** | Redux Toolkit, React Router DOM v7 | Centralized state management and client-side routing |
| **Styling & Icons** | Tailwind CSS v4, SCSS Modules, Lucide React | Responsive glassmorphism interface and modern icons |
| **Markdown & Formatting** | React-Markdown, Remark-GFM, KaTeX, Rehype-Highlight | Math formula rendering and code syntax highlighting |
| **Real-Time Communication**| Socket.IO (Client & Server) | Real-time chat streaming and status updates |
| **Backend Framework** | Node.js, Express 5 | REST API server and agent orchestration |
| **AI Orchestration** | LangChain, LangGraph | Autonomous agent loop, custom tool definitions, and schema validation |
| **AI Model Providers** | Gemini, Groq, Mistral, OpenRouter, Cohere | Multi-provider fallback cascade with automated cooldowns |
| **AI Image Generation** | Cloudflare Workers AI | Flux-1-schnell model (`@cf/black-forest-labs/flux-1-schnell`) |
| **Web Search** | Tavily AI Core API | Real-time internet search and citation retrieval |
| **Database** | MongoDB Atlas, Mongoose 9 | User accounts, chat sessions, message logs, and connector accounts |
| **Cache & Queues** | Redis (ioredis), BullMQ, rate-limit-redis | Distributed task queues (emails & file processing) and rate limiting |
| **Authentication & Auth** | JWT, Bcryptjs, Google OAuth 2.0 | HTTP-only cookie sessions, password hashing, and OAuth 2.0 flow |
| **File & Image Storage** | Cloudinary | Cloud storage for user uploads and AI-generated files |
| **File Processing & Gen**| Multer, File-Type, PDFKit, unpdf | Magic-byte file validation, PDF generation, and text extraction |
| **Email Delivery** | Resend, Nodemailer | Transactional email delivery with automatic background retries |
| **Logging & Security** | Pino, Pino-HTTP, Helmet, Mongo Sanitize | High-performance structured logging and security headers |
| **Hosting** | Vercel (Frontend), Render (Backend) | Production hosting with custom domain routing |

## Architecture

```
                       Browser Client (React 19 + Vite)
                                [app.techy.fun]
                                       │
                      HTTPS / WSS + HTTP-only Cookie
                                       │
                                       ▼
                       REST API Server (Express 5)
                                [api.techy.fun]
  ┌────────────────────────────────────┼────────────────────────────────────┐
  │                                    │                                    │
  ▼                                    ▼                                    ▼
[Security & Auth]              [Socket.IO Gateway]               [AI Agent Engine]
• JWT / Cookie Sessions         • Real-Time Streams               • LangChain Agent Loop
• CSRF & Mongo Sanitize         • Status Notifications            • Multi-Tool Reasoning
• Redis Rate Limiters                                             • Image Streaming
  │                                                                     │
  ├─────────────────────────────────────────────────────────────────────┤
  │                                                                     │
  ▼                                                                     ▼
[External Services & APIs]                                      [Autonomous Tools]
• Google OAuth & Connectors (Gmail / Calendar / Drive)           • Web Search (Tavily)
• Cloudflare AI (Flux-1-schnell Image Gen)                       • Math.js & Date-Time
• Multi-LLM Routing (Gemini ➔ Groq ➔ Mistral ➔ OpenRouter ➔ Cohere) • PDF/TXT Gen (PDFKit)
  │
  ├─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  ▼                                                                     ▼
[Primary Data Stores]                                           [Asynchronous Workers]
• MongoDB Atlas (Users, Chats, Messages, Connectors)            • BullMQ Worker (Redis)
• Redis (Distributed Cache, Queues, Rate Limits)                 ├── Email Delivery (Resend)
• Cloudinary (Media & Document Storage)                         └── Asynchronous File Parsing
```

## Getting started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Redis**: Local Redis server or cloud Redis instance (e.g. [Upstash](https://upstash.com/))
- **External Accounts & API Keys**:
  - Google Cloud Console (OAuth 2.0 Client Credentials & API scopes)
  - Resend API key (for transactional emails)
  - Cloudinary account (Cloud Name, API Key, API Secret)
  - Cloudflare account (Account ID & API Token for Workers AI)
  - Tavily Search API key
  - AI Providers (Google Gemini, Groq, Mistral, OpenRouter, Cohere)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the **backend/** directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info

# Database & Cache
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/inquis?retryWrites=true&w=majority
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Security & Encryption
BCRYPT_GEN_SALT=10
JWT_SECRET_KEY=your_super_secret_jwt_key_here
EMAIL_VERIFICATION_JWT_SECRET_KEY=your_email_verification_jwt_secret_here
RESET_PASSWORD_JWT_SECRET_KEY=your_reset_password_jwt_secret_here
CONNECTOR_ENCRYPTION_KEY=32_character_hex_encryption_key_here

# Google OAuth 2.0 (Sign-In & Connectors)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Delivery (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Cloudflare Workers AI (Flux-1-schnell Image Generation)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Real-Time Web Search
TVLY_API_KEY=tvly-your_tavily_api_key_here

# AI Model Providers
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
MISTRAL_API_KEY=your_mistral_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
COHERE_API_KEY=your_cohere_api_key
```

Create a `.env.development` file in the **frontend/** directory:

```env
VITE_BACKEND_API=http://localhost:3000
```

> **Security Note:** Never commit `.env` files or API secrets to version control.

### 4. Set up Google OAuth

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. In **APIs & Services** > **Enabled APIs & Services**, enable:
   - **Gmail API**
   - **Google Calendar API**
   - **Google Drive API**
3. Configure the **OAuth Consent Screen**:
   - User Type: **External**
   - Set Application name, support email, and developer contact details.
   - Add sensitive scopes: `.../auth/gmail.modify`, `.../auth/calendar.events`, `.../auth/drive.file`.
4. Create an **OAuth Client ID** (Application type: *Web application*):
   - **Authorized JavaScript Origins:**
     - `http://localhost:5173` (development)
     - `https://app.techy.fun` (production)
   - **Authorized Redirect URIs:**
     - `http://localhost:3000/api/auth/google/callback` (Google Sign-In)
     - `http://localhost:3000/api/connectors/google/callback` (Google Connectors)
5. Add your Google test account under **Test Users** while the application is in Testing status.

### 5. Run the app

Open two terminal sessions:

```bash
# Terminal 1: Start Backend API (runs server & BullMQ background workers)
cd backend
npm run dev

# Terminal 2: Start Frontend Development Server
cd frontend
npm run dev
```

- The frontend application will be accessible at: `http://localhost:5173`
- The backend API server will listen at: `http://localhost:3000`

## Deployment

| Component | Platform | Configuration & Notes |
|---|---|---|
| **Frontend** | Vercel | Connected to GitHub repository, builds with `npm run build`, routed to custom domain `app.techy.fun`. Set `VITE_BACKEND_API=https://api.techy.fun`. |
| **Backend** | Render | Deployed as a web service running `node server.js` with custom domain `api.techy.fun`. Configure all environment variables in Render Dashboard. |
| **Workers** | Render / Background | Can run concurrently inside the main server process or as an independent background worker instance using `npm run worker`. |
| **Database** | MongoDB Atlas | Whitelist the production server IP address range or configure secure VPC peering. |
| **Cache & Queues** | Upstash / Redis Cloud | Managed Redis instance with SSL enabled for background job processing and rate limiting. |
| **Email** | Resend | Authenticate domain DNS records (SPF, DKIM, DMARC) for verified email delivery. |

For production Google OAuth, ensure `https://app.techy.fun` is added to Authorized JavaScript Origins and `https://api.techy.fun/api/...` callback endpoints are added to Authorized Redirect URIs.

## Google verification status

Inquis requests sensitive and restricted Google scopes (Gmail, Calendar, Drive). Branding is verified, and the app's data access is currently **under Google's review**. Until that completes, Google shows an "unverified app" screen when you connect a Google service:

1. Click **Advanced**
2. Click **Go to Inquis (unsafe)**
3. Tick the permission checkbox and click **Continue**

The warning appears only because verification is pending. See the [Privacy Policy](https://app.techy.fun/privacy) for exactly what is accessed and how it is handled.

## Project structure

```
.
├── backend/
│   ├── src/
│   │   ├── agent/             # LangChain agent loop & stream generator
│   │   ├── ai/                # Multi-model providers, routing cascade & cooldown logic
│   │   ├── api/               # External Google API clients & token refresh handler
│   │   ├── config/            # Environment variable validation, DB & Redis setup
│   │   ├── connectors/        # Google Workspace connector definitions & registry
│   │   ├── constants/         # App constants, prompt templates & system guidelines
│   │   ├── context/           # AsyncLocalStorage context for request & connector data
│   │   ├── controllers/       # Route controllers (auth, chat, connectors, files)
│   │   ├── executors/         # Human-in-the-loop action executors (Gmail, Calendar, Drive)
│   │   ├── lib/               # Structured Pino logger & shared utilities
│   │   ├── middlewares/       # CSRF, rate limiters, auth guards & Multer upload filter
│   │   ├── models/            # Mongoose schemas (User, Chat, Message, Connector, File)
│   │   ├── queues/            # BullMQ queue definitions (email & file parsing)
│   │   ├── routes/            # Express route endpoints (/api/auth, /api/chats, etc.)
│   │   ├── services/          # Business logic (AI, web search, images, math, files, email)
│   │   ├── sockets/           # Socket.IO server initialization & event dispatchers
│   │   ├── templates/         # HTML templates for verification & password-reset emails
│   │   ├── tools/             # Agent tools (Gmail, Calendar, Drive, File generation)
│   │   ├── utils/             # Helper functions (PDF building, errors, wrappers)
│   │   ├── validations/       # Zod & Express-Validator schemas for inputs
│   │   └── workers/           # BullMQ background workers (email delivery & file jobs)
│   ├── app.js                 # Express application configuration & middleware stack
│   ├── server.js              # Server entrypoint (HTTP + Socket.IO server initialization)
│   └── package.json           # Backend dependencies and scripts
│
├── frontend/
│   ├── public/                # Static assets, icons, and SVG illustrations
│   ├── src/
│   │   ├── app/               # Root App component, Redux store providers & router setup
│   │   ├── assets/            # App screenshots, verification step guides & graphics
│   │   ├── components/        # Reusable UI components (Protected/Public routes, Modals)
│   │   ├── data/              # Static UI configuration data & constants
│   │   ├── features/          # Domain-driven feature modules
│   │   │   ├── auth/          # Login, Signup, Reset Password pages & forms
│   │   │   ├── chat/          # Dashboard, chat input, messages, sidebar, modals, media
│   │   │   ├── connectors/    # Connector cards, action cards, Google warning modal
│   │   │   └── legal/         # Privacy Policy & Terms of Service legal pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # AppLayout (with sidebar) and AuthLayout
│   │   ├── services/          # Frontend API client & Socket.IO connections
│   │   ├── store/             # Redux slices (auth, chat, connectors)
│   │   ├── styles/            # SCSS modules, Tailwind CSS v4 setup & global styles
│   │   ├── utils/             # Client-side utility functions & formatters
│   │   └── main.jsx           # React DOM root entrypoint
│   ├── index.html             # HTML entry template with meta tags
│   ├── vite.config.js         # Vite configuration with React & Tailwind plugins
│   └── package.json           # Frontend dependencies and scripts
│
└── readme.md                  # Project documentation and setup guide
```

## Roadmap

- [ ] Complete Google OAuth app verification
- [ ] Paid plan and billing
- [ ] More connectors
- [ ] Mobile-friendly improvements
- [ ] Chat export

## Privacy and security

- All traffic uses HTTPS
- Google refresh tokens are encrypted before storage
- HTTP-only cookies for sessions, no advertising cookies
- Write actions on your Google account require explicit confirmation
- Delete your chats in the app; email us to delete your account and data

Questions or deletion requests: **computerscienceengineer1@gmail.com**

## Contributing

This is a personal project, but suggestions are welcome. Open an issue to discuss a change before sending a pull request.

## License

Add a license of your choice (for example MIT) in a `LICENSE` file, then update this section.

---

<div align="center">

Built by **Sourav Giri**

</div>