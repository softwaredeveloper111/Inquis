# Software Requirements Specification (SRS)
## Inquis: AI-Powered Autonomous Assistant & Knowledge Platform

---

### Document Control & Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | INQ-SRS-2026-V2.0 |
| **System Title** | Inquis Conversational AI & Workspace Intelligence Platform |
| **Version** | 2.0.0 (Production Release Baseline) |
| **Document Status** | Approved / Production Baseline |
| **Classification** | Engineering & Architectural Specification |
| **Author / Lead Architect** | Sourav Giri |
| **Target Runtime** | Node.js 18+ (ESM) / React 19 / MongoDB Atlas / Redis 6+ |
| **Production Endpoints** | Frontend: `https://app.techy.fun` \| Backend API: `https://api.techy.fun` |

#### Revision History

| Version | Date | Author | Description of Changes |
|---|---|---|---|
| 1.0.0 | 2026-09-15 | Sourav Giri | Initial SRS drafting for basic conversational chat and LLM streaming. |
| 1.5.0 | 2026-10-01 | Sourav Giri | Added BullMQ queues, file ingestion pipeline, and Cloudinary storage. |
| 2.0.0 | 2026-10-08 | Sourav Giri | Comprehensive production refactoring: added Google Workspace Connectors (Gmail, Calendar, Drive), Human-in-the-Loop Action Confirmation Engine, Generated Files Subsystem (PDFKit/TXT), Cloudflare Workers AI image generation, multi-tier Redis rate limiters, token encryption at rest, and full API interface specifications. |

---

## 1. Introduction

### 1.1 Purpose
This document specifies the formal Software Requirements Specification (SRS) for **Inquis** (formerly referenced during initial research as Perplexity Clone). It articulates the functional capabilities, external system interfaces, data schemas, non-functional constraints, and architectural standards governing the application in accordance with IEEE 830 / ISO/IEC/IEEE 29148 standards.

### 1.2 Document Conventions
* **RFC 2119 Compliance**: The key words **"MUST"**, **"MUST NOT"**, **"REQUIRED"**, **"SHALL"**, **"SHALL NOT"**, **"SHOULD"**, **"SHOULD NOT"**, **"RECOMMENDED"**, **"MAY"**, and **"OPTIONAL"** in this document are to be interpreted as described in BCP 14, RFC 2119.
* **Requirements Nomenclature**: Requirements are tagged uniquely using the schema `FR-[SUBSYSTEM]-[ID]` for functional requirements and `NFR-[CATEGORY]-[ID]` for non-functional requirements.

### 1.3 Intended Audience
This specification is designed for:
* **Full-Stack Engineers & AI Architects**: For implementation, code reviews, and maintenance.
* **DevOps & Infrastructure Engineers**: For cloud deployment topology, environment configuration, and scaling policies.
* **Security & Compliance Auditors**: For assessing encryption mechanisms, Google OAuth verification, and data isolation policies.
* **Product Managers & QA Engineers**: For acceptance testing and verification criteria.

### 1.4 Product Scope
**Inquis** is a full-stack, enterprise-grade conversational AI assistant. It integrates multi-turn natural language dialogue with autonomous tool reasoning, real-time web search, deterministic mathematical calculation, timezone-aware datetime operations, AI image synthesis, multimodal document ingestion, dynamic document generation, and bi-directional Google Workspace integrations (Gmail, Google Calendar, Google Drive). 

Crucially, Inquis enforces a strict **Human-in-the-Loop (HITL)** security model: the autonomous AI agent is strictly barred from directly executing destructive or state-changing write operations on third-party user data; instead, it generates interactive proposal cards requiring explicit client-side authorization before execution.

### 1.5 Definitions, Acronyms, and Abbreviations
* **AES-GCM**: Advanced Encryption Standard in Galois/Counter Mode.
* **BullMQ**: High-performance Node.js message queue backed by Redis.
* **CSRF**: Cross-Site Request Forgery.
* **HITL**: Human-in-the-Loop.
* **JWT**: JSON Web Token (RFC 7519).
* **LLM**: Large Language Model.
* **NDJSON**: Newline Delimited JSON (`application/x-ndjson`).
* **OAuth 2.0**: Open Authorization 2.0 Protocol (RFC 6749).
* **RBAC / ABAC**: Role-Based / Attribute-Based Access Control.
* **TTL**: Time to Live (cache expiration interval).

---

## 2. Overall Description

### 2.1 Product Perspective & System Context
Inquis operates as a modern cloud-native, decoupled distributed architecture. The system consists of four primary tiers:
1. **Presentation Tier (SPA)**: React 19 single-page application hosted on Vercel (`app.techy.fun`).
2. **Application & Orchestration Tier**: Express 5 REST API and Socket.IO server hosted on Render (`api.techy.fun`).
3. **Asynchronous Background Processing Tier**: BullMQ worker processes executing in background threads/containers for email transmission and asynchronous file extraction.
4. **Data & Storage Tier**: Managed MongoDB Atlas for persistent entities, Redis for high-throughput distributed caching, rate limiting, and queues, and Cloudinary for media asset persistence.

