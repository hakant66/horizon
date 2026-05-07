// ─────────────────────────────────────────────────────────────────────────────
// SECTOR MAPPINGS
// Provides SASB SICS taxonomy, NACE Rev.2 → SASB mapping, ESRS sector groups,
// CSRD scope thresholds, and sector-specific defaults for metrics/materiality.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. SASB Macro Sectors & Sub-sectors (SICS) ───────────────────────────────

export type SasbSubSector = {
  sics: string;       // SASB SICS code, e.g. "RC-CH"
  label_en: string;
  label_tr: string;
  macro: string;      // macro sector key
};

export type SasbMacroSector = {
  key: string;
  label_en: string;
  label_tr: string;
  subsectors: SasbSubSector[];
};

export const SASB_MACRO_SECTORS: SasbMacroSector[] = [
  {
    key: "CONSUMER_GOODS",
    label_en: "Consumer Goods",
    label_tr: "Tüketici Ürünleri",
    subsectors: [
      { sics: "CG-AA", label_en: "Apparel, Accessories & Footwear", label_tr: "Giyim, Aksesuar ve Ayakkabı", macro: "CONSUMER_GOODS" },
      { sics: "CG-BF", label_en: "Building Products & Furnishings", label_tr: "Yapı Ürünleri ve Mobilya", macro: "CONSUMER_GOODS" },
      { sics: "CG-EC", label_en: "E-Commerce", label_tr: "E-Ticaret", macro: "CONSUMER_GOODS" },
      { sics: "CG-HP", label_en: "Household & Personal Products", label_tr: "Ev ve Kişisel Bakım Ürünleri", macro: "CONSUMER_GOODS" },
      { sics: "CG-MS", label_en: "Multiline & Specialty Retailers", label_tr: "Çok Hatlı ve Özel Perakendeciler", macro: "CONSUMER_GOODS" },
      { sics: "CG-TS", label_en: "Toys & Sporting Goods", label_tr: "Oyuncak ve Spor Malzemeleri", macro: "CONSUMER_GOODS" },
    ],
  },
  {
    key: "EXTRACTIVES",
    label_en: "Extractives & Minerals Processing",
    label_tr: "Madencilik ve Mineral İşleme",
    subsectors: [
      { sics: "EM-CO", label_en: "Coal Operations", label_tr: "Kömür Operasyonları", macro: "EXTRACTIVES" },
      { sics: "EM-EP", label_en: "Oil & Gas — E&P", label_tr: "Petrol ve Gaz — Arama & Üretim", macro: "EXTRACTIVES" },
      { sics: "EM-MD", label_en: "Oil & Gas — Midstream", label_tr: "Petrol ve Gaz — Orta Akış", macro: "EXTRACTIVES" },
      { sics: "EM-RM", label_en: "Oil & Gas — Refining & Marketing", label_tr: "Petrol ve Gaz — Rafineri ve Pazarlama", macro: "EXTRACTIVES" },
      { sics: "EM-SV", label_en: "Oil & Gas — Services", label_tr: "Petrol ve Gaz — Hizmetler", macro: "EXTRACTIVES" },
      { sics: "EM-MM", label_en: "Metals & Mining", label_tr: "Metaller ve Madencilik", macro: "EXTRACTIVES" },
      { sics: "EM-CM", label_en: "Construction Materials", label_tr: "İnşaat Malzemeleri", macro: "EXTRACTIVES" },
    ],
  },
  {
    key: "FINANCIALS",
    label_en: "Financials",
    label_tr: "Finansal Hizmetler",
    subsectors: [
      { sics: "FN-AC", label_en: "Asset Management & Custody", label_tr: "Varlık Yönetimi ve Saklama", macro: "FINANCIALS" },
      { sics: "FN-CB", label_en: "Commercial Banks", label_tr: "Ticari Bankalar", macro: "FINANCIALS" },
      { sics: "FN-CF", label_en: "Consumer Finance", label_tr: "Tüketici Finansmanı", macro: "FINANCIALS" },
      { sics: "FN-EX", label_en: "Investment Banking & Brokerage", label_tr: "Yatırım Bankacılığı ve Aracılık", macro: "FINANCIALS" },
      { sics: "FN-IN", label_en: "Insurance", label_tr: "Sigortacılık", macro: "FINANCIALS" },
      { sics: "FN-MF", label_en: "Mortgage Finance", label_tr: "Konut Finansmanı", macro: "FINANCIALS" },
      { sics: "FN-RE", label_en: "Real Estate", label_tr: "Gayrimenkul", macro: "FINANCIALS" },
      { sics: "FN-RN", label_en: "Real Estate Services", label_tr: "Gayrimenkul Hizmetleri", macro: "FINANCIALS" },
    ],
  },
  {
    key: "FOOD_BEVERAGE",
    label_en: "Food & Beverage",
    label_tr: "Gıda ve İçecek",
    subsectors: [
      { sics: "FB-AG", label_en: "Agricultural Products", label_tr: "Tarımsal Ürünler", macro: "FOOD_BEVERAGE" },
      { sics: "FB-BV", label_en: "Alcoholic Beverages", label_tr: "Alkollü İçecekler", macro: "FOOD_BEVERAGE" },
      { sics: "FB-FR", label_en: "Food Retailers & Distributors", label_tr: "Gıda Perakendecileri ve Dağıtıcılar", macro: "FOOD_BEVERAGE" },
      { sics: "FB-MP", label_en: "Meat, Poultry & Dairy", label_tr: "Et, Kümes Hayvanları ve Süt", macro: "FOOD_BEVERAGE" },
      { sics: "FB-NB", label_en: "Non-Alcoholic Beverages", label_tr: "Alkolsüz İçecekler", macro: "FOOD_BEVERAGE" },
      { sics: "FB-PF", label_en: "Packaged Foods", label_tr: "Ambalajlı Gıdalar", macro: "FOOD_BEVERAGE" },
      { sics: "FB-RS", label_en: "Restaurants", label_tr: "Restoranlar", macro: "FOOD_BEVERAGE" },
      { sics: "FB-TB", label_en: "Tobacco", label_tr: "Tütün", macro: "FOOD_BEVERAGE" },
    ],
  },
  {
    key: "HEALTH_CARE",
    label_en: "Health Care",
    label_tr: "Sağlık",
    subsectors: [
      { sics: "HC-BP", label_en: "Biotechnology & Pharmaceuticals", label_tr: "Biyoteknoloji ve İlaç", macro: "HEALTH_CARE" },
      { sics: "HC-DI", label_en: "Drug Retailers", label_tr: "İlaç Perakendecileri", macro: "HEALTH_CARE" },
      { sics: "HC-DY", label_en: "Health Care Delivery", label_tr: "Sağlık Hizmet Sunumu", macro: "HEALTH_CARE" },
      { sics: "HC-DZ", label_en: "Health Care Distributors", label_tr: "Sağlık Dağıtıcıları", macro: "HEALTH_CARE" },
      { sics: "HC-MS", label_en: "Managed Care", label_tr: "Yönetilen Sağlık", macro: "HEALTH_CARE" },
      { sics: "HC-MD", label_en: "Medical Equipment & Supplies", label_tr: "Tıbbi Cihaz ve Malzeme", macro: "HEALTH_CARE" },
    ],
  },
  {
    key: "INFRASTRUCTURE",
    label_en: "Infrastructure",
    label_tr: "Altyapı",
    subsectors: [
      { sics: "IF-EU", label_en: "Electric Utilities & Power Generators", label_tr: "Elektrik Dağıtımı ve Enerji Üretimi", macro: "INFRASTRUCTURE" },
      { sics: "IF-EN", label_en: "Engineering & Construction Services", label_tr: "Mühendislik ve İnşaat Hizmetleri", macro: "INFRASTRUCTURE" },
      { sics: "IF-GU", label_en: "Gas Utilities & Distributors", label_tr: "Doğalgaz Dağıtımı", macro: "INFRASTRUCTURE" },
      { sics: "IF-HB", label_en: "Home Builders", label_tr: "Konut İnşaatı", macro: "INFRASTRUCTURE" },
      { sics: "IF-RE", label_en: "Real Estate Owners & Developers", label_tr: "Gayrimenkul Sahipleri ve Geliştiriciler", macro: "INFRASTRUCTURE" },
      { sics: "IF-WM", label_en: "Waste Management", label_tr: "Atık Yönetimi", macro: "INFRASTRUCTURE" },
      { sics: "IF-WU", label_en: "Water Utilities & Services", label_tr: "Su Hizmetleri", macro: "INFRASTRUCTURE" },
    ],
  },
  {
    key: "RENEWABLE_RESOURCES",
    label_en: "Renewable Resources & Alternative Energy",
    label_tr: "Yenilenebilir Kaynaklar ve Alternatif Enerji",
    subsectors: [
      { sics: "RR-BI", label_en: "Biofuels", label_tr: "Biyoyakıtlar", macro: "RENEWABLE_RESOURCES" },
      { sics: "RR-FM", label_en: "Forestry Management", label_tr: "Ormancılık Yönetimi", macro: "RENEWABLE_RESOURCES" },
      { sics: "RR-PP", label_en: "Pulp & Paper Products", label_tr: "Kâğıt Hamuru ve Kâğıt Ürünleri", macro: "RENEWABLE_RESOURCES" },
      { sics: "RR-SE", label_en: "Solar Energy", label_tr: "Güneş Enerjisi", macro: "RENEWABLE_RESOURCES" },
      { sics: "RR-WE", label_en: "Wind Energy", label_tr: "Rüzgâr Enerjisi", macro: "RENEWABLE_RESOURCES" },
      { sics: "RR-FV", label_en: "Fuel Cells & Industrial Batteries", label_tr: "Yakıt Pilleri ve Endüstriyel Bataryalar", macro: "RENEWABLE_RESOURCES" },
    ],
  },
  {
    key: "RESOURCE_TRANSFORMATION",
    label_en: "Resource Transformation",
    label_tr: "Kaynak Dönüşümü",
    subsectors: [
      { sics: "RT-AE", label_en: "Aerospace & Defense", label_tr: "Havacılık ve Savunma", macro: "RESOURCE_TRANSFORMATION" },
      { sics: "RT-CH", label_en: "Chemicals", label_tr: "Kimyasallar", macro: "RESOURCE_TRANSFORMATION" },
      { sics: "RT-CP", label_en: "Containers & Packaging", label_tr: "Konteyner ve Ambalaj", macro: "RESOURCE_TRANSFORMATION" },
      { sics: "RT-EE", label_en: "Electrical & Electronic Equipment", label_tr: "Elektrik ve Elektronik Ekipman", macro: "RESOURCE_TRANSFORMATION" },
      { sics: "RT-IG", label_en: "Industrial Machinery & Goods", label_tr: "Endüstriyel Makine ve Mallar", macro: "RESOURCE_TRANSFORMATION" },
    ],
  },
  {
    key: "SERVICES",
    label_en: "Services",
    label_tr: "Hizmetler",
    subsectors: [
      { sics: "SV-ED", label_en: "Education", label_tr: "Eğitim", macro: "SERVICES" },
      { sics: "SV-HL", label_en: "Hotels & Lodging", label_tr: "Otel ve Konaklama", macro: "SERVICES" },
      { sics: "SV-ME", label_en: "Media & Entertainment", label_tr: "Medya ve Eğlence", macro: "SERVICES" },
      { sics: "SV-PS", label_en: "Professional & Commercial Services", label_tr: "Profesyonel ve Ticari Hizmetler", macro: "SERVICES" },
    ],
  },
  {
    key: "TECHNOLOGY",
    label_en: "Technology & Communications",
    label_tr: "Teknoloji ve İletişim",
    subsectors: [
      { sics: "TC-HW", label_en: "Hardware", label_tr: "Donanım", macro: "TECHNOLOGY" },
      { sics: "TC-IM", label_en: "Internet Media & Services", label_tr: "İnternet Medyası ve Hizmetleri", macro: "TECHNOLOGY" },
      { sics: "TC-SC", label_en: "Semiconductors", label_tr: "Yarı İletkenler", macro: "TECHNOLOGY" },
      { sics: "TC-SI", label_en: "Software & IT Services", label_tr: "Yazılım ve BT Hizmetleri", macro: "TECHNOLOGY" },
      { sics: "TC-TL", label_en: "Telecommunication Services", label_tr: "Telekomünikasyon Hizmetleri", macro: "TECHNOLOGY" },
    ],
  },
  {
    key: "TRANSPORTATION",
    label_en: "Transportation",
    label_tr: "Ulaştırma",
    subsectors: [
      { sics: "TR-AF", label_en: "Air Freight & Logistics", label_tr: "Hava Kargo ve Lojistik", macro: "TRANSPORTATION" },
      { sics: "TR-AL", label_en: "Airlines", label_tr: "Havayolları", macro: "TRANSPORTATION" },
      { sics: "TR-AU", label_en: "Auto Parts", label_tr: "Otomobil Parçaları", macro: "TRANSPORTATION" },
      { sics: "TR-MT", label_en: "Automobiles", label_tr: "Otomobiller", macro: "TRANSPORTATION" },
      { sics: "TR-MS", label_en: "Marine Transportation", label_tr: "Deniz Taşımacılığı", macro: "TRANSPORTATION" },
      { sics: "TR-RR", label_en: "Rail Transportation", label_tr: "Demiryolu Taşımacılığı", macro: "TRANSPORTATION" },
      { sics: "TR-RO", label_en: "Road Transportation", label_tr: "Karayolu Taşımacılığı", macro: "TRANSPORTATION" },
    ],
  },
];

