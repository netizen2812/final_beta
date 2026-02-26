import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: ['en', 'hi', 'ur', 'ml', 'bn'],
        ns: ['common'],
        defaultNS: 'common',
        interpolation: {
            escapeValue: false,
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        react: {
            useSuspense: false,
        },
    });

// Restore saved language from localStorage
const savedLang = localStorage.getItem('i18nextLng');
if (savedLang && ['en', 'hi', 'ur', 'ml', 'bn'].includes(savedLang)) {
    i18n.changeLanguage(savedLang);
}

export default i18n;
