# Software Requirements Specification (SRS)
## Perplexity Clone (AI-Powered Conversational Search & Knowledge Platform)

---

## 1. Introduction

### 1.1 Purpose
This document provides the formal Software Requirements Specification (SRS) for the **Perplexity Clone** application. It describes the complete functional requirements, system architecture, data models, API endpoints, non-functional requirements, and design constraints of the project as implemented in the codebase.

### 1.2 Scope
The project is a full-stack conversational AI search engine inspired by Perplexity AI. It enables authenticated users to engage in intelligent, multi-turn AI conversations, execute real-time web searches, calculate mathematical expressions, perform calendar and timezone queries, generate AI images, and upload and analyze documents (PDF, TXT) and images (PNG, JPG, WEBP). Responses are delivered via real-time HTTP streaming (NDJSON) with multi-model fallback resiliency.

### 1.3 Definitions, Acronyms, and Abbreviations
* **SRS**: Software Requirements Specification
* **LLM**: Large Language Model
* **JWT**: JSON Web Token
* **NDJSON**: Newline Delimited JSON (`application/x-ndjson`)
* **TTL**: Time to Live (Redis cache expiration)
* **CSRF**: Cross-Site Request Forgery
* **RAG / Inline**: Context-injection mechanisms for user documents and images
* **BullMQ**: Redis-based message queue for Node.js background processing

---

## 2. Overall Description

### 2.1 Product Perspective & High-Level Architecture
The application is structured as a decoupled client-server architecture:
* **Frontend**: Single Page Application (SPA) built with React 19, Vite 8, React Router v7, Redux Toolkit, Tailwind CSS v4, and SCSS modules.
* **Backend**: Express 5 application on Node.js (ES Modules), with Socket.IO integration, MongoDB (via Mongoose 9) as the primary datastore, and Redis (via ioredis 6) for caching, rate limiting, and BullMQ queue management.
* **Workers**: Dedicated BullMQ worker processes for asynchronous email delivery (`email` queue) and file extraction/ingestion (`file-ingest` queue).
* **Third-Party Services**:
  * Cloudinary: Cloud asset storage (images and uploaded documents).
  * Cloudflare AI: FLUX-1-Schnell image generation model.
  * Resend: Transactional email delivery service.
  * Tavily: Search engine API for real-time web grounding.
  * Google OAuth 2.0: Third-party authentication provider.
  * AI Providers (LangChain): Google GenAI (Gemini), Groq, Mistral AI, OpenRouter, Cohere.

```
+------------------------------------------------------------------------+
|                              Frontend                                  |
|         React 19 + Redux Toolkit + React Router v7 + Vite              |
+------------------------------------+-----------------------------------+
                                     |  HTTP (REST & NDJSON) / WebSocket
+------------------------------------v-----------------------------------+
|                              Backend                                   |
|   Express 5 API Server + Socket.IO Server (HTTP server on PORT)        |
|   Middlewares: Helmet, MongoSanitize, CORS, CookieParser, RateLimiters|
+---------+--------------------+---------------------+-------------------+
          |                    |                     |
+---------v--------+   +-------v-----------+   +-----v-------------------+
|    MongoDB       |   |      Redis        |   |    AI & External APIs   |
| User, Chat,      |   | Caching, Blacklist|   | LangChain Multi-Model   |
| Message, File    |   | Rate Limits,      |   | Tavily (Web Search)     |
| Models           |   | BullMQ Queues     |   | Cloudflare (FLUX Image) |
+------------------+   +-------+-----------+   | Cloudinary (Storage)    |
                               |               | Resend (Email Service)  |
                       +-------v-----------+   | Google OAuth 2.0        |
                       |  BullMQ Workers   |   +-------------------------+
                       | - Email Worker    |
                       | - File Ingest     |
                       +-------------------+
```

### 2.2 Technology Stack
* **Runtime**: Node.js (ES Modules)
* **Backend Framework**: Express 5.2.1
* **Database**: MongoDB with Mongoose 9.10.0
* **In-Memory Store & Cache**: Redis via ioredis 6.0.0
* **Job Queue & Workers**: BullMQ 6.3.8
* **Authentication**: JWT (`jsonwebtoken` 9.0.3), `bcryptjs` 3.0.3, `google-auth-library` 11.1.0
* **AI & Orchestration**:
  * `langchain` 1.5.14 & `@langchain/core` 1.2.13
  * `@langchain/google-genai` (gemini-3.5-flash-lite)
  * `@langchain/groq` (openai/gpt-oss-120b)
  * `@langchain/mistralai` (ministral-3b-2512)
  * `@langchain/openrouter` (nvidia/nemotron-3.5-lightning:free)
  * `@langchain/cohere` (command-r7b-12-2024)
