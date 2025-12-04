import {Skeleton} from '@/components/ui/skeleton';
import {Card,CardContent} from '@/components/ui/card';

export default function Loading(){
  return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
    <div className="container mx-auto p-8 space-y-6">
      <div className="space-y-2"><Skeleton className="h-10 w-64"/><Skeleton className="h-5 w-96"/></div>
      <Card className="border-0"><CardContent className="p-6 space-y-4">
        <div className="flex gap-4"><Skeleton className="h-10 flex-1"/><Skeleton className="h-10 w-48"/></div>
      </CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_,i)=><Card key={i} className="border-0"><CardContent className="p-0">
          <Skeleton className="aspect-square w-full"/><div className="p-4 space-y-3">
          <Skeleton className="h-5 w-full"/><Skeleton className="h-8 w-24"/><Skeleton className="h-10 w-full"/>
        </div></CardContent></Card>)}
      </div>
    </div>
  </div>;
}