export const ALL_SASB_SUBSECTORS: SasbSubSector[] = SASB_MACRO_SECTORS.flatMap((m) => m.subsectors);

export function getSasbByCode(sics: string): SasbSubSector | undefined {
  return ALL_SASB_SUBSECTORS.find((s) => s.sics === sics);
}

// ── 2. NACE Rev.2 → SASB SICS Mapping ───────────────────────────────────────

export const NACE_TO_SASB: Record<string, string> = {
  // Agriculture
  "A01": "FB-AG",
  "A02": "RR-FM",
  // Mining
  "B05": "EM-CO",
  "B06": "EM-EP",
  "B07": "EM-MM",
  "B08": "EM-MM",
  // Manufacturing
  "C10": "FB-PF",
  "C11": "FB-BV",
  "C13": "CG-AA",
  "C14": "CG-AA",
  "C15": "CG-AA",
  "C17": "RR-PP",
  "C19": "EM-RM",
  "C20": "RT-CH",
  "C21": "HC-BP",
  "C22": "RT-CP",
  "C24": "EM-MM",
  "C25": "RT-IG",
  "C26": "TC-HW",
  "C27": "RT-EE",
  "C28": "RT-IG",
  "C29": "TR-MT",
  "C30": "RT-AE",
  "C31": "CG-BF",
  // Utilities
  "D35": "IF-EU",
  "E36": "IF-WU",
  "E38": "IF-WM",
  // Construction
  "F41": "IF-HB",
  "F42": "IF-EN",
  "F43": "IF-EN",
  // Trade
  "G45": "TR-AU",
  "G46": "SV-PS",
  "G47": "CG-MS",
  // Transport
  "H49": "TR-RR",
  "H50": "TR-MS",
  "H51": "TR-AL",
  "H52": "TR-AF",
  "H53": "TR-AF",
  // Accommodation
  "I55": "SV-HL",
  "I56": "FB-RS",
  // Information
  "J58": "SV-ME",
  "J59": "SV-ME",
  "J60": "SV-ME",
  "J61": "TC-TL",
  "J62": "TC-SI",
  "J63": "TC-IM",
  // Finance
  "K64": "FN-CB",
  "K65": "FN-IN",
  "K66": "FN-AC",
  // Real estate
  "L68": "FN-RE",
  // Professional services
  "M69": "SV-PS",
  "M70": "SV-PS",
  "M71": "SV-PS",
  "M72": "HC-BP",
  "M73": "SV-PS",
  // Education
  "P85": "SV-ED",
  // Health
  "Q86": "HC-DY",
  "Q87": "HC-DY",
};

