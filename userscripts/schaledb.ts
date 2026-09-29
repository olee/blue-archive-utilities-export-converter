/// <reference lib="dom" />

import { serializeSchaleDbText, yuzutrendsToSchaleDb } from '../convert.ts';
import type { YuzutrendsExport } from '../models/yuzutrends.ts';

const INPUT_SELECTOR = '.modal-body [placeholder="Paste export string here and click Import"]';

function isYuzutrendsExport(value: unknown): value is YuzutrendsExport {
    return (
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as YuzutrendsExport).globalPlans)
    );
}

/** Try parse pasted text as yuzutrends JSON and convert to SchaleDB base64. */
function tryConvertYuzutrends(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) {
        return null;
    }

    try {
        const parsed: unknown = JSON.parse(trimmed);
        if (!isYuzutrendsExport(parsed)) {
            return null;
        }
        return serializeSchaleDbText(yuzutrendsToSchaleDb(parsed));
    } catch {
        return null;
    }
}

function setNativeValue(
    el: HTMLInputElement | HTMLTextAreaElement,
    value: string,
): void {
    const proto = el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

const ATTACHED = new WeakSet<Element>();

function attach(el: HTMLInputElement | HTMLTextAreaElement): void {
    if (ATTACHED.has(el)) {
        return;
    }
    ATTACHED.add(el);

    let converting = false;

    const onUpdate = (): void => {
        if (converting) {
            return;
        }
        const converted = tryConvertYuzutrends(el.value);
        if (converted === null || converted === el.value) {
            return;
        }

        converting = true;
        try {
            setNativeValue(el, converted);
        } finally {
            converting = false;
        }
    };

    el.addEventListener('input', onUpdate);
    el.addEventListener('change', onUpdate);
    el.addEventListener('paste', () => queueMicrotask(onUpdate));
}

function scan(): void {
    for (const el of document.querySelectorAll(INPUT_SELECTOR)) {
        if (
            el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement
        ) {
            attach(el);
        }
    }
}

function start(): void {
    scan();
    new MutationObserver(scan).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}

start();
