'use client';
import {useEffect} from 'react';
import {ErrorState} from '@/components/shared/feedback/ErrorState';

export default function Error({error,reset}:{error:Error;reset:()=>void}){
  useEffect(()=>console.error(error),[error]);
  return <div className="min-h-screen flex items-center justify-center p-8">
    <ErrorState title="Erro ao Carregar" error={error} onRetry={reset}/>
  </div>;
}
