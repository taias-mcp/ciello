/**
 * Tool Registry
 * 
 * Exports all tool handlers and schemas for MCP registration.
 * Each tool is self-contained in its own file with schema, types, and handler.
 */

// Handlers
export { handleStartOnboarding } from "./start-onboarding.js";
export { handleSetupBoard } from "./setup-board.js";
export { handleCreateFirstTask } from "./create-first-task.js";
export { handleExpandBoard } from "./expand-board.js";
export { handleFinishSetup } from "./finish-setup.js";

// Schemas
export { startOnboardingSchema } from "./start-onboarding.js";
export { setupBoardSchema } from "./setup-board.js";
export { createFirstTaskSchema } from "./create-first-task.js";
export { expandBoardSchema } from "./expand-board.js";
export { finishSetupSchema } from "./finish-setup.js";

// Import schemas for the allToolSchemas array
import { startOnboardingSchema } from "./start-onboarding.js";
import { setupBoardSchema } from "./setup-board.js";
import { createFirstTaskSchema } from "./create-first-task.js";
import { expandBoardSchema } from "./expand-board.js";
import { finishSetupSchema } from "./finish-setup.js";

/** All tool schemas for MCP registration */
export const allToolSchemas = [
  startOnboardingSchema,
  setupBoardSchema,
  createFirstTaskSchema,
  expandBoardSchema,
  finishSetupSchema
] as const;
