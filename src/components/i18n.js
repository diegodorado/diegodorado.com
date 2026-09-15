import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import en from "../translations/en.json"
import es from "../translations/es.json"
import quotes from "../data/quotes.json"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en, es },
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    debug: process.env.NODE_ENV === "development",
    saveMissing: process.env.NODE_ENV === "development",
    updateMissing: process.env.NODE_ENV === "development",
    load: "languageOnly",
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })

//todo: is this the right places for this??
i18n.quotes = quotes

export default i18n
