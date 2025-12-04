"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const typeOptions = [
  { value: "clinica", label: "Clínica de Estética" },
  { value: "profissional", label: "Profissional Autônomo" },
  { value: "fabricante", label: "Fabricante / Laboratório" },
  { value: "fornecedor", label: "Fornecedor / Distribuidor" },
];

interface PartnerLeadFormProps {
  defaultType?: string;
}

export function PartnerLeadForm({ defaultType = "clinica" }: PartnerLeadFormProps) {
  const [form, setForm] = useState({
    type: defaultType,
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    services: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim()) {
      toast.error("Informe nome da empresa, contato e e-mail.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/partner-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: form.type,
          companyName: form.companyName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          location: form.location.trim() || undefined,
          website: form.website.trim() || undefined,
          services: form.services
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          notes: form.notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Não foi possível enviar seu cadastro.");
      }

      toast.success("Recebemos seu cadastro! Entraremos em contato em breve.");
      setForm({
        type: form.type,
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        services: "",
        notes: "",
      });
    } catch (error) {
      console.error("Erro ao enviar cadastro de parceiro:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao enviar cadastro.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-[28px] border border-blue-100 bg-white p-8 shadow-lg shadow-pink-200/30">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Tipo de parceria</p>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: option.value }))}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                form.type === option.value
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-blue-200 text-blue-500 hover:bg-blue-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <label className="text-sm font-semibold text-gray-700">
            Nome da empresa ou marca
          </label>
          <Input
            required
            placeholder="Ex: Aurora Glow Clinic"
            value={form.companyName}
            onChange={handleChange("companyName")}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-semibold text-gray-700">Nome do responsável</label>
          <Input
            required
            placeholder="Seu nome completo"
            value={form.contactName}
            onChange={handleChange("contactName")}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-semibold text-gray-700">E-mail</label>
          <Input
            required
            type="email"
            placeholder="nome@empresa.com"
            value={form.email}
            onChange={handleChange("email")}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-semibold text-gray-700">Telefone / WhatsApp</label>
          <Input
            placeholder="(00) 00000-0000"
            value={form.phone}
            onChange={handleChange("phone")}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-semibold text-gray-700">Cidade / Estado</label>
          <Input
            placeholder="Ex: São Paulo • SP"
            value={form.location}
            onChange={handleChange("location")}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-semibold text-gray-700">Site ou Instagram</label>
          <Input
            placeholder="https://suaempresa.com"
            value={form.website}
            onChange={handleChange("website")}
          />
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold text-gray-700">
          Principais serviços ou produtos (separados por vírgula)
        </label>
        <Textarea
          placeholder="Ex: Harmonização facial, depilação a laser, dermocosméticos autorais"
          value={form.services}
          onChange={handleChange("services")}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold text-gray-700">Mensagem adicional</label>
        <Textarea
          placeholder="Conte rapidamente como podemos ajudar ou diferenciais da sua operação"
          value={form.notes}
          onChange={handleChange("notes")}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-pink-500/40"
        disabled={submitting}
      >
        {submitting ? "Enviando..." : "Quero ser parceiro"}
      </Button>
      <p className="text-center text-xs text-gray-500">
        Ao enviar o formulário você concorda em receber contato do time DoctorQ.
      </p>
    </form>
  );
}
