import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../../src/lib/db/schema';

export const mockClient = drizzle.mock({ schema });
