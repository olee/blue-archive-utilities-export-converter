#!/usr/bin/env node
import { codeBlock } from 'common-tags';
import * as fs from 'node:fs/promises';
import { parseArgs } from 'node:util';
import {
    parseSchaleDbText,
    schaleDbToYuzutrends,
    serializeSchaleDbText,
    yuzutrendsToSchaleDb,
} from './convert.ts';
import type { SchaleDbExport } from './models/schaledb.ts';
import type { YuzutrendsExport } from './models/yuzutrends.ts';

type OutFormat = 'yuzutrends' | 'schaledb';

const DEFAULT_YUZU_PATH = 'yuzutrends.json';
const DEFAULT_SCHALE_PATH = 'schaledb.txt';

function usage(): never {
    console.error(codeBlock`
        Utility to convert between SchaleDB and YuzuTrends exports.
        
        Options:
            --schaledb <file>  SchaleDB input file
                    -S <file>

          --yuzutrends <file>  YuzuTrends input file
                    -Y <file>
        
               --out <format>  Output format (yuzutrends or schaledb)
                  -O <format>

        Examples:
          ./converter.ts --yuzutrends yuzutrends.json --out schaledb
          ./converter.ts --schaledb schaledb.txt --yuzutrends yuzutrends.json --out yuzutrends

        If more than the required input file is provided, converted data is merged into the existing export.
    `);
    process.exit(1);
}

function parseOut(value: string | undefined): OutFormat {
    if (value === 'yuzutrends' || value === 'schaledb') return value;
    console.error(`Invalid --out value: ${value ?? '(missing)'}`);
    usage();
}

async function readJson<T>(path: string): Promise<T> {
    return JSON.parse(await fs.readFile(path, 'utf8')) as T;
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

const SCHALEDB_DEBUG_JSON = 'schaledb.json';

async function dumpSchaleDbJson(data: SchaleDbExport): Promise<void> {
    await fs.writeFile(
        SCHALEDB_DEBUG_JSON,
        `${JSON.stringify(data, null, 2)}\n`,
    );
}

async function loadSchaleDb(path: string): Promise<SchaleDbExport> {
    const data = parseSchaleDbText(await fs.readFile(path, 'utf8'));
    await dumpSchaleDbJson(data);
    return data;
}

async function writeSchaleDb(
    path: string,
    data: SchaleDbExport,
): Promise<void> {
    await fs.writeFile(path, serializeSchaleDbText(data));
    await dumpSchaleDbJson(data);
}

async function main(): Promise<void> {
    const { values } = parseArgs({
        options: {
            schaledb: { type: 'string', short: 'S' },
            yuzutrends: { type: 'string', short: 'Y' },
            out: { type: 'string', short: 'O' },
        },
        allowPositionals: false,
    });

    const out = parseOut(values.out);

    switch (out) {
        case 'yuzutrends': {
            const schalePath = values.schaledb;
            if (!schalePath) {
                console.error('Converting to yuzutrends requires --schaledb (-S).');
                usage();
            }
            if (!(await fileExists(schalePath))) {
                throw new Error(`SchaleDB input not found: ${schalePath}`);
            }

            const yuzuPath = values.yuzutrends ?? DEFAULT_YUZU_PATH;
            const schale = await loadSchaleDb(schalePath);
            const existing = values.yuzutrends && (await fileExists(yuzuPath))
                ? await readJson<YuzutrendsExport>(yuzuPath)
                : undefined;
            const result = schaleDbToYuzutrends(schale, existing);
            await fs.writeFile(yuzuPath, `${JSON.stringify(result, null, 4)}\n`);
            console.error(existing
                ? `Merged into yuzutrends export at ${yuzuPath}`
                : `Wrote new yuzutrends export to ${yuzuPath}`,
            );
            break;
        }
        case 'schaledb': {
            const yuzuPath = values.yuzutrends;
            if (!yuzuPath) {
                console.error('Converting to schaledb requires --yuzutrends (-Y).');
                usage();
            }
            if (!(await fileExists(yuzuPath))) {
                throw new Error(`Yuzutrends input not found: ${yuzuPath}`);
            }

            const schalePath = values.schaledb ?? DEFAULT_SCHALE_PATH;
            const yuzu = await readJson<YuzutrendsExport>(yuzuPath);
            const existing = values.schaledb && (await fileExists(schalePath))
                ? await loadSchaleDb(schalePath)
                : undefined;
            const result = yuzutrendsToSchaleDb(yuzu, existing);
            await writeSchaleDb(schalePath, result);
            console.error(existing
                ? `Merged into SchaleDB export at ${schalePath}`
                : `Wrote new SchaleDB export to ${schalePath}`,
            );
            break;
        }
        default:
            throw new Error(`Invalid output format: ${out}`);
    }
}

main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
