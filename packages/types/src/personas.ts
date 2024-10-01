export const PERSONA_ID_PREFIX = 'prsn';

export interface BoxPersonaDB {
  id: string;
  name: string;
  systemPrompt: string;
  filter?: Record<string, string>;
}
