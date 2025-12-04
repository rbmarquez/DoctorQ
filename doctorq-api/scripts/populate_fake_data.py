"""
Script para popular o banco de dados DoctorQ com dados fake
Gera dados realistas para todas as tabelas principais
"""

import asyncio
import json
import os
import random
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

import asyncpg
from dotenv import load_dotenv
from faker import Faker

# Configurar Faker para português do Brasil
fake = Faker("pt_BR")

# Configurações do banco
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL não configurada. Defina a variável no ambiente ou no arquivo .env."
    )

# Dados de referência
ESPECIALIDADES_ESTETICA = [
    'Esteticista', 'Dermatologista', 'Fisioterapeuta Dermato-Funcional',
    'Cosmetólogo', 'Biomédico Esteta', 'Terapeuta Holístico'
]

CATEGORIAS_PROCEDIMENTOS = {
    'facial': [
        'Limpeza de Pele', 'Peeling Químico', 'Microagulhamento', 'Botox',
        'Preenchimento Facial', 'Harmonização Facial', 'Radiofrequência Facial',
        'Laser CO2', 'Microdermoabrasão'
    ],
    'corporal': [
        'Drenagem Linfática', 'Massagem Modeladora', 'Criolipólise',
        'Radiofrequência Corporal', 'Endermologia', 'Cavitação',
        'Carboxiterapia', 'Lipoenzimática'
    ],
    'capilar': [
        'Cauterização Capilar', 'Botox Capilar', 'Hidratação Profunda',
        'Reconstrução Capilar', 'Cronograma Capilar'
    ],
    'depilacao': [
        'Depilação a Laser', 'Depilação com Luz Pulsada', 'Depilação com Cera'
    ]
}

STATUS_AGENDAMENTO = ['agendado', 'confirmado', 'concluido', 'cancelado']
FORMAS_PAGAMENTO = ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'convenio']


async def main():
    """Função principal"""
    print("🚀 Iniciando população do banco de dados...")

    # Conectar ao banco
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # 1. Criar empresa
        print("\n📊 Criando empresas...")
        empresa_ids = await criar_empresas(conn, 1)
        empresa_id = empresa_ids[0]

        # 2. Criar usuários
        print("\n👥 Criando usuários...")
        user_ids = await criar_usuarios(conn, empresa_id, 50)

        # 3. Criar clínicas
        print("\n🏥 Criando clínicas...")
        clinica_ids = await criar_clinicas(conn, empresa_id, 10)

        # 4. Criar profissionais
        print("\n👨‍⚕️ Criando profissionais...")
        profissional_ids = await criar_profissionais(conn, user_ids[:20], clinica_ids)

        # 5. Criar pacientes
        print("\n🤒 Criando pacientes...")
        paciente_ids = await criar_pacientes(conn, user_ids[20:], clinica_ids)

        # 6. Criar procedimentos
        print("\n💉 Criando procedimentos...")
        procedimento_ids = await criar_procedimentos(conn, clinica_ids)

        # 7. Criar agendamentos
        print("\n📅 Criando agendamentos...")
        agendamento_ids = await criar_agendamentos(
            conn, paciente_ids, profissional_ids, clinica_ids, procedimento_ids
        )

        # 8. Criar prontuários
        print("\n📋 Criando prontuários...")
        await criar_prontuarios(conn, agendamento_ids, paciente_ids, profissional_ids, clinica_ids)

        # 9. Criar avaliações
        print("\n⭐ Criando avaliações...")
        await criar_avaliacoes(conn, agendamento_ids, paciente_ids, profissional_ids, clinica_ids)

        # 10. Criar agentes (para conversas)
        print("\n🤖 Criando agentes...")
        agente_ids = await criar_agentes(conn, user_ids[0], empresa_id)

        # 11. Criar conversas
        print("\n💬 Criando conversas...")
        conversa_ids = await criar_conversas(conn, user_ids, agente_ids)

        # 12. Criar mensagens
        print("\n✉️ Criando mensagens...")
        await criar_mensagens(conn, conversa_ids)

        print("\n✅ População concluída com sucesso!")
        print(f"   - {len(empresa_ids)} empresas")
        print(f"   - {len(user_ids)} usuários")
        print(f"   - {len(clinica_ids)} clínicas")
        print(f"   - {len(profissional_ids)} profissionais")
        print(f"   - {len(paciente_ids)} pacientes")
        print(f"   - {len(procedimento_ids)} procedimentos")
        print(f"   - {len(agendamento_ids)} agendamentos")
        print(f"   - {len(agente_ids)} agentes")
        print(f"   - {len(conversa_ids)} conversas")

    finally:
        await conn.close()


