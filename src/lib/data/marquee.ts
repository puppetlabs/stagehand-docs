import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { MarqueeDocument } from './types';

export interface LoadMarqueeOptions {
  path?: string;
}

const sourceDataPath = (moduleRelativePath: string, projectRelativePath: string): string => {
  const modulePath = fileURLToPath(new URL(moduleRelativePath, import.meta.url));
  return existsSync(modulePath) ? modulePath : resolve(process.cwd(), projectRelativePath);
};

const dataPath = sourceDataPath('../../data/marquee.json', 'src/data/marquee.json');
const schemaPath = sourceDataPath(
  '../../data/schema/marquee.schema.json',
  'src/data/schema/marquee.schema.json',
);

// Test-only data sets, selected by an exact fixture name (never a free-form path), mirroring the
// compatibility register's fixture flags. They are used to build the page against hostile text.
const fixtureDataPaths: Record<string, string> = {
  hostile: resolve(process.cwd(), 'tests/fixtures/data/marquee-hostile-text.json'),
  valid: resolve(process.cwd(), 'tests/fixtures/data/marquee-valid.json'),
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const describeErrors = (errors: ErrorObject[] | null | undefined) =>
  (errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');

export const loadMarquee = (options: LoadMarqueeOptions = {}): MarqueeDocument => {
  const fixtureName = process.env.STAGEHAND_MARQUEE_FIXTURE;
  const source =
    options.path ??
    (fixtureName !== undefined && fixtureName in fixtureDataPaths
      ? fixtureDataPaths[fixtureName]
      : dataPath);

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(source, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read marquee data from ${source}: ${(error as Error).message}`);
  }

  const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));
  if (!validate(parsed)) {
    throw new Error(`Invalid marquee data in ${source}: ${describeErrors(validate.errors)}`);
  }

  return parsed as MarqueeDocument;
};
