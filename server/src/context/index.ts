/**
 * Context Module Exports
 */

// Prompt system (new modular architecture)
export {
  PromptRouter,
  promptRouter,
  getPromptStats,
  type PromptDomain,
  type PromptAssemblyConfig,
  // Individual prompt pieces
  personaPrompt,
  guardrailsPrompt,
  responseFormatPrompt,
  emailDomainPrompt,
  calendarDomainPrompt,
  generalDomainPrompt,
  widgetCapabilityPrompt,
} from './prompts';

// Legacy wrapper (backwards compat - prefer PromptRouter directly)
export { SystemPromptBuilder } from './system-prompts';

// Conversation memory
export {
  ConversationManager,
  type ConversationEntry,
  type ConversationMemory,
  type ConversationManagerConfig,
} from './conversation-memory';

// User context
export {
  UserContextProvider,
  type UserProfile,
  type UserContextData,
} from './user-context';
