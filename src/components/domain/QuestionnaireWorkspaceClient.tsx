"use client";

import { useMemo, useState } from "react";
import { QuestionnaireType } from "@prisma/client";
import { useI18n } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/domain/PageHeader";
import { ProgressBar } from "@/components/domain/ProgressBar";
import { DataTable } from "@/components/domain/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Topic = { id: string; name_tr: string; name_en: string | null };
type Question = {
  id: string;
  questionnaireId: string;
  questionnaireTopicId: string | null;
  code: string | null;
  title: string;
  question_text: string;
  section: string;
  unit: string | null;
  owner_name: string | null;
  owner_department: string | null;
  owner_email: string | null;
  helper: string | null;
  example: string | null;
  reminder: string | null;
  video_link: string | null;
  questionnaireSectionId: string | null;
  questionnaireSubsectionId: string | null;
};
type Subsection = { id: string; name: string; questions: Question[] };
type Section = { id: string; name: string; subsections: Subsection[]; questions: Question[] };
type Questionnaire = {
  id: string;
  name_tr: string;
  name_en: string | null;
  type: QuestionnaireType;
  sections: Section[];
  answers: { id: string }[];
};
type Answer = {
  id: string;
  questionnaireQuestionId: string;
  answer_text: string | null;
  answer_number: string | null;
};

type Tab = "setup" | "answers" | "dashboard";

