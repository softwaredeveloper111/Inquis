import { createAgent, tool } from "langchain";
import { z } from "zod";
import {logger} from "../lib/logger.js"

import { dateTime } from "../services/calender.service.js";
import { EvalMathExp } from "../services/math.service.js";
import { webSearch } from "../services/websearch.service.js";
import { generateImage } from "../services/image.service.js";

import { getConnectorTools } from "../connectors/index.js";

import { generatedFileTools } from "../tools/generatedfiles.tools.js";


/** logger wrapper function */
const withLog = (name, fn) => async (args) => {
  const start = Date.now();
  logger.info({ tool: name, args }, "tool called");
  const result = await fn(args);
  logger.info({ tool: name, ms: Date.now() - start }, "tool done");
  return result;
};


const websearchTool = tool(
  
  withLog("webSearchTool", webSearch),
  {
    name: "webSearchTool",
    description:
      "Search the internet for current information. When the user specifies a date, prioritize sources published on or after that date and report the publicat date and source for every result",
    schema: z.object({
      question: z.string().describe("The question or topic to search for"),
    }),
  },
);



const calculatorTool = tool(
  withLog("calculatorTool", EvalMathExp),
  {
    name:"calculatorTool",
    description:"Use this tool to perform mathematical calculations accurately. Input should be a mathematical expression.",
     schema: z.object({
      expression: z
        .string()
        .describe("The mathematical expression to calculate"),
    }),
  }
)



const dateTimeTool = tool(
  withLog("dateTimeTool", dateTime),
  {
    name:"dateTimeTool",
    description:"Use this tool for date and time operations such as getting the current time, finding the day of a date, calculating the difference between dates, adding days, and checking time in different timezones.",
    schema: z.object({
      operation: z.enum([
        "current_time",
        "day_of_week",
        "date_difference",
        "add_days",
        "timezone",
      ]),

      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format"),

      date2: z
        .string()
        .optional()
        .describe("Second date in YYYY-MM-DD format"),

      timezone: z
        .string()
        .optional()
        .describe(
          "IANA timezone such as Asia/Kolkata or America/New_York"
        ),

      days: z
        .number()
        .optional()
        .describe("Number of days to add"),
    })
  }
)


const imageTool = tool(
  withLog("imageTool", generateImage), 
  {
  name: "imageTool",
  description:
    "Generate an image from a text description. Use ONLY when the user asks to create, draw or generate an image. Write the prompt in English with subject, style and lighting.",
  schema: z.object({
    prompt: z.string().describe("Detailed English description of the image"),
  }),
});



const tools = [ websearchTool, calculatorTool, dateTimeTool, imageTool , ...generatedFileTools];


export async function* agentStream(model, messages, signal ,onStatus) {
  const [system, ...rest] = messages; // messages[0] = SystemMessage
   const { tools: connectorTools, prompt: connectorPrompt } = await getConnectorTools();
   const agent = createAgent({
    model,
    tools: [...tools, ...connectorTools],
    systemPrompt: system.content + connectorPrompt,
  });

  const stream = await agent.stream(
    { messages: rest },
    { streamMode: "messages", signal, recursionLimit: 11 } // ~5 tool steps
  );

  for await (const [chunk, meta] of stream) {
  if (meta?.langgraph_node !== "model_request") continue;
  if (chunk.tool_call_chunks?.some((c) => c.name === "imageTool")) onStatus?.("image");
  yield chunk;
}
}




// Controller
//    ↓
// ai.service.js
//    ↓
// Agent
//    ├── webSearchTool
//    ├── calculatorTool
//    └── dateTimeTool
//    ↓
// LLM
//    ↓
// existing modelRouting
//    ↓
// Gemini → Groq → Mistral → OpenRouter → Cohere