```
+-----------------------------------------------------------------------------------------+
|                                    Client Tier (SPA)                                     |
|                       React 19 + Redux Toolkit + React Router v7                         |
|                             Hosted on Vercel [app.techy.fun]                            |
+--------------------------------------------+--------------------------------------------+
                                             | HTTPS (REST & NDJSON) / WSS (Socket.IO)
+--------------------------------------------v--------------------------------------------+
|                                 Application Server Tier                                 |
|                       Node.js (ESM) + Express 5.2.1 + Socket.IO                         |
|                             Hosted on Render [api.techy.fun]                            |
|                                                                                         |
|  [Security Middlewares]          [Agent & Tools Engine]        [Workspace Connectors]   |
|  • Helmet, MongoSanitize         • LangChain Agent Loop        • Google API Client      |
|  • CSRF & Cookie Parser          • Tavily Web Search           • OAuth Token Manager    |
|  • Redis Distributed Limits      • Cloudflare Flux Gen         • HITL Action Executor   |
|  • JWT / Session Auth            • Math.js & Date-Time         • AES Encryption Layer   |
+---------+----------------------------------+------------------------------------+-------+
          |                                  |                                    |
+---------v----------+             +---------v----------+               +---------v-------+
|  MongoDB Atlas     |             |  Redis Cache/Queue |               | External APIs   |
|  • users           |             |  • Token Blacklist |               | • Gemini        |
|  • chats           |             |  • Rate Limit Keys |               | • Groq          |
|  • messages        |             |  • AI Cooldowns    |               | • Mistral       |
|  • files           |             |  • Action Buffers  |               | • OpenRouter    |
|  • connectoraccts  |             |  • BullMQ Streams  |               | • Cohere        |
|  • generatedfiles  |             +---------+----------+               | • Cloudflare AI |
+--------------------+                       |                          | • Tavily Search |
                                   +---------v----------+               | • Resend Email  |
                                   |  BullMQ Workers    |               | • Cloudinary    |
                                   |  • email.worker    |               | • Google APIs   |
                                   |  • file.worker     |               +-----------------+
                                   +--------------------+
```

### 2.2 Technology Stack

#### 2.2.1 Frontend Architecture
* **Core Framework**: React 19.2.6 with Vite 8.0.12 (ES Modules, HMR).
* **State Management**: Redux Toolkit 2.12.0 and React-Redux 9.3.0.
* **Routing**: React Router DOM 7.18.4 (Nested data routes, layouts, protected guards).
* **Styling Engine**: Tailwind CSS 4.3.3 (`@tailwindcss/vite`), Sass 1.104.1 (Modular SCSS), Lucide React 1.52.0 icons.
* **Markdown & Formula Rendering**: React-Markdown 10.1.0, Remark-GFM 4.0.1, Remark-Math 6.0.0, Rehype-Katex 7.0.1 (KaTeX 0.18.10), Rehype-Highlight 7.0.2 (Highlight.js 11.12.0).
* **Real-Time Client**: Socket.IO Client 4.8.4.
* **Feedback & Forms**: Sonner 2.0.8 (Toasts), React Hook Form 7.88.0, Zod 4.6.5, `@hookform/resolvers` 5.9.1.

#### 2.2.2 Backend Architecture
* **Runtime**: Node.js 18+ LTS with native ECMAScript Modules (`"type": "module"`).
* **Web Framework**: Express 5.2.1 with native Promise error handling.
* **Real-Time Gateway**: Socket.IO 4.8.4 mounted on Node HTTP Server.
* **Database Driver**: Mongoose 9.10.0 (MongoDB Atlas).
* **Cache & In-Memory Store**: ioredis 6.0.0 (Standalone & Redis Cloud/Upstash).
* **Queue Engine**: BullMQ 6.3.8 (Redis Streams backing).
* **Logging Engine**: Pino 10.3.1, Pino-HTTP 11.0.0, Morgan 1.12.1.

#### 2.2.3 AI & Agent Infrastructure
* **Orchestration**: `langchain` 1.5.14, `@langchain/core` 1.2.13.
* **Model Providers**:
  * Google GenAI: `@langchain/google-genai` 2.3.2 (`gemini-3.5-flash-lite`).
  * Groq Cloud: `@langchain/groq` 1.3.1 (`openai/gpt-oss-120b`).
  * Mistral AI: `@langchain/mistralai` 1.2.0 (`ministral-3b-2512`).
  * OpenRouter: `@langchain/openrouter` 0.4.15 (`nvidia/nemotron-3.5-lightning:free`).
  * Cohere: `@langchain/cohere` 1.1.0 (`command-r7b-12-2024`).
* **Image Synthesis**: Cloudflare Workers AI (`@cf/black-forest-labs/flux-1-schnell`).
* **Web Grounding**: Tavily Core SDK `@tavily/core` 0.7.13.
* **Deterministic Computation**: `mathjs` 15.2.0, `date-fns` 4.4.0, `date-fns-tz` 3.2.0.
* **Document Synthesis & Parsing**: PDFKit 0.20.2, `unpdf` 1.8.1, `file-type` 22.1.1.

---

## 3. System Features & Functional Requirements

### 3.1 Authentication & Identity Subsystem

#### FR-AUTH-01: User Registration & Credential Hashing
* The system **SHALL** accept user registration requests containing `username`, `email`, and `password`.
* **Validation Rules**:
  * `username`: Length between 3 and 30 characters, alphanumeric and underscore characters only (`^[a-z0-9_]{3,30}$`).
  * `email`: Standard RFC 5322 email syntax, normalized to lowercase, trimmed, and strictly unique.
  * `password`: Length between 8 and 72 characters, requiring at least one uppercase letter, one lowercase letter, one numeric digit, and one special symbol (`[@$!%*?&]`).
