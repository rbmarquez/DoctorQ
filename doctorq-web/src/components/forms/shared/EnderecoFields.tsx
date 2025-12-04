/**
 * Componente reutilizável de campos de endereço
 * Usado em formulários de Empresa, Clínica, Profissional e Fornecedor
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EnderecoFieldsProps {
  values: {
    ds_endereco?: string;
    nr_numero?: string;
    ds_complemento?: string;
    nm_bairro?: string;
    nm_cidade?: string;
    nm_estado?: string;
    nr_cep?: string;
  };
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
  prefix?: string; // Para diferenciar campos em formulários com múltiplos endereços
}

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function EnderecoFields({
  values,
  onChange,
  disabled = false,
  prefix = "",
}: EnderecoFieldsProps) {
  const getFieldName = (field: string) => prefix ? `${prefix}_${field}` : field;

  const handleCEPChange = async (cep: string) => {
    onChange(getFieldName("nr_cep"), cep);

    // Buscar endereço via ViaCEP quando CEP tiver 8 dígitos
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();

        if (!data.erro) {
          onChange(getFieldName("ds_endereco"), data.logradouro || "");
          onChange(getFieldName("nm_bairro"), data.bairro || "");
          onChange(getFieldName("nm_cidade"), data.localidade || "");
          onChange(getFieldName("nm_estado"), data.uf || "");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const formatCEP = (value: string) => {
    const clean = value.replace(/\D/g, "");
    return clean.replace(/^(\d{5})(\d)/, "$1-$2");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CEP */}
        <div className="space-y-2">
          <Label htmlFor={getFieldName("nr_cep")}>CEP</Label>
          <Input
            id={getFieldName("nr_cep")}
            placeholder="00000-000"
            value={values.nr_cep || ""}
            onChange={(e) => handleCEPChange(formatCEP(e.target.value))}
            disabled={disabled}
            maxLength={9}
          />
        </div>

        {/* Endereço */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor={getFieldName("ds_endereco")}>Endereço</Label>
          <Input
            id={getFieldName("ds_endereco")}
            placeholder="Rua, avenida, etc."
            value={values.ds_endereco || ""}
            onChange={(e) => onChange(getFieldName("ds_endereco"), e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Número */}
        <div className="space-y-2">
          <Label htmlFor={getFieldName("nr_numero")}>Número</Label>
          <Input
            id={getFieldName("nr_numero")}
            placeholder="123"
            value={values.nr_numero || ""}
            onChange={(e) => onChange(getFieldName("nr_numero"), e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Complemento */}
        <div className="space-y-2">
          <Label htmlFor={getFieldName("ds_complemento")}>Complemento</Label>
          <Input
            id={getFieldName("ds_complemento")}
            placeholder="Sala, andar, etc."
            value={values.ds_complemento || ""}
            onChange={(e) => onChange(getFieldName("ds_complemento"), e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Bairro */}
        <div className="space-y-2">
          <Label htmlFor={getFieldName("nm_bairro")}>Bairro</Label>
          <Input
            id={getFieldName("nm_bairro")}
            placeholder="Centro"
            value={values.nm_bairro || ""}
            onChange={(e) => onChange(getFieldName("nm_bairro"), e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cidade */}
        <div className="space-y-2">
          <Label htmlFor={getFieldName("nm_cidade")}>Cidade</Label>
          <Input
            id={getFieldName("nm_cidade")}
            placeholder="São Paulo"
            value={values.nm_cidade || ""}
            onChange={(e) => onChange(getFieldName("nm_cidade"), e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor={getFieldName("nm_estado")}>Estado</Label>
          <Select
            value={values.nm_estado || ""}
            onValueChange={(value) => onChange(getFieldName("nm_estado"), value)}
            disabled={disabled}
          >
            <SelectTrigger id={getFieldName("nm_estado")}>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_BRASIL.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
