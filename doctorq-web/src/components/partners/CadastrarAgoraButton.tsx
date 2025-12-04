"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface CadastrarAgoraButtonProps {
  iframeUrl?: string;
  label?: string;
  className?: string;
}

export function CadastrarAgoraButton({
  iframeUrl = "/parceiros/novo",
  label = "Cadastrar Agora",
  className,
}: CadastrarAgoraButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className={cn(
          "bg-white text-rose-600 hover:bg-rose-50 px-8 py-6 text-lg font-semibold shadow-lg shadow-rose-900/20 flex items-center gap-2",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <span>{label}</span>
        <ArrowRight className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl w-[94vw] h-[84vh] overflow-hidden rounded-[32px] border border-rose-200 bg-white/95 p-0">
          <div className="flex h-full flex-col">
            <DialogHeader className="px-8 pt-8 pb-4 space-y-4">
              <DialogTitle className="text-2xl font-bold text-slate-900">
              Escolha o plano perfeito
              </DialogTitle>              
            </DialogHeader>

            <div className="flex-1 px-8 pb-8">
              <div className="h-full w-full overflow-hidden rounded-[28px] border border-rose-100 shadow-lg shadow-rose-200/30">
                <iframe
                  src={iframeUrl}
                  title="Cadastro de parceiros"
                  className="h-full w-full border-0"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
