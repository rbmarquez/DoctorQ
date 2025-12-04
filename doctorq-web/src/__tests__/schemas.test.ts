/**
 * Testes para os schemas de valida\u00e7\u00e3o Zod
 */

import {
  profissionalSchema,
  clinicaSchema,
  albumSchema,
  fotoSchema,
  agendamentoSchema,
  avaliacaoSchema,
  transacaoSchema,
  configuracaoSchema,
  uploadFileSchema,
  formatZodError,
  validateWithSchema,
} from '@/lib/schemas';
import { z } from 'zod';

describe('Schemas de Valida\u00e7\u00e3o Zod', () => {
  describe('profissionalSchema', () => {
    it('should validate a valid profissional', () => {
      const validData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        nm_profissional: 'Dr. João Silva',
        ds_especialidades: 'Dermatologia, Est\u00e9tica',
        nr_anos_experiencia: 10,
      };

      const result = profissionalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        id_user: 'invalid-uuid',
        nm_profissional: 'Dr. João Silva',
      };

      const result = profissionalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ID de usu\u00e1rio inv\u00e1lido');
      }
    });

    it('should reject short name', () => {
      const invalidData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        nm_profissional: 'Dr',
      };

      const result = profissionalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative experience years', () => {
      const invalidData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        nm_profissional: 'Dr. João Silva',
        nr_anos_experiencia: -5,
      };

      const result = profissionalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('clinicaSchema', () => {
    it('should validate a valid clinica', () => {
      const validData = {
        nm_clinica: 'Cl\u00ednica BeautyMed',
        ds_telefone: '(11) 98765-4321',
        ds_email: 'contato@beautymed.com.br',
        ds_cep: '01310-100',
      };

      const result = clinicaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        nm_clinica: 'Cl\u00ednica BeautyMed',
        ds_telefone: '123',
        ds_email: 'contato@beautymed.com.br',
      };

      const result = clinicaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Telefone inv\u00e1lido');
      }
    });

    it('should accept multiple phone formats', () => {
      const validFormats = [
        '(11) 98765-4321',
        '11987654321',
        '(11) 3456-7890',
        '1134567890',
      ];

      validFormats.forEach((phone) => {
        const data = {
          nm_clinica: 'Test',
          ds_telefone: phone,
          ds_email: 'test@test.com',
        };
        const result = clinicaSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email', () => {
      const invalidData = {
        nm_clinica: 'Cl\u00ednica BeautyMed',
        ds_email: 'invalid-email',
      };

      const result = clinicaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('E-mail inv\u00e1lido');
      }
    });

    it('should reject invalid CEP format', () => {
      const invalidData = {
        nm_clinica: 'Cl\u00ednica BeautyMed',
        ds_cep: '123',
      };

      const result = clinicaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('CEP inv\u00e1lido');
      }
    });
  });

  describe('albumSchema', () => {
    it('should validate a valid album', () => {
      const validData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        nm_album: 'Meu \u00c1lbum',
        ds_tipo: 'procedimento',
      };

      const result = albumSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid album type', () => {
      const invalidData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        nm_album: 'Meu \u00c1lbum',
        ds_tipo: 'invalid-type',
      };

      const result = albumSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid album types', () => {
      const validTypes = ['procedimento', 'antes_depois', 'evolucao', 'geral'];

      validTypes.forEach((tipo) => {
        const data = {
          id_user: '123e4567-e89b-12d3-a456-426614174000',
          nm_album: 'Test Album',
          ds_tipo: tipo,
        };
        const result = albumSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('fotoSchema', () => {
    it('should validate a valid foto', () => {
      const validData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        ds_caminho: '/uploads/foto123.jpg',
      };

      const result = fotoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional tipo_foto', () => {
      const validTypes = ['antes', 'depois', 'durante'];

      validTypes.forEach((tipo) => {
        const data = {
          id_user: '123e4567-e89b-12d3-a456-426614174000',
          ds_caminho: '/uploads/test.jpg',
          ds_tipo_foto: tipo,
        };
        const result = fotoSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('agendamentoSchema', () => {
    it('should validate a valid agendamento', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

      const validData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        id_profissional: '123e4567-e89b-12d3-a456-426614174001',
        dt_agendamento: futureDate,
        ds_tipo: 'consulta',
      };

      const result = agendamentoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday

      const invalidData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        id_profissional: '123e4567-e89b-12d3-a456-426614174001',
        dt_agendamento: pastDate,
        ds_tipo: 'consulta',
      };

      const result = agendamentoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('data futura');
      }
    });
  });

  describe('avaliacaoSchema', () => {
    it('should validate a valid avaliacao', () => {
      const validData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        id_profissional: '123e4567-e89b-12d3-a456-426614174001',
        nr_avaliacao: 5,
        ds_comentario: '\u00d3timo atendimento!',
      };

      const result = avaliacaoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject rating below 1', () => {
      const invalidData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        id_profissional: '123e4567-e89b-12d3-a456-426614174001',
        nr_avaliacao: 0,
      };

      const result = avaliacaoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rating above 5', () => {
      const invalidData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        id_profissional: '123e4567-e89b-12d3-a456-426614174001',
        nr_avaliacao: 6,
      };

      const result = avaliacaoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('transacaoSchema', () => {
    it('should validate a valid transacao', () => {
      const validData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        vl_transacao: 150.50,
        ds_tipo: 'credito',
        ds_categoria: 'procedimento',
      };

      const result = transacaoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      const invalidData = {
        id_user: '123e4567-e89b-12d3-a456-426614174000',
        vl_transacao: -50,
        ds_tipo: 'credito',
      };

      const result = transacaoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid transaction types', () => {
      const validTypes = ['credito', 'debito', 'pix', 'boleto', 'cartao'];

      validTypes.forEach((tipo) => {
        const data = {
          id_user: '123e4567-e89b-12d3-a456-426614174000',
          vl_transacao: 100,
          ds_tipo: tipo,
        };
        const result = transacaoSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('uploadFileSchema', () => {
    it('should validate a valid file upload', () => {
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });

      const validData = {
        file,
        titulo: 'Test Image',
        tipoFoto: 'antes',
      };

      const result = uploadFileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject file larger than 10MB', () => {
      // Create a mock file object with large size
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      const invalidData = {
        file: largeFile,
      };

      const result = uploadFileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid file types', () => {
      const pdfFile = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });

      const invalidData = {
        file: pdfFile,
      };

      const result = uploadFileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    describe('formatZodError', () => {
      it('should format zod errors into key-value pairs', () => {
        const schema = z.object({
          name: z.string().min(3),
          email: z.string().email(),
        });

        const result = schema.safeParse({
          name: 'ab',
          email: 'invalid',
        });

        if (!result.success) {
          const formatted = formatZodError(result.error);

          expect(formatted).toHaveProperty('name');
          expect(formatted).toHaveProperty('email');
          expect(typeof formatted.name).toBe('string');
          expect(typeof formatted.email).toBe('string');
        }
      });
    });

    describe('validateWithSchema', () => {
      it('should return success for valid data', () => {
        const schema = z.object({
          name: z.string(),
          age: z.number(),
        });

        const result = validateWithSchema(schema, {
          name: 'John',
          age: 30,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('John');
          expect(result.data.age).toBe(30);
        }
      });

      it('should return errors for invalid data', () => {
        const schema = z.object({
          name: z.string(),
          age: z.number(),
        });

        const result = validateWithSchema(schema, {
          name: 'John',
          age: 'not a number',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toHaveProperty('age');
        }
      });
    });
  });
});