* The system **SHALL** hash the password using `bcryptjs` parameterized with the configured salt rounds (`BCRYPT_GEN_SALT`) before persisting.
* Newly registered accounts **SHALL** initialize with `verified: false`.
* The system **SHALL** generate an email verification JWT (valid for 300 seconds), compute its SHA-256 digest, persist the digest in Redis (`email-verification:<userId>`, TTL 300s), and dispatch an asynchronous email job via BullMQ.

#### FR-AUTH-02: Cryptographic Email Verification
* Verification **SHALL** be processed via `GET /api/auth/verify-email?token=<token>`.
* The system **SHALL** verify token signature against `EMAIL_VERIFICATION_JWT_SECRET_KEY` and compare its SHA-256 digest with the stored Redis hash.
* Upon validation, the user record **SHALL** transition to `verified: true`, the Redis key **SHALL** be purged, and an HTML status response rendered.

#### FR-AUTH-03: Session Management & HTTP-Only Cookie Issuance
* Upon successful password verification via `bcrypt.compare`, the system **SHALL** verify that `verified === true`.
* The system **SHALL** generate a session JWT signed with `JWT_SECRET_KEY` (1-day expiration) containing payload `{ id: user._id }`.
* The session token **SHALL** be transmitted exclusively via an HTTP-only cookie (`token`):
  * `httpOnly: true`, `path: "/"`, `maxAge: 86400000` (24 hours).
  * `secure: true` in production environments.
  * `sameSite: "none"` in production (cross-domain client/API architecture) and `sameSite: "strict"` in development.

#### FR-AUTH-04: Google OAuth 2.0 Single Sign-On
* The system **SHALL** provide federated authentication via Google OAuth 2.0 (`googleAuth.route.js`).
* Initiating `GET /api/auth/google?mode=signup|login` **SHALL** generate a cryptographically random `state` nonce stored in an HTTP cookie (`g_oauth_state`, TTL 600s, `sameSite: "lax"`).
* The callback `GET /api/auth/google/callback` **SHALL** validate the state nonce, exchange authorization code for tokens, retrieve Google profile information, upsert user record with randomized secure password credentials, auto-mark `verified: true`, set the session cookie, and redirect to the frontend.

#### FR-AUTH-05: Password Reset Lifecycle
* The system **SHALL** support a two-step password reset flow (`/forgot-password` and `/reset-password`).
* Reset tokens **SHALL** be signed with `RESET_PASSWORD_JWT_SECRET_KEY` (300-second TTL), hashed with SHA-256, and stored in Redis under `password-reset:user:<userId>`.
* Successful reset **SHALL** update the password hash and invalidate the Redis token immediately.

#### FR-AUTH-06: Session Invalidation & Token Blacklisting
* Upon `POST /api/auth/logout`, the system **SHALL** calculate the SHA-256 digest of the current session JWT and persist it in Redis under `blacklist:token:<tokenHash>` with a TTL equal to the token's remaining validity.
* The system **SHALL** purge the cached user profile (`user:<userId>`) and clear the client cookie.

---

### 3.2 Conversational AI & Autonomous Agent Subsystem

#### FR-CHAT-01: Real-Time Stream Response Generation
* The system **SHALL** provide an NDJSON streaming endpoint: `POST /api/chats/message`.
* Requests **SHALL** accept `{ message: string, chatId?: string, fileIds?: string[] }`.
* The server **SHALL** initialize response headers (`Content-Type: application/x-ndjson; charset=utf-8`, `Transfer-Encoding: chunked`) and invoke `res.flushHeaders()` prior to streaming token chunks.
* The stream **SHALL** emit typed JSON lines:
  * `{"type": "token", "text": "..."}`: Text fragment from the model.
  * `{"type": "status", "status": "image"}`: Tool lifecycle transition events.
  * `{"type": "connector_action", "action": {...}}`: Human-in-the-loop proposal events.
  * `{"type": "done", "chat": "<id>", "title": "<title>"}`: Stream completion metadata.
  * `{"type": "error", "message": "..."}`: Stream error notifications.
* The system **SHALL** bind an `AbortController` to the request's `close` event (`req.on("close")`), immediately terminating downstream AI API streams upon client disconnect to eliminate unmetered token consumption.

#### FR-CHAT-02: Multi-Model Resiliency Cascade & Circuit Breaker
* The AI engine **SHALL** implement an automated multi-provider fallback cascade:
  1. **Primary**: Google Gemini (`gemini-3.5-flash-lite`) — 12s timeout, 100,000 context tokens.
  2. **Secondary**: Groq Cloud (`openai/gpt-oss-120b`) — 12s timeout, 6,000 context tokens.
  3. **Tertiary**: Mistral AI (`ministral-3b-2512`) — 12s timeout, 30,000 context tokens.
  4. **Quaternary**: OpenRouter (`nvidia/nemotron-3.5-lightning:free`) — 15s timeout, 30,000 context tokens.
  5. **Quinary**: Cohere (`command-r7b-12-2024`) — 12s timeout, 30,000 context tokens.
* **Cooldown Policies**:
  * Upon HTTP 429 (Rate Limit): Provider enters cooldown for 60 seconds (or standard `retry-after` header value).
  * Upon HTTP 401/403 (Auth failure): Provider enters cooldown for 600 seconds.
  * Upon 3 consecutive HTTP 503 / network timeout failures: Provider enters cooldown for 30 seconds.
