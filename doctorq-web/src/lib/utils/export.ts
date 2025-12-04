/**
 * Export Utilities
 *
 * Funções para exportar dados em diversos formatos (CSV, Excel, JSON, PDF)
 */

/**
 * Converte array de objetos para CSV
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return '';

  // Se não forneceu colunas, usa todas as keys do primeiro objeto
  const cols = columns || Object.keys(data[0]).map(key => ({ key, header: key }));

  // Header
  const header = cols.map(col => escapeCSVField(col.header)).join(',');

  // Rows
  const rows = data.map(row => {
    return cols
      .map(col => {
        const value = row[col.key];
        return escapeCSVField(String(value ?? ''));
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Escapa campo CSV (adiciona aspas se necessário)
 */
function escapeCSVField(field: string): string {
  // Se contém vírgula, quebra de linha ou aspas, precisa escapar
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Baixa CSV
 */
export function downloadCSV(csv: string, filename: string = 'export.csv'): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta array de objetos para CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string = 'export.csv',
  columns?: { key: keyof T; header: string }[]
): void {
  const csv = arrayToCSV(data, columns);
  downloadCSV(csv, filename);
}

/**
 * Converte array de objetos para Excel (HTML table)
 *
 * Nota: Para Excel real (.xlsx), seria necessário usar biblioteca como 'xlsx'
 * Esta implementação cria um arquivo HTML que o Excel pode abrir
 */
export function arrayToExcel<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return '';

  const cols = columns || Object.keys(data[0]).map(key => ({ key, header: key }));

  // HTML table
  const header = `
    <thead>
      <tr>
        ${cols.map(col => `<th>${col.header}</th>`).join('')}
      </tr>
    </thead>
  `;

  const body = `
    <tbody>
      ${data
        .map(
          row => `
        <tr>
          ${cols.map(col => `<td>${row[col.key] ?? ''}</td>`).join('')}
        </tr>
      `
        )
        .join('')}
    </tbody>
  `;

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          ${header}
          ${body}
        </table>
      </body>
    </html>
  `;
}

/**
 * Baixa Excel
 */
export function downloadExcel(html: string, filename: string = 'export.xls'): void {
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta array de objetos para Excel
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string = 'export.xls',
  columns?: { key: keyof T; header: string }[]
): void {
  const html = arrayToExcel(data, columns);
  downloadExcel(html, filename);
}

/**
 * Exporta para JSON
 */
export function exportToJSON<T>(
  data: T[],
  filename: string = 'export.json',
  pretty: boolean = true
): void {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta para TXT
 */
export function exportToTXT(
  content: string,
  filename: string = 'export.txt'
): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta para PDF (requer jsPDF)
 *
 * Exemplo de uso com jsPDF:
 * ```
 * import jsPDF from 'jspdf';
 * import autoTable from 'jspdf-autotable';
 *
 * export function exportToPDF<T extends Record<string, any>>(
 *   data: T[],
 *   filename: string = 'export.pdf',
 *   columns?: { key: keyof T; header: string }[]
 * ) {
 *   const doc = new jsPDF();
 *   const cols = columns || Object.keys(data[0]).map(key => ({ key, header: key }));
 *
 *   autoTable(doc, {
 *     head: [cols.map(col => col.header)],
 *     body: data.map(row => cols.map(col => row[col.key] ?? '')),
 *   });
 *
 *   doc.save(filename);
 * }
 * ```
 */

/**
 * Helper para formatar dados antes de exportar
 */
export function formatDataForExport<T extends Record<string, any>>(
  data: T[],
  formatters?: Partial<Record<keyof T, (value: any) => string>>
): T[] {
  if (!formatters) return data;

  return data.map(row => {
    const formatted = { ...row };
    for (const key in formatters) {
      if (key in row) {
        formatted[key] = formatters[key]!(row[key]) as any;
      }
    }
    return formatted;
  });
}

/**
 * Exemplo de formatters comuns
 */
export const commonFormatters = {
  date: (value: string | Date) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR');
  },
  datetime: (value: string | Date) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('pt-BR');
  },
  currency: (value: number) => {
    if (value == null) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },
  boolean: (value: boolean) => (value ? 'Sim' : 'Não'),
  cpf: (value: string) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },
  cnpj: (value: string) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  },
  phone: (value: string) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  },
};

/**
 * Export com filtros aplicados
 */
export interface ExportOptions<T> {
  filename?: string;
  format: 'csv' | 'excel' | 'json' | 'txt';
  columns?: { key: keyof T; header: string }[];
  formatters?: Partial<Record<keyof T, (value: any) => string>>;
  filterFn?: (row: T) => boolean;
}

export function exportData<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions<T>
): void {
  const {
    filename = `export-${Date.now()}`,
    format,
    columns,
    formatters,
    filterFn,
  } = options;

  // Aplicar filtro
  let filteredData = filterFn ? data.filter(filterFn) : data;

  // Aplicar formatters
  if (formatters) {
    filteredData = formatDataForExport(filteredData, formatters);
  }

  // Exportar no formato escolhido
  switch (format) {
    case 'csv':
      exportToCSV(filteredData, `${filename}.csv`, columns);
      break;
    case 'excel':
      exportToExcel(filteredData, `${filename}.xls`, columns);
      break;
    case 'json':
      exportToJSON(filteredData, `${filename}.json`);
      break;
    case 'txt':
      const csv = arrayToCSV(filteredData, columns);
      exportToTXT(csv, `${filename}.txt`);
      break;
  }
}
