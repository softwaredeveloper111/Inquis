import { AIMessage } from "langchain";
import { logger } from "../lib/logger.js";
import { providers } from "./providers.js";
import { isCoolingDown, setCooldown, recordFailure } from "./cooldown.js";
import {agentStream} from "../agent/agent.js"


const OVERALL_DEADLINE_MS = 20_000; // pehla token aane tak poori chain ka max time
const MAX_STREAM_MS = 90_000; // pehla token aane ke baad, poore answer ka max time
const MIN_REMAINING_MS = 1_000;
const RETRY_DELAY_MS = 300; // + jitter
const COOLDOWN_429_DEFAULT_SEC = 60;
const COOLDOWN_AUTH_SEC = 600;
const COOLDOWN_UNAVAILABLE_SEC = 30;
const FAILURES_BEFORE_COOLDOWN = 3;
const AGENT_DEADLINE_MS = 60_000;


/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class ProviderError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

/** Saare providers fail hue (pehla token aane se pehle). Controller isko 503 banata hai. */
export class AllProvidersFailedError extends Error {
  constructor(message = "All AI providers failed") {
    super(message);
    this.name = "AllProvidersFailedError";
  }
}

/** Stream shuru ho chuki thi, beech mein toot gayi. Fallback nahi hota, user retry karega. */
export class StreamInterruptedError extends Error {
  constructor(message = "Stream interrupted") {
    super(message);
    this.name = "StreamInterruptedError";
  }
}





/**
 * Raw provider/LangChain error -> { kind, retryAfter? }
 * kind: rate_limit | unavailable | server | auth | context_length | bad_request
 */
export function classifyError(err) {
  if (err instanceof ProviderError) return { kind: err.kind };

  const status = err?.status ?? err?.statusCode ?? err?.response?.status ?? err?.cause?.status;
  const msg = String(err?.message ?? "");
  const code = err?.code ?? err?.cause?.code;

  if (status === 429) return { kind: "rate_limit", retryAfter: getRetryAfter(err) };
  if (status === 401 || status === 403) return { kind: "auth" };

  if (status === 400 || status === 413 || status === 422) {
    if (/api key/i.test(msg)) return { kind: "auth" };
    if (/context|too long|maximum.*tokens|token limit|too large/i.test(msg))
      return { kind: "context_length" };
    return { kind: "bad_request" };
  }

  if (status === 503) return { kind: "unavailable" };
  if (status >= 500) return { kind: "server" };

  if (
    err?.name === "AbortError" ||
    err?.name === "TimeoutError" ||
    ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "UND_ERR_CONNECT_TIMEOUT"].includes(code)
  ) {
    return { kind: "unavailable" };
  }

  if (/\b429\b|rate.?limit|quota/i.test(msg))
    return { kind: "rate_limit", retryAfter: getRetryAfter(err) };
  if (/\b503\b|unavailable|overloaded/i.test(msg)) return { kind: "unavailable" };
  if (/\b40[13]\b|unauthorized|invalid api key/i.test(msg)) return { kind: "auth" };

  return { kind: "server" };
}






function getRetryAfter(err) {
  const headers = err?.headers ?? err?.response?.headers;
  const raw =
    typeof headers?.get === "function" ? headers.get("retry-after") : headers?.["retry-after"];
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 300) : undefined;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Gemini kabhi content blocks ka array deta hai, kabhi string */
export function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => (typeof c === "string" ? c : c?.type === "text" ? c.text : ""))
      .join("");
  }
  return "";
}

const estimateTokens = (m) => Math.ceil(extractText(m.content).length / 4);



function trimToBudget(messages, maxTokens) {
  const [system, ...rest] = messages;
  let total = estimateTokens(system);
  const kept = [];

  for (let i = rest.length - 1; i >= 0; i--) {
    const t = estimateTokens(rest[i]);
    if (kept.length > 0 && total + t > maxTokens) break;
    total += t;
    kept.unshift(rest[i]);
  }
  while (kept.length > 1 && kept[0] instanceof AIMessage) kept.shift();

  return [system, ...kept];
}

/* ------------------------------------------------------------------ */
/* Single provider attempt (max 1 retry) — STREAMING                   */
/* ------------------------------------------------------------------ */

/**
 * GOLDEN RULE:
 *  - Pehla token aane se PEHLE fail  -> retry / fallback allowed
 *  - Pehla token aane ke BAAD fail   -> fallback NAHI (half answer ja chuka hai), StreamInterruptedError
 */