* **Mid-Stream Circuit Breaker**: Once the first token chunk has been flushed to the client, provider fallback **SHALL** be permanently inhibited to prevent concatenated, corrupted responses; the stream emits `StreamInterruptedError`.

#### FR-CHAT-03: Autonomous Agent Tool Execution Loop
* When tool execution is required, the system **SHALL** execute a LangChain agent loop (`createAgent`) bound with `recursionLimit: 11` (allowing up to ~5 sequential reasoning steps).
* **Registered Core Tools**:
  1. `webSearchTool`: Queries Tavily API for live internet content, returning sources, dates, and snippets.
  2. `calculatorTool`: Evaluates mathematical expressions using deterministic `mathjs`.
  3. `dateTimeTool`: Computes time differences, date offsets, and timezone conversions via `date-fns-tz`.
  4. `imageTool`: Generates images via Cloudflare Workers AI FLUX model, uploads raw buffer to Cloudinary (`perplexity/images`), and returns the persistent markdown link.
  5. `createTextFile` & `createPdfFile`: Synthesizes user-requested text or PDF files.
  6. Workspace Connector Tools: Gmail, Calendar, and Drive integration tools.

#### FR-CHAT-04: Automated Chat Title Generation
* Upon the initial user prompt in a new chat, the system **SHALL** asynchronously generate a concise 2–4 word title using a lightweight model (`ministral-3b-2512`, `temperature: 0.2`, `maxTokens: 25`).
* If title generation exceeds 5,000ms or fails, the system **SHALL** fallback to truncating the first 4 words of the user query.

---

### 3.3 Google Workspace Connectors & Human-in-the-Loop (HITL) Subsystem

#### FR-CONN-01: Separate Workspace Service Authorization
* Inquis **SHALL** provide dedicated connector authorization routes under `/api/connectors`:
  * `POST /api/connectors/google/:service/start` (where `:service` is `gmail`, `calendar`, or `drive`).
* Generating the authorization URL **SHALL** request restricted Google OAuth scopes:
  * Gmail: `https://www.googleapis.com/auth/gmail.modify`
  * Calendar: `https://www.googleapis.com/auth/calendar.events`
  * Drive: `https://www.googleapis.com/auth/drive.file`
* The callback `GET /api/connectors/google/callback` **SHALL** authenticate using state verification cached in Redis, exchange the code for access/refresh tokens, and securely persist the connection.

#### FR-CONN-02: Cryptographic Token Storage at Rest
* Connector refresh tokens **SHALL NOT** be stored in plaintext.
* The system **SHALL** encrypt all refresh tokens using AES-256 with a dedicated master secret (`CONNECTOR_ENCRYPTION_KEY`) before saving to the `connectoraccounts` collection in MongoDB.
* The field `refreshTokenEnc` **SHALL** be configured with `select: false` on the Mongoose schema.

#### FR-CONN-03: Read Tool Capabilities
* When active, connector read tools **SHALL** expose user data to the LLM context ephemerally:
  * `gmailSearch`: Queries user emails with Gmail syntax (`from:`, `is:unread`, `newer_than:`).
  * `gmailReadThread`: Fetches full email threads with HTML tag sanitization and MIME decoding.
  * `calendarListEvents`: Queries primary calendar events across ISO date intervals.
  * `driveSearchFiles`: Searches Google Drive files and folders.
  * `driveReadFile`: Extracts plain text from Google Drive documents.

#### FR-CONN-04: Human-in-the-Loop Two-Phase Write Protocol
* The AI Agent **SHALL NOT** directly execute write operations on Google APIs.
* When the agent decides to invoke a write action (`gmail.send`, `calendar.create`, `calendar.update`, `calendar.delete`, `drive.create_folder`, `drive.create_doc`, `drive.rename`, `drive.move`, `drive.trash`), it **SHALL** invoke `prepareAction()`:
  1. The action parameters and preview summary are serialized and cached in Redis under `connector:action:<id>` with an absolute TTL of 900 seconds (15 minutes).
  2. A cryptographic SHA-256 hash of `[userId, type, params]` is stored in `connector:action:dedupe:<hash>` (TTL 120s) to prevent duplicate card creation during provider retries.
  3. The stream emits an event `{"type": "connector_action", "action": { id, service, type, ...preview }}`.
  4. The model receives a status notification that the proposal is pending user confirmation.

#### FR-CONN-05: Atomic Action Confirmation & Execution
* The frontend **SHALL** render an interactive Action Card allowing the user to inspect parameters and click **Confirm** or **Cancel**.
* `POST /api/connectors/actions/:id/confirm`:
  * Atomically executes `redis.del("connector:action:<id>")`. If return count !== 1, request is rejected with HTTP 410 (prevents double-execution / replay attacks).
  * Executes the corresponding action runner in `actions.executors.js` using a freshly refreshed Google access token.
  * Returns success summary string to the UI.
* `POST /api/connectors/actions/:id/cancel`:
  * Atomically deletes the action key and dedupe key from Redis.

#### FR-CONN-06: Connector Revocation & Data Purge
* `DELETE /api/connectors/:service`:
  * Deletes the `ConnectorAccount` record from MongoDB.
  * Purges any associated connector context from active memory.

---

### 3.4 Generated Files Subsystem

