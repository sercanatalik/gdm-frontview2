import { readFileSync } from 'fs';
import { join } from 'path';

export const SYSTEM_PROMPT = readFileSync(
  join(process.cwd(), 'app/api/ai/financing/prompt.md'),
  'utf-8'
);
