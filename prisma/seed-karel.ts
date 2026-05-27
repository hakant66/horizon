/**
 * Karel Elektronik Sanayi ve Ticaret A.Ş.
 * 2024 TSRS Raporu verilerini Horizon platformuna aktarır.
 * Kaynak: karel-2024-tsrs-uyumlu-surdurulebilirlik-raporu.pdf
 */
import {
  ClimateRiskType,
  EmissionScope,
  MetricEntryStatus,
  PrismaClient,
  QuestionnaireType,
  ReportFramework,
  ReportStatus,
  ReportingPeriodStatus,
  RiskOrOpportunity,
  Scope2Method,
  TargetStatus,
  UserRole,
} from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Karel verisi yükleniyor...");

  // ─────────────────────────────────────────────────────────
  // 1. ORGANİZASYON
  // ─────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: "karel-elektronik-2024" },
    update: {},
    create: {
      id: "karel-elektronik-2024",
      name: "Karel Elektronik Sanayi ve Ticaret A.Ş.",
      taxId: "0001234567890",
      sector: "Elektronik ve Teknoloji",
      naceCode: "C26",
      naceDescription: "Bilgisayarların, Elektronik ve Optik Ürünlerin İmalatı",
      sasbSector: "Technology & Communications",
      csrdSector: "Electronic Equipment",
      reportingFrameworks: ["TSRS_1", "TSRS_2", "GRI", "TCFD", "ISO14064"],
      employeeCount: 2450,
      annualTurnoverEurM: 185.0,
      totalAssetsEurM: 220.0,
      isPublicInterestEntity: true,
      headquartersCountry: "TR",
      reportingCurrency: "TRY",
      consolidationMethod: "OPERATIONAL_CONTROL",
    },
  });
  console.log("✅ Organizasyon:", org.name);

  // ─────────────────────────────────────────────────────────
  // 2. KULLANICILAR
  // ─────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@karel.com.tr" },
    update: {},
    create: {
      name: "Bora Tuncer",
      email: "admin@karel.com.tr",
      password: hashSync("Karel2024!", 10),
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  const smUser = await prisma.user.upsert({
    where: { email: "caner.cinar@karel.com.tr" },
    update: {},
    create: {
      name: "Caner Çınar",
      email: "caner.cinar@karel.com.tr",
      password: hashSync("Karel2024!", 10),
      role: UserRole.SUSTAINABILITY_MANAGER,
      organizationId: org.id,
    },
  });

  const dataUser = await prisma.user.upsert({
    where: { email: "ugur.seker@karel.com.tr" },
    update: {},
    create: {
      name: "Uğur Şeker",
      email: "ugur.seker@karel.com.tr",
      password: hashSync("Karel2024!", 10),
      role: UserRole.DATA_CONTRIBUTOR,
      organizationId: org.id,
    },
  });
  console.log("✅ Kullanıcılar oluşturuldu");

  // ─────────────────────────────────────────────────────────
  // 3. İŞTİRAKLER (Subsidiaries)
  // ─────────────────────────────────────────────────────────
  const subsidiaries = [
    { name: "Karel İletişim Hizmetleri A.Ş.", country: "TR", ownershipPercent: 52.60 },
    { name: "Daiichi Elektronik Sanayi ve Ticaret A.Ş.", country: "TR", ownershipPercent: 74.99 },
    { name: "Globalppx İletişim Teknolojileri A.Ş.", country: "TR", ownershipPercent: 100.00 },
    { name: "Karel Europa S.R.L.", country: "IT", ownershipPercent: 100.00 },
    { name: "Karel İleri Teknolojiler A.Ş.", country: "TR", ownershipPercent: 70.00 },
    { name: "FC Daiichi Auto Parts Uzbekistan", country: "UZ", ownershipPercent: 74.99 },
    { name: "Daiichi Electromes Italya S.R.L.", country: "IT", ownershipPercent: 55.00 },
  ];
  for (const sub of subsidiaries) {
    await prisma.subsidiary.upsert({
      where: { id: `karel-sub-${sub.name.toLowerCase().replace(/[^a-z]/g, "-")}` },
      update: {},
      create: {
        id: `karel-sub-${sub.name.toLowerCase().replace(/[^a-z]/g, "-")}`,
        organizationId: org.id,
        name: sub.name,
        country: sub.country,
        ownershipPercent: sub.ownershipPercent,
        isInScope: sub.country === "TR",
        consolidationNote: sub.country === "TR" ? "Operasyonel kontrol kapsamında" : "Kapsam dışı - uluslararası iştirak",
      },
    });
  }
  console.log("✅ İştirakler oluşturuldu");

  // ─────────────────────────────────────────────────────────
  // 4. TESİSLER
  // ─────────────────────────────────────────────────────────
  const facilityAnkara = await prisma.facility.upsert({
    where: { id: "karel-fac-ankara-uretim" },
    update: {},
    create: {
      id: "karel-fac-ankara-uretim",
      organizationId: org.id,
      name: "Karel Ankara Üretim Merkezi",
      country: "TR",
      city: "Ankara (Sincan OSB)",
      facilityType: "Manufacturing",
    },
  });

  const facilityArge = await prisma.facility.upsert({
    where: { id: "karel-fac-ankara-arge" },
    update: {},
    create: {
      id: "karel-fac-ankara-arge",
      organizationId: org.id,
      name: "Karel Ar-Ge Merkezi",
      country: "TR",
      city: "Ankara",
      facilityType: "R&D",
    },
  });

  const facilityIstanbul = await prisma.facility.upsert({
    where: { id: "karel-fac-istanbul" },
    update: {},
    create: {
      id: "karel-fac-istanbul",
      organizationId: org.id,
      name: "Karel İstanbul Bölge Müdürlüğü",
      country: "TR",
      city: "İstanbul (Üsküdar)",
      facilityType: "Office",
    },
  });
  console.log("✅ Tesisler oluşturuldu");

  // ─────────────────────────────────────────────────────────
  // 5. RAPORLAMA DÖNEMİ — 2024
  // ─────────────────────────────────────────────────────────
  const period2024 = await prisma.reportingPeriod.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "2024 TSRS Raporlama Dönemi" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "2024 TSRS Raporlama Dönemi",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      status: ReportingPeriodStatus.CERTIFIED,
      lockedById: adminUser.id,
      lockedAt: new Date("2025-02-01"),
    },
  });
  console.log("✅ Raporlama dönemi:", period2024.name);

  // ─────────────────────────────────────────────────────────
  // 6. METRİK TANIMLARI — mevcut varsa kullan, yoksa oluştur
  // ─────────────────────────────────────────────────────────
  const metricCodes = [
    "natural_gas_consumption",
    "diesel_consumption",
    "petrol_consumption",
    "electricity_consumption",
    "water_consumption",
    "waste_generated",
    "waste_recycled",
    "employee_count",
    "lost_time_injury_count",
  ];
  const metricDefs: Record<string, { id: string }> = {};
  for (const code of metricCodes) {
    const def = await prisma.metricDefinition.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        category:
          code.includes("gas") || code.includes("diesel") || code.includes("petrol") || code.includes("electricity") ? "Energy"
          : code.includes("water") ? "Water"
          : code.includes("waste") ? "Waste"
          : "Social",
        unit:
          code === "natural_gas_consumption" ? "sm3"
          : code === "electricity_consumption" ? "kWh"
          : code === "water_consumption" ? "m3"
          : code.includes("waste") ? "kg"
          : code === "employee_count" ? "count"
          : "L",
        isRequired: true,
        sector: "C26",
      },
    });
    metricDefs[code] = def;
  }

  // Tehlikeli atık için özel tanım
  const hazWasteDef = await prisma.metricDefinition.upsert({
    where: { code: "hazardous_waste_generated" },
    update: {},
    create: {
      code: "hazardous_waste_generated",
      name: "Hazardous waste generated",
      category: "Waste",
      unit: "kg",
      isRequired: false,
      sector: "C26",
    },
  });
  const isgTrainingDef = await prisma.metricDefinition.upsert({
    where: { code: "ohs_training_hours" },
    update: {},
    create: {
      code: "ohs_training_hours",
      name: "OHS training hours",
      category: "Social",
      unit: "hours",
      isRequired: false,
      sector: "C26",
    },
  });
  console.log("✅ Metrik tanımları hazır");

  // ─────────────────────────────────────────────────────────
  // 7. METRİK GİRİŞLERİ — Karel 2024 gerçek verileri
  // ─────────────────────────────────────────────────────────
  type MetricRow = { metricCode: string; facilityId: string; value: number; unit: string };
  const metricEntries: MetricRow[] = [
    // Doğalgaz — üretim + İstanbul
    { metricCode: "natural_gas_consumption", facilityId: facilityAnkara.id, value: 162341.60, unit: "sm3" },
    { metricCode: "natural_gas_consumption", facilityId: facilityIstanbul.id, value: 2845.01, unit: "sm3" },
    // Dizel
    { metricCode: "diesel_consumption", facilityId: facilityAnkara.id, value: 100338.98, unit: "L" },
    { metricCode: "diesel_consumption", facilityId: facilityArge.id, value: 42253.16, unit: "L" },
    { metricCode: "diesel_consumption", facilityId: facilityIstanbul.id, value: 42128.00, unit: "L" },
    // Benzin
    { metricCode: "petrol_consumption", facilityId: facilityAnkara.id, value: 17026.52, unit: "L" },
    { metricCode: "petrol_consumption", facilityId: facilityArge.id, value: 39194.02, unit: "L" },
    { metricCode: "petrol_consumption", facilityId: facilityIstanbul.id, value: 8071.00, unit: "L" },
    // Elektrik
    { metricCode: "electricity_consumption", facilityId: facilityAnkara.id, value: 7645325.04, unit: "kWh" },
    { metricCode: "electricity_consumption", facilityId: facilityArge.id, value: 355423.35, unit: "kWh" },
    { metricCode: "electricity_consumption", facilityId: facilityIstanbul.id, value: 301577.91, unit: "kWh" },
    // Atık (kg) — karton ambalaj 155t, plastik 108t, ahşap 104t = toplam 367t = 367000 kg
    { metricCode: "waste_generated", facilityId: facilityAnkara.id, value: 367000, unit: "kg" },
    { metricCode: "waste_recycled", facilityId: facilityAnkara.id, value: 330300, unit: "kg" }, // ~90% geri dönüşüm
    // Tehlikeli atık 164.26 t
    { metricCode: "hazardous_waste_generated", facilityId: facilityAnkara.id, value: 164260, unit: "kg" },
    // İSG eğitim (tüm tesis)
    { metricCode: "ohs_training_hours", facilityId: facilityAnkara.id, value: 31152, unit: "hours" },
    // Çalışan sayısı
    { metricCode: "employee_count", facilityId: facilityAnkara.id, value: 2000, unit: "count" },
    // İş kazası sayısı
    { metricCode: "lost_time_injury_count", facilityId: facilityAnkara.id, value: 12, unit: "count" },
  ];

  for (const me of metricEntries) {
    const defId = me.metricCode === "hazardous_waste_generated" ? hazWasteDef.id
      : me.metricCode === "ohs_training_hours" ? isgTrainingDef.id
      : metricDefs[me.metricCode]?.id;
    if (!defId) continue;
    await prisma.metricEntry.upsert({
      where: {
        facilityId_reportingPeriodId_metricDefinitionId: {
          facilityId: me.facilityId,
          reportingPeriodId: period2024.id,
          metricDefinitionId: defId,
        },
      },
      update: { value: me.value, status: MetricEntryStatus.VALIDATED },
      create: {
        organizationId: org.id,
        facilityId: me.facilityId,
        reportingPeriodId: period2024.id,
        metricDefinitionId: defId,
        value: me.value,
        unit: me.unit,
        status: MetricEntryStatus.VALIDATED,
        ownerUserId: dataUser.id,
      },
    });
  }
  console.log("✅ Metrik girişleri kaydedildi");

  // ─────────────────────────────────────────────────────────
  // 8. ESG ÖZET
  // ─────────────────────────────────────────────────────────
  await prisma.esgSummary.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      legalName: "Karel Elektronik Sanayi ve Ticaret A.Ş.",
      brandPortfolio: "Karel, Daiichi, Karel Europa",
      naceCode: "C26",
      sectorDescription: "Elektronik üretim, iletişim sistemleri, savunma elektroniği, otomotiv elektroniği ve saha operasyon teknolojileri",
      operatingCountries: "TR, IT, UZ, CN, IN",
      totalEmployees: 2450,
      employeeMale: 1900,
      employeeFemale: 550,
      employeePermanent: 2200,
      employeeTemporary: 250,
      fiscalYearStart: new Date("2024-01-01"),
      fiscalYearEnd: new Date("2024-12-31"),
      annualRevenue: 9800000000,
      sustainabilityCapexForecast: 150000000,
      sustainabilityGovernanceBody: "Kalite ve Sürdürülebilirlik GMY'liği (Caner Çınar), Yönetim Kurulu denetiminde. 2025'te Sürdürülebilirlik Komitesi kurulması planlanmaktadır.",
      businessResilienceAssessment: "IPCC RCP 4.5 ve RCP 8.5 senaryoları kapsamında değerlendirilmiş. RCP 8.5 en kötü senaryoda FAVÖK'ün %10'una kadar finansal etki öngörülmüş; mevcut önlemlerle bu etki önemli ölçüde azaltılmaktadır.",
      antiBriberyPolicyUpdated: true,
      gdprKvkkPolicyUpdated: true,
      // Çevresel veriler
      annualElectricityConsumption: 8302326.29, // kWh
      annualNaturalGasConsumption: 165186.61,   // sm3
      annualFuelConsumption: 248.01,            // toplam ton yakıt (dizel + benzin)
      renewableEnergyPercent: 0,                // henüz %0 (hedef 2050'de %100)
      scope1Emissions: 1103,
      scope2Emissions: 3645,
      scope3Emissions: null,                    // ilk TSRS yılı — kapsam 3 isteğe bağlı
      annualWaterWithdrawal: 8500,              // tahmini m3 (kesin veri açıklanmamış)
      wasteRecyclingRate: 90,                   // %90 hedef (H6 TAMAMLANDI)
      lostTimeInjuryRate: 25.35,               // ppm
      avgTrainingHoursPerEmployee: 12.7,        // 31152 saat / 2450 çalışan
      femaleManagerPercent: 18,
      supplierSocialAuditConducted: false,
      employeeTurnoverRate: 8.5,
      climateRiskInRiskRegister: true,
      rdExpenditure: 490000000,                 // cirosunun ~%5'i
      reportBoundaryNote: "Karel ve Daiichi Türkiye operasyonları dahil. Uluslararası iştirakler kapsam dışı (ilk TSRS yılı muafiyeti). ISO 14064-1 operasyonel kontrol yaklaşımı.",
    },
  });
  console.log("✅ ESG özeti kaydedildi");

  // ─────────────────────────────────────────────────────────
  // 9. ÖNEMLİLİK (MATERIALITY) KONULARI
  // ─────────────────────────────────────────────────────────
  const materialityData = [
    { name: "İklim Değişikliği ve Karbon Yönetimi",  category: "Environmental", financial: 5, impact: 4, likelihood: 4, stakeholder: 5, material: true },
    { name: "Enerji Verimliliği ve Yenilenebilir Enerji", category: "Environmental", financial: 4, impact: 4, likelihood: 5, stakeholder: 4, material: true },
    { name: "Sera Gazı Emisyon Azaltımı (Kapsam 1-2)", category: "Environmental", financial: 4, impact: 5, likelihood: 5, stakeholder: 5, material: true },
    { name: "Su Yönetimi ve Döngüsel Ekonomi",        category: "Environmental", financial: 3, impact: 3, likelihood: 3, stakeholder: 3, material: false },
    { name: "Atık Yönetimi ve Sıfır Atık",            category: "Environmental", financial: 3, impact: 3, likelihood: 4, stakeholder: 3, material: false },
    { name: "İş Sağlığı ve Güvenliği",               category: "Social",         financial: 4, impact: 5, likelihood: 5, stakeholder: 4, material: true },
    { name: "Tedarik Zinciri Yönetimi (Uzak Doğu Riski)", category: "Social",    financial: 5, impact: 4, likelihood: 4, stakeholder: 4, material: true },
    { name: "ESG Performans Raporlaması (TSRS/CDP/EcoVadis)", category: "Governance", financial: 4, impact: 3, likelihood: 4, stakeholder: 5, material: true },
    { name: "Dijital Dönüşüm ve Ar-Ge Yeniliği",     category: "Governance",     financial: 5, impact: 4, likelihood: 5, stakeholder: 4, material: true },
    { name: "Müşteri ve Yatırımcı ESG Baskısı",       category: "Social",         financial: 4, impact: 3, likelihood: 4, stakeholder: 5, material: true },
    { name: "Yasal Uyum ve Düzenleyici Riskler (CBAM, AB)", category: "Governance", financial: 4, impact: 4, likelihood: 4, stakeholder: 3, material: true },
    { name: "İnsan Hakları ve Çalışan Hakları",        category: "Social",         financial: 2, impact: 3, likelihood: 2, stakeholder: 3, material: false },
  ];

  for (const mt of materialityData) {
    await prisma.materialityTopic.upsert({
      where: { organizationId_reportingPeriodId_name: { organizationId: org.id, reportingPeriodId: period2024.id, name: mt.name } },
      update: {},
      create: {
        organizationId: org.id,
        reportingPeriodId: period2024.id,
        name: mt.name,
        category: mt.category,
        financialImpactScore: mt.financial,
        impactSeverityScore: mt.impact,
        likelihoodScore: mt.likelihood,
        stakeholderConcernScore: mt.stakeholder,
        isMaterial: mt.material,
      },
    });
  }
  console.log("✅ Önemlilik konuları kaydedildi");

  // ─────────────────────────────────────────────────────────
  // 10. İKLİM RİSKLERİ ve FIRSATLAR
  // ─────────────────────────────────────────────────────────
  const risk1 = await prisma.climateRisk.upsert({
    where: { id: "karel-risk-1-extreme-weather" },
    update: {},
    create: {
      id: "karel-risk-1-extreme-weather",
      organizationId: org.id,
      reportingPeriodId: period2024.id,
      facilityId: facilityAnkara.id,
      entryType: RiskOrOpportunity.RISK,
      name: "Aşırı Hava Olayları — Üretim ve Saha Ekipman Arızaları",
      type: ClimateRiskType.PHYSICAL_ACUTE,
      probability: "Orta",
      impact: "Düşük-Orta",
      probabilityScore: 3,
      impactScore: 2,
      riskScore: 5,
      timeHorizon: "Kısa-Uzun Vade",
      status: "Open",
      financialImpactEstimate: null,
      mitigationPlan: "Önlem 1: 2030'a kadar Ankara Üretim Merkezi'nde enerji verimliliği ve yenilenebilir enerji yatırımları. Yüksek verimli iklimlendirme, güneş enerjisi entegrasyonu, kapalı devre soğutma sistemleri.\n\nÖnlem 2: Saha baz istasyonları için dayanıklılığı artırılmış ekipman (korozyona dayanıklı, su geçirmez kabinler, yangına dayanıklı bariyerler, FMEA analizi 2030'a kadar).",
      notes: "Karel'in Ankara üretim merkezi ve 74 ilde saha operasyonları doğrudan iklim koşullarına maruz. Sıcak hava dalgaları soğutma ihtiyacını artırabilir. IPCC RCP 4.5 ve 8.5 senaryoları baz alınmış. Finansal etki FAVÖK'ün %1-2'si.",
      regulatoryRef: "IPCC AR6, Türkiye İklim Değişikliği Başkanlığı Risk Haritaları, Ankara BB İklim Eylem Planı (RCP 4.5)",
      ownerUserId: smUser.id,
    },
  });

  await prisma.scenarioAnalysis.upsert({
    where: { id: "karel-scenario-r1-rcp45" },
    update: {},
    create: {
      id: "karel-scenario-r1-rcp45",
      climateRiskId: risk1.id,
      scenarioName: "RCP 4.5 — Ilımlı Azaltım",
      temperaturePathway: "+2.5°C (2050)",
      scenarioFramework: "IPCC",
      physicalHazard: "Sıcak hava dalgaları, ani yağışlar, kuraklık",
      qualitativeImpact: "Sınırlı fiziksel etki. 2050'de İç Anadolu'da yıllık sıcaklık artışı ~2.5°C ile sınırlı kalır. Üretim merkezinde soğutma maliyetleri artar. Saha operasyonlarında sezonsal aksamalar yaşanabilir.",
      estimatedRevenueImpactPercent: -1.5,
      estimatedCostImpact: 8500000,
      assumptions: "Türkiye'nin %41 emisyon azaltım taahhüdü (NDC 2030) gerçekleşir. Enerji verimliliği yatırımları devreye girer. Ankara BB İklim Eylem Planı uygulanır.",
      adaptationMeasure: "Yüksek verimli soğutma sistemleri, su verimliliği projeleri, acil durum protokollerinin güncellenmesi.",
      confidenceLevel: "Orta",
    },
  });

  await prisma.scenarioAnalysis.upsert({
    where: { id: "karel-scenario-r1-rcp85" },
    update: {},
    create: {
      id: "karel-scenario-r1-rcp85",
      climateRiskId: risk1.id,
      scenarioName: "RCP 8.5 — Yüksek Emisyon (En Kötü Senaryo)",
      temperaturePathway: ">+4°C (2050)",
      scenarioFramework: "IPCC",
      physicalHazard: "Şiddetli kuraklık, aşırı sıcaklık artışı, sel ve su baskını riskleri",
      qualitativeImpact: "2050'de İç Anadolu'da ciddi kuraklık ve sıcaklık artışı. Saha ekipmanları için yüksek bakım maliyeti, su kaynaklarına erişim güçleşebilir. Lojistik ve tedarik zincirinde aksamalar.",
      estimatedRevenueImpactPercent: -4.5,
      estimatedCostImpact: 25000000,
      assumptions: "Küresel emisyon azaltım politikaları yetersiz kalır. Türkiye'de %88-414 arası sera gazı artışı (2019-2050). Ankara'da yağış değişkenliği ve sıcak gün sayısı dramatik artar.",
      adaptationMeasure: "Çeşitlendirilmiş tedarik coğrafyası, sigorta güvencesi, iş sürekliliği planları. Enerji bağımsızlığı için güneş enerjisi + UPS. Tesis çevresinde sel önleme altyapısı.",
      confidenceLevel: "Düşük-Orta",
    },
  });

  const risk2 = await prisma.climateRisk.upsert({
    where: { id: "karel-risk-2-esg-pressure" },
    update: {},
    create: {
      id: "karel-risk-2-esg-pressure",
      organizationId: org.id,
      reportingPeriodId: period2024.id,
      entryType: RiskOrOpportunity.RISK,
      name: "Müşteri/Yatırımcı ESG ve Karbon Ayak İzi Azaltım Baskısı",
      type: ClimateRiskType.TRANSITION_MARKET,
      probability: "Düşük-Orta",
      impact: "Düşük",
      probabilityScore: 2,
      impactScore: 2,
      riskScore: 4,
      timeHorizon: "Kısa-Orta Vade",
      status: "Open",
      financialImpactEstimate: null,
      mitigationPlan: "CDP ve EcoVadis platformlarında raporlama, SBTi'ye katılım değerlendirmesi, AB CBAM uyumu için emisyon izleme sistemi, otomotiv ve beyaz eşya müşterilerine yönelik karbon azaltım taahhüdü.",
      notes: "Otomotiv (Ford, TOGG, Stellantis), beyaz eşya (Arçelik) ve savunma (Aselsan) müşterileri karbon azaltım taahhüdü beklemektedir. ESG eksikliği uzun vadede rekabet avantajını zayıflatabilir. FAVÖK'e %1-2 etkisi öngörülmektedir.",
      regulatoryRef: "AB CBAM, CSDDD (Corporate Sustainability Due Diligence Directive), SBTi, CDP",
      ownerUserId: smUser.id,
    },
  });

  const risk3 = await prisma.climateRisk.upsert({
    where: { id: "karel-risk-3-supply-chain" },
    update: {},
    create: {
      id: "karel-risk-3-supply-chain",
      organizationId: org.id,
      reportingPeriodId: period2024.id,
      entryType: RiskOrOpportunity.RISK,
      name: "Uzak Doğu Kaynaklı Bileşen Temin Güçlüğü — Ticaret Savaşları ve AB Düzenlemeleri",
      type: ClimateRiskType.TRANSITION_POLICY_LEGAL,
      probability: "Yüksek",
      impact: "Yüksek",
      probabilityScore: 4,
      impactScore: 4,
      riskScore: 8,
      timeHorizon: "Orta-Uzun Vade",
      status: "Open",
      financialImpactEstimate: null,
      mitigationPlan: "Tedarik zincirini coğrafi çeşitlendirme: Avrupa, Türkiye içi ve bölgesel alternatif tedarikçiler. Kritik bileşenler için stratejik stok yönetimi (geçmiş yıllarda oluşturulmuş). Tedarikçi seçim süreçlerine ESG kriterleri entegre ediliyor. AB CBAM uyumu için düşük karbonlu üretim süreçleri.",
      notes: "Yarı iletkenler, dirençler ve kritik elektronik bileşenler (~1100 onaylı tedarikçi). ABD-Çin gerilimleri ve AB Critical Raw Materials Act riski. FAVÖK'e %5-10 finansal etki öngörülmektedir. En yüksek skorlu risk.",
      regulatoryRef: "AB Critical Raw Materials Act (2023), CSDDD, ABD Çip ve Bilim Yasası (CHIPS Act)",
      ownerUserId: smUser.id,
    },
  });

  await prisma.scenarioAnalysis.upsert({
    where: { id: "karel-scenario-r3-trade" },
    update: {},
    create: {
      id: "karel-scenario-r3-trade",
      climateRiskId: risk3.id,
      scenarioName: "Orta Senaryo — Kısmi Ticaret Kısıtlamaları",
      temperaturePathway: "N/A (Geçiş Riski)",
      scenarioFramework: "IPCC 4.5 & 8.5 (geçiş boyutu)",
      physicalHazard: "N/A",
      qualitativeImpact: "Bileşen tedarikinde %15-25 maliyet artışı, 4-8 hafta gecikme. AB CBAM kapsamı genişlediğinde ek vergi yükü. Üretim aksamaları müşteri teslimatlarını etkileyebilir.",
      estimatedRevenueImpactPercent: -7.5,
      estimatedCostImpact: 45000000,
      assumptions: "ABD-Çin gerilimleri devam eder ancak kapsamlı ambargo uygulanmaz. AB CBAM 2026'da elektronik bileşenlere genişler.",
      adaptationMeasure: "Stratejik stok artırımı, AB uyumlu alternatif tedarikçi geliştirme, Türkiye içi üretim kapasitesi artışı.",
      confidenceLevel: "Orta-Yüksek",
    },
  });

  // Fırsatlar
  const opp1 = await prisma.climateRisk.upsert({
    where: { id: "karel-opp-1-automotive" },
    update: {},
    create: {
      id: "karel-opp-1-automotive",
      organizationId: org.id,
      reportingPeriodId: period2024.id,
      entryType: RiskOrOpportunity.OPPORTUNITY,
      name: "Otomotiv Pazarında Büyüme — Nearshoring ve Düşük Karbonlu Tedarik",
      type: ClimateRiskType.TRANSITION_MARKET,
      probability: "Yüksek",
      impact: "Yüksek",
      probabilityScore: 4,
      impactScore: 4,
      riskScore: 8,
      timeHorizon: "Orta-Uzun Vade",
      status: "Open",
      mitigationPlan: "Düşük karbonlu üretim teknolojilerine yatırım, SBTi ve CDP raporlaması, Avrupalı OEM'lerle (Ford Otosan, TOGG, Stellantis) stratejik ortaklıklar geliştirme, yeşil lojistik çözümleri.",
      notes: "EV dönüşümüyle birlikte Uzak Doğu'dan alımlar Türkiye'ye kayıyor. Karel'in Avrupa'ya yakınlığı ve üretim kapasitesi sayesinde iklim dostu tedarikçi konumuna gelebilir. FAVÖK'e %5-10 pozitif etki potansiyeli.",
      ownerUserId: smUser.id,
    },
  });

  const opp2 = await prisma.climateRisk.upsert({
    where: { id: "karel-opp-2-green-tech" },
    update: {},
    create: {
      id: "karel-opp-2-green-tech",
      organizationId: org.id,
      reportingPeriodId: period2024.id,
      entryType: RiskOrOpportunity.OPPORTUNITY,
      name: "Dijitalleşme ve Yeşil Altyapı Çözümlerine Talep Artışı",
      type: ClimateRiskType.TRANSITION_TECHNOLOGY,
      probability: "Yüksek",
      impact: "Yüksek",
      probabilityScore: 4,
      impactScore: 4,
      riskScore: 8,
      timeHorizon: "Orta-Uzun Vade",
      status: "Open",
      mitigationPlan: "AR-GE süreçlerinde iklim dostu teknolojilere öncelik, akıllı sulama ve sensör tabanlı su yönetimi çözümleri, düşük enerji tüketimli akıllı cihazlar, 5G/IoT tabanlı altyapı çözümleri. AB Yeşil Mutabakat fonlarına başvuru.",
      notes: "Akıllı şehirler, yeşil enerji altyapıları, EV şarj istasyonları, 5G/IoT tabanlı altyapı ihtiyacı hızla artmaktadır. Karel'in güçlü Ar-Ge kapasitesi (133 kişilik ekip, cironsun %5'i) bu fırsatı değerlendirmeye elverişlidir.",
      ownerUserId: smUser.id,
    },
  });
  console.log("✅ İklim riskleri ve fırsatları kaydedildi");

  // ─────────────────────────────────────────────────────────
  // 11. HEDEFLER (Targets)
  // ─────────────────────────────────────────────────────────
  // Target modeli metricDefinitionId gerektiriyor; scope 1+2 için scope emisyon metriği kullanacağız
  const emissionMetricDef = await prisma.metricDefinition.upsert({
    where: { code: "scope_1_2_emissions_tco2e" },
    update: {},
    create: {
      code: "scope_1_2_emissions_tco2e",
      name: "Total Scope 1+2 GHG Emissions",
      category: "Emissions",
      unit: "tCO2e",
      isRequired: true,
      sector: "C26",
    },
  });
  const renewableEnergyMetricDef = await prisma.metricDefinition.upsert({
    where: { code: "renewable_energy_percent" },
    update: {},
    create: {
      code: "renewable_energy_percent",
      name: "Renewable energy share",
      category: "Energy",
      unit: "%",
      isRequired: false,
      sector: "C26",
    },
  });
  const wasteRecycleRateDef = await prisma.metricDefinition.upsert({
    where: { code: "waste_recycling_rate_percent" },
    update: {},
    create: {
      code: "waste_recycling_rate_percent",
      name: "Waste recycling rate",
      category: "Waste",
      unit: "%",
      isRequired: false,
      sector: "C26",
    },
  });
  const supplierDiversityDef = await prisma.metricDefinition.upsert({
    where: { code: "approved_supplier_count" },
    update: {},
    create: {
      code: "approved_supplier_count",
      name: "Approved supplier count",
      category: "Supply Chain",
      unit: "count",
      isRequired: false,
      sector: "C26",
    },
  });

  type TargetRow = {
    id: string; name: string; defId: string; baseYear: number; baseVal: number;
    targetYear: number; targetVal: number; currentVal: number; status: TargetStatus;
  };
  const targets: TargetRow[] = [
    {
      id: "karel-target-h1-renewable",
      name: "H1 — Üretim Merkezi Dışında %100 Yenilenebilir Enerji",
      defId: renewableEnergyMetricDef.id,
      baseYear: 2024, baseVal: 0,
      targetYear: 2050, targetVal: 100,
      currentVal: 0,
      status: TargetStatus.ON_TRACK,
    },
    {
      id: "karel-target-h2-net-zero",
      name: "H2 — Net Sıfır Emisyon (Kapsam 1+2)",
      defId: emissionMetricDef.id,
      baseYear: 2024, baseVal: 4748,
      targetYear: 2050, targetVal: 0,
      currentVal: 4748,
      status: TargetStatus.ON_TRACK,
    },
    {
      id: "karel-target-h5-waste-reduction",
      name: "H5 — Atık Miktarı Azaltma (%2 yıllık — ciro bazlı)",
      defId: metricDefs["waste_generated"]?.id ?? isgTrainingDef.id,
      baseYear: 2023, baseVal: 383000, // 2023 yaklaşık değer (4.19% azalma sonrası 367000)
      targetYear: 2024, targetVal: 375000,
      currentVal: 367000,
      status: TargetStatus.ON_TRACK,
    },
    {
      id: "karel-target-h6-recycling",
      name: "H6 — Atık Döngüsel Oranı %90 (TAMAMLANDI)",
      defId: wasteRecycleRateDef.id,
      baseYear: 2023, baseVal: 85,
      targetYear: 2024, targetVal: 90,
      currentVal: 90,
      status: TargetStatus.ON_TRACK,
    },
    {
      id: "karel-target-h7-supplier",
      name: "H7 — Kritik Ham Madde Tedarikçi Çeşitliliği (%2 artış)",
      defId: supplierDiversityDef.id,
      baseYear: 2024, baseVal: 1100,
      targetYear: 2025, targetVal: 1122,
      currentVal: 1100,
      status: TargetStatus.ON_TRACK,
    },
    {
      id: "karel-target-h8-isg",
      name: "H8 — İSG Eğitim Saatleri (1.200 kişi*saat hedefi — AŞILDI: 31.152 saat)",
      defId: isgTrainingDef.id,
      baseYear: 2023, baseVal: 25000,
      targetYear: 2024, targetVal: 1200,
      currentVal: 31152,
      status: TargetStatus.ON_TRACK,
    },
  ];

  for (const t of targets) {
    await prisma.target.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        organizationId: org.id,
        reportingPeriodId: period2024.id,
        name: t.name,
        metricDefinitionId: t.defId,
        baselineYear: t.baseYear,
        baselineValue: t.baseVal,
        targetYear: t.targetYear,
        targetValue: t.targetVal,
        currentValue: t.currentVal,
        status: t.status,
      },
    });
  }
  console.log("✅ Hedefler kaydedildi");

  // ─────────────────────────────────────────────────────────
  // 12. ANKET — TSRS ESG Soruları ve Yanıtlar
  // ─────────────────────────────────────────────────────────
  const questionnaire = await prisma.questionnaire.upsert({
    where: { organizationId_name_tr: { organizationId: org.id, name_tr: "Karel 2024 TSRS ESG Anketi" } },
    update: {},
    create: {
      organizationId: org.id,
      name_tr: "Karel 2024 TSRS ESG Anketi",
      name_en: "Karel 2024 TSRS ESG Questionnaire",
      type: QuestionnaireType.VERBAL,
      description: "TSRS 1 ve TSRS 2 çerçevesinde Karel'in sürdürülebilirlik performansına ilişkin nitel sorular",
    },
  });

  const sections: Array<{ name: string; questions: Array<{ code: string; title: string; text: string; answer: string }> }> = [
    {
      name: "Kurumsal Yönetişim",
      questions: [
        {
          code: "GOV-01",
          title: "Sürdürülebilirlik Yönetim Yapısı",
          text: "Şirketinizde sürdürülebilirlik yönetim yapısı nasıl kurgulanmıştır?",
          answer: "Sürdürülebilirlik faaliyetleri, Genel Müdür liderliğinde, Kalite ve Sürdürülebilirlik Genel Müdür Yardımcılığı (Caner Çınar) bünyesinde yürütülmektedir. Bu yapı Yönetim Kurulu tarafından onaylanmış olup sürdürülebilirlik stratejilerinin oluşturulması, politikaların uygulanması, performansın izlenmesi ve koordinasyonun sağlanmasından sorumludur. GMY altında Sistem ve Süreç İyileştirme Müdürü ile Sürdürülebilirlik Mühendisi görev yapmaktadır. 2025 yılı içerisinde bir Sürdürülebilirlik Komitesi kurulması planlanmaktadır.",
        },
        {
          code: "GOV-02",
          title: "Yönetim Kurulu Komiteleri",
          text: "Sürdürülebilirlik risklerini izleyen komiteler hangileridir?",
          answer: "Üç ana komite bulunmaktadır: (1) Denetim Komitesi — yılda 4 kez toplanır, 2024'te 4 karar almıştır; (2) Kurumsal Yönetim Komitesi — yılda 4 kez toplanır, 2024'te 2 karar almıştır; (3) Riskin Erken Saptanması Komitesi (RESK) — iki ayda bir toplanır, stratejik/operasyonel/finansal ve yasal riskleri değerlendirir, güncel risk haritası üzerindeki gelişmeleri Yönetim Kurulu'na sunar.",
        },
        {
          code: "GOV-03",
          title: "Net Sıfır Hedefi",
          text: "Şirketinizin uzun vadeli karbon hedefi nedir?",
          answer: "Karel, 2050 yılı itibarıyla net sıfır emisyona ulaşmayı hedeflemektedir. Bu hedef; Türkiye'nin 2053 net sıfır hedefi ve 2030'a kadar %41 emisyon azaltımı taahhüdü (NDC) ile uyumludur. Stratejik planlamada enerji verimliliği projeleri, dijital üretim altyapıları ve yenilenebilir enerji kullanımı önceliklendirilmektedir.",
        },
      ],
    },
    {
      name: "Strateji ve İş Modeli",
      questions: [
        {
          code: "STR-01",
          title: "İklim Risk Yönetimi Yaklaşımı",
          text: "Şirketinizde iklim kaynaklı riskler nasıl yönetilmektedir?",
          answer: "Karel'de iklim riskleri üç temel başlık altında yönetilmektedir: (1) İklim Risklerinin Azaltılması: Tüm faaliyet alanlarında enerji verimliliği ve fosil yakıt bağımlılığının azaltılması; (2) İklim Risklerine Adaptasyon: IPCC RCP 4.5 ve RCP 8.5 senaryoları kapsamında senaryo analizleri; (3) İklim Risklerinin Yönetimi: Karbon fiyatlaması ve ticaretiyle ilgili gelişmeleri takip eden karbon senaryo çalışmaları. Risk Komitesi altı aylık döngülerle değerlendirme yapar.",
        },
        {
          code: "STR-02",
          title: "Değer Zinciri ve İş Modeli",
          text: "Karel'in değer zinciri nasıl tanımlanmaktadır?",
          answer: "Karel'in değer zinciri üç ana halkadan oluşur: (1) Yukarı Yönlü — ~1100 onaylı tedarikçiden yarı iletken, direnç gibi kritik elektronik bileşenler tedariki. ROHS test cihazıyla tehlikeli madde analizi. A/B/C harf notu sistemiyle tedarikçi değerlendirmesi. (2) Direkt Operasyonlar — Avrupa'nın en büyük Class 8 Temiz Oda (1500 m²), %95 otonom üretim hattı, yapay zekâ destekli optik kalite kontrol, lazer markalama. (3) Aşağı Yönlü — Ford Otosan, TOGG, Arçelik, Bosch, Aselsan, Nokia, Vodafone, Turkcell gibi lider müşterilere teslimat.",
        },
        {
          code: "STR-03",
          title: "Ar-Ge ve İnovasyon",
          text: "Karel'in Ar-Ge yatırımları hakkında bilgi veriniz.",
          answer: "Karel, her yıl cirosunun yaklaşık %5'ini Ar-Ge faaliyetlerine ayırmaktadır. 133 kişilik Ar-Ge ekibi; iletişim sistemlerinden savunma elektroniğine, otomotiv elektroniğinden IoT çözümlerine kadar geniş alanda özgün ürünler geliştirmektedir. Türkiye'de Ar-Ge'ye en yüksek bütçe ayıran özel sektör firmaları arasındadır. 2024'te Endüstri 4.0 dönüşümü kapsamında robotik lehimleme ve dijital dönüşüm projeleri hayata geçirilmiştir.",
        },
      ],
    },
    {
      name: "Çevresel Sürdürülebilirlik",
      questions: [
        {
          code: "ENV-01",
          title: "Sera Gazı Envanteri Metodolojisi",
          text: "Sera gazı emisyonlarınız nasıl ölçülmektedir?",
          answer: "Karel, sera gazı emisyon envanterini ISO 14064-1 metodolojisine uygun şekilde hesaplamakar raporlamaktadır. Ölçümler operasyonel kontrol yaklaşımına göre yapılmış; fabrikalar, filo araçları ve kiralık lojistik araçlar kapsama alınmıştır. Hesaplamalarda IPCC emisyon faktörleri, DEFRA ve T.C. Enerji Bakanlığı'nın resmi elektrik emisyon faktörleri kullanılmıştır. 2024 sonuçları: Kapsam 1: 1.103 tCO₂e, Kapsam 2: 3.645 tCO₂e, Toplam: 4.748 tCO₂e. Kapsam 3 önümüzdeki yıllarda raporlanacaktır.",
        },
        {
          code: "ENV-02",
          title: "Su Yönetimi",
          text: "Su kaynaklarının yönetiminde ne tür önlemler alınmaktadır?",
          answer: "Karel, su ihtiyacını Ankara Organize Sanayi Bölgesi (AOSB) altyapısından temin etmektedir. Tüketim verileri aylık olarak kaydedilip analiz edilmektedir. Sensörlü armatürler ve düşük debili musluklar tercih edilmiştir. Periyodik bakımlarla su kaçakları önlenmiştir. Atıksu AOSB kanalizasyonuna deşarj edilmekte, OSB yetkilileri tarafından periyodik numune analizi yapılmaktadır. 2024'te atıksu deşarjına ilişkin herhangi bir yasal yaptırım bildirilmemiştir. H4 hedefi: 2030'a kadar ISO 14046 su ayak izi hesaplama sisteminin kurulması.",
        },
        {
          code: "ENV-03",
          title: "Atık Yönetimi ve Döngüsel Ekonomi",
          text: "Atık yönetiminde nasıl bir yaklaşım benimsenmektedir?",
          answer: "Karel, Sıfır Atık Misyonu'nu benimsemektedir. Üretim ve ofis alanlarında atıklar türlerine göre ayrıştırılmaktadır. 2024 performansı: Kağıt/karton ambalaj 212 t → 155 t, plastik ambalaj 138 t → 108 t, ahşap ambalaj 104 t. Tehlikeli atık: 164,26 t (2023: 135,74 t, %21 artış). 2023'e kıyasla toplam atık miktarı %4,19 azaltılmıştır (hedef %1,5 iken aşılmıştır). H6 hedefi (%90 döngüsel oran) TAMAMLANMIŞTIR.",
        },
      ],
    },
    {
      name: "Sosyal Sürdürülebilirlik",
      questions: [
        {
          code: "SOC-01",
          title: "İş Sağlığı ve Güvenliği",
          text: "İSG performansınız hakkında bilgi veriniz.",
          answer: "Karel, iş güvenliğini tesis içiyle sınırlı görmemektedir. Saha Operasyon Teknolojileri birimi yılın 365 günü sahada aktif görev yapmaktadır. 2024 kaza sıklık oranı: 25,35 ppm. Kazaların büyük çoğunluğu düşük şiddetli olup anlık müdahaleyle kontrol altına alınmıştır. Tüm çalışanlara ve taşeronlara 31.152 saat İSG eğitimi verilmiştir (hedef 1.200 kişi*saat). Özel tatbikatlar ve gerçek senaryo uygulamaları yapılmış, tüm yeni işe alımlarda İSG eğitimi zorunlu tutulmuştur.",
        },
        {
          code: "SOC-02",
          title: "Toplumsal Cinsiyet Eşitliği ve Çeşitlilik",
          text: "Şirketinizde çeşitlilik ve kapsayıcılık nasıl desteklenmektedir?",
          answer: "Karel, toplumsal cinsiyet eşitliğini sürdürülebilirlik stratejisinin bir parçası olarak ele almaktadır. 13 milyonu aşkın kullanıcıya ulaşan Karel; dijitalleşme, enerji verimliliği ve toplumsal sorumluluk bilinciyle hareket etmektedir. İnsan kaynakları politikası fırsat eşitliğini esas almaktadır. Yetkinlik Bazlı Performans Değerlendirme Sistemi ile bireysel ve kurumsal sürdürülebilirlik hedefleri yıllık olarak belirlenmektedir.",
        },
      ],
    },
  ];

  for (const sec of sections) {
    const section = await prisma.questionnaireSection.upsert({
      where: { questionnaireId_name: { questionnaireId: questionnaire.id, name: sec.name } },
      update: {},
      create: {
        organizationId: org.id,
        questionnaireId: questionnaire.id,
        name: sec.name,
        orderIndex: sections.indexOf(sec),
      },
    });

    const subsection = await prisma.questionnaireSubsection.upsert({
      where: { questionnaireSectionId_name: { questionnaireSectionId: section.id, name: "Genel" } },
      update: {},
      create: {
        organizationId: org.id,
        questionnaireSectionId: section.id,
        name: "Genel",
        orderIndex: 0,
      },
    });

    for (const q of sec.questions) {
      const question = await prisma.questionnaireQuestion.upsert({
        where: { id: `karel-q-${q.code}` },
        update: {},
        create: {
          id: `karel-q-${q.code}`,
          organizationId: org.id,
          questionnaireId: questionnaire.id,
          questionnaireSectionId: section.id,
          questionnaireSubsectionId: subsection.id,
          section: sec.name,
          code: q.code,
          title: q.title,
          question_text: q.text,
          isMandatory: true,
        },
      });

      await prisma.questionnaireAnswer.upsert({
        where: { questionnaireQuestionId_reportingPeriodId: { questionnaireQuestionId: question.id, reportingPeriodId: period2024.id } },
        update: {},
        create: {
          organizationId: org.id,
          questionnaireId: questionnaire.id,
          questionnaireQuestionId: question.id,
          reportingPeriodId: period2024.id,
          answer_text: q.answer,
          answering_user_id: smUser.id,
          approvalStage: "APPROVED",
        },
      });
    }
  }
  console.log("✅ Anket soruları ve yanıtları kaydedildi");

  // ─────────────────────────────────────────────────────────
  // 13. RAPOR — TSRS 2 (İklimle İlgili Açıklamalar)
  // ─────────────────────────────────────────────────────────
  await prisma.report.upsert({
    where: { id: "karel-report-tsrs2-2024" },
    update: {},
    create: {
      id: "karel-report-tsrs2-2024",
      organizationId: org.id,
      reportingPeriodId: period2024.id,
      framework: ReportFramework.TSRS_2,
      status: ReportStatus.APPROVED,
      approvedById: adminUser.id,
      approvedAt: new Date("2025-03-15"),
      generatedAt: new Date("2025-02-28"),
      governanceText: `Karel'de Sürdürülebilirlik Yönetişimi

"Değer Odaklı, Güvenilir ve Sürdürülebilir Büyüme" yaklaşımıyla hareket eden Karel, sürdürülebilirlik yönetimini stratejik bir öncelik olarak ele almakta; yönetişim yapısını ulusal ve uluslararası standartlara uyumlu şekilde yapılandırmaktadır.

Yönetim Kurulu, sürdürülebilirlik alanındaki çalışmaları doğrudan stratejik gündemine almakta; iklim değişikliğiyle mücadele, karbon yönetimi, enerji dönüşümü, sosyal sorumluluk ve yönetişim uygulamalarını bütüncül bir yaklaşımla değerlendirmektedir.

Sürdürülebilirlik faaliyetleri, Genel Müdür liderliğinde, Kalite ve Sürdürülebilirlik Genel Müdür Yardımcılığı bünyesinde yürütülmektedir. Bu yapı Yönetim Kurulu tarafından onaylanmıştır.

Komiteler:
• Denetim Komitesi: Yılda 4 kez toplanır; 2024'te 4 karar almıştır.
• Kurumsal Yönetim Komitesi: Yılda 4 kez toplanır; 2024'te 2 karar almıştır.
• Riskin Erken Saptanması Komitesi (RESK): İki ayda bir toplanır; stratejik, operasyonel, finansal ve yasal riskleri değerlendirir.

2025 yılı içerisinde bir Sürdürülebilirlik Komitesi kurulması planlanmaktadır. Bu komite; yönetim kurulu ve üst yönetim düzeyinde stratejik yönlendirme sağlamak, sürdürülebilirlik hedeflerinin performansını izlemek ve koordinasyonu güçlendirmek üzere yapılandırılacaktır.

Bireysel ve kurumsal sürdürülebilirlik hedefleri yıllık olarak belirlenmekte, Yetkinlik Bazlı Performans Değerlendirme Sistemi ile gerçekleşme düzeyi izlenmektedir. "Kaplumbağa Diyagramı" metodolojisi kullanılarak her sürdürülebilirlik süreci; girdileri, çıktıları, sorumluları ve performans göstergeleri ile birlikte sistematik olarak tanımlanmaktadır.`,

      strategyText: `Karel'in İklim Stratejisi

Karel, iklim değişikliğini küresel düzeyde stratejik bir tehdit olarak ele almakta; faaliyetlerini Türkiye'nin iklim politikaları ve uluslararası sürdürülebilirlik ilkeleriyle uyumlu şekilde şekillendirmektedir.

Temel Hedef: 2050 yılında net sıfır emisyona ulaşmak
Türkiye'nin 2053 net sıfır hedefi ve 2030'a kadar %41 emisyon azaltımı taahhüdü (NDC) ile uyumludur.

İklim Riskleri Üç Başlık Altında Yönetilmektedir:

1. İklim Risklerinin Azaltılması
Enerji verimliliğinin artırılması, fosil yakıt bağımlılığının kademeli olarak azaltılması. Üretim ve ofis operasyonlarında enerji tüketimi sürekli izlenmektedir. Araç yakıtları kontrol altına alınmakta; karbon salımı düşük araç alternatiflerine geçiş ve filo optimizasyonu hedeflenmektedir.

2. İklim Risklerine Adaptasyon
Fiziksel iklim riskleri (sıcaklık artışı, kuraklık, su stresi, aşırı hava olayları) ve geçiş riskleri (karbon fiyatlaması, regülasyon değişiklikleri, müşteri taleplerinde değişim) IPCC RCP 4.5 ve RCP 8.5 senaryoları çerçevesinde değerlendirilmektedir.

3. İklim Risklerinin Yönetimi
Türkiye'de kurulması beklenen Ulusal Karbon Fiyatlama Mekanizması kapsamındaki mali yüklerin öngörülmesi amacıyla şirket bünyesinde karbon senaryo çalışmaları planlanmaktadır.

İş Modeli ve Değer Zinciri
Karel'in iş modeli; küresel tedarik zinciri yönetimi (~1100 onaylı tedarikçi), Avrupa'nın en büyük Class 8 Temiz Oda'sını içeren yüksek teknolojiye dayalı üretim (%95 otonom üretim hattı) ve güçlü pazar konumu üzerine kurulu, entegre bir değer zinciri etrafında şekillenmektedir. Karel, her yıl cirosunun yaklaşık %5'ini Ar-Ge'ye ayırmaktadır.

Lokasyon Bazlı Risk İzleme
Karel'in çok lokasyonlu yapısı nedeniyle WWF Risk Filter platformu üzerinden lokasyon bazlı su riski, biyoçeşitlilik kaybı ve doğal afet olasılıkları düzenli olarak izlenmektedir.`,

      riskManagementText: `Karel'in İklim Risk Yönetim Yaklaşımı

Karel, iklim risk ve fırsat değerlendirmelerini ileriye dönük stres testleriyle desteklemek amacıyla iklim senaryo analizi çalışmalarını başlatmıştır. Risk ve fırsat değerlendirmeleri kısa (0-1 yıl), orta (1-3 yıl) ve uzun vadeli (3+ yıl) planlama dönemlerine yayılmaktadır.

Risk Değerlendirme Metodolojisi
Gerçekleşme Olasılığı (1-5) × Etki Büyüklüğü (1-5) = Toplam Risk Puanı (maks. 10)

Belirlenen Başlıca Riskler:

RİSK 1 — Aşırı Hava Olayları (Fiziksel Akut Risk)
Puan: 5/10 | Vade: Kısa-Uzun | Finansal Etki: FAVÖK'ün %1-2'si
Saha baz istasyonları ve dış mekân elektronik bileşenler aşırı yağmur, sıcaklık, nem ve rüzgara maruz kalmaktadır. Karel'in Ankara Üretim Merkezi'nde enerji ihtiyacı artabilir. IPCC RCP 4.5 ve 8.5 senaryoları kapsamında değerlendirilmiştir.
Önlemler: 2030'a kadar enerji verimliliği ve yenilenebilir enerji yatırımları, yüksek verimli iklimlendirme çözümleri, güneş enerjisi entegrasyonu, kapalı devre soğutma sistemleri, su tasarrufu uygulamaları.

RİSK 2 — ESG ve Karbon Ayak İzi Baskısı (Geçiş Riski — Pazar)
Puan: 4/10 | Vade: Kısa-Orta | Finansal Etki: FAVÖK'ün %1-2'si
Otomotiv (Ford Otosan, TOGG, Stellantis), beyaz eşya (Arçelik) ve savunma (Aselsan) müşterileri karbon azaltım taahhüdü beklemektedir.
Önlemler: CDP ve EcoVadis platformlarında raporlama, SBTi katılımı değerlendirmesi, AB CBAM uyumu.

RİSK 3 — Uzak Doğu Tedarik Güçlüğü (Geçiş Riski — Politika/Yasal)
Puan: 8/10 | Vade: Orta-Uzun | Finansal Etki: FAVÖK'ün %5-10'u | EN YÜKSEK RİSK
Karel'in elektronik bileşenlerinin büyük bölümü Uzak Doğu'dan temin edilmektedir. ABD-Çin ticaret gerilimleri ve AB Critical Raw Materials Act tedarik zincirinde gecikmeler, maliyet artışları ve ürün bulunabilirliği sorunları yaratabilir.
Önlemler: Coğrafi çeşitlendirme, stratejik stok yönetimi, ESG kriterli tedarikçi seçimi, AB CBAM uyumu.

Fırsatlar:
FIRSAT 1 — Otomotiv Nearshoring: Puan: 8/10 | Finansal Etki: FAVÖK'ün %5-10'u pozitif
FIRSAT 2 — Dijitalleşme ve Yeşil Altyapı: Puan: 8/10 | Finansal Etki: FAVÖK'ün %5-10'u pozitif

Risk Komitesi: Altı aylık döngülerle değerlendirme yapar (hedef: yılda minimum 1 kez değerlendirme).
Finansal Dayanıklılık: RCP 8.5 en kötü senaryosunda FAVÖK'ün %10'una kadar finansal etki öngörülmüş; mevcut önlemlerle bu etki önemli ölçüde azaltılmaktadır.`,

      metricsTargetsText: `Karel 2024 Metrikler ve Hedefler

SERA GAZI EMİSYONLARI (ISO 14064-1 — Kapsam 1+2)
• Kapsam 1 Emisyonları: 1.103 tCO₂e
• Kapsam 2 Emisyonları: 3.645 tCO₂e
• Toplam (Kapsam 1+2): 4.748 tCO₂e
Not: Ankara ili toplam sera gazı emisyonu 22.884.638 tCO₂e olup Karel'in payı oldukça düşüktür.

ENERJİ TÜKETİMİ (2024)
• Doğalgaz: 165.186,61 sm³ (Üretim: 162.341,60 / İstanbul: 2.845,01)
• Dizel Yakıt: 184.720,14 L
• Benzin: 64.291,54 L
• Elektrik: 8.302.326,29 kWh (Üretim: 7.645.325,04 / Ar-Ge: 355.423,35 / İstanbul: 301.577,91)

ATIK YÖNETİMİ (2024)
• Kağıt/Karton Ambalaj: 155 ton (2023: 212 ton — %27 azalma)
• Plastik Ambalaj: 108 ton (2023: 138 ton — %22 azalma)
• Ahşap Ambalaj: 104 ton
• Tehlikeli Atık: 164,26 ton (2023: 135,74 ton — %21 artış)
• Toplam Atık Azaltımı: %4,19 (Hedef: %1,5 — AŞILDI)
• Atık Geri Dönüşüm Oranı: %90 (H6 HEDEFİ TAMAMLANDI)

İŞ SAĞLIĞI VE GÜVENLİĞİ (2024)
• Kaza Sıklık Oranı: 25,35 ppm
• Verilen İSG Eğitimi: 31.152 saat (Hedef 1.200 kişi*saat — AŞILDI)

HEDEFLER (H1-H11):
H1: Üretim Merkezi dışında %100 yenilenebilir enerji → 2050 (Süreçte)
H2: Net Sıfır Emisyon (Kapsam 1+2) → 2050 (Süreçte)
H3: EcoVadis ve TSRS sistemlerinde sürdürülebilirlik performans izleme → 2026 (Süreçte)
H4: Su tüketimini azaltma ve ISO 14046 su ayak izi hesaplama → 2030 (Süreçte)
H5: Atık miktarını %2 azaltma → 2024 (TAMAMLANDI — %4,19 azaltım)
H6: Atık döngüsel oranı %90 → 2024 (TAMAMLANDI)
H7: Tedarikçi sayısı ve çeşitliliği %2 artış → 2025 (Süreçte)
H8: 1.200 kişi*saat İSG eğitimi → 2024 (TAMAMLANDI — 31.152 saat)
H9: İklim dayanıklılık programı (saha hizmetleri işgücü kaybı azaltma) → 2030 (Planlama)
H10: FMEA ekipman analizi ve tasarım revizyon planı → 2030 (Planlama)
H11: Yenilenebilir enerji destekli UPS sistemleri → 2030 (Planlama)`,
    },
  });

  // TSRS 1 raporu da oluştur
  await prisma.report.upsert({
    where: { id: "karel-report-tsrs1-2024" },
    update: {},
    create: {
      id: "karel-report-tsrs1-2024",
      organizationId: org.id,
      reportingPeriodId: period2024.id,
      framework: ReportFramework.TSRS_1,
      status: ReportStatus.APPROVED,
      approvedById: adminUser.id,
      approvedAt: new Date("2025-03-15"),
      generatedAt: new Date("2025-02-28"),
      governanceText: `Karel Genel Sürdürülebilirlik Yönetişimi

Karel, sürdürülebilirlik performansını GRI, TCFD, ISO 14064-1 ve TSRS çerçeveleri doğrultusunda şeffaf biçimde izlemekte ve raporlamaktadır. Kurumsal performans sisteminde sürdürülebilirlik alanındaki bireysel ve kurumsal hedefler yıllık olarak belirlenmektedir.

Sürdürülebilirlik kararları, tüm birimlerin katılımıyla şekillenmekte; iç tetkikler, yönetim gözden geçirme toplantıları ve üçüncü taraf denetimler yoluyla düzenli olarak değerlendirilmektedir.`,
      strategyText: `Karel'in Sürdürülebilirlik Stratejisi

"Teknolojiyle büyüyor, sorumlulukla dönüşüyoruz" anlayışıyla hareket eden Karel; iletişim, savunma, otomotiv, elektronik üretim ve saha operasyonları alanlarında faaliyet gösteren, yüksek katma değerli ürün ve çözümler sunan lider bir teknoloji şirketidir. 40. kuruluş yıl dönümüne yaklaşan Karel, Doğan Holding'in stratejik desteğiyle hem yerel hem küresel ölçekte sürdürülebilir büyüme hedeflemektedir. Döngüsel ekonomi yaklaşımını tüm iş süreçlerine entegre etmektedir.`,
      riskManagementText: `Kurumsal Risk Yönetimi

Karel'de iklimle ilgili riskler Risk Komitesi tarafından belirli aralıklarla değerlendirilmekte ve izlenmektedir. Sürdürülebilirlik Risklerinin Değerlendirilmesi ve Yönetimi Prosedürü kapsamında mevcut risklerin yılda en az bir kez değerlendirilmesi öngörülmekte; halihazırda değerlendirmeler yılda altı kez gerçekleştirilmektedir.`,
      metricsTargetsText: `Genel ESG Metrikleri

Çevresel: Kapsam 1+2 toplam 4.748 tCO₂e, elektrik tüketimi 8,3 GWh, atık geri dönüşüm oranı %90.
Sosyal: 31.152 saat İSG eğitimi, kaza sıklık oranı 25,35 ppm.
Yönetişim: Yönetim Kuruluna bağlı 3 komite, yılda 6 risk değerlendirme döngüsü.`,
    },
  });
  console.log("✅ Raporlar kaydedildi");

  // ─────────────────────────────────────────────────────────
  // 14. EMİSYON FAKTÖRÜ VE HESAPLAMALAR
  // ─────────────────────────────────────────────────────────
  const efNatGas = await prisma.emissionFactor.upsert({
    where: { id: "ef-tr-natural-gas-s1" },
    update: {},
    create: {
      id: "ef-tr-natural-gas-s1",
      name: "Doğalgaz (Türkiye, Kapsam 1)",
      country: "TR",
      activityUnit: "sm3",
      factorValue: 0.001956, // tCO2e/sm3
      factorUnit: "tCO2e/sm3",
      source: "IPCC AR6 / DEFRA 2024",
      versionYear: 2024,
      scope: EmissionScope.SCOPE_1,
      category: "Stationary Combustion",
    },
  });

  const efDiesel = await prisma.emissionFactor.upsert({
    where: { id: "ef-tr-diesel-s1" },
    update: {},
    create: {
      id: "ef-tr-diesel-s1",
      name: "Dizel (Araç, Türkiye, Kapsam 1)",
      country: "TR",
      activityUnit: "L",
      factorValue: 0.002683, // tCO2e/L
      factorUnit: "tCO2e/L",
      source: "IPCC AR6 / DEFRA 2024",
      versionYear: 2024,
      scope: EmissionScope.SCOPE_1,
      category: "Mobile Combustion",
    },
  });

  const efElec = await prisma.emissionFactor.upsert({
    where: { id: "ef-tr-electricity-s2" },
    update: {},
    create: {
      id: "ef-tr-electricity-s2",
      name: "Şebeke Elektriği (Türkiye, Kapsam 2 — Konum Bazlı)",
      country: "TR",
      activityUnit: "kWh",
      factorValue: 0.000439, // tCO2e/kWh (2024 Türkiye şebeke faktörü)
      factorUnit: "tCO2e/kWh",
      source: "T.C. Enerji Bakanlığı — 2024 Grid Emission Factor",
      versionYear: 2024,
      scope: EmissionScope.SCOPE_2,
      scope2Method: Scope2Method.LOCATION_BASED,
      category: "Purchased Electricity",
    },
  });

  // MetricEntry ID'lerini bul
  const ngAnkaraEntry = await prisma.metricEntry.findUnique({
    where: {
      facilityId_reportingPeriodId_metricDefinitionId: {
        facilityId: facilityAnkara.id,
        reportingPeriodId: period2024.id,
        metricDefinitionId: metricDefs["natural_gas_consumption"]?.id ?? "",
      },
    },
  });
  const elecAnkaraEntry = await prisma.metricEntry.findUnique({
    where: {
      facilityId_reportingPeriodId_metricDefinitionId: {
        facilityId: facilityAnkara.id,
        reportingPeriodId: period2024.id,
        metricDefinitionId: metricDefs["electricity_consumption"]?.id ?? "",
      },
    },
  });

  if (ngAnkaraEntry && metricDefs["natural_gas_consumption"]) {
    await prisma.emissionCalculation.upsert({
      where: { id: "karel-calc-ng-ankara-2024" },
      update: {},
      create: {
        id: "karel-calc-ng-ankara-2024",
        organizationId: org.id,
        facilityId: facilityAnkara.id,
        reportingPeriodId: period2024.id,
        metricEntryId: ngAnkaraEntry.id,
        emissionFactorId: efNatGas.id,
        scope: EmissionScope.SCOPE_1,
        activityValue: 162341.60,
        activityUnit: "sm3",
        factorValue: 0.001956,
        resultTCO2e: 162341.60 * 0.001956, // ~317.54 tCO2e
        calculationFormula: "Activity (sm3) × Emission Factor (tCO2e/sm3)",
      },
    });
  }

  if (elecAnkaraEntry && metricDefs["electricity_consumption"]) {
    await prisma.emissionCalculation.upsert({
      where: { id: "karel-calc-elec-ankara-2024" },
      update: {},
      create: {
        id: "karel-calc-elec-ankara-2024",
        organizationId: org.id,
        facilityId: facilityAnkara.id,
        reportingPeriodId: period2024.id,
        metricEntryId: elecAnkaraEntry.id,
        emissionFactorId: efElec.id,
        scope: EmissionScope.SCOPE_2,
        scope2Method: Scope2Method.LOCATION_BASED,
        activityValue: 7645325.04,
        activityUnit: "kWh",
        factorValue: 0.000439,
        resultTCO2e: 7645325.04 * 0.000439, // ~3356.30 tCO2e
        calculationFormula: "Activity (kWh) × Grid Emission Factor (tCO2e/kWh) — Location Based",
      },
    });
  }
  console.log("✅ Emisyon faktörleri ve hesaplamaları kaydedildi");

  console.log("\n🎉 Karel 2024 TSRS verisi başarıyla yüklendi!");
  console.log("─".repeat(60));
  console.log("Organizasyon:", org.name);
  console.log("Raporlama Dönemi:", period2024.name);
  console.log("Kapsam 1+2 Emisyonu: 4.748 tCO₂e");
  console.log("Tesisler: Ankara Üretim, Ar-Ge, İstanbul");
  console.log("Kullanıcı (admin):", adminUser.email);
  console.log("Kullanıcı (sürdürülebilirlik müdürü):", smUser.email);
  console.log("Şifre (tüm kullanıcılar): Karel2024!");
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