export function QuestionnaireWorkspaceClient({
  reportingPeriodId,
  initialTopics,
  initialQuestionnaires,
  initialAnswers,
  initialDashboard,
}: {
  reportingPeriodId: string;
  initialTopics: Topic[];
  initialQuestionnaires: Questionnaire[];
  initialAnswers: Answer[];
  initialDashboard: { totalQuestions: number; answered: number; remaining: number; progress: number };
}) {
  const { locale, t } = useI18n();
  const [tab, setTab] = useState<Tab>("setup");
  const [topics, setTopics] = useState(initialTopics);
  const [questionnaires, setQuestionnaires] = useState(initialQuestionnaires);
  const [answers, setAnswers] = useState(initialAnswers);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [message, setMessage] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState(initialQuestionnaires[0]?.id || "");

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState(initialQuestionnaires[0]?.id || "");
  const [cloneNameTr, setCloneNameTr] = useState("");
  const [cloneNameEn, setCloneNameEn] = useState("");
  const [cloneLoading, setCloneLoading] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importNameTr, setImportNameTr] = useState("");
  const [importNameEn, setImportNameEn] = useState("");
  const [importType, setImportType] = useState<"VERBAL" | "NUMERIC">("VERBAL");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const [qaAiLoading, setQaAiLoading] = useState(false);

  const selectedQuestionnaire = useMemo(
    () => questionnaires.find((q) => q.id === selectedQuestionnaireId) || questionnaires[0],
    [questionnaires, selectedQuestionnaireId],
  );

  const selectedQuestions = useMemo(
    () =>
      (selectedQuestionnaire?.sections || [])
        .flatMap((s) => s.subsections.flatMap((ss) => ss.questions))
        .concat((selectedQuestionnaire?.sections || []).flatMap((s) => s.questions)),
    [selectedQuestionnaire],
  );

  const answerMap = useMemo(() => {
    const map = new Map<string, Answer>();
    for (const answer of answers) map.set(answer.questionnaireQuestionId, answer);
    return map;
  }, [answers]);

  async function refreshAll(questionnaireId?: string) {
    const activeQuestionnaireId = questionnaireId || selectedQuestionnaireId;
    if (!activeQuestionnaireId) return;
    const [setupRes, answersRes, dashboardRes] = await Promise.all([
      fetch("/api/questionnaire/setup"),
      fetch(`/api/questionnaire/answers?questionnaireId=${activeQuestionnaireId}&reportingPeriodId=${reportingPeriodId}`),
      fetch(`/api/questionnaire/dashboard?questionnaireId=${activeQuestionnaireId}&reportingPeriodId=${reportingPeriodId}`),
    ]);

    if (setupRes.ok) {
      const json = (await setupRes.json()) as { topics: Topic[]; questionnaires: Questionnaire[] };
      setTopics(json.topics);
      setQuestionnaires(json.questionnaires);
    }
    if (answersRes.ok) {
      const json = (await answersRes.json()) as Answer[];
      setAnswers(
        json.map((row) => ({
          ...row,
          answer_number: (row.answer_number as unknown as string | null) || null,
        })),
      );
    }
    if (dashboardRes.ok) {
      const json = (await dashboardRes.json()) as typeof initialDashboard;
      setDashboard(json);
    }
  }

  async function setupMutation(entityType: string, payload: unknown, method: "POST" | "PATCH" | "DELETE") {
    const res = await fetch("/api/questionnaire/setup", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(method === "DELETE" ? payload : { entityType, payload }),
    });
    setMessage(res.ok ? (locale === "tr" ? "İşlem başarılı" : "Operation successful") : locale === "tr" ? "İşlem başarısız" : "Operation failed");
    if (res.ok) await refreshAll();
  }

  async function saveAnswer(questionId: string, rawText: string, rawNumber: string) {
    if (!selectedQuestionnaireId) return;
    const payload = {
      questionnaireId: selectedQuestionnaireId,
      questionnaireQuestionId: questionId,
      reportingPeriodId,
      answer_text: rawText || null,
      answer_number: rawNumber ? Number(rawNumber) : null,
    };

    const res = await fetch("/api/questionnaire/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(res.ok ? (locale === "tr" ? "Yanıt kaydedildi" : "Answer saved") : locale === "tr" ? "Yanıt kaydedilemedi" : "Answer save failed");
    if (res.ok) await refreshAll();
  }

  async function cloneQuestionnaire() {
    if (!cloneSourceId || !cloneNameTr.trim()) return;
    setCloneLoading(true);
    const res = await fetch("/api/questionnaire/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceQuestionnaireId: cloneSourceId, name_tr: cloneNameTr, name_en: cloneNameEn || null }),
    });
    setCloneLoading(false);
    if (res.ok) {
      const data = (await res.json()) as { id: string; name_tr: string };
      setShowCloneModal(false);
      setCloneNameTr("");
      setCloneNameEn("");
      setMessage(locale === "tr" ? `"${data.name_tr}" oluşturuldu.` : `"${data.name_tr}" created.`);
      await refreshAll(data.id);
      setSelectedQuestionnaireId(data.id);
    } else {
      setMessage(locale === "tr" ? "Kopyalama başarısız." : "Clone failed.");
    }
  }

  async function importFromExcel() {
    if (!importFile || !importNameTr.trim()) return;
    setImportLoading(true);
    setImportError("");
    const fd = new FormData();
    fd.append("file", importFile);
    fd.append("name_tr", importNameTr.trim());
    fd.append("name_en", importNameEn.trim());
    fd.append("type", importType);
    const res = await fetch("/api/questionnaire/import", { method: "POST", body: fd });
    setImportLoading(false);
    if (res.ok) {
      const data = (await res.json()) as { id: string; name_tr: string; rowCount: number };
      setShowImportModal(false);
      setImportNameTr("");
      setImportNameEn("");
      setImportFile(null);
      setMessage(
        locale === "tr"
          ? `"${data.name_tr}" oluşturuldu — ${data.rowCount} soru içe aktarıldı.`
          : `"${data.name_tr}" created — ${data.rowCount} questions imported.`,
      );
      await refreshAll(data.id);
      setSelectedQuestionnaireId(data.id);
    } else {
      const err = (await res.json()) as { error?: string };
      setImportError(err.error ?? (locale === "tr" ? "İçe aktarma başarısız" : "Import failed"));
    }
  }

  async function fillAnswersFromAI() {
    if (!selectedQuestions.length) return;
    setQaAiLoading(true);
    setMessage(locale === "tr" ? "AI yanıtları dolduruyor..." : "AI filling answers...");
    try {
      const questions = selectedQuestions.slice(0, 30).map((q) => ({
        id: q.id,
        code: q.code,
        title: q.title,
        question_text: q.question_text,
      }));
      const res = await fetch("/api/ai/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "questionnaire", questions }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setMessage(err.error ?? (locale === "tr" ? "AI doldurulamadı" : "AI fill failed"));
        return;
      }
      const data = (await res.json()) as { answers: Record<string, string> };
      const filled = Object.keys(data.answers).length;
      if (filled === 0) {
        setMessage(locale === "tr" ? "AI ilgili yanıt bulamadı." : "AI could not find relevant answers.");
        return;
      }
      // Save each answer via API
      const saves = await Promise.all(
        Object.entries(data.answers).map(([questionId, answer]) =>
          fetch("/api/questionnaire/answers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionnaireId: selectedQuestionnaireId,
              questionnaireQuestionId: questionId,
              reportingPeriodId,
              answer_text: answer,
              answer_number: null,
            }),
          }),
        ),
      );
      const saved = saves.filter((r) => r.ok).length;
      await refreshAll();
      setMessage(
        locale === "tr"
          ? `AI ${saved}/${filled} yanıtı kaydetti. Lütfen kontrol edin.`
          : `AI saved ${saved}/${filled} answers. Please review.`,
      );
    } catch {
      setMessage(locale === "tr" ? "AI servisine ulaşılamadı" : "Could not reach AI service");
    } finally {
      setQaAiLoading(false);
    }
  }

  async function deleteAnswer(answerId: string) {
    const res = await fetch("/api/questionnaire/answers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: answerId }),
    });
    setMessage(res.ok ? (locale === "tr" ? "Yanıt silindi" : "Answer deleted") : locale === "tr" ? "Silme başarısız" : "Delete failed");
    if (res.ok) await refreshAll();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("questionnaire")}
        description={
          locale === "tr"
            ? "Anket kurulumunu yönetin, yanıtları toplayın ve ilerlemeyi takip edin."
            : "Manage questionnaire setup, collect answers, and track progress."
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === "setup" ? "default" : "outline"} onClick={() => setTab("setup")}>
          {t("questionnaireSetup")}
        </Button>
        <Button variant={tab === "answers" ? "default" : "outline"} onClick={() => setTab("answers")}>
          {t("questionnaireAnswers")}
        </Button>
        <Button variant={tab === "dashboard" ? "default" : "outline"} onClick={() => setTab("dashboard")}>
          {t("questionnaireDashboard")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const a = document.createElement("a");
            a.href = `/api/export/questionnaire?reportingPeriodId=${reportingPeriodId}`;
            a.download = "questionnaire.csv";
            a.click();
          }}
        >
          {locale === "tr" ? "CSV İndir" : "Export CSV"}
        </Button>
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-sm font-medium">{locale === "tr" ? "Anket Seçimi" : "Select Questionnaire"}</label>
        <select
          className="h-9 rounded-md border border-slate-300 px-3 text-sm"
          value={selectedQuestionnaireId}
          onChange={(e) => {
            const nextId = e.target.value;
            setSelectedQuestionnaireId(nextId);
            void refreshAll(nextId);
          }}
        >
          {questionnaires.map((q) => (
            <option key={q.id} value={q.id}>
              {locale === "tr" ? q.name_tr : q.name_en || q.name_tr}
            </option>
          ))}
        </select>
      </div>

      {tab === "setup" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "tr" ? "Konular" : "Topics"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  void setupMutation(
                    "topic",
                    {
                      name_tr: String(formData.get("name_tr") || ""),
                      name_en: String(formData.get("name_en") || "") || null,
                    },
                    "POST",
                  );
                  e.currentTarget.reset();
                }}
              >
                <Input name="name_tr" placeholder="Konu (TR)" required />
                <Input name="name_en" placeholder="Topic (EN)" />
                <Button type="submit">+</Button>
              </form>
              {topics.map((topic) => (
                <div key={topic.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm">
                  <span>{topic.name_tr}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const next = window.prompt(locale === "tr" ? "Yeni konu adı" : "New topic name", topic.name_tr);
                        if (!next) return;
                        void setupMutation("topic", { id: topic.id, name_tr: next, name_en: topic.name_en }, "PATCH");
                      }}
                    >
                      {locale === "tr" ? "Düzenle" : "Edit"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => void setupMutation("topic", { entityType: "topic", id: topic.id }, "DELETE")}>
                      {locale === "tr" ? "Sil" : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "tr" ? "Anketler" : "Questionnaires"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  void setupMutation(
                    "questionnaire",
                    {
                      name_tr: String(formData.get("name_tr") || ""),
                      name_en: String(formData.get("name_en") || "") || null,
                      type: String(formData.get("type") || "VERBAL"),
                      description: String(formData.get("description") || "") || null,
                    },
                    "POST",
                  );
                  e.currentTarget.reset();
                }}
              >
                <Input name="name_tr" placeholder="Anket adı (TR)" required />
                <Input name="name_en" placeholder="Questionnaire name (EN)" />
                <select name="type" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
                  <option value="VERBAL">{locale === "tr" ? "Sözel" : "Verbal"}</option>
                  <option value="NUMERIC">{locale === "tr" ? "Sayısal" : "Numeric"}</option>
                </select>
                <Textarea name="description" placeholder={locale === "tr" ? "Açıklama" : "Description"} />
                <Button type="submit">{locale === "tr" ? "Anket Oluştur" : "Create Questionnaire"}</Button>
              </form>

              <div className="border-t border-slate-200 pt-3 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setCloneSourceId(questionnaires[0]?.id || "");
                    setCloneNameTr("");
                    setCloneNameEn("");
                    setShowCloneModal(true);
                  }}
                >
                  {locale === "tr" ? "Taslaktan Yeni Anket Oluştur" : "Create New from Template"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setImportNameTr("");
                    setImportNameEn("");
                    setImportType("VERBAL");
                    setImportFile(null);
                    setImportError("");
                    setShowImportModal(true);
                  }}
                >
                  {locale === "tr" ? "Excel'den İçe Aktar" : "Import from Excel"}
                </Button>
              </div>

              <DataTable
                data={questionnaires}
                columns={[
                  {
                    key: "name",
                    header: locale === "tr" ? "Ad" : "Name",
                    render: (row) => (locale === "tr" ? row.name_tr : row.name_en || row.name_tr),
                  },
                  { key: "type", header: locale === "tr" ? "Tür" : "Type", render: (row) => locale === "tr" ? (row.type === "VERBAL" ? "Sözel" : "Sayısal") : row.type },
                  {
                    key: "count",
                    header: locale === "tr" ? "Soru Sayısı" : "Question Count",
                    render: (row) => row.sections.flatMap((s) => s.subsections.flatMap((ss) => ss.questions)).length,
                  },
                  {
                    key: "actions",
                    header: locale === "tr" ? "İşlemler" : "Actions",
                    render: (row) => (
                      <Button size="sm" variant="destructive" onClick={() => void setupMutation("questionnaire", { entityType: "questionnaire", id: row.id }, "DELETE")}>
                        {locale === "tr" ? "Sil" : "Delete"}
                      </Button>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{locale === "tr" ? "Bölüm / Alt Bölüm / Soru Yönetimi" : "Section / Subsection / Question Management"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedQuestionnaire ? (
                <>
                  <div className="grid gap-2 md:grid-cols-3">
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        void setupMutation(
                          "section",
                          { questionnaireId: selectedQuestionnaire.id, name: String(fd.get("section_name") || "") },
                          "POST",
                        );
                        e.currentTarget.reset();
                      }}
                    >
                      <Input name="section_name" placeholder={locale === "tr" ? "Yeni bölüm" : "New section"} required />
                      <Button type="submit">+</Button>
                    </form>

                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        void setupMutation(
                          "subsection",
                          {
                            questionnaireSectionId: String(fd.get("section_id") || ""),
                            name: String(fd.get("subsection_name") || ""),
                          },
                          "POST",
                        );
                        e.currentTarget.reset();
                      }}
                    >
                      <select name="section_id" className="h-9 rounded-md border border-slate-300 px-2 text-sm" required>
                        {selectedQuestionnaire.sections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                      <Input name="subsection_name" placeholder={locale === "tr" ? "Yeni alt bölüm" : "New subsection"} required />
                      <Button type="submit">+</Button>
                    </form>

                    <form
                      className="flex flex-col gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        void setupMutation(
                          "question",
                          {
                            questionnaireId: selectedQuestionnaire.id,
                            questionnaireSectionId: String(fd.get("q_section_id") || ""),
                            questionnaireSubsectionId: String(fd.get("q_subsection_id") || ""),
                            questionnaireTopicId: String(fd.get("q_topic_id") || "") || null,
                            section: String(fd.get("q_section_name") || ""),
                            code: String(fd.get("q_code") || "") || null,
                            title: String(fd.get("q_title") || ""),
                            question_text: String(fd.get("q_text") || ""),
                            unit: String(fd.get("q_unit") || "") || null,
                            owner_name: String(fd.get("owner_name") || "") || null,
                            owner_department: String(fd.get("owner_department") || "") || null,
                            owner_email: String(fd.get("owner_email") || "") || null,
                            helper: String(fd.get("helper") || "") || null,
                            example: String(fd.get("example") || "") || null,
                            reminder: String(fd.get("reminder") || "") || null,
                            video_link: String(fd.get("video_link") || "") || null,
                          },
                          "POST",
                        );
                        e.currentTarget.reset();
                      }}
                    >
                      <select name="q_section_id" className="h-9 rounded-md border border-slate-300 px-2 text-sm" required>
                        {selectedQuestionnaire.sections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                      <select name="q_subsection_id" className="h-9 rounded-md border border-slate-300 px-2 text-sm" required>
                        {selectedQuestionnaire.sections.flatMap((section) =>
                          section.subsections.map((subsection) => (
                            <option key={subsection.id} value={subsection.id}>
                              {subsection.name}
                            </option>
                          )),
                        )}
                      </select>
                      <select name="q_topic_id" className="h-9 rounded-md border border-slate-300 px-2 text-sm">
                        <option value="">{locale === "tr" ? "Konu seçiniz" : "Select topic"}</option>
                        {topics.map((topic) => (
                          <option key={topic.id} value={topic.id}>
                            {topic.name_tr}
                          </option>
                        ))}
                      </select>
                      <Input name="q_section_name" placeholder={locale === "tr" ? "Bölüm adı" : "Section name"} required />
                      <Input name="q_code" placeholder={locale === "tr" ? "Kod" : "Code"} />
                      <Input name="q_title" placeholder={locale === "tr" ? "Soru başlığı" : "Question title"} required />
                      <Textarea name="q_text" placeholder={locale === "tr" ? "Soru metni" : "Question text"} required />
                      <Input name="q_unit" placeholder={locale === "tr" ? "Birim" : "Unit"} />
                      <Input name="owner_name" placeholder={locale === "tr" ? "Sorumlu adı" : "Owner name"} />
                      <Input name="owner_department" placeholder={locale === "tr" ? "Sorumlu departman" : "Owner department"} />
                      <Input name="owner_email" type="email" placeholder={locale === "tr" ? "Sorumlu e-posta" : "Owner email"} />
                      <Textarea name="helper" placeholder={locale === "tr" ? "Yardımcı not" : "Helper"} />
                      <Textarea name="example" placeholder={locale === "tr" ? "Örnek" : "Example"} />
                      <Textarea name="reminder" placeholder={locale === "tr" ? "Hatırlatma" : "Reminder"} />
                      <Input name="video_link" placeholder={locale === "tr" ? "Video linki" : "Video link"} />
                      <Button type="submit">{locale === "tr" ? "Soru Oluştur" : "Create Question"}</Button>
                    </form>
                  </div>

                  <DataTable
                    data={selectedQuestions}
                    columns={[
                      { key: "section", header: locale === "tr" ? "Bölüm" : "Section", render: (row) => row.section },
                      { key: "title", header: locale === "tr" ? "Başlık" : "Title", render: (row) => row.title },
                      {
                        key: "question",
                        header: locale === "tr" ? "Soru" : "Question",
                        render: (row) => <div className="max-w-[450px] whitespace-pre-wrap text-xs">{row.question_text}</div>,
                      },
                      { key: "owner", header: locale === "tr" ? "Sorumlu Departman" : "Owner Department", render: (row) => row.owner_department || "-" },
                      {
                        key: "actions",
                        header: locale === "tr" ? "İşlem" : "Action",
                        render: (row) => (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingQuestion(row)}
                            >
                              {locale === "tr" ? "Düzenle" : "Edit"}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => void setupMutation("question", { entityType: "question", id: row.id }, "DELETE")}>
                              {locale === "tr" ? "Sil" : "Delete"}
                            </Button>
                          </div>
                        ),
                      },
                    ]}
                  />

                  {editingQuestion ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingQuestion(null)}>
                      <form
                        className="grid max-h-[90vh] w-full max-w-4xl gap-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-4 md:grid-cols-2"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!selectedQuestionnaire) return;
                          const fd = new FormData(e.currentTarget);
                          void setupMutation(
                            "question",
                            {
                              id: editingQuestion.id,
                              questionnaireId: selectedQuestionnaire.id,
                              questionnaireSectionId: String(fd.get("q_section_id") || ""),
                              questionnaireSubsectionId: String(fd.get("q_subsection_id") || ""),
                              questionnaireTopicId: String(fd.get("q_topic_id") || "") || null,
                              section: String(fd.get("q_section_name") || ""),
                              code: String(fd.get("q_code") || "") || null,
                              title: String(fd.get("q_title") || ""),
                              question_text: String(fd.get("q_text") || ""),
                              unit: String(fd.get("q_unit") || "") || null,
                              owner_name: String(fd.get("owner_name") || "") || null,
                              owner_department: String(fd.get("owner_department") || "") || null,
                              owner_email: String(fd.get("owner_email") || "") || null,
                              helper: String(fd.get("helper") || "") || null,
                              example: String(fd.get("example") || "") || null,
                              reminder: String(fd.get("reminder") || "") || null,
                              video_link: String(fd.get("video_link") || "") || null,
                            },
                            "PATCH",
                          );
                          setEditingQuestion(null);
                        }}
                      >
                        <p className="col-span-full text-sm font-semibold">{locale === "tr" ? "Soruyu Düzenle" : "Edit Question"}</p>
                        <select name="q_section_id" defaultValue={editingQuestion.questionnaireSectionId || ""} className="h-9 rounded-md border border-slate-300 px-2 text-sm" required>
                          {selectedQuestionnaire.sections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.name}
                            </option>
                          ))}
                        </select>
                        <select name="q_subsection_id" defaultValue={editingQuestion.questionnaireSubsectionId || ""} className="h-9 rounded-md border border-slate-300 px-2 text-sm" required>
                          {selectedQuestionnaire.sections.flatMap((section) =>
                            section.subsections.map((subsection) => (
                              <option key={subsection.id} value={subsection.id}>
                                {subsection.name}
                              </option>
                            )),
                          )}
                        </select>
                        <select name="q_topic_id" defaultValue={editingQuestion.questionnaireTopicId || ""} className="h-9 rounded-md border border-slate-300 px-2 text-sm">
                          <option value="">{locale === "tr" ? "Konu seçiniz" : "Select topic"}</option>
                          {topics.map((topic) => (
                            <option key={topic.id} value={topic.id}>
                              {topic.name_tr}
                            </option>
                          ))}
                        </select>
                        <Input name="q_section_name" defaultValue={editingQuestion.section} placeholder={locale === "tr" ? "Bölüm adı" : "Section name"} required />
                        <Input name="q_code" defaultValue={editingQuestion.code || ""} placeholder={locale === "tr" ? "Kod" : "Code"} />
                        <Input name="q_title" defaultValue={editingQuestion.title} placeholder={locale === "tr" ? "Soru başlığı" : "Question title"} required />
                        <Textarea name="q_text" defaultValue={editingQuestion.question_text} placeholder={locale === "tr" ? "Soru metni" : "Question text"} required />
                        <Input name="q_unit" defaultValue={editingQuestion.unit || ""} placeholder={locale === "tr" ? "Birim" : "Unit"} />
                        <Input name="owner_name" defaultValue={editingQuestion.owner_name || ""} placeholder={locale === "tr" ? "Sorumlu adı" : "Owner name"} />
                        <Input name="owner_department" defaultValue={editingQuestion.owner_department || ""} placeholder={locale === "tr" ? "Sorumlu departman" : "Owner department"} />
                        <Input name="owner_email" type="email" defaultValue={editingQuestion.owner_email || ""} placeholder={locale === "tr" ? "Sorumlu e-posta" : "Owner email"} />
                        <Textarea name="helper" defaultValue={editingQuestion.helper || ""} placeholder={locale === "tr" ? "Yardımcı not" : "Helper"} />
                        <Textarea name="example" defaultValue={editingQuestion.example || ""} placeholder={locale === "tr" ? "Örnek" : "Example"} />
                        <Textarea name="reminder" defaultValue={editingQuestion.reminder || ""} placeholder={locale === "tr" ? "Hatırlatma" : "Reminder"} />
                        <Input name="video_link" defaultValue={editingQuestion.video_link || ""} placeholder={locale === "tr" ? "Video linki" : "Video link"} />
                        <div className="col-span-full flex gap-2">
                          <Button type="submit">{locale === "tr" ? "Güncelle" : "Update"}</Button>
                          <Button type="button" variant="outline" onClick={() => setEditingQuestion(null)}>
                            {locale === "tr" ? "Vazgeç" : "Cancel"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-slate-600">{locale === "tr" ? "Anket bulunamadı." : "No questionnaire found."}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "answers" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{t("questionnaireAnswers")}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fillAnswersFromAI()}
                disabled={qaAiLoading || !selectedQuestions.length}
              >
                {qaAiLoading
                  ? (locale === "tr" ? "Yükleniyor..." : "Loading...")
                  : (locale === "tr" ? "AI ile Doldur" : "Fill with AI")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 lg:grid-cols-3">
              <div className="overflow-hidden rounded-sm border border-black bg-[#e6e6e6] lg:col-span-2">
                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-3 border-r border-black px-3 py-2 text-sm font-bold uppercase tracking-wide">
                    {locale === "tr" ? "VERİ GİRİŞİ" : "DATA ENTRY"}
                  </div>
                  <div className="col-span-9 px-3 py-2 text-sm font-bold uppercase tracking-wide">
                    {locale === "tr" ? "AŞAĞIDAKİ ADIMLARI UYGULAYINIZ" : "FOLLOW THE STEPS BELOW"}
                  </div>
                </div>
                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-3 border-r border-black px-3 py-1 text-base font-bold">{dashboard.progress}%</div>
                  <div className="col-span-9 px-3 py-1 text-sm font-semibold">
                    {locale === "tr" ? "YALNIZCA YANIT SÜTUNUNU DOLDURUNUZ" : "ONLY FILL IN THE ANSWER COLUMN"}
                  </div>
                </div>
                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-3 border-r border-black px-3 py-1 text-sm">&nbsp;</div>
                  <div className="col-span-9 px-3 py-1 text-sm font-semibold">
                    {locale === "tr"
                      ? "ÖNCE SAĞDA YER ALAN DEPARTMAN BUTONUNDAN DEPARTMANINIZI SEÇEBİLİRSİNİZ"
                      : "YOU CAN FIRST SELECT YOUR DEPARTMENT USING THE DEPARTMENT BUTTON"}
                  </div>
                </div>
                <div className="grid grid-cols-12">
                  <div className="col-span-3 border-r border-black px-3 py-1 text-sm">&nbsp;</div>
                  <div className="col-span-9 px-3 py-1 text-sm font-semibold">
                    {locale === "tr"
                      ? "GRI 3-3 SORULARININ YANITLANMASI STANDARDA GÖRE ZORUNLUDUR"
                      : "ANSWERING GRI 3-3 QUESTIONS IS REQUIRED BY THE STANDARD"}
                  </div>
                </div>
              </div>
              <div className="rounded-sm border border-[#2e7d32] bg-[#edf7ed] px-3 py-2 text-xs text-[#1b5e20]">
                {locale === "tr"
                  ? "Bu panel, Excel’deki bilgilendirme alanını temsil eder. Soru yanıtlamadan önce adımları takip ediniz."
                  : "This panel mirrors the informational area from the Excel sheet. Follow steps before answering."}
              </div>
            </div>

            <div className="overflow-x-auto rounded-sm border border-black bg-white">
              <table className="w-full min-w-[1400px] border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#0070c0] text-white">
                    <th className="border border-black px-2 py-2 text-left font-bold uppercase">KONU</th>
                    <th className="border border-black px-2 py-2 text-left font-bold uppercase">KOD</th>
                    <th className="border border-black px-2 py-2 text-left font-bold uppercase">SORU BAŞLIĞI</th>
                    <th className="border border-black px-2 py-2 text-left font-bold uppercase">SORU</th>
                    <th className="border border-black px-2 py-2 text-left font-bold uppercase">
                      {locale === "tr" ? "LÜTFEN BURAYA YANIT GİRİNİZ" : "ENTER ANSWER HERE"}
                    </th>
                    <th className="border border-black px-2 py-2 text-left font-bold uppercase">İLGİLİ BİRİM</th>
                    <th className="border border-black px-2 py-2 text-left font-bold uppercase">VERİ DOĞRULUĞU</th>
                    <th className="border border-black px-2 py-2 text-left font-bold uppercase">AÇIKLAMA</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuestions.map((row, index) => {
                    const existing = answerMap.get(row.id);
                    return (
                      <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f7fbff]"}>
                        <td className="border border-black px-2 py-2 align-top font-medium">{row.section}</td>
                        <td className="border border-black px-2 py-2 align-top">{row.code || "-"}</td>
                        <td className="border border-black px-2 py-2 align-top font-semibold">{row.title}</td>
                        <td className="border border-black px-2 py-2 align-top">
                          <div className="max-w-[420px] whitespace-pre-wrap">{row.question_text}</div>
                        </td>
                        <td className="border border-black px-2 py-2 align-top">
                          <div className="flex min-w-[280px] flex-col gap-2">
                            <div className="flex gap-2">
                              <Input id={`text-${row.id}`} defaultValue={existing?.answer_text || ""} placeholder={locale === "tr" ? "Yanıt" : "Answer"} />
                              {selectedQuestionnaire?.type === "NUMERIC" ? (
                                <Input id={`num-${row.id}`} defaultValue={existing?.answer_number || ""} placeholder="0" type="number" />
                              ) : null}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const text = (document.getElementById(`text-${row.id}`) as HTMLInputElement | null)?.value || "";
                                  const num = (document.getElementById(`num-${row.id}`) as HTMLInputElement | null)?.value || "";
                                  void saveAnswer(row.id, text, num);
                                }}
                              >
                                {locale === "tr" ? "Kaydet" : "Save"}
                              </Button>
                              {existing ? (
                                <Button size="sm" variant="destructive" onClick={() => void deleteAnswer(existing.id)}>
                                  {locale === "tr" ? "Sil" : "Delete"}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="border border-black px-2 py-2 align-top">{row.owner_department || "-"}</td>
                        <td className="border border-black px-2 py-2 align-top">
                          {existing ? (locale === "tr" ? "Tamamlandı" : "Completed") : locale === "tr" ? "Bekliyor" : "Pending"}
                        </td>
                        <td className="border border-black px-2 py-2 align-top text-slate-700">
                          <div className="max-w-[360px] whitespace-pre-wrap">{row.helper || "-"}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showImportModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-base font-semibold">
              {locale === "tr" ? "Excel'den Anket İçe Aktar" : "Import Questionnaire from Excel"}
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              {locale === "tr"
                ? "Excel dosyanızda şu sütunlar olmalı: Bölüm, Alt Bölüm, Kod, Başlık, Soru Metni, Birim, Sahip Adı, Sahip Departman, Sahip E-posta, Yardımcı Bilgi, Örnek, Hatırlatıcı"
                : "Your Excel file should have columns: Section, Subsection, Code, Title, Question Text, Unit, Owner Name, Owner Dept, Owner Email, Helper, Example, Reminder"}
            </p>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {locale === "tr" ? "Anket Adı (TR)" : "Questionnaire Name (TR)"}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    value={importNameTr}
                    onChange={(e) => setImportNameTr(e.target.value)}
                    placeholder={locale === "tr" ? "Anket adı" : "Questionnaire name"}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {locale === "tr" ? "Anket Adı (EN)" : "Questionnaire Name (EN)"}
                  </label>
                  <Input
                    value={importNameEn}
                    onChange={(e) => setImportNameEn(e.target.value)}
                    placeholder="Questionnaire name (EN)"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {locale === "tr" ? "Anket Türü" : "Questionnaire Type"}
                </label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as "VERBAL" | "NUMERIC")}
                >
                  <option value="VERBAL">{locale === "tr" ? "Sözel" : "Verbal"}</option>
                  <option value="NUMERIC">{locale === "tr" ? "Sayısal" : "Numeric"}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {locale === "tr" ? "Excel Dosyası (.xlsx)" : "Excel File (.xlsx)"}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-slate-700"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = "/api/questionnaire/import";
                    a.download = "anket-sablonu.xlsx";
                    a.click();
                  }}
                >
                  {locale === "tr" ? "Boş şablonu indir" : "Download blank template"}
                </button>
              </div>
              {importError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{importError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => void importFromExcel()}
                  disabled={importLoading || !importNameTr.trim() || !importFile}
                  className="flex-1"
                >
                  {importLoading
                    ? locale === "tr" ? "İçe aktarılıyor..." : "Importing..."
                    : locale === "tr" ? "İçe Aktar" : "Import"}
                </Button>
                <Button variant="outline" onClick={() => setShowImportModal(false)}>
                  {locale === "tr" ? "Vazgeç" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCloneModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowCloneModal(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-base font-semibold">
              {locale === "tr" ? "Taslaktan Yeni Anket Oluştur" : "Create New Questionnaire from Template"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {locale === "tr" ? "Şablon Anket" : "Template Questionnaire"}
                </label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
                  value={cloneSourceId}
                  onChange={(e) => setCloneSourceId(e.target.value)}
                >
                  {questionnaires.map((q) => (
                    <option key={q.id} value={q.id}>
                      {locale === "tr" ? q.name_tr : q.name_en || q.name_tr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {locale === "tr" ? "Yeni Anket Adı (TR)" : "New Questionnaire Name (TR)"}
                </label>
                <Input
                  value={cloneNameTr}
                  onChange={(e) => setCloneNameTr(e.target.value)}
                  placeholder={locale === "tr" ? "Anket adı (TR)" : "Questionnaire name (TR)"}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {locale === "tr" ? "Yeni Anket Adı (EN)" : "New Questionnaire Name (EN)"}
                </label>
                <Input
                  value={cloneNameEn}
                  onChange={(e) => setCloneNameEn(e.target.value)}
                  placeholder={locale === "tr" ? "Anket adı (EN)" : "Questionnaire name (EN)"}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => void cloneQuestionnaire()}
                  disabled={cloneLoading || !cloneNameTr.trim()}
                  className="flex-1"
                >
                  {cloneLoading
                    ? locale === "tr" ? "Oluşturuluyor..." : "Creating..."
                    : locale === "tr" ? "Oluştur" : "Create"}
                </Button>
                <Button variant="outline" onClick={() => setShowCloneModal(false)}>
                  {locale === "tr" ? "Vazgeç" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "dashboard" ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("questionnaireDashboard")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgressBar value={dashboard.progress} label={`${dashboard.progress}%`} />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded border border-slate-200 p-3 text-sm">
                <p className="text-slate-500">{locale === "tr" ? "Toplam Soru" : "Total Questions"}</p>
                <p className="text-xl font-semibold">{dashboard.totalQuestions}</p>
              </div>
              <div className="rounded border border-slate-200 p-3 text-sm">
                <p className="text-slate-500">{locale === "tr" ? "Yanıtlanan" : "Answered"}</p>
                <p className="text-xl font-semibold">{dashboard.answered}</p>
              </div>
              <div className="rounded border border-slate-200 p-3 text-sm">
                <p className="text-slate-500">{locale === "tr" ? "Kalan" : "Remaining"}</p>
                <p className="text-xl font-semibold">{dashboard.remaining}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
