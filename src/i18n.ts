import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Intentar obtener el idioma guardado
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    lng: savedLanguage || 'es',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    ns: ['common'],
    defaultNS: 'common',
  });

export default i18n;