/** Best-effort NACE → SASB: tries 4-char, then 3-char, then 2-char prefix */
export function naceToSasb(naceCode: string): string | null {
  const clean = naceCode.replace(/\s/g, "").toUpperCase();
  // Try progressively shorter prefix matches
  for (const len of [4, 3, 2]) {
    const key = clean.slice(0, len);
    if (NACE_TO_SASB[key]) return NACE_TO_SASB[key];
  }
  return null;
}

// ── 3. ESRS / CSRD ───────────────────────────────────────────────────────────

export type ReportingFramework =
  | "IFRS_S1"
  | "IFRS_S2"
  | "TSRS_1"
  | "TSRS_2"
  | "ESRS_CSRD"
  | "GRI"
  | "CDP"
  | "TCFD";

export const REPORTING_FRAMEWORKS: { value: ReportingFramework; label_en: string; label_tr: string }[] = [
  { value: "IFRS_S1",   label_en: "IFRS S1 — General Sustainability Disclosures",     label_tr: "IFRS S1 — Genel Sürdürülebilirlik Açıklamaları" },
  { value: "IFRS_S2",   label_en: "IFRS S2 — Climate-Related Disclosures",            label_tr: "IFRS S2 — İklimle İlgili Açıklamalar" },
  { value: "TSRS_1",    label_en: "TSRS 1 — Turkish Sustainability Reporting Standard", label_tr: "TSRS 1 — Türkiye Sürdürülebilirlik Raporlama Standardı" },
  { value: "TSRS_2",    label_en: "TSRS 2 — Turkish Climate Reporting Standard",       label_tr: "TSRS 2 — Türkiye İklim Raporlama Standardı" },
  { value: "ESRS_CSRD", label_en: "ESRS / CSRD — EU Sustainability Reporting",        label_tr: "ESRS / CSRD — AB Sürdürülebilirlik Raporlaması" },
  { value: "GRI",       label_en: "GRI Standards",                                    label_tr: "GRI Standartları" },
  { value: "CDP",       label_en: "CDP Climate Disclosure",                           label_tr: "CDP İklim Açıklaması" },
  { value: "TCFD",      label_en: "TCFD Recommendations",                             label_tr: "TCFD Tavsiyeleri" },
];

