import app from '../server/src/index';
import { initDatabase } from '../server/src/database/db';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
  return app(req, res);
}
