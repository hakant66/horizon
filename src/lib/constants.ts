export const NAV_ITEMS = [
  { href: "/dashboard",       labelKey: "home",           icon: "LayoutDashboard" },
  { href: "/setup",           labelKey: "setup",          icon: "Settings2" },
  { href: "/esg-summary",     labelKey: "esgSummary",     icon: "ClipboardList" },
  { href: "/questionnaire",   labelKey: "questionnaire",  icon: "MessageSquare" },
  { href: "/materiality",     labelKey: "materiality",    icon: "Target" },
  { href: "/data-collection", labelKey: "dataCollection", icon: "Database" },
  { href: "/emissions",       labelKey: "emissions",      icon: "Wind" },
  { href: "/risks",           labelKey: "risks",          icon: "AlertTriangle" },
  { href: "/targets",         labelKey: "targets",        icon: "TrendingUp" },
  { href: "/reports",         labelKey: "reports",        icon: "FileText" },
  { href: "/certification",   labelKey: "certification",  icon: "Award" },
  { href: "/audit-trail",     labelKey: "auditTrail",     icon: "History" },
  { href: "/settings",        labelKey: "settings",       icon: "SlidersHorizontal" },
] as const;

export type NavIconName = (typeof NAV_ITEMS)[number]["icon"];

export const MATERIALITY_TOPICS = [
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
