import React, { createContext, useContext, useEffect, useState } from 'react'

export type LanguageCode = 'en' | 'hi' | 'kn' | string

export interface LanguageOption {
  code: string
  name: string
  nativeName: string
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'kn', name: 'Kannada (Karnataki)', nativeName: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
]

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    nav_home: 'Home',
    nav_explore: 'Explore',
    nav_heritage: 'Heritage',
    nav_culture: 'Culture',
    nav_community: 'Community',
    nav_documents: 'Documents',
    nav_vacancies: 'Vacancies',
    nav_about: 'About Us',
    nav_sign_in: 'Sign In',
    nav_sign_out: 'Sign Out',

    // Sub-nav & Categories
    tangible_heritage: 'Tangible Cultural Heritage',
    intangible_heritage: 'Intangible Cultural Heritage',
    world_heritage: 'World Heritage',
    culture_rituals: 'Culture & Rituals',
    official_services: 'Official Digital Services',

    // Buttons & CTAs
    btn_explore: 'Explore',
    btn_details: 'Details',
    btn_view_details: 'View Details',
    btn_search: 'Search',
    btn_register: 'Register',
    btn_ask_ai: 'Ask Culture AI',

    // Headings & Kickers
    kicker_digital_portal: 'Digital Heritage Portal',
    portal_title: 'Sanskriti Setu',
    portal_tagline: 'Discover the living soul of Bharat',
    portal_sub: 'One global gateway to India’s states, cities, heritage sites, museums and living traditions, curated from the Ministry of Culture and trusted institutions.',
    stats_states: 'States & UTs',
    stats_heritage: 'Heritage Resources',
    stats_museums: 'Museums',

    // Search
    search_placeholder: 'Search culture, heritage, sites...',

    // AI Assistant
    ai_intro: 'Namaste! I am your heritage guide to Bharat’s living culture. Ask about monuments, festivals, museums, crafts or plan a journey.',
    ai_typing: 'Thinking…',
    ai_placeholder: 'e.g. Tell me about the Chola temples or Hampi',
  },
  hi: {
    // Navigation
    nav_home: 'मुख्य पृष्ठ',
    nav_explore: 'अन्वेषण',
    nav_heritage: 'धरोहर',
    nav_culture: 'संस्कृति',
    nav_community: 'समुदाय',
    nav_documents: 'दस्तावेज़',
    nav_vacancies: 'अवसर',
    nav_about: 'हमारे बारे में',
    nav_sign_in: 'साइन इन',
    nav_sign_out: 'साइन आउट',

    // Sub-nav & Categories
    tangible_heritage: 'मूर्त सांस्कृतिक धरोहर',
    intangible_heritage: 'अमूर्त सांस्कृतिक धरोहर',
    world_heritage: 'विश्व धरोहर (यूनेस्को)',
    culture_rituals: 'संस्कृति एवं अनुष्ठान',
    official_services: 'आधिकारिक डिजिटल सेवाएं',

    // Buttons & CTAs
    btn_explore: 'अन्वेषण करें',
    btn_details: 'विवरण',
    btn_view_details: 'विवरण देखें',
    btn_search: 'खोजें',
    btn_register: 'पंजीकरण करें',
    btn_ask_ai: 'संस्कृति AI से पूछें',

    // Headings & Kickers
    kicker_digital_portal: 'डिजिटल धरोहर पोर्टल',
    portal_title: 'संस्कृति सेतु',
    portal_tagline: 'भारत की जीवंत आत्मा की खोज करें',
    portal_sub: 'भारत के राज्यों, शहरों, धरोहर स्थलों, संग्रहालयों और जीवंत परंपराओं का एक वैश्विक द्वार — संस्कृति मंत्रालय द्वारा प्रामाणिक।',
    stats_states: 'राज्य एवं केंद्र शासित प्रदेश',
    stats_heritage: 'धरोहर संसाधन',
    stats_museums: 'संग्रहालय',

    // Search
    search_placeholder: 'संस्कृति, धरोहर, स्थल खोजें...',

    // AI Assistant
    ai_intro: 'नमस्ते! मैं भारत की जीवंत संस्कृति का आपका धरोहर मार्गदर्शक हूँ। स्मारकों, त्योहारों, संग्रहालयों, शिल्पों के बारे में पूछें।',
    ai_typing: 'विचार कर रहा है…',
    ai_placeholder: 'उदाहरण: चोल मंदिरों या हम्पी के बारे में बताएं',
  },
  kn: {
    // Navigation
    nav_home: 'ಮುಖ್ಯ ಪುಟ',
    nav_explore: 'ಅನ್ವೇಷಿಸಿ',
    nav_heritage: 'ಪರಂಪರೆ',
    nav_culture: 'ಸಂಸ್ಕೃತಿ',
    nav_community: 'ಸಮುದಾಯ',
    nav_documents: 'ದಾಖಲೆಗಳು',
    nav_vacancies: 'ಅವಕಾಶಗಳು',
    nav_about: 'ನಮ್ಮ ಬಗ್ಗೆ',
    nav_sign_in: 'ಸೈನ್ ಇನ್',
    nav_sign_out: 'ಸೈನ್ ಔಟ್',

    // Sub-nav & Categories
    tangible_heritage: 'ಭೌತಿಕ ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆ',
    intangible_heritage: 'ಅಭೌತಿಕ ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆ',
    world_heritage: 'ವಿಶ್ವ ಪರಂಪರೆ (ಯುನೆಸ್ಕೋ)',
    culture_rituals: 'ಸಂಸ್ಕೃತಿ ಮತ್ತು ಆಚರಣೆಗಳು',
    official_services: 'ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ಸೇವೆಗಳು',

    // Buttons & CTAs
    btn_explore: 'ಅನ್ವೇಷಿಸಿ',
    btn_details: 'ವಿವರಗಳು',
    btn_view_details: 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    btn_search: 'ಹುಡುಕಿ',
    btn_register: 'ನೋಂದಾಯಿಸಿ',
    btn_ask_ai: 'ಸಂಸ್ಕೃತಿ AI ಗೆ ಕೇಳಿ',

    // Headings & Kickers
    kicker_digital_portal: 'ಡಿಜಿಟಲ್ ಪರಂಪರೆ ಪೋರ್ಟಲ್',
    portal_title: 'ಸಂಸ್ಕೃತಿ ಸೇತು',
    portal_tagline: 'ಭಾರತದ ಜೀವಂತ ಆತ್ಮವನ್ನು ಅನ್ವೇಷಿಸಿ',
    portal_sub: 'ಭಾರತದ ರಾಜ್ಯಗಳು, ನಗರಗಳು, ಪಾರಂಪರಿಕ ತಾಣಗಳು, ವಸ್ತುಸಂಗ್ರಹಾಲಯಗಳು ಮತ್ತು ಜೀವಂತ ಸಂಪ್ರದಾಯಗಳ ಜಾಗತಿಕ ದ್ವಾರ — ಸಾಂಸ್ಕೃತಿಕ ಸಚಿವಾಲಯದಿಂದ ಅಧಿಕೃತ.',
    stats_states: 'ರಾಜ್ಯಗಳು ಮತ್ತು ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶಗಳು',
    stats_heritage: 'ಪಾರಂಪರಿಕ ಸಂಪನ್ಮೂಲಗಳು',
    stats_museums: 'ವಸ್ತುಸಂಗ್ರಹಾಲಯಗಳು',

    // Search
    search_placeholder: 'ಸಂಸ್ಕೃತಿ, ಪರಂಪರೆ, ತಾಣಗಳನ್ನು ಹುಡುಕಿ...',

    // AI Assistant
    ai_intro: 'ನಮಸ್ಕಾರ! ನಾನು ಭಾರತದ ಜೀವಂತ ಸಂಸ್ಕೃತಿಯ ನಿಮ್ಮ ಪಾರಂಪರಿಕ ಮಾರ್ಗದರ್ಶಿ. ಸ್ಮಾರಕಗಳು, ಹಬ್ಬಗಳು, ವಸ್ತುಸಂಗ್ರಹಾಲಯಗಳ ಬಗ್ಗೆ ಕೇಳಿ.',
    ai_typing: 'ಆಲೋಚಿಸುತ್ತಿದೆ…',
    ai_placeholder: 'ಉದಾ: ಚೋಳ ದೇವಾಲಯಗಳು ಅಥವಾ ಹಂಪಿ ಬಗ್ಗೆ ತಿಳಿಸಿ',
  },
}

interface LanguageContextType {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
  t: (key: string) => string
  languages: LanguageOption[]
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  languages: INDIAN_LANGUAGES,
})

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    return localStorage.getItem('sanskriti_lang') || 'en'
  })

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang)
    localStorage.setItem('sanskriti_lang', newLang)
  }

  const t = (key: string): string => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['en']
    return dict[key] || TRANSLATIONS['en'][key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: INDIAN_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
