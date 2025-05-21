import { resolve } from 'path';
import { generateOpenApiSpec } from '../src/lib';

const result = await generateOpenApiSpec();
await Bun.file(resolve(__dirname, '../openapi.yaml')).write(result);
