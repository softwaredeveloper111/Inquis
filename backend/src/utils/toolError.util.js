import { AppError } from "./appError.util.js";

/** User-friendly error. Tools ise model ko text ki tarah dete hain, REST routes 502/4xx bana dete hain */
export class ToolError extends AppError {
  constructor(message, status = 502) {
    super(message, status);
  }
}