#### FR-GEN-01: Server-Side PDF Document Generation
* When invoked via `createPdfFile`, the system **SHALL** utilize `pdfkit` to compile structured text into a formal PDF binary buffer.
* The content **SHALL** be validated (maximum 60,000 characters per document) and sanitized for non-printable characters.
* The binary buffer **SHALL** be stored in MongoDB under `generatedfiles` with an unguessable 32-character hexadecimal token.

#### FR-GEN-02: Plain Text File Generation
* When invoked via `createTextFile`, the system **SHALL** validate text content (maximum 200,000 characters), clean whitespace, and store UTF-8 text buffer under `generatedfiles`.

#### FR-GEN-03: Secure File Download Pipeline
* Generated files **SHALL** be publicly downloadable via `GET /api/generated-files/:token`.
* The endpoint **SHALL** set appropriate headers:
  * `Content-Type`: `application/pdf` or `text/plain; charset=utf-8`.
  * `Content-Disposition`: `attachment; filename="<filename>"`.
* Generated files **SHALL** configure a 30-day MongoDB TTL index on `createdAt` for automated archival and purge.

---

### 3.5 File Attachment & Ingestion Subsystem

#### FR-FILE-01: File Upload & MIME Magic-Byte Validation
* `POST /api/files` **SHALL** accept multipart uploads with a strict 5 MB file size limit.
* Permitted formats: PNG, JPG, WEBP, PDF, TXT.
* **Validation**: The server **SHALL** inspect raw buffer bytes using `fileTypeFromBuffer` to verify that actual file signatures match declared MIME types, rejecting spoofed uploads with HTTP 400. Text files are checked for null-byte absence.

#### FR-FILE-02: Asynchronous BullMQ Document Ingestion
* Upon upload of PDF or TXT files, the file record is created in MongoDB with `status: "processing"` and enqueued to BullMQ `file-ingest` queue.
* The worker extracts text using `unpdf` (`mergePages: true`). If text exceeds 60,000 characters, it is truncated; if no text is found (scanned PDF), the job marks `status: "failed"` with `failReason: "No readable text found"`.
* Upon success, the record updates to `status: "ready"`, `mode: "inline"` with `extractedText` saved.

#### FR-FILE-03: Multimodal Context Injection
* When messages are submitted with file attachments:
  * Up to 4 document texts (`MAX_DOCS = 4`) are injected into the agent system prompt within `<document index="i" name="...">` tags.
  * Up to 4 images (`MAX_IMAGES = 4`) are converted to base64 Data URLs and injected into the user message block for vision-capable models (Gemini).

---

## 4. External Interfaces

### 4.1 Frontend Route Architecture

| Route Path | Access Level | Layout | Primary Component | Functional Description |
|---|---|---|---|---|
| `/login` | Public | `AuthLayout` | `LoginPage` | User login with email/password and Google SSO button |
| `/signup` | Public | `AuthLayout` | `SignupPage` | Account registration with password criteria validation |
| `/reset-password` | Public | `AuthLayout` | `ResetPasswordPage`| Password reset entry via email token |
| `/privacy` | Public | `AuthLayout` | `PrivacyPage` | Corporate Privacy Policy & Google data disclosure |
| `/terms` | Public | `AuthLayout` | `TermsPage` | Terms of Service & acceptable use policies |
| `/` | Protected | `AppLayout` | `Dashboard` | Primary conversational AI workspace and streaming chat |
| `/dashboard` | Protected | `AppLayout` | Redirect (`/`) | Canonical dashboard redirect |
| `/connectors` | Protected | `AppLayout` | `Connectors` | Management of Gmail, Calendar, Drive connectors |
| `*` | Any | None | `NotFound` | 404 Not Found error view |

---

### 4.2 Backend API Specifications

#### 4.2.1 Authentication Endpoints (`/api/auth`)

##### `POST /api/auth/register`
* **Access**: Public \| **Rate Limit**: 10 req / 15 min (IP-based)
* **Headers**: `Content-Type: application/json`, `x-csrf-token`
* **Request Body**:
```json
{
  "username": "sourav_giri",
  "email": "sourav@example.com",
  "password": "SecurePassword123!"
}
```
* **Responses**:
  * `201 Created`: `{ "success": true, "message": "User registered successfully", "data": { "id": "...", "username": "...", "email": "..." } }`
  * `400 Bad Request`: Validation failure.
  * `409 Conflict`: Username or email already registered.

##### `GET /api/auth/verify-email`
* **Access**: Public
* **Query Parameters**: `token` (JWT string)
* **Responses**: `200 OK` (HTML confirmation), `410 Gone` (Expired token), `400 Bad Request`.

##### `POST /api/auth/login`
* **Access**: Public \| **Rate Limit**: 10 req / 15 min (IP-based)
* **Headers**: `Content-Type: application/json`, `x-csrf-token`
* **Request Body**: `{ "email": "sourav@example.com", "password": "SecurePassword123!" }`
* **Responses**:
  * `200 OK`: Sets HTTP-only `token` cookie; returns user profile object.
  * `401 Unauthorized`: Invalid credentials.
  * `403 Forbidden`: Account unverified (`verified === false`).

##### `GET /api/auth/me`
* **Access**: Protected (Session cookie required)
* **Responses**: `200 OK` with user profile object (`id`, `username`, `email`, `verified`).

##### `POST /api/auth/logout`
* **Access**: Protected
* **Responses**: `200 OK`, clears `token` cookie, blacklists token in Redis.

##### `POST /api/auth/forgot-password`
* **Access**: Public \| **Rate Limit**: 3 req / 15 min
* **Request Body**: `{ "email": "sourav@example.com" }`
* **Responses**: `200 OK` (dispatches reset email).

