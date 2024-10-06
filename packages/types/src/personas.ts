export const PERSONA_ID_PREFIX = 'prsn';

export interface BoxPersonaDB {
  id: string;
  name: string;
  system_prompt: string;
  github_app_id: string;
  github_client_id: string;
  github_private_key: string;
  filter?: Record<string, string>;
}
