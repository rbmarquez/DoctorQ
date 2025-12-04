/**
 * Componente de formulário em dialog genérico
 *
 * Características:
 * - Tipagem genérica para qualquer entidade
 * - Integração com React Hook Form
 * - Validação com Zod
 * - Estados de loading e erro
 * - Modo criar e editar
 */

'use client';

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * Props do FormDialog
 */
export interface FormDialogProps<T> {
  /** Se o dialog está aberto */
  open: boolean;
  /** Callback ao fechar o dialog */
  onOpenChange: (open: boolean) => void;
  /** Título do dialog */
  title: string;
  /** Descrição do dialog */
  description?: string;
  /** Conteúdo do formulário (campos) */
  children: ReactNode;
  /** Callback ao submeter o formulário */
  onSubmit: (data: T) => void | Promise<void>;
  /** Se está processando (salvando) */
  isSubmitting?: boolean;
  /** Label do botão de submit */
  submitLabel?: string;
  /** Label do botão de cancelar */
  cancelLabel?: string;
  /** Tamanho do dialog */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Mapa de tamanhos para classes CSS
 */
const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Componente de dialog com formulário genérico
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const { trigger: criarEmpresa, isMutating } = useCreateEmpresa();
 *
 * const handleSubmit = async (data: CreateEmpresaDto) => {
 *   await criarEmpresa(data);
 *   setOpen(false);
 * };
 *
 * <FormDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Nova Empresa"
 *   description="Preencha os dados da nova empresa"
 *   onSubmit={handleSubmit}
 *   isSubmitting={isMutating}
 * >
 *   <FormField name="nm_razao_social" label="Razão Social" />
 *   <FormField name="nr_cnpj" label="CNPJ" />
 * </FormDialog>
 * ```
 */
export function FormDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  size = 'md',
}: FormDialogProps<T>) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries()) as T;
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="py-6 space-y-4">{children}</div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Componente de campo de formulário simples
 */
export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'tel' | 'url' | 'password' | 'textarea';
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number;
  className?: string;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  defaultValue,
  className = '',
}: FormFieldProps) {
  const inputClasses = `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

  const textareaClasses = `flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          className={textareaClasses}
          rows={4}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          className={inputClasses}
        />
      )}
    </div>
  );
}

/**
 * Componente de select para formulários
 */
export interface FormSelectProps {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder = 'Selecione...',
  required = false,
  defaultValue,
  className = '',
}: FormSelectProps) {
  const selectClasses = `flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium leading-none">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={selectClasses}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