* **Tools & Utilities**:
  * `@tavily/core` 0.7.13 (Web Search)
  * `mathjs` 15.2.0 (Math Calculator)
  * `date-fns` 4.4.0 & `date-fns-tz` 3.2.0 (Date/Time operations)
  * `unpdf` 1.8.1 (PDF text extraction)
  * `file-type` 22.1.1 (Magic byte MIME detection)
  * `cloudinary` 2.11.0 (File & Image Cloud Storage)
  * `resend` 6.28.1 & `nodemailer` 10.0.10 (Email delivery)
  * `pino` 10.3.1 (Logging)
* **Security & Validation**: `helmet` 8.3.0, `@exortek/express-mongo-sanitize` 3.0.1, `express-validator` 7.3.2, `express-rate-limit` 8.7.0, `rate-limit-redis` 6.0.1, `zod` 4.6.5
* **Frontend**: React 19.2.6, Vite 8.0.12, React Router DOM 7.18.4, Redux Toolkit 2.12.0, Axios 1.20.0, Socket.IO Client 4.8.4, Sonner 2.0.8, Lucide React 1.48.0, React-Markdown 10.1.0, KaTeX & Rehype/Remark plugins, Tailwind CSS 4.3.3, SASS 1.104.1.

---

## 3. System Features & Functional Requirements

### 3.1 Authentication & Authorization
* **FR-AUTH-01: User Registration**:
  * Users can register with `username`, `email`, and `password`.
  * `username` constraints: 3-30 chars, lowercase, alphanumeric and underscores only (`^[a-z0-9_]{3,30}$`).
  * `email` constraints: valid email format, unique, lowercase, trimmed.
  * `password` constraints: 8-72 chars, must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character (`@$!%*?&`).
  * Passwords must be hashed using `bcryptjs` with configured salt rounds before storage.
  * Account created with `verified: false`.
  * Email verification token (JWT, 5-minute expiry) is generated, hashed with SHA-256, stored in Redis under `email-verification:<userId>` with 300s TTL, and queued to BullMQ `email` queue.
* **FR-AUTH-02: Email Verification**:
  * Verification link accessed via `GET /api/auth/verify-email?token=<token>`.
  * Validates JWT token and checks token SHA-256 hash against Redis.
  * On success, marks user as `verified: true`, deletes token from Redis, and returns an HTML confirmation response.
  * Handles expired tokens (HTTP 410 HTML response) and invalid/already verified tokens.
* **FR-AUTH-03: Resend Verification Email**:
  * Endpoint `POST /api/auth/resend-verify-email`.
  * Validates email, ensures user exists and is not yet verified.
  * Generates new token, stores in Redis, and enqueues verification email job.
* **FR-AUTH-04: User Login**:
  * Endpoint `POST /api/auth/login`.
  * Verifies email and password using `bcrypt.compare`.
  * Blocks login if account is unverified (`verified === false`).
  * Generates session JWT (1-day expiry) containing `id: user._id`.
  * Sets HTTP-only cookie `token` (path `/`, maxAge 1 day, secure in production, sameSite `strict` in dev / `none` in prod).
* **FR-AUTH-05: Google OAuth 2.0 Authentication**:
  * `GET /api/auth/google`: Initiates Google OAuth consent flow with state parameter stored in `g_oauth_state` cookie (`lax` sameSite, 10 min TTL). Supports `mode=signup` or `mode=login`.
  * `GET /api/auth/google/callback`: Verifies state cookie, exchanges auth code for tokens, verifies Google ID token. Finds or automatically creates user (if `signup` mode, with randomized secure password and auto-verification), sets session cookie `token`, and redirects to frontend.
* **FR-AUTH-06: Forgot & Reset Password**:
  * `POST /api/auth/forgot-password`: Generates reset token (JWT, 5-minute expiry), hashes with SHA-256, stores in Redis (`password-reset:user:<userId>`, 300s TTL), queues reset email with frontend reset URL.
  * `POST /api/auth/reset-password`: Verifies token against JWT secret and Redis hash, validates new password complexity, updates password, and deletes Redis token.
