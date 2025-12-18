/**
 * Conversation and message types for chat history
 */

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  kb_type: string;
  mode: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id?: string;
  type: "human" | "ai";
  content: string | any;
  timestamp?: string;
  metadata?: Record<string, any>;
  additional_kwargs?: Record<string, any>;
}