async def criar_empresas(conn, quantidade=1):
    """Criar empresas"""
    empresa_ids = []

    for _ in range(quantidade):
        empresa_id = str(uuid4())
        cnpj = fake.cnpj()

        await conn.execute("""
            INSERT INTO tb_empresas (
                id_empresa, nm_empresa, nr_cnpj, ds_email, nr_telefone,
                ds_endereco, nr_cep, nm_cidade, nm_estado, st_ativo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, empresa_id, fake.company(), cnpj, fake.company_email(),
            fake.phone_number(), fake.street_address(), fake.postcode(),
            fake.city(), fake.state_abbr(), True)

        empresa_ids.append(empresa_id)

    return empresa_ids


async def criar_usuarios(conn, empresa_id, quantidade=50):
    """Criar usuários"""
    user_ids = []

    # Pegar IDs dos perfis
    perfil_rows = await conn.fetch("SELECT id_perfil, nm_perfil FROM tb_perfis")
    perfis = {row['nm_perfil']: row['id_perfil'] for row in perfil_rows}

    for i in range(quantidade):
        user_id = str(uuid4())
        nome = fake.name()
        email = fake.email()

        # Distribuir perfis
        if i < 5:
            perfil = perfis.get('admin')
        elif i < 10:
            perfil = perfis.get('gestor_clinica')
        elif i < 25:
            perfil = perfis.get('profissional')
        elif i < 30:
            perfil = perfis.get('recepcionista')
        else:
            perfil = perfis.get('paciente')

        await conn.execute("""
            INSERT INTO tb_users (
                id_user, id_empresa, id_perfil, nm_email, nm_completo,
                nr_telefone, st_ativo, nm_provider
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, user_id, empresa_id, perfil, email, nome,
            fake.phone_number(), True, 'credentials')

        user_ids.append(user_id)

    return user_ids


async def criar_clinicas(conn, empresa_id, quantidade=10):
    """Criar clínicas"""
    clinica_ids = []

    for _ in range(quantidade):
        clinica_id = str(uuid4())

        # Horário de funcionamento (JSON)
        horario = {
            'segunda': {'inicio': '09:00', 'fim': '18:00'},
            'terca': {'inicio': '09:00', 'fim': '18:00'},
            'quarta': {'inicio': '09:00', 'fim': '18:00'},
            'quinta': {'inicio': '09:00', 'fim': '18:00'},
            'sexta': {'inicio': '09:00', 'fim': '18:00'},
            'sabado': {'inicio': '09:00', 'fim': '13:00'},
        }

        especialidades = random.sample(ESPECIALIDADES_ESTETICA, random.randint(2, 4))

        await conn.execute("""
            INSERT INTO tb_clinicas (
                id_clinica, id_empresa, nm_clinica, ds_clinica, ds_email, nr_telefone,
                ds_endereco, nm_cidade, nm_estado, nr_cep, ds_especialidades,
                ds_horario_funcionamento, st_ativo, nr_avaliacao_media, nr_total_avaliacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        """, clinica_id, empresa_id, f"Clínica {fake.company()}",
            fake.text(max_nb_chars=200), fake.company_email(), fake.phone_number(),
            fake.street_address(), fake.city(), fake.state_abbr(), fake.postcode(),
            especialidades, json.dumps(horario), True, Decimal(str(round(random.uniform(4.0, 5.0), 1))),
            random.randint(10, 200))

        clinica_ids.append(clinica_id)

    return clinica_ids


async def criar_profissionais(conn, user_ids, clinica_ids):
    """Criar profissionais"""
    profissional_ids = []

    for user_id in user_ids:
        profissional_id = str(uuid4())
        clinica_id = random.choice(clinica_ids)

        # Pegar nome do usuário
        user = await conn.fetchrow("SELECT nm_completo FROM tb_users WHERE id_user = $1", user_id)

        especialidades = random.sample(ESPECIALIDADES_ESTETICA, random.randint(1, 3))

        await conn.execute("""
            INSERT INTO tb_profissionais (
                id_profissional, id_user, id_clinica, nm_profissional, ds_biografia,
                ds_especialidades, nr_registro_profissional, nr_anos_experiencia,
                ds_email, nr_telefone, st_ativo, nr_avaliacao_media, nr_total_avaliacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        """, profissional_id, user_id, clinica_id, user['nm_completo'],
            fake.text(max_nb_chars=300), especialidades, f"CRF-{fake.random_int(10000, 99999)}",
            random.randint(2, 20), fake.email(), fake.phone_number(), True,
            Decimal(str(round(random.uniform(4.0, 5.0), 1))), random.randint(5, 100))

        profissional_ids.append(profissional_id)

    return profissional_ids


async def criar_pacientes(conn, user_ids, clinica_ids):
    """Criar pacientes"""
    paciente_ids = []

    for user_id in user_ids:
        paciente_id = str(uuid4())
        clinica_id = random.choice(clinica_ids)

        # Pegar nome do usuário
        user = await conn.fetchrow("SELECT nm_completo FROM tb_users WHERE id_user = $1", user_id)

        dt_nascimento = fake.date_of_birth(minimum_age=18, maximum_age=80)

        await conn.execute("""
            INSERT INTO tb_pacientes (
                id_paciente, id_user, id_clinica, nm_paciente, dt_nascimento,
                nr_cpf, ds_email, nr_telefone, ds_endereco, nm_cidade,
                nm_estado, nr_cep, st_ativo, nr_total_consultas
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        """, paciente_id, user_id, clinica_id, user['nm_completo'], dt_nascimento,
            fake.cpf(), fake.email(), fake.phone_number(), fake.street_address(),
            fake.city(), fake.state_abbr(), fake.postcode(), True, random.randint(1, 20))

        paciente_ids.append(paciente_id)

    return paciente_ids


async def criar_procedimentos(conn, clinica_ids):
    """Criar procedimentos"""
    procedimento_ids = []

    for clinica_id in clinica_ids:
        # Cada clínica terá vários procedimentos
        for categoria, procedimentos in CATEGORIAS_PROCEDIMENTOS.items():
            # Pegar alguns procedimentos aleatórios desta categoria
            for proc_nome in random.sample(procedimentos, min(len(procedimentos), 3)):
                procedimento_id = str(uuid4())

                await conn.execute("""
                    INSERT INTO tb_procedimentos (
                        id_procedimento, id_clinica, nm_procedimento, ds_procedimento,
                        ds_categoria, vl_preco, nr_duracao_minutos, st_ativo
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, procedimento_id, clinica_id, proc_nome, fake.text(max_nb_chars=200),
                    categoria, Decimal(str(random.randint(50, 500))), random.choice([30, 45, 60, 90, 120]),
                    True)

                procedimento_ids.append(procedimento_id)

    return procedimento_ids


async def criar_agendamentos(conn, paciente_ids, profissional_ids, clinica_ids, procedimento_ids):
    """Criar agendamentos"""
    agendamento_ids = []

    # Criar 200 agendamentos
    for _ in range(200):
        agendamento_id = str(uuid4())
        paciente_id = random.choice(paciente_ids)
        profissional_id = random.choice(profissional_ids)

        # Pegar clinica do profissional
        prof = await conn.fetchrow(
            "SELECT id_clinica FROM tb_profissionais WHERE id_profissional = $1",
            profissional_id
        )
        clinica_id = prof['id_clinica']

        # Pegar procedimento da clínica
        procs = await conn.fetch(
            "SELECT id_procedimento FROM tb_procedimentos WHERE id_clinica = $1",
            clinica_id
        )
        if not procs:
            continue
        procedimento_id = random.choice(procs)['id_procedimento']

        # Data de agendamento (últimos 6 meses até próximos 3 meses)
        dt_agendamento = fake.date_time_between(start_date='-6M', end_date='+3M')
        status = random.choice(STATUS_AGENDAMENTO)

        await conn.execute("""
            INSERT INTO tb_agendamentos (
                id_agendamento, id_paciente, id_profissional, id_clinica, id_procedimento,
                dt_agendamento, nr_duracao_minutos, ds_status, vl_valor, ds_forma_pagamento,
                st_confirmado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """, agendamento_id, paciente_id, profissional_id, clinica_id, procedimento_id,
            dt_agendamento, random.choice([30, 45, 60, 90]), status,
            Decimal(str(random.randint(50, 500))), random.choice(FORMAS_PAGAMENTO),
            status in ['confirmado', 'concluido'])

        agendamento_ids.append(agendamento_id)

    return agendamento_ids


async def criar_prontuarios(conn, agendamento_ids, paciente_ids, profissional_ids, clinica_ids):
    """Criar prontuários para agendamentos concluídos"""
    prontuario_count = 0

    # Criar prontuário para metade dos agendamentos
    for agendamento_id in random.sample(agendamento_ids, len(agendamento_ids) // 2):
        # Pegar info do agendamento
        agend = await conn.fetchrow("""
            SELECT id_paciente, id_profissional, id_clinica, dt_agendamento, ds_status
            FROM tb_agendamentos WHERE id_agendamento = $1
        """, agendamento_id)

        if agend['ds_status'] != 'concluido':
            continue

        prontuario_id = str(uuid4())

        await conn.execute("""
            INSERT INTO tb_prontuarios (
                id_prontuario, id_paciente, id_profissional, id_agendamento, id_clinica,
                dt_consulta, ds_tipo, ds_queixa_principal, ds_diagnostico, ds_orientacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, prontuario_id, agend['id_paciente'], agend['id_profissional'],
            agendamento_id, agend['id_clinica'], agend['dt_agendamento'],
            random.choice(['primeira_consulta', 'retorno', 'procedimento']),
            fake.text(max_nb_chars=100), fake.text(max_nb_chars=200),
            fake.text(max_nb_chars=150))

        prontuario_count += 1

    print(f"   - {prontuario_count} prontuários criados")


async def criar_avaliacoes(conn, agendamento_ids, paciente_ids, profissional_ids, clinica_ids):
    """Criar avaliações para agendamentos concluídos"""
    avaliacao_count = 0

    # Criar avaliação para 70% dos agendamentos concluídos
    for agendamento_id in random.sample(agendamento_ids, len(agendamento_ids) * 7 // 10):
        # Pegar info do agendamento
        agend = await conn.fetchrow("""
            SELECT id_paciente, id_profissional, id_clinica, ds_status
            FROM tb_agendamentos WHERE id_agendamento = $1
        """, agendamento_id)

        if agend['ds_status'] != 'concluido':
            continue

        avaliacao_id = str(uuid4())
        nota = random.randint(4, 5)  # Maioria das avaliações são positivas

        await conn.execute("""
            INSERT INTO tb_avaliacoes (
                id_avaliacao, id_paciente, id_profissional, id_clinica, id_agendamento,
                nr_nota, ds_comentario, nr_atendimento, nr_instalacoes, nr_pontualidade,
                nr_resultado, st_recomenda, st_aprovada, st_visivel
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        """, avaliacao_id, agend['id_paciente'], agend['id_profissional'],
            agend['id_clinica'], agendamento_id, nota, fake.text(max_nb_chars=200),
            random.randint(4, 5), random.randint(4, 5), random.randint(4, 5),
            random.randint(4, 5), nota >= 4, True, True)

        avaliacao_count += 1

    print(f"   - {avaliacao_count} avaliações criadas")


async def criar_agentes(conn, user_id, empresa_id):
    """Criar agentes de IA"""
    agente_ids = []

    agentes_config = [
        ('Assistente de Agendamento', 'Ajuda pacientes a agendar consultas', 'chatbot'),
        ('Consultor de Procedimentos', 'Informa sobre procedimentos disponíveis', 'assistant'),
        ('Suporte Técnico', 'Auxilia com dúvidas técnicas', 'assistant'),
    ]

    for nome, descricao, tipo in agentes_config:
        agente_id = str(uuid4())

        await conn.execute("""
            INSERT INTO tb_agentes (
                id_agente, id_empresa, nm_agente, ds_agente, ds_tipo,
                st_ativo, nm_modelo, nr_temperature
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, agente_id, empresa_id, nome, descricao, tipo,
            True, 'gpt-4', 0.7)

        agente_ids.append(agente_id)

    return agente_ids


async def criar_conversas(conn, user_ids, agente_ids):
    """Criar conversas"""
    conversa_ids = []

    # Criar 50 conversas
    for _ in range(50):
        conversa_id = str(uuid4())
        user_id = random.choice(user_ids)
        agente_id = random.choice(agente_ids)

        dt_criacao = fake.date_time_between(start_date='-3M', end_date='now')

        await conn.execute("""
            INSERT INTO tb_conversas (
                id_conversa, id_user, id_agente, nm_titulo, dt_criacao
            ) VALUES ($1, $2, $3, $4, $5)
        """, conversa_id, user_id, agente_id, fake.sentence(nb_words=6), dt_criacao)

        conversa_ids.append((conversa_id, dt_criacao))

    return conversa_ids


async def criar_mensagens(conn, conversa_ids):
    """Criar mensagens para as conversas"""
    mensagem_count = 0

    for conversa_id, dt_base in conversa_ids:
        # Cada conversa terá entre 3 e 15 mensagens
        num_mensagens = random.randint(3, 15)

        for i in range(num_mensagens):
            mensagem_id = str(uuid4())
            # Alternar entre user e assistant
            role = 'user' if i % 2 == 0 else 'assistant'

            # Incrementar timestamp
            dt_mensagem = dt_base + timedelta(minutes=i)

            await conn.execute("""
                INSERT INTO tb_messages (
                    id_message, id_conversa, ds_role, ds_content, dt_criacao
                ) VALUES ($1, $2, $3, $4, $5)
            """, mensagem_id, conversa_id, role, fake.text(max_nb_chars=200), dt_mensagem)

            mensagem_count += 1

    print(f"   - {mensagem_count} mensagens criadas")


if __name__ == '__main__':
    asyncio.run(main())