* **FR-AUTH-07: User Profile (`/me`)**:
  * Protected endpoint `GET /api/auth/me`. Returns authenticated user information.
  * User object cached in Redis under `user:<userId>` with 300s TTL.
* **FR-AUTH-08: Logout & Token Blacklisting**:
  * `POST /api/auth/logout`: Reads JWT from cookie, computes SHA-256 hash, stores in Redis under `blacklist:token:<tokenHash>` with remaining token TTL.
  * Evicts user cache `user:<userId>` and clears `token` cookie.

### 3.2 Conversational AI Chat & Tool Engine
* **FR-CHAT-01: Message Generation & Real-time Streaming**:
  * Endpoint `POST /api/chats/message`.
  * Accepts `message` (string), optional `chatId` (string), and optional `fileIds` (array of file IDs).
  * Validates and loads chat history (last 20 messages sorted chronologically).
  * Streams response using NDJSON (`application/x-ndjson`), flushing headers upon first token.
  * Stream emits JSON events:
    * `{"type": "token", "text": "..."}`: Chunk of generated text.
    * `{"type": "status", "status": "image"}`: Tool invocation status update.
    * `{"type": "done", "chat": "<chatId>", "title": "<title>"}`: Stream completion.
    * `{"type": "error", "message": "..."}`: Error notification.
  * Client disconnect detection via `req.on("close")` with `AbortController` signal to terminate AI computation and conserve tokens.
* **FR-CHAT-02: Multi-Model Routing & Resiliency Chain**:
  * Prioritized provider fallback chain:
    1. **Gemini** (`gemini-3.5-flash-lite`): Supports tools & vision, 12s timeout, 100k context tokens.
    2. **Groq** (`openai/gpt-oss-120b`): Supports tools, 12s timeout, 6k context tokens.
    3. **Mistral** (`ministral-3b-2512`): Supports tools, 12s timeout, 30k context tokens.
    4. **OpenRouter** (`nvidia/nemotron-3.5-lightning:free`): Supports tools, 15s timeout, 30k context tokens.
    5. **Cohere** (`command-r7b-12-2024`): Supports tools, 12s timeout, 30k context tokens.
  * Dynamic filtering: filters providers based on capabilities (`supportsTools`, `supportsVision`).
  * Context trimming: dynamically trims messages to stay within provider token budget using `trimToBudget`.
  * Cooldown tracking in Redis:
    * HTTP 429 Rate Limit: Cooldown 60s (or provider `retry-after`).
    * Auth failure (401/403): Cooldown 600s.
    * 3 consecutive server/unavailable failures: Cooldown 30s.
  * If all candidate providers are cooling down, the router attempts the pool anyway.
  * Mid-stream failure guard: Once first token is emitted, fallback is aborted to prevent partial duplicate output; emits `StreamInterruptedError`.
* **FR-CHAT-03: LangChain Autonomous Agent & Tools**:
  * When `useAgent` is active, invokes `createAgent` with tools and `recursionLimit: 11` (approx. 5 tool steps):
    1. **Web Search Tool (`webSearchTool`)**: Queries Tavily API (`maxResults: 3`, `searchDepth: "basic"`). Returns title, URL, and snippet content for real-time web grounding.
    2. **Calculator Tool (`calculatorTool`)**: Executes mathematical expressions safely via `mathjs` `evaluate()`.
    3. **DateTime Tool (`dateTimeTool`)**: Performs operations (`current_time`, `day_of_week`, `date_difference`, `add_days`, `timezone`) using `date-fns` and `date-fns-tz` (default timezone: `Asia/Kolkata`).
    4. **Image Generation Tool (`imageTool`)**: Calls Cloudflare AI endpoint (`@cf/black-forest-labs/flux-1-schnell`), receives base64 JPEG, uploads to Cloudinary folder `perplexity/images`, and returns exact markdown URL.
* **FR-CHAT-04: Chat Title Generation**:
  * For new chats, automatically generates a 2 to 4-word title in parallel with the first message.
  * Uses dedicated `titleModel` (`ministral-3b-2512` via Mistral AI, temperature: 0.2, maxTokens: 25).
  * Sanitizes output (strips numbers, bullets, quotes, special characters).
  * Fallback to first 4 words of user query if AI generation fails or exceeds 5-second total timeout.