##### `POST /api/auth/reset-password`
* **Access**: Public \| **Rate Limit**: 3 req / 15 min
* **Request Body**: `{ "token": "...", "password": "NewSecurePassword123!" }`
* **Responses**: `200 OK` upon successful update.

#### 4.2.2 Google OAuth 2.0 (`/api/auth/google`)
* `GET /api/auth/google?mode=signup|login`: Redirects to Google consent screen.
* `GET /api/auth/google/callback?code=...&state=...`: Handles OAuth callback and sets session cookie.

#### 4.2.3 Chat & Messaging Endpoints (`/api/chats`)

##### `POST /api/chats/message`
* **Access**: Protected \| **Rate Limits**: 10 req/min (burst) + 50 req/24hr (daily)
* **Request Body**:
```json
{
  "message": "Summarise my 3 latest emails and create a meeting notes PDF",
  "chatId": "651f8a7e9b0123456789abcd",
  "fileIds": ["651f8a7e9b0123456789abce"]
}
```
* **Response**: `200 OK` with `Content-Type: application/x-ndjson; charset=utf-8` stream.

##### `GET /api/chats`
* **Access**: Protected
* **Query Parameters**: `cursor` (ISO Date), `limit` (int, default 20, max 50)
* **Response**: `200 OK` with `{ "chats": [...], "hasMore": boolean, "nextCursor": "..." }`.

##### `GET /api/chats/messages/:chatId`
* **Access**: Protected
* **Query Parameters**: `cursor` (ObjectId), `limit` (int, default 20, max 50)
* **Response**: `200 OK` with `{ "messages": [...], "hasMore": boolean, "nextCursor": "..." }`.

##### `PATCH /api/chats/pinned/:chatId`
* **Access**: Protected
* **Response**: `200 OK` toggling pinned state.

##### `PATCH /api/chats/rename/:chatId`
* **Access**: Protected
* **Request Body**: `{ "newTitle": "Sprint Planning Notes" }`
* **Response**: `200 OK` with updated chat.

##### `DELETE /api/chats/delete/:chatId`
* **Access**: Protected
* **Response**: `200 OK`, deletes chat, messages, file records, and purges Cloudinary assets.

#### 4.2.4 File Management Endpoints (`/api/files`)
* `POST /api/files`: Accepts `multipart/form-data` (key: `file`), rate limited to 30 uploads/hour. Returns `201 Created` with file metadata.
* `GET /api/files/:fileId`: Returns processing status (`processing`, `ready`, `failed`).

#### 4.2.5 Workspace Connectors Endpoints (`/api/connectors`)
* `GET /api/connectors`: Returns connection status list (`gmail`, `calendar`, `drive`) with connected email addresses.
* `POST /api/connectors/google/:service/start`: Generates OAuth consent URL for specific service.
* `GET /api/connectors/google/callback`: Public callback endpoint validating state from Redis.
* `POST /api/connectors/actions/:id/confirm`: Authorizes and triggers execution of a pending write action.
* `POST /api/connectors/actions/:id/cancel`: Cancels and discards a pending write action.
* `DELETE /api/connectors/:service`: Disconnects service and deletes encrypted refresh token.

#### 4.2.6 Generated Files Endpoints (`/api/generated-files`)
* `GET /api/generated-files/:token`: Public download route serving binary file stream.

#### 4.2.7 System Diagnostics
* `GET /api/health`: Returns `{ "status": "ok", "uptime": 1234.56, "timestamp": 1728388000000 }`.

---

## 5. Data Models & Database Schemas

### 5.1 MongoDB Schemas (Mongoose)

