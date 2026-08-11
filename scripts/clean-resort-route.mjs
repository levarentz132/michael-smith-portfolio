import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staleAssetDirectory = path.join(projectRoot, 'dist', 'resort');

await fs.rm(staleAssetDirectory, { recursive: true, force: true });
console.log(`Removed stale route-conflicting directory: ${staleAssetDirectory}`);