* **FR-CHAT-05: Chat History Persistence**:
  * Saves user query and AI response into MongoDB `messages` collection only after stream completes successfully.
  * If a newly created chat fails before saving messages, orphan chat cleanup runs to remove the empty chat.

### 3.3 Chat Management
* **FR-CHAT-06: List Chats**:
  * `GET /api/chats`: Cursor-based pagination (`cursor` = `updatedAt` of last unpinned chat, `limit` max 50, default 20).
  * Returns pinned chats first (in initial page) followed by unpinned chats sorted by `updatedAt` descending.
* **FR-CHAT-07: Get Chat Messages**:
  * `GET /api/chats/messages/:chatId`: Cursor-based pagination (`cursor` = `_id` of oldest message).
  * Validates chat ownership (403 if unauthorized).
  * Populates message attachments (name, MIME, URL).
* **FR-CHAT-08: Pin / Unpin Chat**:
  * `PATCH /api/chats/pinned/:chatId`: Toggles `isPinned` boolean flag.
* **FR-CHAT-09: Rename Chat**:
  * `PATCH /api/chats/rename/:chatId`: Updates chat `title` (validated: max 60 chars).
* **FR-CHAT-10: Delete Chat**:
  * `DELETE /api/chats/delete/:chatId`: Deletes chat record, all associated messages, and associated files from MongoDB.
  * Triggers asynchronous background deletion of file assets from Cloudinary storage (`deleteFromStorage`).

### 3.4 File Attachment & Ingestion Pipeline
* **FR-FILE-01: File Upload & Validation**:
  * `POST /api/files`: Accepts single file in `multipart/form-data` with field key `file`.
  * Max file size limit: 5 MB (`5 * 1024 * 1024` bytes).
  * Allowed MIME types:
    * `image/png` (Cloudinary resource: `image`)
    * `image/jpeg` (Cloudinary resource: `image`)
    * `image/webp` (Cloudinary resource: `image`)
    * `application/pdf` (Cloudinary resource: `raw`)
    * `text/plain` (Cloudinary resource: `raw`)
  * Two-layer validation: Multer MIME filter + byte inspection using `fileTypeFromBuffer` (and null-byte checks for text files).
  * Memory storage buffer uploaded directly to Cloudinary (`uploadBuffer`).
  * Creates `File` record in MongoDB with `status: "processing"`.
  * Images marked immediately as `status: "ready"`, `mode: "image"`.
  * PDF and text documents queued to BullMQ `file-ingest` queue for text extraction.
* **FR-FILE-02: Asynchronous File Ingestion Worker**:
  * BullMQ worker on queue `file-ingest` (concurrency: 2).
  * Downloads document from Cloudinary URL with 30s timeout.
  * For PDF: extracts full text using `unpdf` (`extractText` with `mergePages: true`).
  * For TXT: reads UTF-8 text.
  * Validation: Rejects files with no readable text (scanned PDFs without OCR) or text exceeding 60,000 characters (~15,000 tokens).
  * On success: Updates file record with `status: "ready"`, `mode: "inline"`, and stores `extractedText`.
  * On failure: Updates file record with `status: "failed"` and sets `failReason`.
* **FR-FILE-03: File Status Polling**:
  * `GET /api/files/:fileId`: Checks file status (`processing`, `ready`, `failed`), returning mode and failure reason if applicable.
* **FR-FILE-04: Chat Context Injection**:
  * When sending a message with `fileIds`:
    * Up to 4 documents (`MAX_DOCS = 4`) injected into system prompt as `<document index="i" name="...">content</document>`.
    * Up to 4 images (`MAX_IMAGES = 4`) fetched, converted to base64 Data URLs, and attached to the user message block for vision-capable models (Gemini).

### 3.5 Real-Time Communication
* **FR-SOCK-01: WebSocket Connection**:
  * Socket.IO server mounted on HTTP server, configured with CORS for `FRONTEND_URL` and credentials support.
  * Logs connection events (`io.on("connection")`).

### 3.6 Frontend User Interface
* **FR-UI-01: Authentication Flows**:
  * Login page (`/login`) with email/password and "Continue with Google" button.
  * Signup page (`/signup`) with input validation, password criteria indicators, and Google OAuth option.
  * Password reset flow (`/reset-password?token=...`).