#### 5.1.1 `User` Model (`users` collection)
```javascript
{
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### 5.1.2 `Chat` Model (`chats` collection)
```javascript
{
  user:      { type: ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, required: true, trim: true, maxlength: 60 },
  isPinned:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
// Compound Index: { user: 1, isPinned: 1, updatedAt: -1 }
```

#### 5.1.3 `Message` Model (`messages` collection)
```javascript
{
  chat:        { type: ObjectId, ref: 'Chat', required: true, index: true },
  content:     { type: String, required: true, trim: true },
  role:        { type: String, required: true, enum: ['user', 'ai'] },
  attachments: [{ type: ObjectId, ref: 'File' }],
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
}
// Compound Index: { chat: 1, _id: -1 }
```

#### 5.1.4 `File` Model (`files` collection)
```javascript
{
  user:         { type: ObjectId, ref: 'User', required: true, index: true },
  chat:         { type: ObjectId, ref: 'Chat', default: null, index: true },
  name:         { type: String, required: true, trim: true },
  mime:         { type: String, required: true },
  size:         { type: Number, required: true },
  url:          { type: String, required: true },
  publicId:     { type: String, required: true },
  resourceType: { type: String, required: true, enum: ['image', 'raw'] },
  status:       { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
  mode:         { type: String, enum: ['image', 'inline', 'rag'], default: null },
  failReason:   { type: String, default: null },
  extractedText:{ type: String, select: false },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now }
}
```

#### 5.1.5 `ConnectorAccount` Model (`connectoraccounts` collection)
```javascript
{
  userId:         { type: ObjectId, ref: 'User', required: true, index: true },
  service:        { type: String, enum: ['gmail', 'calendar', 'drive'], required: true },
  googleEmail:    { type: String, lowercase: true, trim: true },
  scopes:         [{ type: String }],
  refreshTokenEnc:{ type: String, required: true, select: false }, // AES-256 encrypted
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now }
}
// Compound Unique Index: { userId: 1, service: 1 } (unique: true)
```

#### 5.1.6 `GeneratedFile` Model (`generatedfiles` collection)
```javascript
{
  user:      { type: ObjectId, ref: 'User', index: true },
  token:     { type: String, required: true, unique: true }, // 32-char hex token
  name:      { type: String, required: true },
  mime:      { type: String, required: true },
  size:      { type: Number, required: true },
  data:      { type: Buffer, required: true, select: false },
  createdAt: { type: Date, default: Date.now, expires: 2592000 } // 30-day TTL auto-purge
}
```

---

### 5.2 Redis Architecture & Key Schema

| Key Pattern | Data Structure | TTL | Subsystem Purpose |
|---|---|---|---|
| `user:<userId>` | String (JSON) | 300s | Authenticated user session cache |
| `blacklist:token:<tokenHash>` | String ("1") | Remaining JWT TTL | Revoked session token blacklist |
| `email-verification:<userId>` | String (SHA-256) | 300s | Email verification token digest |
| `password-reset:user:<userId>` | String (SHA-256) | 300s | Password reset token digest |
| `global-rate-limit:<ip>` | Counter | 900s (15 min) | Global DDoS protection (300 req limit) |
| `auth-rate-limit:<ip>` | Counter | 900s (15 min) | Auth brute-force mitigation (10 req limit) |
| `forgotPassword-rate-limit:<ip>`| Counter | 900s (15 min) | Password reset brute-force limit (3 req) |
| `sendEmail-rate-limit:<ip>` | Counter | 900s (15 min) | Resend email rate limiter (3 req) |
| `email-rate-limit:<email>` | Counter | 900s (15 min) | Account enumeration limiter (5 req) |
| `rl:msg:min:<userId>` | Counter | 60s (1 min) | Chat burst limiter (10 msg / min) |
| `rl:msg:day:<userId>` | Counter | 86400s (24 hr) | Chat daily usage quota (50 msg / day) |
| `rl:file:hour:<userId>` | Counter | 3600s (1 hr) | File upload throttle (30 uploads / hr) |
| `cooldown:provider:<name>` | String ("1") | 30s – 600s | Circuit breaker active cooldown flag |
| `failures:provider:<name>` | Counter | 60s | Circuit breaker rolling failure counter |
| `connector:state:<state>` | String (JSON) | 600s | OAuth state data during connector linking |
| `connector:action:<id>` | String (JSON) | 900s (15 min) | Pending HITL action payload and preview |
| `connector:action:dedupe:<hash>`| String (actionId) | 120s (2 min) | De-duplication buffer across AI retries |

---

## 6. Non-Functional Requirements

### 6.1 Security & Cryptographic Standards
* **NFR-SEC-01 (Transport Security)**: All client-to-server and server-to-external communication **MUST** use TLS 1.3 (HTTPS / WSS).
* **NFR-SEC-02 (Data at Rest)**: Third-party OAuth refresh tokens **MUST** be encrypted via AES-256 with Galois/Counter Mode or CBC using `CONNECTOR_ENCRYPTION_KEY`. Plaintext tokens must never appear in database backups or query outputs.
* **NFR-SEC-03 (NoSQL Injection & Sanitization)**: All request parameters, body attributes, and query fields **MUST** be sanitized using `@exortek/express-mongo-sanitize` to strip `$` and `.` operators.
* **NFR-SEC-04 (CSRF Mitigation)**: Mutation endpoints **MUST** enforce CSRF validation (`csrfProtection` middleware) by validating explicit custom request headers.
* **NFR-SEC-05 (HTTP Hardening)**: Express server **MUST** apply HTTP security headers via `helmet` (HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options).

### 6.2 Reliability, Availability & Fault Tolerance
* **NFR-REL-01 (High Availability Fallback)**: The AI reasoning engine **MUST** maintain >= 99.9% uptime by automatically cascading through five heterogeneous AI providers (Gemini -> Groq -> Mistral -> OpenRouter -> Cohere).
* **NFR-REL-02 (Asynchronous Decoupling)**: Slow I/O processes (email delivery and PDF document parsing) **MUST** execute on decoupled BullMQ queues to ensure primary web worker event loops remain unblocked.
* **NFR-REL-03 (Resource Conservation)**: Disconnected client streams **MUST** automatically abort LLM downstream generation via `AbortController` within 250ms of socket close.

### 6.3 Performance & Scalability
* **NFR-PERF-01 (Time-to-First-Token)**: Streaming headers **MUST** flush immediately (`flushHeaders()`) ensuring initial text chunks reach client devices in under 1,500ms on healthy primary providers.
* **NFR-PERF-02 (Pre-Buffer Upload Throttling)**: `fileUploadLimit` rate limiter **MUST** validate upload quotas prior to Multer memory buffering to protect backend servers from out-of-memory (OOM) attacks.
* **NFR-PERF-03 (Database Query Efficiency)**: Message queries and conversation lists **MUST** utilize cursor-based pagination backed by compound indexes, executing queries in under 50ms for collections exceeding 1,000,000 documents.

### 6.4 Privacy by Design & Compliance
* **NFR-PRV-01 (Ephemeral Context Storage)**: Google Workspace data (emails, calendar entries, drive contents) **MUST NOT** be saved to persistent database collections; data exists exclusively in volatile process memory during agent execution.
* **NFR-PRV-02 (Zero AI Training Policy)**: User personal data and third-party connector streams **SHALL NEVER** be transmitted to model providers for training purposes.
* **NFR-PRV-03 (Immediate Data Deletion)**: Disconnecting any connector **MUST** immediately purge the encrypted credentials from the database.

---

## 7. Appendices & Configuration Matrix

### 7.1 Environment Variables Reference

| Variable Name | Environment | Required | Description |
|---|---|---|---|
| `NODE_ENV` | Backend | Yes | Execution mode (`development` \| `production`) |
| `PORT` | Backend | Yes | HTTP listening port (e.g. `3000`) |
| `BACKEND_URL` | Backend | Yes | Base URL of API server (e.g. `http://localhost:3000`) |
| `FRONTEND_URL` | Backend | Yes | Base URL of client application (e.g. `http://localhost:5173`) |
| `LOG_LEVEL` | Backend | Yes | Pino log verbosity (`debug`, `info`, `warn`, `error`) |
| `MONGO_URI` | Backend | Yes | MongoDB Atlas connection string |
| `REDIS_HOST` | Backend | Yes | Redis server hostname / IP |
| `REDIS_PORT` | Backend | Yes | Redis server port (e.g. `6379`) |
| `REDIS_PASSWORD` | Backend | Yes | Redis authentication password (empty if local) |
| `BCRYPT_GEN_SALT` | Backend | Yes | Salt work factor for password hashing (e.g. `10`) |
| `JWT_SECRET_KEY` | Backend | Yes | Secret key for signing primary session tokens |
| `EMAIL_VERIFICATION_JWT_SECRET_KEY` | Backend | Yes | Secret key for email verification links |
| `RESET_PASSWORD_JWT_SECRET_KEY` | Backend | Yes | Secret key for password reset tokens |
| `CONNECTOR_ENCRYPTION_KEY` | Backend | Yes | 32-character hex secret for AES refresh token encryption |
| `GOOGLE_CLIENT_ID` | Backend | Yes | Google Cloud OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | Backend | Yes | Google Cloud OAuth 2.0 Client Secret |
| `RESEND_API_KEY` | Backend | Yes | Resend API key for transactional email delivery |
| `CLOUDINARY_CLOUD_NAME` | Backend | Yes | Cloudinary cloud account namespace |
| `CLOUDINARY_API_KEY` | Backend | Yes | Cloudinary asset management API key |
| `CLOUDINARY_API_SECRET` | Backend | Yes | Cloudinary API secret |
| `CLOUDFLARE_ACCOUNT_ID` | Backend | Yes | Cloudflare account ID for Workers AI |
| `CLOUDFLARE_API_TOKEN` | Backend | Yes | Cloudflare API token with Workers AI permission |
| `TVLY_API_KEY` | Backend | Yes | Tavily AI search engine API key |
| `GEMINI_API_KEY` | Backend | Yes | Google Gemini API key |
| `GROQ_API_KEY` | Backend | Yes | Groq Cloud API key |
| `MISTRAL_API_KEY` | Backend | Yes | Mistral AI platform API key |
| `OPENROUTER_API_KEY` | Backend | Yes | OpenRouter multi-model gateway API key |
| `COHERE_API_KEY` | Backend | Yes | Cohere platform API key |
| `VITE_BACKEND_API` | Frontend | Yes | Backend API origin URL consumed by Axios / Sockets |

