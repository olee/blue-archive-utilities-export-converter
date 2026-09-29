import * as esbuild from 'esbuild';
import { mkdir } from 'node:fs/promises';

const GH_REPO = 'olee/blue-archive-utilities-export-converter';
const LATEST_DOWNLOAD_URL = `https://github.com/${GH_REPO}/releases/latest/download/schaledb.js`;

/** Prefer CI tag (`v1.0.1`), fall back to package.json / local dev. */
function resolveVersion(): string {
    const raw =
        process.env.USERSCRIPT_VERSION ??
        process.env.npm_package_version ??
        '0.0.0-dev';
    return raw.replace(/^v/i, '');
}

const version = resolveVersion();

const USERSCRIPT_BANNER = `// ==UserScript==
// @name         SchaleDB import converter (from YuzuTrends export)
// @namespace    https://github.com/${GH_REPO}
// @version      ${version}
// @description  Converts pasted YuzuTrends JSON export into SchaleDB base64 on the import field
// @match        https://schaledb.com/*
// @match        https://*.schaledb.com/*
// @updateURL    ${LATEST_DOWNLOAD_URL}
// @downloadURL  ${LATEST_DOWNLOAD_URL}
// @grant        none
// @run-at       document-idle
// ==/UserScript==
`;

await mkdir('dist/userscripts', { recursive: true });

await esbuild.build({
    entryPoints: ['userscripts/schaledb.ts'],
    outfile: 'dist/userscripts/schaledb.js',
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    banner: { js: USERSCRIPT_BANNER },
    logLevel: 'info',
});

console.error(`Built userscript v${version} → dist/userscripts/schaledb.js`);
