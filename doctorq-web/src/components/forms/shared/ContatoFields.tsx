/**
 * Componente reutilizável de campos de contato
 * Usado em formulários de Empresa, Clínica, Profissional e Fornecedor
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MessageCircle, Globe } from "lucide-react";

interface ContatoFieldsProps {
  values: {
    ds_email?: string;
    nr_telefone?: string;
    nr_whatsapp?: string;
    ds_site?: string;
  };
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
  showWebsite?: boolean; // Mostrar campo de site (opcional)
}

export function ContatoFields({
  values,
  onChange,
  disabled = false,
  showWebsite = true,
}: ContatoFieldsProps) {
  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, "");

    // Formato: (11) 98765-4321 ou (11) 3456-7890
    if (clean.length <= 10) {
      return clean
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return clean
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handlePhoneChange = (field: string, value: string) => {
    const formatted = formatPhone(value);
    onChange(field, formatted);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="ds_email">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>E-mail</span>
            </div>
          </Label>
          <Input
            id="ds_email"
            type="email"
            placeholder="contato@exemplo.com"
            value={values.ds_email || ""}
            onChange={(e) => onChange("ds_email", e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="nr_telefone">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>Telefone</span>
            </div>
          </Label>
          <Input
            id="nr_telefone"
            placeholder="(11) 3456-7890"
            value={values.nr_telefone || ""}
            onChange={(e) => handlePhoneChange("nr_telefone", e.target.value)}
            disabled={disabled}
            maxLength={15}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp */}
        <div className="space-y-2">
          <Label htmlFor="nr_whatsapp">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </div>
          </Label>
          <Input
            id="nr_whatsapp"
            placeholder="(11) 98765-4321"
            value={values.nr_whatsapp || ""}
            onChange={(e) => handlePhoneChange("nr_whatsapp", e.target.value)}
            disabled={disabled}
            maxLength={15}
          />
        </div>

        {/* Site (opcional) */}
        {showWebsite && (
          <div className="space-y-2">
            <Label htmlFor="ds_site">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Website</span>
              </div>
            </Label>
            <Input
              id="ds_site"
              type="url"
              placeholder="https://www.exemplo.com"
              value={values.ds_site || ""}
              onChange={(e) => onChange("ds_site", e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}