---

### 7.2 Requirements Traceability Matrix

| Requirement ID | Module / Service | File Path References | Test & Verification Method |
|---|---|---|---|
| `FR-AUTH-01..08` | Identity & Auth | `backend/src/routes/auth.route.js`<br>`backend/src/controllers/auth.controller.js` | Integration Test & JWT Verification |
| `FR-CHAT-01..02` | Stream & AI Routing | `backend/src/ai/modelRouting.js`<br>`backend/src/controllers/chat.controller.js` | Streaming NDJSON & Provider Failover Test |
| `FR-CHAT-03` | Agent & Tools | `backend/src/agent/agent.js`<br>`backend/src/services/image.service.js` | Tool Invocation & Mock Execution |
| `FR-CONN-01..06` | Workspace Connectors | `backend/src/connectors/index.js`<br>`backend/src/executors/actions.executors.js`<br>`backend/src/services/actions.service.js` | Google OAuth Simulation & HITL Confirmation Card Flow |
| `FR-GEN-01..03` | File Generation | `backend/src/tools/generatedfiles.tools.js`<br>`backend/src/routes/generatedfiles.route.js` | Binary Stream & Download Verification |
| `FR-FILE-01..04` | File Ingestion | `backend/src/middlewares/upload.middleware.js`<br>`backend/src/workers/file.worker.js` | Magic-Byte Inspection & BullMQ Processing Test |
| `NFR-SEC-01..05` | Security Hardening | `backend/src/middlewares/csrf.middleware.js`<br>`backend/src/app.js` | OWASP Vulnerability & Pen-Test Audit |
| `NFR-REL-01..03` | Resiliency & Limits | `backend/src/middlewares/rateLimiter.middleware.js`<br>`backend/src/ai/cooldown.js` | Redis Stress Testing & Load Generation |

---

<div align="center">

**Inquis Engineering Specification Document**  
*Maintained by Sourav Giri and the Inquis Development Team*

</div>
