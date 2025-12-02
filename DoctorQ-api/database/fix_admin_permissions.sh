#!/bin/bash
# =============================================================================
# Script para corrigir permissões do usuário admin@doctorq.app
# Data: 25/11/2025
# =============================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Fix Admin Permissions - DoctorQ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Perguntar qual ambiente
echo -e "${YELLOW}Escolha o ambiente:${NC}"
echo "1) Produção AWS RDS"
echo "2) Local (10.11.2.81)"
read -p "Opção (1 ou 2): " OPCAO

if [ "$OPCAO" == "1" ]; then
    echo -e "${GREEN}→ Conectando em Produção (AWS RDS)${NC}"
    DB_HOST="dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com"
    DB_USER="doctorq"
    DB_PASSWORD="Passw0rd150982"
    DB_NAME="dbdoctorq"
elif [ "$OPCAO" == "2" ]; then
    echo -e "${GREEN}→ Conectando em Local (10.11.2.81)${NC}"
    DB_HOST="10.11.2.81"
    DB_USER="postgres"
    DB_PASSWORD="postgres"
    DB_NAME="dbdoctorq"
else
    echo -e "${RED}Opção inválida!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}1. Verificando status atual do usuário admin...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
SELECT
    'Status Atual:' as info,
    id_user,
    nm_nome,
    nm_email,
    st_ativo,
    fg_ativo,
    id_perfil,
    id_empresa
FROM tb_users
WHERE nm_email = 'admin@doctorq.app';
EOF

echo ""
echo -e "${YELLOW}2. Atualizando perfil e permissões...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'
-- Garantir que perfil admin existe
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_descricao,
    ds_papel,
    fg_ativo,
    dt_criacao
)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Administrador',
    'Administrador do Sistema - Acesso Total',
    'admin',
    true,
    NOW()
)
ON CONFLICT (id_perfil) DO UPDATE SET
    nm_perfil = 'Administrador',
    ds_descricao = 'Administrador do Sistema - Acesso Total',
    ds_papel = 'admin',
    fg_ativo = true;

-- Atualizar usuário admin
UPDATE tb_users SET
    id_perfil = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    st_ativo = 'S',
    fg_ativo = true,
    nm_nome = 'Administrador',
    dt_atualizacao = NOW()
WHERE nm_email = 'admin@doctorq.app';

-- Garantir que empresa está ativa
UPDATE tb_empresas SET
    fg_ativo = true,
    dt_atualizacao = NOW()
WHERE id_empresa = '329311ce-0d17-4361-bc51-60234ed972ee';

SELECT 'Atualizações aplicadas com sucesso!' as resultado;
EOF

echo ""
echo -e "${YELLOW}3. Verificando status após alterações...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
SELECT
    'Status Atualizado:' as info,
    u.id_user,
    u.nm_nome,
    u.nm_email,
    u.st_ativo,
    u.fg_ativo,
    u.id_perfil,
    p.nm_perfil,
    p.ds_papel as role,
    u.id_empresa,
    e.nm_fantasia
FROM tb_users u
LEFT JOIN tb_perfis p ON u.id_perfil = p.id_perfil
LEFT JOIN tb_empresas e ON u.id_empresa = e.id_empresa
WHERE u.nm_email = 'admin@doctorq.app';
EOF

echo ""
echo -e "${GREEN}✅ Script concluído!${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Reinicie a API em produção: pm2 restart doctorq-api"
echo "2. Limpe o cache do navegador e faça login novamente"
echo "3. Verifique se o menu admin aparece"
echo ""
