import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-10 w-48" /><Skeleton className="h-5 w-80" /></div><Skeleton className="h-10 w-32" /></div>
        <div className="grid grid-cols-4 gap-6">{Array.from({length:8}).map((_,i)=><Card key={i} className="border-0"><div className="h-2 bg-gray-200"/><CardHeader className="space-y-3"><Skeleton className="h-12 w-12 rounded-xl"/><Skeleton className="h-5 w-full"/></CardHeader><CardContent><Skeleton className="h-6 w-20"/></CardContent></Card>)}</div>
      </div>
    </div>
  );
}
