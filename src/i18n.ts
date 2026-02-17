/**
 * @module @dreamer/web3/i18n
 *
 * i18n for @dreamer/web3: error and warning messages.
 * When lang is not passed, locale is auto-detected from env
 * (LANGUAGE/LC_ALL/LANG).
 */

import {
  $i18n,
  getGlobalI18n,
  getI18n,
  type TranslationData,
  type TranslationParams,
} from "@dreamer/i18n";
import { getEnv } from "@dreamer/runtime-adapter";
import enUS from "./locales/en-US.json" with { type: "json" };
import zhCN from "./locales/zh-CN.json" with { type: "json" };

/** Supported locale. */
export type Locale = "en-US" | "zh-CN";

/** Default locale when detection fails. */
export const DEFAULT_LOCALE: Locale = "en-US";

const WEB3_LOCALES: Locale[] = ["en-US", "zh-CN"];

let web3TranslationsLoaded = false;

/**
 * Detect locale: LANGUAGE > LC_ALL > LANG.
 * Falls back to DEFAULT_LOCALE when unset or not in supported list.
 */
export function detectLocale(): Locale {
  const langEnv = getEnv("LANGUAGE") || getEnv("LC_ALL") || getEnv("LANG");
  if (!langEnv) return DEFAULT_LOCALE;
  const first = langEnv.split(/[:\s]/)[0]?.trim();
  if (!first) return DEFAULT_LOCALE;
  const match = first.match(/^([a-z]{2})[-_]([A-Z]{2})/i);
  if (match) {
    const normalized = `${match[1].toLowerCase()}-${
      match[2].toUpperCase()
    }` as Locale;
    if (WEB3_LOCALES.includes(normalized)) return normalized;
  }
  const primary = first.substring(0, 2).toLowerCase();
  if (primary === "zh") return "zh-CN";
  if (primary === "en") return "en-US";
  return DEFAULT_LOCALE;
}

/**
 * Load web3 translations into the current I18n instance (once).
 */
export function ensureWeb3I18n(): void {
  if (web3TranslationsLoaded) return;
  const i18n = getGlobalI18n() ?? getI18n();
  i18n.loadTranslations("en-US", enUS as TranslationData);
  i18n.loadTranslations("zh-CN", zhCN as TranslationData);
  web3TranslationsLoaded = true;
}

/**
 * Load translations and set current locale. Call once at entry (e.g. mod, client).
 */
export function initWeb3I18n(): void {
  ensureWeb3I18n();
  $i18n.setLocale(detectLocale());
}

/**
 * Translate by key. When lang is not passed, uses current locale (set at entry).
 * Do not call ensure/init inside $t; call initWeb3I18n() at entry.
 */
export function $t(
  key: string,
  params?: TranslationParams,
  lang?: Locale,
): string {
  if (lang !== undefined) {
    const prev = $i18n.getLocale();
    $i18n.setLocale(lang);
    try {
      return $i18n.t(key, params);
    } finally {
      $i18n.setLocale(prev);
    }
  }
  return $i18n.t(key, params);
}
