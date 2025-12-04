import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Database, Upload } from 'lucide-react';

export const metadata = { title: 'Knowledge Base | DoctorQ Admin' };

export default function KnowledgePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Base de Conhecimento" description="Gerencie documentos e embeddings para RAG" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Documentos', count: '245', icon: FileText, color: 'from-blue-500 to-cyan-600' },
            { title: 'Embeddings', count: '1.2K', icon: Database, color: 'from-purple-500 to-blue-600' },
            { title: 'Uploads Pendentes', count: '8', icon: Upload, color: 'from-orange-500 to-red-600' },
          ].map((item, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${item.color}`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{item.count}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
