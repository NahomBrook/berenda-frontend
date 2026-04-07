import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import am from './locales/am.json';

const savedLang = localStorage.getItem('berenda_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('berenda_lang', lng);
  document.documentElement.lang = lng;
  // Apply Ethiopic font class to body when Amharic
  if (lng === 'am') {
    document.body.classList.add('lang-am');
  } else {
    document.body.classList.remove('lang-am');
  }
});

// Apply on load
if (savedLang === 'am') {
  document.body.classList.add('lang-am');
  document.documentElement.lang = 'am';
}

export default i18n;
