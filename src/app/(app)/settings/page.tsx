import { PageHeader } from "@/components/domain/PageHeader";
import { SettingsClient } from "@/components/domain/SettingsClient";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        titleTr="Ayarlar"
        titleEn="Settings"
        description="Manage workspace-level preferences and system notices."
        descriptionTr="Çalışma alanı tercihlerini ve sistem bildirimlerini yönetin."
        descriptionEn="Manage workspace-level preferences and system notices."
      />
      <SettingsClient />
    </div>
  );
}
