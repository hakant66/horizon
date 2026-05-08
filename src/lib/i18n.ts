export const locales = ["tr", "en"] as const;
export type Locale = (typeof locales)[number];

export const dictionary = {
  tr: {
    workflow: "İş Akışı",
    home: "Ana Sayfa",
    setup: "Kurulum",
    questionnaire: "Anket",
    materiality: "Önemlilik",
    dataCollection: "Veri Toplama",
    emissions: "Emisyonlar",
    risks: "Riskler ve Senaryolar",
    targets: "Hedefler",
    reports: "Raporlar",
    certification: "Belgelendirme",
    auditTrail: "Denetim İzleri",
    settings: "Ayarlar",
    signOut: "Çıkış",
    appTagline: "Yapılandırılmış IFRS/TSRS raporlama iş akışı",
    language: "Dil",
    notifications: "Bildirimler",
    questionnaireSetup: "Anket Kurulumu",
    questionnaireAnswers: "Anket Yanıtları",
    questionnaireDashboard: "Anket Panosu",
    esgSummary: "ESG Özet Bilgileri",
    openMenu: "Menüyü Aç",
    closeMenu: "Menüyü Kapat",
  },
  en: {
    workflow: "Workflow",
    home: "Home",
    setup: "Setup",
    questionnaire: "Questionnaire",
    materiality: "Materiality",
    dataCollection: "Data Collection",
    emissions: "Emissions",
    risks: "Risks & Scenarios",
    targets: "Targets",
    reports: "Reports",
    certification: "Certification",
    auditTrail: "Audit Trail",
    settings: "Settings",
    signOut: "Sign out",
    appTagline: "Structured IFRS/TSRS reporting workflow",
    language: "Language",
    notifications: "Notifications",
    questionnaireSetup: "Questionnaire Setup",
    questionnaireAnswers: "Questionnaire Answers",
    questionnaireDashboard: "Questionnaire Dashboard",
    esgSummary: "ESG Summary",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
} as const;

export type I18nKey = keyof typeof dictionary.tr;

export function translate(locale: Locale, key: I18nKey) {
  return dictionary[locale][key] || dictionary.tr[key] || key;
}
