import {Skeleton} from '@/components/ui/skeleton';
import {Card,CardContent} from '@/components/ui/card';

export default function Loading(){
  return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
    <div className="container mx-auto p-8 space-y-6">
      <div className="space-y-2"><Skeleton className="h-10 w-64"/><Skeleton className="h-5 w-96"/></div>
      <Card className="border-0"><CardContent className="p-12 space-y-4">
        <Skeleton className="h-16 w-16 mx-auto"/><Skeleton className="h-6 w-48 mx-auto"/>
        <Skeleton className="h-4 w-64 mx-auto"/></CardContent></Card>
    </div>
  </div>;
}