// CSRD scope thresholds (EU Accounting Directive)
export const CSRD_THRESHOLDS = {
  largeCompany:    { employees: 250,  turnoverEurM: 40,  assetsEurM: 20  },
  listedSME:       { employees: 10,   turnoverEurM: 0,   assetsEurM: 0   },
  microEnterprise: { employees: 10,   turnoverEurM: 0.9, assetsEurM: 0.45 },
};

export type CsrdScope = "LARGE_COMPANY" | "LISTED_SME" | "OUT_OF_SCOPE";

export function determineCsrdScope(params: {
  employees: number | null;
  turnoverEurM: number | null;
  assetsEurM: number | null;
  isPublicInterestEntity: boolean | null;
}): CsrdScope {
  const { employees, turnoverEurM, assetsEurM, isPublicInterestEntity } = params;
  if (isPublicInterestEntity) return "LARGE_COMPANY";
  const t = CSRD_THRESHOLDS.largeCompany;
  const meetsTwo =
    [employees != null && employees >= t.employees, turnoverEurM != null && turnoverEurM >= t.turnoverEurM, assetsEurM != null && assetsEurM >= t.assetsEurM].filter(Boolean).length >= 2;
  if (meetsTwo) return "LARGE_COMPANY";
  if (employees != null && employees >= CSRD_THRESHOLDS.listedSME.employees) return "LISTED_SME";
  return "OUT_OF_SCOPE";
}

