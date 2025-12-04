# Usuários de Teste - DoctorQ

Usuários criados para teste do sistema de perfis hierárquicos.

## 📋 Credenciais de Acesso

### 1. Administrador (Super Admin)
```
📧 Email: admin@doctorq.com
🔑 Senha: Admin@123
👤 Perfil: super_admin (admin)
🏢 Empresa: Nenhuma (acesso global)
```

**Permissões:**
- Acesso total ao sistema
- Gerenciamento de usuários, empresas, perfis
- Gerenciamento de licenças
- Visualização de todos os relatórios
- Acesso à seção "Administração" no menu

---

### 2. Parceiro (Gestor de Clínica)
```
📧 Email: parceiro@doctorq.com
🔑 Senha: Parceiro@123
👤 Perfil: gestor_clinica (parceiro)
🏢 Empresa: Clínica Teste
```

**Permissões:**
- Gestão completa da clínica
- Gerenciamento de agendamentos, pacientes, profissionais
- Acesso ao financeiro e faturas
- Gestão de procedimentos

---

### 3. Fornecedor (Gestor de Fornecedor)
```
📧 Email: fornecedor@doctorq.com
🔑 Senha: Fornecedor@123
👤 Perfil: gestor_fornecedor (fornecedor)
🏢 Empresa: Fornecedor Teste
```

**Permissões:**
- Gestão completa do fornecedor
- Gerenciamento de produtos e pedidos
- Criação de campanhas
- Acesso ao marketplace

---

### 4. Paciente
```
📧 Email: paciente@doctorq.com
🔑 Senha: Paciente@123
👤 Perfil: paciente (paciente)
🏢 Empresa: Nenhuma (usuário final)
```

**Permissões:**
- Criação e visualização de agendamentos
- Criação e visualização de avaliações
- Edição do perfil pessoal
- Visualização de procedimentos disponíveis

---

## 🔐 Como Fazer Login

### Frontend (Recomendado)
1. Acesse: http://localhost:3000/login
2. Selecione "Entrar com Credenciais"
3. Digite o email e senha
4. Clique em "Entrar"

### Observações:
- Os usuários foram criados diretamente no banco de dados PostgreSQL
- As senhas estão criptografadas com `pbkdf2_sha256` via Passlib
- Cada usuário está associado ao seu perfil hierárquico correspondente
- Parceiro e Fornecedor têm empresas criadas automaticamente

---

## 🗄️ Verificação no Banco de Dados

Para verificar os usuários criados:

```sql
-- Listar todos os usuários de teste
SELECT
  u.nm_email,
  u.nm_completo,
  p.nm_perfil,
  p.nm_tipo_acesso,
  e.nm_empresa,
  u.st_ativo
FROM tb_users u
LEFT JOIN tb_perfis p ON u.id_perfil = p.id_perfil
LEFT JOIN tb_empresas e ON u.id_empresa = e.id_empresa
WHERE u.nm_email IN (
  'admin@doctorq.com',
  'parceiro@doctorq.com',
  'fornecedor@doctorq.com',
  'paciente@doctorq.com'
)
ORDER BY p.nm_tipo_acesso;
```

---

## 📝 Notas Importantes

1. **Senha Padrão**: Todas as senhas seguem o formato `[Tipo]@123`
2. **Ambiente**: Estas credenciais são apenas para **desenvolvimento/teste**
3. **Segurança**: **NÃO** use estas credenciais em produção
4. **Empresas**: Clínica Teste e Fornecedor Teste foram criadas automaticamente
5. **Perfis**: Todos os perfis são do tipo 'system' (pré-configurados)

---

**Data de Criação**: 02/11/2025
**Banco de Dados**: PostgreSQL @ 10.11.2.81:5432/doctorq
**Status**: ✅ Ativo
