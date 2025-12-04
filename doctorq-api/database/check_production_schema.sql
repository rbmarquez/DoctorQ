-- Script para verificar estrutura real das tabelas em produção

\c dbdoctorq

-- Verificar estrutura de tb_perfis
\d tb_perfis

-- Verificar estrutura de tb_users
\d tb_users

-- Verificar estrutura de tb_campanhas
\d tb_campanhas

-- Ver dados atuais do perfil admin
SELECT * FROM tb_perfis WHERE id_perfil = '9e1a9f9d-517f-44dd-89dd-be5b6f8af7a7';

-- Ver dados do usuário admin
SELECT
    id_user,
    nm_nome,
    nm_email,
    st_ativo,
    fg_ativo,
    id_perfil,
    nm_papel
FROM tb_users
WHERE nm_email = 'admin@doctorq.app';