// ── 4. Sector-specific default materiality topics (SASB-aligned) ─────────────

export const SASB_DEFAULT_MATERIALITY: Record<string, string[]> = {
  "RT-CH": ["GHG emissions", "Air quality", "Water management", "Hazardous waste", "Process safety", "Chemical safety", "Employee health & safety", "Supply chain management"],
  "RT-IG": ["Energy management", "GHG emissions", "Water management", "Waste & circular economy", "Employee health & safety", "Business ethics"],
  "RT-EE": ["Energy management", "GHG emissions", "Water management", "Hazardous waste", "Product lifecycle", "Supply chain labor rights"],
  "TC-HW": ["Energy management", "GHG emissions", "Electronic waste", "Product lifecycle", "Supply chain labor rights", "Data privacy & security"],
  "TC-SI": ["Energy management (data centers)", "Data privacy & security", "Customer welfare", "Workforce diversity", "Business ethics"],
  "TC-TL": ["Energy management", "GHG emissions", "Data privacy & security", "Network reliability", "Customer welfare"],
  "FN-CB": ["Financed emissions", "Climate risk in lending", "Financial inclusion", "Data security", "Business ethics", "Systemic risk management"],
  "FN-IN": ["Climate risk in underwriting", "Weather-related losses", "Financed emissions", "Investment risk", "Data security"],
  "FB-AG": ["GHG emissions", "Water management", "Land use & biodiversity", "Food safety", "Labor practices", "Supply chain standards"],
  "FB-PF": ["GHG emissions", "Water management", "Packaging & waste", "Food safety", "Supply chain sustainability"],
  "EM-EP": ["GHG emissions", "Air quality", "Water management", "Biodiversity", "Community relations", "Health & safety"],
  "EM-MM": ["GHG emissions", "Air quality", "Water management", "Biodiversity", "Community impact", "Mine safety", "Business ethics"],
  "IF-EU": ["GHG emissions", "Air quality", "Water management", "Grid reliability", "Climate transition risk", "Nuclear safety"],
  "IF-EN": ["GHG emissions", "Employee health & safety", "Business ethics", "Supply chain sustainability"],
  "TR-AL": ["GHG emissions", "Fuel efficiency", "Air quality", "Labor practices", "Fleet safety"],
  "TR-RO": ["GHG emissions", "Fleet safety", "Driver welfare", "Labor practices"],
  "HC-BP": ["Drug safety", "Pricing & access", "Clinical trial ethics", "Data privacy", "Supply chain quality"],
  "SV-HL": ["Energy management", "Water management", "Waste", "Labor practices", "Data privacy"],
  "SV-PS": ["Data privacy & security", "Business ethics", "Employee welfare", "GHG emissions"],
  "CG-AA": ["Supply chain labor rights", "Water management", "Raw material sourcing", "Chemical safety", "GHG emissions"],
  "RT-AE": ["GHG emissions", "Fuel efficiency", "Supply chain management", "Employee health & safety", "Business ethics"],
  "IF-WM": ["GHG emissions", "Hazardous waste", "Water quality", "Community health", "Employee safety"],
  "RR-FM": ["Biodiversity", "Land use", "Water management", "GHG emissions", "Community relations", "Labor rights"],
  "RR-PP": ["GHG emissions", "Water management", "Biodiversity", "Waste & circular economy", "Supply chain standards"],
};