async function callProvider(provider, messages, deadline, onToken, clientSignal ,useAgent , onStatus) {
  const input = trimToBudget(messages, provider.maxContextTokens);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_REMAINING_MS) return { ok: false };
    if (clientSignal?.aborted) return { ok: false, stop: true };

    // ek controller: timeout aur client-disconnect dono isi se stream rokte hain
    const controller = new AbortController();
    clientSignal?.addEventListener("abort", () => controller.abort(), { once: true });

    // pehle token ka timeout (time-to-first-token)
   let timer = setTimeout(() => controller.abort(), Math.min(provider.timeoutMs, remaining));
    let started = false;
    let gotChunk = false; 
    let text = "";

    try {


      const stream = useAgent? agentStream(provider.model, input, controller.signal , onStatus): await provider.model.stream(input, { signal: controller.signal });

      for await (const chunk of stream) {

          if (!gotChunk) {
    gotChunk = true; // provider zinda hai (text ya tool call, kuch bhi aaya)
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(), useAgent ? AGENT_DEADLINE_MS : MAX_STREAM_MS);
  }

        const piece = extractText(chunk.content);
        if (!piece) continue; // pehla chunk aksar khaali hota hai

        if (!started) {
          started = true;
          clearTimeout(timer);
          timer = setTimeout(() => controller.abort(), MAX_STREAM_MS); // ab poore answer ka cap
        }
        text += piece;
        onToken(piece);
      }
      
        const fake = [...text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].some(
        (m) => !m[1].startsWith("https://res.cloudinary.com/")
      );
      if (fake) throw new ProviderError("server", "model invented an image url");

      if (!text.trim()) throw new ProviderError("server", "empty response");
      return { ok: true, content: text };
    } catch (err) {
      // user khud chala gaya (tab band): error nahi, bas ruk jao
      if (clientSignal?.aborted) return { ok: false, stop: true };

      // stream beech mein toota: fallback nahi
      if (started) {
        logger.error({ provider: provider.name, error: err?.message }, "stream interrupted mid-way");
        throw new StreamInterruptedError();
      }

      const { kind, retryAfter } = classifyError(err);
      logger.warn(
        { provider: provider.name, kind, status: err?.status ?? err?.statusCode, attempt, error: err?.message },
        "provider call failed"
      );

      switch (kind) {
        case "rate_limit":
          await setCooldown(provider.name, retryAfter ?? COOLDOWN_429_DEFAULT_SEC);
          return { ok: false };

        case "auth":
          logger.error({ provider: provider.name }, "ALERT: provider auth failed, check API key");
          await setCooldown(provider.name, COOLDOWN_AUTH_SEC);
          return { ok: false };

        case "context_length":
          return { ok: false };

        case "bad_request":
          logger.error({ provider: provider.name, error: err?.message }, "bad request, aborting chain");
          return { ok: false, stop: true };

        default: // unavailable | server
          if (attempt === 1) {
            await sleep(RETRY_DELAY_MS + Math.random() * 300);
            continue;
          }
          if ((await recordFailure(provider.name)) >= FAILURES_BEFORE_COOLDOWN) {
            await setCooldown(provider.name, COOLDOWN_UNAVAILABLE_SEC);
          }
          return { ok: false };
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false };
}

/* ------------------------------------------------------------------ */
/* Public: chain                                                       */
/* ------------------------------------------------------------------ */

/**
 * @param messages LangChain messages, messages[0] = SystemMessage
 * @param options.onToken  har text piece par call hota hai
 * @param options.signal   client disconnect par abort hota hai
 * @returns {{ content: string, provider: string }}   (content = poora final text)
 * @throws AllProvidersFailedError   pehla token aane se pehle sab fail
 * @throws StreamInterruptedError    stream beech mein toot gayi
 */
export async function routeChat(
  messages,
  { onToken = () => {}, onStatus, signal, useAgent = false, needsVision = false } = {}
) {
  const deadline = Date.now() + (useAgent ? AGENT_DEADLINE_MS : OVERALL_DEADLINE_MS);

  // capability filter PEHLE, cooldown baad mein
  let candidates = providers;
  if (useAgent) candidates = candidates.filter((p) => p.supportsTools);
  if (needsVision) candidates = candidates.filter((p) => p.supportsVision);

  const cooling = await Promise.all(candidates.map((p) => isCoolingDown(p.name)));
  let pool = candidates.filter((_, i) => !cooling[i]);

  if (pool.length === 0) {
    logger.warn("all candidate providers cooling down, trying anyway");
    pool = candidates;
  }

  for (const provider of pool) {
    if (deadline - Date.now() < MIN_REMAINING_MS) break;

    const result = await callProvider(provider, messages, deadline, onToken, signal, useAgent, onStatus);
    if (result.ok) {
      logger.info({ provider: provider.name }, "ai response served");
      return { content: result.content, provider: provider.name };
    }
    if (result.stop) break;
  }

  throw new AllProvidersFailedError();
}







/**
 * extractText: LLM ka response string ya array of content blocks ho sakta hai. extractText() dono ko plain text mein convert karta hai.
 * LLM response
    ↓
extractText()
    ↓
plain string


example:
llm reponse: "Hello bro"
ya fir
llm response: [
  { type: "text", text: "Hello " },
  { type: "text", text: "bro" }
]

  extractText function alwasy return "Hello bro"

 */





  /**
   * trimToBudget :P rovider ko input bhejne se pehle messages ko uske maxContextTokens limit ke andar rakhna.Messages
   ↓
trimToBudget(messages, provider.maxContextTokens)
   ↓
System message + latest messages
   ↓
Provider ko send


agar conversation jada bada hua to 
Old messages  ← remove
      ↓
Latest messages ← keep
      ↓
System message  ← keep
   */







/**
 * callProvider() this is the main engine of the modelRouting.js
 * 
 * callProvider()
    ↓
messages ko provider ke context budget mein trim
    ↓
Attempt 1
    ↓
provider.model.stream()
    ↓
First token aaya?

Agar first token nahi aaya:
error
 ↓
classifyError()
 ↓
retry / cooldown / next provider

Agar first token aa gaya:
streaming start
     ↓
tokens user ko ja rahe hain
     ↓
beech mein error
     ↓
❌ fallback nahi
     ↓
StreamInterruptedError
 */