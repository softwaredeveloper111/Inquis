import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenRouter } from "@langchain/openrouter";
import { ChatCohere } from "@langchain/cohere";
import { config } from "../config/config.js";

/**
 * IMPORTANT: maxRetries hamesha 0.
 * Retry / fallback ka control sirf router ke paas hai, SDK ke paas nahi.
 *
 * maxContextTokens = input ke liye safe budget (provider ke real limit se kam rakho,
 * khaaskar Groq jaisi tight TPM wali free tiers pe). Apne plan ke hisaab se tune karo.
 *
 * Array ka order hi fallback order hai.
 */
export const providers = [
  {
    name: "gemini",
    timeoutMs: 12_000,
    maxContextTokens: 100_000,
    model: new ChatGoogleGenerativeAI({
      model: "gemini-3.5-flash-lite",
      apiKey: config.GEMINI_API_KEY,
      maxTokens: 4096,
      maxRetries: 0,
    }),
    supportsTools: true,
    supportsVision: true,
  },
  {
    name: "groq",
    timeoutMs: 12_000,
    maxContextTokens: 6_000,
    model: new ChatGroq({
      model: "openai/gpt-oss-120b",
      apiKey: config.GROQ_API_KEY,
      temperature: 0,
      maxTokens: 4096,
      maxRetries: 0,
    }),
    supportsTools: true,
  },
  {
    name: "mistral",
    timeoutMs: 12_000,
    maxContextTokens: 30_000,
    model: new ChatMistralAI({
      model: "ministral-3b-2512",
      apiKey: config.MISTRAL_API_KEY,
      maxTokens: 4096,
      maxRetries: 0,
    }),
    supportsTools: true,
  },
  {
    name: "openrouter",
    timeoutMs: 15_000,
    maxContextTokens: 30_000,
    model: new ChatOpenRouter({
      model: "nvidia/nemotron-3.5-lightning:free",
      apiKey: config.OPENROUTER_API_KEY,
      temperature: 0,
      maxTokens: 4096,
      maxRetries: 0,
    }),
    supportsTools: true,
  },
  {
    name: "cohere",
    timeoutMs: 12_000,
    maxContextTokens: 30_000,
    model: new ChatCohere({
      model: "command-r7b-12-2024",
      apiKey: config.COHERE_API_KEY,
      temperature: 0,
      maxTokens: 4096,
      maxRetries: 0,
    }),
    supportsTools: true
  },
];

/** Sirf title ke liye. Router/cooldown yahan nahi lagta. */
export const titleModel = new ChatMistralAI({
  model: "ministral-3b-2512",
  apiKey: config.MISTRAL_API_KEY,
  temperature: 0.2,
  maxTokens: 25,
  maxRetries: 0,
});