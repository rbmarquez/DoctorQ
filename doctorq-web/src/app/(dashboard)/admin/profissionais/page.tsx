import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Profissionais | DoctorQ Admin' };

export default function ProfissionaisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Profissionais" description="Gerencie profissionais do sistema" />
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Página em Desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Esta página será implementada com DataTable e formulários completos em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