* **FR-UI-02: Dashboard & Conversation View**:
  * Main conversation workspace with top navigation bar, collapsible sidebar, and bottom chat input area.
  * Chat input supports multiline typing, file drag-and-drop / file picker attachment (PDF, TXT, images), and Incognito mode toggle.
  * Real-time stream rendering of assistant answers using Markdown (`react-markdown`), mathematical formulas (`rehype-katex`, `remark-math`), and syntax highlighted code blocks (`rehype-highlight`, `highlight.js`).
  * Visual status indicators when agent executes tools (e.g., image generation in progress).
* **FR-UI-03: Sidebar & History Management**:
  * Categorized list of conversations (Pinned vs. Recent).
  * Inline options to pin, unpin, rename, and delete conversations.
  * Search modal (`SearchModal`) to filter conversations.
  * Upgrade modal (`UpgradeModal`) and Connectors page (`/connectors`).

---

## 4. External Interfaces

### 4.1 Frontend Routing
| Route | Access | Component | Purpose |
|---|---|---|---|
| `/login` | Public | `LoginPage` | User login & Google OAuth entry |
| `/signup` | Public | `SignupPage` | User registration & Google OAuth entry |
| `/reset-password` | Public | `ResetPasswordPage` | Reset password via token from email |
| `/` | Protected | `Dashboard` | Main AI chat and conversation view |
| `/dashboard` | Protected | Redirect | Redirects to `/` |
| `/connectors` | Protected | `Connectors` | Connectors management page |
| `*` | Any | `NotFound` | 404 page |

### 4.2 Backend API Specifications

#### Authentication (`/api/auth`)
* `POST /api/auth/register`
  * **Headers**: `x-csrf-token` (required)
  * **Body**: `{ username, email, password }`
  * **Rate Limit**: 10 req / 15 min (IP-based)
  * **Response**: `201 Created` with created user details (excluding password).
* `GET /api/auth/verify-email`
  * **Query**: `token`
  * **Response**: `200 OK` (HTML page) on success, `410 Gone` (expired), `400/401` (invalid).
* `POST /api/auth/resend-verify-email`
  * **Headers**: `x-csrf-token` (required)
  * **Body**: `{ email }`
  * **Rate Limit**: 3 req / 15 min (IP + Email based)
  * **Response**: `200 OK`.
* `POST /api/auth/login`
  * **Headers**: `x-csrf-token` (required)
  * **Body**: `{ email, password }`
  * **Rate Limit**: 10 req / 15 min (IP-based)
  * **Response**: `200 OK` with user data + sets `token` HTTP-only cookie.
* `GET /api/auth/me`
  * **Access**: Protected (`token` cookie required)
  * **Rate Limit**: 300 req / 15 min (Global)
  * **Response**: `200 OK` with current user object.
* `POST /api/auth/logout`
  * **Access**: Protected
  * **Headers**: `x-csrf-token` (required)
  * **Response**: `200 OK`, clears `token` cookie, blacklists token in Redis.
* `POST /api/auth/forgot-password`
  * **Headers**: `x-csrf-token` (required)
  * **Body**: `{ email }`
  * **Rate Limit**: 3 req / 15 min (IP + Email based)
  * **Response**: `200 OK`.
* `POST /api/auth/reset-password`
  * **Headers**: `x-csrf-token` (required)
  * **Body**: `{ token, password }`
  * **Rate Limit**: 3 req / 15 min
  * **Response**: `200 OK`.
* `GET /api/auth/google`
  * **Query**: `mode` (`signup` | `login`)
  * **Response**: `302 Redirect` to Google OAuth consent screen.
* `GET /api/auth/google/callback`
  * **Query**: `code`, `state`
  * **Response**: `302 Redirect` to Frontend `/` (with auth cookie) or `/login?error=...`.

#### Chat & Messaging (`/api/chats`)
* `POST /api/chats/message`
  * **Access**: Protected
  * **Body**: `{ message: string, chatId?: string, fileIds?: string[] }`
  * **Rate Limits**: 10 req / min (burst per user) + 50 req / 24 hours (daily per user)
  * **Response**: `200 OK` with `Content-Type: application/x-ndjson; charset=utf-8` stream.
