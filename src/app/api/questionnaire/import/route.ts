import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";
import { QuestionnaireType } from "@prisma/client";
import * as XLSX from "xlsx";

// Column indices in the Excel sheet (0-based)
const COL = {
  section: 0,
  subsection: 1,
  code: 2,
  title: 3,
  question_text: 4,
  unit: 5,
  owner_name: 6,
  owner_department: 7,
  owner_email: 8,
  helper: 9,
  example: 10,
  reminder: 11,
} as const;

function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function nullable(val: unknown): string | null {
  const s = str(val);
  return s === "" ? null : s;
}

// GET — download blank template
export async function GET() {
  try {
    await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);

    const wb = XLSX.utils.book_new();
    const headers = [
      "Bölüm",
      "Alt Bölüm",
      "Kod",
      "Başlık",
      "Soru Metni",
      "Birim",
      "Sahip Adı",
      "Sahip Departman",
      "Sahip E-posta",
      "Yardımcı Bilgi",
      "Örnek",
      "Hatırlatıcı",
    ];
    const example = [
      "Çevre",
      "Emisyonlar",
      "E-01",
      "Kapsam 1 Emisyonları",
      "Raporlama dönemindeki toplam Kapsam 1 GHG emisyonları nedir?",
      "tCO2e",
      "Sürdürülebilirlik Müdürü",
      "Strateji",
      "surdurulebilirlik@sirket.com",
      "GHG Protokolü kapsamında doğrudan emisyonlar",
      "1.200 tCO2e",
      "Yıllık doğrulanmış veri",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    // Column widths
    ws["!cols"] = [24, 20, 10, 30, 50, 10, 20, 20, 30, 40, 30, 30].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Anket");

    const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as number[];
    const bytes = new Uint8Array(arr);

    return new Response(bytes.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="anket-sablonu.xlsx"',
      },
    });
  } catch (error) {
    return apiError(error, 401);
  }
}

// POST — import questionnaire from uploaded Excel
export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name_tr = str(formData.get("name_tr"));
    const name_en = nullable(formData.get("name_en"));
    const typeRaw = str(formData.get("type"));

    if (!file) return apiError("Dosya gerekli", 400);
    if (!name_tr) return apiError("Anket adı (TR) gerekli", 400);
    if (typeRaw !== "VERBAL" && typeRaw !== "NUMERIC") return apiError("Geçersiz tür", 400);
    const type = typeRaw as QuestionnaireType;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return apiError("Excel dosyasında sayfa bulunamadı", 400);

    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
    });

    // Skip header row
    const dataRows = rows.slice(1).filter((row) => {
      const r = row as unknown[];
      return str(r[COL.section]) !== "" || str(r[COL.title]) !== "";
    });

    if (dataRows.length === 0) return apiError("Excel'de veri satırı bulunamadı", 400);

    type RowData = {
      section: string;
      subsection: string | null;
      code: string | null;
      title: string;
      question_text: string;
      unit: string | null;
      owner_name: string | null;
      owner_department: string | null;
      owner_email: string | null;
      helper: string | null;
      example: string | null;
      reminder: string | null;
    };

    const parsed: RowData[] = dataRows.map((raw) => {
      const r = raw as unknown[];
      return {
        section: str(r[COL.section]) || "Genel",
        subsection: nullable(r[COL.subsection]),
        code: nullable(r[COL.code]),
        title: str(r[COL.title]) || str(r[COL.question_text]).slice(0, 80) || "Soru",
        question_text: str(r[COL.question_text]) || str(r[COL.title]),
        unit: nullable(r[COL.unit]),
        owner_name: nullable(r[COL.owner_name]),
        owner_department: nullable(r[COL.owner_department]),
        owner_email: nullable(r[COL.owner_email]),
        helper: nullable(r[COL.helper]),
        example: nullable(r[COL.example]),
        reminder: nullable(r[COL.reminder]),
      };
    });

    // Build section→subsection→questions structure
    type SubMap = Map<string | null, RowData[]>;
    const sectionMap = new Map<string, SubMap>();
    const sectionOrder: string[] = [];

    for (const row of parsed) {
      if (!sectionMap.has(row.section)) {
        sectionMap.set(row.section, new Map());
        sectionOrder.push(row.section);
      }
      const subMap = sectionMap.get(row.section)!;
      const key = row.subsection;
      if (!subMap.has(key)) subMap.set(key, []);
      subMap.get(key)!.push(row);
    }

    const questionnaire = await prisma.$transaction(async (tx) => {
      const q = await tx.questionnaire.create({
        data: {
          organizationId: user.organizationId,
          name_tr,
          name_en,
          type,
        },
      });

      let sectionIdx = 0;
      for (const sectionName of sectionOrder) {
        const subMap = sectionMap.get(sectionName)!;

        const sec = await tx.questionnaireSection.create({
          data: {
            organizationId: user.organizationId,
            questionnaireId: q.id,
            name: sectionName,
            orderIndex: sectionIdx++,
          },
        });

        // Questions with no subsection
        const rootQuestions = subMap.get(null) ?? [];
        for (const row of rootQuestions) {
          await tx.questionnaireQuestion.create({
            data: {
              organizationId: user.organizationId,
              questionnaireId: q.id,
              questionnaireSectionId: sec.id,
              section: sectionName,
              code: row.code,
              title: row.title,
              question_text: row.question_text,
              unit: row.unit,
              owner_name: row.owner_name,
              owner_department: row.owner_department,
              owner_email: row.owner_email,
              helper: row.helper,
              example: row.example,
              reminder: row.reminder,
            },
          });
        }

        // Subsections
        let subsectionIdx = 0;
        for (const [subName, questions] of subMap.entries()) {
          if (subName === null) continue;

          const sub = await tx.questionnaireSubsection.create({
            data: {
              organizationId: user.organizationId,
              questionnaireSectionId: sec.id,
              name: subName,
              orderIndex: subsectionIdx++,
            },
          });

          for (const row of questions) {
            await tx.questionnaireQuestion.create({
              data: {
                organizationId: user.organizationId,
                questionnaireId: q.id,
                questionnaireSectionId: sec.id,
                questionnaireSubsectionId: sub.id,
                section: sectionName,
                code: row.code,
                title: row.title,
                question_text: row.question_text,
                unit: row.unit,
                owner_name: row.owner_name,
                owner_department: row.owner_department,
                owner_email: row.owner_email,
                helper: row.helper,
                example: row.example,
                reminder: row.reminder,
              },
            });
          }
        }
      }

      return q;
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "QUESTIONNAIRE_IMPORTED",
      entityType: "Questionnaire",
      entityId: questionnaire.id,
      afterValueJson: { name_tr, rowCount: parsed.length },
    });

    return apiOk({ id: questionnaire.id, name_tr: questionnaire.name_tr, rowCount: parsed.length }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Unique constraint")) return apiError("Bu isimde bir anket zaten mevcut", 400);
    return apiError(error, 500);
  }
}