/** Returns default materiality topics for a SASB SICS code, falls back to universal topics */
export function getDefaultMaterialityTopics(sics: string | null | undefined): string[] {
  if (!sics) return UNIVERSAL_MATERIALITY_TOPICS;
  return SASB_DEFAULT_MATERIALITY[sics] ?? UNIVERSAL_MATERIALITY_TOPICS;
}

export const UNIVERSAL_MATERIALITY_TOPICS = [
  "Climate change",
  "Energy management",
  "Water management",
  "Waste and circular economy",
  "Biodiversity",
  "Occupational health and safety",
  "Labor practices",
  "Human rights",
  "Supply chain responsibility",
  "Business ethics",
  "Data privacy",
  "Community impact",
];

// ── 5. Sector-specific MetricDefinition codes ─────────────────────────────────

export const SASB_SECTOR_METRICS: Record<string, string[]> = {
  "RT-CH":  ["electricity_consumption", "natural_gas_consumption", "diesel_consumption", "water_consumption", "waste_generated", "waste_recycled", "employee_count", "lost_time_injury_count"],
  "TC-SI":  ["electricity_consumption", "water_consumption", "employee_count"],
  "FN-CB":  ["electricity_consumption", "employee_count", "lost_time_injury_count"],
  "FB-AG":  ["electricity_consumption", "water_consumption", "waste_generated", "waste_recycled", "employee_count", "lost_time_injury_count"],
  "IF-EU":  ["electricity_consumption", "natural_gas_consumption", "diesel_consumption", "water_consumption", "waste_generated", "employee_count", "lost_time_injury_count"],
  "EM-MM":  ["electricity_consumption", "diesel_consumption", "water_consumption", "waste_generated", "waste_recycled", "employee_count", "lost_time_injury_count"],
  "TR-AL":  ["diesel_consumption", "petrol_consumption", "employee_count", "lost_time_injury_count"],
  "TR-RO":  ["diesel_consumption", "petrol_consumption", "employee_count", "lost_time_injury_count"],
};

