import { PageHeader } from "@/components/shared/layout/PageHeader";
import { PartnerPlansManager } from "@/components/partners/admin/PartnerPlansManager";

export const metadata = {
  title: "Planos de Parceria",
};

export default function PartnerPlansPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto space-y-8 px-6 py-10 lg:px-10">
        <PageHeader
          title="Catálogo de Planos"
          description="Gerencie os planos e serviços disponíveis no funil de parceiros."
          backHref="/admin/dashboard"
        />
        <PartnerPlansManager />
      </div>
    </div>
  );
}
