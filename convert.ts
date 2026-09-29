import type { Student } from './models/generic.ts';
import {
    baToSchaleDb,
    mergeWithGeneric as mergeSchaleDb,
    schaleDbToBa,
    type SchaleDbExport,
} from './models/schaledb.ts';
import {
    mergeWithGeneric as mergeYuzutrends,
    fromGeneric as yuzuFromGeneric,
    toGeneric as yuzuToGeneric,
    type YuzutrendsExport,
} from './models/yuzutrends.ts';

function decodeBase64Utf8(base64: string): string {
    const binary = atob(base64.trim());
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

/** Parse a SchaleDB export from its base64 text form. */
export function parseSchaleDbText(base64: string): SchaleDbExport {
    const decoded = decodeBase64Utf8(base64);
    if (!decoded.startsWith('{')) {
        throw new Error('Invalid SchaleDB base64 string');
    }
    return JSON.parse(decoded) as SchaleDbExport;
}

/** Serialize a SchaleDB export to its base64 text form. */
export function serializeSchaleDbText(data: SchaleDbExport): string {
    return encodeBase64Utf8(JSON.stringify(data));
}

/** Convert SchaleDB students into a yuzutrends export (optionally merging). */
export function schaleDbToYuzutrends(
    schale: SchaleDbExport,
    existing?: YuzutrendsExport,
): YuzutrendsExport {
    const students: Student[] = schaleDbToBa(schale);
    if (existing) {
        return mergeYuzutrends(existing, students);
    }
    return yuzuFromGeneric(students);
}

/** Convert a yuzutrends export into SchaleDB (optionally merging). */
export function yuzutrendsToSchaleDb(
    yuzu: YuzutrendsExport,
    existing?: SchaleDbExport,
): SchaleDbExport {
    const students: Student[] = yuzuToGeneric(yuzu);
    if (existing) {
        return mergeSchaleDb(existing, students);
    }
    return baToSchaleDb(students);
}