* `GET /api/chats`
  * **Access**: Protected
  * **Query**: `cursor` (ISO date string), `limit` (int, default 20, max 50)
  * **Response**: `200 OK` with `{ chats, hasMore, nextCursor }`.
* `GET /api/chats/messages/:chatId`
  * **Access**: Protected
  * **Params**: `chatId` (Mongo ObjectId)
  * **Query**: `cursor` (Mongo ObjectId), `limit` (int, default 20, max 50)
  * **Response**: `200 OK` with `{ messages, hasMore, nextCursor }`.
* `PATCH /api/chats/pinned/:chatId`
  * **Access**: Protected
  * **Response**: `200 OK` with updated chat document.
* `PATCH /api/chats/rename/:chatId`
  * **Access**: Protected
  * **Body**: `{ newTitle: string }` (1-60 chars)
  * **Response**: `200 OK` with updated chat document.
* `DELETE /api/chats/delete/:chatId`
  * **Access**: Protected
  * **Response**: `200 OK`, deletes chat, messages, file metadata, and schedules Cloudinary deletion.

#### Files (`/api/files`)
* `POST /api/files`
  * **Access**: Protected
  * **Content-Type**: `multipart/form-data` (field: `file`)
  * **Rate Limit**: 30 uploads / hour (per user)
  * **Response**: `201 Created` with `{ fileId, name, mime, size, url, status, mode }`.
* `GET /api/files/:fileId`
  * **Access**: Protected
  * **Response**: `200 OK` with `{ fileId, name, status, mode, failReason }`.

#### System Health
* `GET /api/health`
  * **Response**: `200 OK` with `{ status: "ok", uptime, timestamp }`.

---

## 5. Data Models & Database Design (MongoDB)

### 5.1 User Collection (`users`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto-generated PK | Unique identifier |
| `username` | String | Required, Unique, Trim, Lowercase, 3-30 chars, regex `^[a-z0-9_]{3,30}$` | User handle |
| `email` | String | Required, Unique, Trim, Lowercase, regex `^\S+@\S+\.\S+$` | User email |
| `password` | String | Required, 8-72 chars, hidden (`select: false`), regex | Bcrypt hashed password |
| `verified` | Boolean | Default: `false` | Email verification status |
| `createdAt` | Date | Timestamps | Account creation timestamp |
| `updatedAt` | Date | Timestamps | Last update timestamp |

### 5.2 Chat Collection (`chats`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto-generated PK | Unique conversation identifier |
| `user` | ObjectId | Ref: `User`, Required, Index | Owner user ID |
| `title` | String | Required, Trim, Max: 60 chars | Title of the conversation |
| `isPinned` | Boolean | Default: `false` | Whether chat is pinned in UI |
| `createdAt` | Date | Timestamps | Conversation creation date |
| `updatedAt` | Date | Timestamps | Last message / update date |

* **Compound Index**: `{ user: 1, isPinned: 1, updatedAt: -1 }`

### 5.3 Message Collection (`messages`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto-generated PK | Unique message identifier |
| `chat` | ObjectId | Ref: `Chat`, Required, Index | Associated chat ID |
| `content` | String | Required, Trim | Message text / Markdown |
| `role` | String | Required, Enum: `['user', 'ai']` | Message sender |
| `attachments` | [ObjectId] | Array of Ref: `File` | Attached files |
| `createdAt` | Date | Timestamps | Message creation time |
| `updatedAt` | Date | Timestamps | Message update time |

* **Compound Index**: `{ chat: 1, _id: -1 }`

### 5.4 File Collection (`files`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto-generated PK | Unique file identifier |
| `user` | ObjectId | Ref: `User`, Required, Index | Uploading user ID |
| `chat` | ObjectId | Ref: `Chat`, Default: `null`, Index | Linked chat ID |
| `name` | String | Required, Trim | Original file name |
| `mime` | String | Required | Detected MIME type |
| `size` | Number | Required | File size in bytes |
| `url` | String | Required | Cloudinary secure URL |
| `publicId` | String | Required | Cloudinary public asset ID |
| `resourceType` | String | Required, Enum: `["image", "raw"]` | Cloudinary asset type |
| `status` | String | Enum: `["processing", "ready", "failed"]`, Default: `"processing"` | Processing status |
| `mode` | String | Enum: `["image", "inline", "rag"]`, Default: `null` | Context injection mode |
| `failReason` | String | Default: `null` | Error explanation if failed |
| `extractedText`| String | Hidden (`select: false`) | Extracted textual content |
| `createdAt` | Date | Timestamps | File upload timestamp |
| `updatedAt` | Date | Timestamps | File record update timestamp |

