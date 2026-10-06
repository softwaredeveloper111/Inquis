import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Request-scoped context: { userId, emit }
 * Controller/socket handler generateResponse() ko run(...) mein wrap karta hai, to ai.service,
 * modelRouting aur agent ke function signatures badalne nahi padte.
 *   emit(event) -> client ko live event bhejta hai (confirmation card)
 */
const als = new AsyncLocalStorage();

export const runWithConnectorContext = (ctx, fn) => als.run(ctx, fn);
export const getConnectorContext = () => als.getStore();