export const DEFAULT_SECTOR_METRICS = [
  "electricity_consumption",
  "natural_gas_consumption",
  "diesel_consumption",
  "water_consumption",
  "waste_generated",
  "waste_recycled",
  "employee_count",
  "lost_time_injury_count",
];

export function getSectorMetricCodes(sics: string | null | undefined): string[] {
  if (!sics) return DEFAULT_SECTOR_METRICS;
  return SASB_SECTOR_METRICS[sics] ?? DEFAULT_SECTOR_METRICS;
}

// ── 6. Report generation templates ───────────────────────────────────────────

export type ReportTemplates = {
  governanceText: string;
  strategyText: string;
  riskManagementText: string;
  metricsTargetsText: string;
};

export function getSectorReportTemplates(
  sics: string | null | undefined,
  frameworks: string[],
  metrics: number,
  emissions: number,
  risks: number,
): ReportTemplates {
  const isCSRD   = frameworks.includes("ESRS_CSRD");
  const isIFRS   = frameworks.some((f) => f.startsWith("IFRS") || f.startsWith("TSRS"));
  const isTCFD   = frameworks.includes("TCFD");

  const frameworkNote = isCSRD
    ? "under ESRS/CSRD"
    : isIFRS
    ? "under IFRS S1/S2 (TSRS)"
    : isTCFD
    ? "aligned with TCFD recommendations"
    : "per applicable reporting frameworks";

  const sectorTemplates: Record<string, ReportTemplates> = {
    "RT-CH": {
      governanceText: `Governance oversight is established through a Board-level Sustainability & Safety Committee. Responsibility for process safety, chemical risk, and ESG performance is embedded in the C-suite mandate ${frameworkNote}.`,
      strategyText: `The company's strategy integrates chemical safety, hazardous waste minimisation, and energy transition planning. ${risks} climate and transition risks have been assessed ${frameworkNote}.`,
      riskManagementText: `Risk processes include quarterly process safety reviews, chemical inventory audits, and ${risks} documented climate risks. Transition risk scenarios are evaluated under 1.5°C and 2°C pathways.`,
      metricsTargetsText: `${metrics} operational metric records (including energy, water, hazardous waste) and ${emissions} emissions calculations are included. Scope 1 + 2 totals are disclosed ${frameworkNote}.`,
    },
    "FN-CB": {
      governanceText: `The Board Risk Committee oversees climate-related financial risk, financed emissions, and ESG integration in lending decisions ${frameworkNote}.`,
      strategyText: `Climate transition risk is embedded in credit risk models and portfolio strategy. Financed emissions are measured across major loan categories ${frameworkNote}.`,
      riskManagementText: `Credit portfolio climate risk screening covers ${risks} documented transition and physical risks. Scenario analysis under 1.5°C, 2°C, and 4°C pathways is conducted annually.`,
      metricsTargetsText: `${metrics} operational and financed emission records have been captured. Portfolio alignment to Paris Agreement targets is tracked ${frameworkNote}.`,
    },
    "TC-SI": {
      governanceText: `The Chief Sustainability Officer reports to the Board on data centre energy efficiency, data privacy governance, and ESG targets ${frameworkNote}.`,
      strategyText: `Strategy focuses on renewable energy procurement for data centre operations and responsible AI governance. ${risks} climate-related risks to infrastructure have been identified ${frameworkNote}.`,
      riskManagementText: `Physical risk to data centre assets and supply chain disruption from extreme weather events are covered in ${risks} documented risk assessments.`,
      metricsTargetsText: `${metrics} energy and social metric records and ${emissions} emissions calculations (Scope 2 focus) are disclosed ${frameworkNote}.`,
    },
    "EM-MM": {
      governanceText: `Board-level oversight covers mine safety, environmental rehabilitation, biodiversity, and community relations ${frameworkNote}.`,
      strategyText: `Transition planning addresses stranded asset risk and operational decarbonisation. ${risks} physical and transition risks are quantified ${frameworkNote}.`,
      riskManagementText: `Environmental and safety risk reviews are conducted quarterly across all operating sites, covering ${risks} documented climate risks and biodiversity impact assessments.`,
      metricsTargetsText: `${metrics} site-level metric records including energy, water, waste, and tailings data, and ${emissions} emissions calculations are included ${frameworkNote}.`,
    },
    "IF-EU": {
      governanceText: `A dedicated Climate Transition Board Committee oversees grid reliability, renewable capacity targets, and regulatory compliance ${frameworkNote}.`,
      strategyText: `Capital allocation is aligned with low-carbon transition pathways. Renewable capacity expansion and grid resilience investments are the primary strategic levers. ${risks} identified climate risks inform CapEx decisions ${frameworkNote}.`,
      riskManagementText: `Physical risk assessment for grid infrastructure covers extreme weather, flooding, and temperature stress. ${risks} climate risks are managed through scenario analysis under TCFD and IFRS S2 guidance.`,
      metricsTargetsText: `${metrics} energy generation and consumption metric records and ${emissions} Scope 1 + 2 emission calculations are disclosed ${frameworkNote}.`,
    },
  };

  const template = sectorTemplates[sics ?? ""] ?? {
    governanceText:    `Governance oversight is established through cross-functional sustainability committees ${frameworkNote}.`,
    strategyText:      `Strategy considers ${risks} climate and transition risks to ensure long-term resilience ${frameworkNote}.`,
    riskManagementText:`Risk processes cover ${risks} documented climate risks with annual scenario analysis ${frameworkNote}.`,
    metricsTargetsText:`${metrics} operational metric records and ${emissions} emissions calculations are included in this disclosure package ${frameworkNote}.`,
  };

  return template;
}