---

## 6. Redis Key Patterns & Architecture

| Key Pattern | Data Type | TTL | Purpose |
|---|---|---|---|
| `user:<userId>` | String (JSON) | 300 seconds | User session cache for `identifyUser` middleware |
| `blacklist:token:<tokenHash>` | String ("1") | Remaining JWT TTL | Blacklisted JWT after logout |
| `email-verification:<userId>` | String (SHA-256 hash) | 300 seconds | Verify email token lookup |
| `password-reset:user:<userId>`| String (SHA-256 hash) | 300 seconds | Password reset token lookup |
| `global-rate-limit:<ip>` | Rate-limit counter | 15 minutes | Global API rate limiting |
| `auth-rate-limit:<ip>` | Rate-limit counter | 15 minutes | Login / Signup rate limiting |
| `forgotPassword-rate-limit:<ip>` | Rate-limit counter | 15 minutes | Forgot password rate limiting |
| `sendEmail-rate-limit:<ip>` | Rate-limit counter | 15 minutes | Resend email rate limiting |
| `email-rate-limit:<email>` | Rate-limit counter | 15 minutes | Account enumeration rate limit |
| `rl:msg:min:<userId>` | Rate-limit counter | 60 seconds | User message burst limit (10/min) |
| `rl:msg:day:<userId>` | Rate-limit counter | 24 hours | User message daily quota (50/day) |
| `rl:file:hour:<userId>` | Rate-limit counter | 60 minutes | User file upload limit (30/hour) |
| `cooldown:provider:<name>` | String ("1") | 30s - 600s | AI provider cooldown flag |
| `failures:provider:<name>` | Integer | 60 seconds | AI provider failure count window |

---

## 7. Non-Functional Requirements

### 7.1 Security & Data Protection
* **HTTP Security Headers**: Implemented using `helmet` middleware.
* **NoSQL Injection Sanitization**: Applied across all incoming request bodies and queries using `@exortek/express-mongo-sanitize`.
* **CSRF Protection**: State-changing endpoints (`/register`, `/login`, `/logout`, `/resend-verify-email`, `/forgot-password`, `/reset-password`) validate custom request headers or origin checks via `csrf.middleware.js`.
* **Cookie Security**: Authentication `token` cookie configured with `httpOnly: true`, `secure: true` in production, and `sameSite: "strict"` (dev) or `"none"` (prod). State cookie for Google OAuth uses `sameSite: "lax"`.
* **Secret Segregation**: Distinct JWT secrets configured for general session authentication (`JWT_SECRET_KEY`), email verification (`EMAIL_VERIFICATION_JWT_SECRET_KEY`), and password resets (`RESET_PASSWORD_JWT_SECRET_KEY`).
* **Token Hashing**: Tokens stored in Redis are SHA-256 hashed to prevent plaintext credential exposure in the cache.

### 7.2 Reliability & Fault Tolerance
* **Multi-Provider Fallback**: AI chat routing dynamically fails over across Gemini, Groq, Mistral, OpenRouter, and Cohere.
* **Client Disconnect Handling**: Stream request abort listener (`req.on("close")`) triggers `AbortController.abort()` to terminate LLM execution.
* **Asynchronous Background Processing**: Email delivery and PDF parsing run on background BullMQ workers, isolating external I/O latency and failures from HTTP request cycles.
* **Storage Cleanup Best Effort**: File deletion from Cloudinary runs via `Promise.allSettled` to prevent storage API errors from aborting database cleanup.

### 7.3 Performance
* **Stream Response Latency**: Headers flushed immediately on first chunk (`flushHeaders()`) to minimize time-to-first-token for the user.
* **Redis Caching**: User profile requests (`/api/auth/me`) hit Redis cache before falling back to MongoDB.
* **Database Indexing**: Compound indexes on `{ user: 1, isPinned: 1, updatedAt: -1 }` (chats) and `{ chat: 1, _id: -1 }` (messages) ensure fast cursor pagination.
* **File Upload Throttling Before Buffering**: `fileUploadLimit` rate limiter runs before Multer parses file body, preventing memory exhaustion from abusive requests.
