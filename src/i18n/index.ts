import { createI18n } from 'vue-i18n'
import en from './en'
import de from './de'
import fr from './fr'
import es from './es'
import it from './it'

export type MessageSchema = typeof en

const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'es', 'it'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function detectLocale(): SupportedLocale {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const lang of candidates) {
    const short = lang.slice(0, 2).toLowerCase()
    if (SUPPORTED_LOCALES.includes(short as SupportedLocale)) return short as SupportedLocale
  }
  return 'en'
}

export const i18n = createI18n<[MessageSchema], SupportedLocale>({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, de, fr, es, it },
})
