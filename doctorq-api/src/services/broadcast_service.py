"""
Serviço de Broadcast de Mensagens - UC096
Envio de mensagens em massa com segmentação e agendamento
"""
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.broadcast import (
    TbBroadcastCampanha,
    TbBroadcastDestinatario,
    TbBroadcastTemplate,
    BroadcastCampanhaCreate,
    BroadcastFiltros,
    BroadcastEstatisticas,
    BroadcastPreview,
    StatusCampanha,
    StatusDestinatario,
    CanalEnvio
)
from src.models.user import User


class BroadcastService:
    """Serviço para gerenciar campanhas de broadcast"""

    @staticmethod
    async def criar_campanha(
        db: AsyncSession,
        id_empresa: UUID,
        id_user_criador: UUID,
        data: BroadcastCampanhaCreate
    ) -> TbBroadcastCampanha:
        """
        Cria nova campanha de broadcast

        Processo:
        1. Valida template (se fornecido)
        2. Aplica filtros de segmentação
        3. Conta destinatários
        4. Cria campanha
        5. Se dt_agendamento = null, marca para envio imediato
        """
        # Validar template se fornecido
        if data.id_template:
            query = select(TbBroadcastTemplate).where(
                TbBroadcastTemplate.id_template == data.id_template,
                TbBroadcastTemplate.id_empresa == id_empresa,
                TbBroadcastTemplate.fg_ativo == "S"
            )
            result = await db.execute(query)
            template = result.scalar_one_or_none()

            if not template:
                raise ValueError("Template não encontrado ou inativo")

            # Validar que template é do mesmo canal
            if template.tp_canal != data.tp_canal.value:
                raise ValueError(f"Template é para canal {template.tp_canal}, mas campanha usa {data.tp_canal.value}")

        # Criar campanha
        campanha = TbBroadcastCampanha(
            id_empresa=id_empresa,
            id_user_criador=id_user_criador,
            nm_campanha=data.nm_campanha,
            ds_descricao=data.ds_descricao,
            tp_campanha=data.tp_campanha.value,
            ds_assunto=data.ds_assunto,
            ds_mensagem=data.ds_mensagem,
            ds_template_id=data.id_template,
            tp_canal=data.tp_canal.value,
            ds_filtros_segmentacao=data.filtros_segmentacao.model_dump() if data.filtros_segmentacao else {},
            dt_agendamento=data.dt_agendamento,
            fg_agendada=data.dt_agendamento is not None,
            st_campanha=StatusCampanha.AGENDADA.value if data.dt_agendamento else StatusCampanha.RASCUNHO.value,
            ds_metadados=data.metadados or {}
        )

        db.add(campanha)
        await db.flush()

        # Buscar e adicionar destinatários
        destinatarios = await BroadcastService._buscar_destinatarios(
            db=db,
            id_empresa=id_empresa,
            filtros=data.filtros_segmentacao,
            tp_canal=data.tp_canal
        )

        # Criar registros de destinatários
        for dest_data in destinatarios:
            destinatario = TbBroadcastDestinatario(
                id_campanha=campanha.id_campanha,
                id_user=dest_data["id_user"],
                ds_email=dest_data.get("email"),
                ds_telefone=dest_data.get("telefone"),
                ds_push_token=dest_data.get("push_token"),
                st_envio=StatusDestinatario.PENDENTE.value
            )
            db.add(destinatario)

        campanha.nr_total_destinatarios = len(destinatarios)

        await db.commit()
        await db.refresh(campanha)

        return campanha

    @staticmethod
    async def _buscar_destinatarios(
        db: AsyncSession,
        id_empresa: UUID,
        filtros: Optional[BroadcastFiltros],
        tp_canal: CanalEnvio
    ) -> List[Dict[str, Any]]:
        """
        Busca destinatários com base nos filtros de segmentação

        Retorna lista de dicionários com:
        - id_user
        - email (se canal = email)
        - telefone (se canal = whatsapp/sms)
        - push_token (se canal = push)
        """
        query = select(User).where(User.id_empresa == id_empresa)

        # Aplicar filtros
        if filtros:
            if filtros.perfis:
                query = query.join(User.perfil).where(User.perfil.has(nm_perfil=filtros.perfis))

            if filtros.cidades:
                query = query.where(User.ds_cidade.in_(filtros.cidades))

            if filtros.estados:
                query = query.where(User.ds_estado.in_(filtros.estados))

            if filtros.fg_ativo is not None:
                query = query.where(User.st_ativo == ("S" if filtros.fg_ativo else "N"))

            if filtros.ids_usuarios:
                query = query.where(User.id_user.in_(filtros.ids_usuarios))

            # TODO: Implementar filtros avançados (última visita, clinicas)
            # if filtros.clinicas:
            #     query = query.join(...).where(...)

        result = await db.execute(query)
        users = result.scalars().all()

        destinatarios = []
        for user in users:
            dest = {"id_user": user.id_user}

            # Adicionar contato baseado no canal
            if tp_canal == CanalEnvio.EMAIL:
                if user.ds_email:
                    dest["email"] = user.ds_email
                else:
                    continue  # Pula se não tem email

            elif tp_canal in [CanalEnvio.WHATSAPP, CanalEnvio.SMS]:
                if user.ds_telefone:
                    dest["telefone"] = user.ds_telefone
                else:
                    continue  # Pula se não tem telefone

            elif tp_canal == CanalEnvio.PUSH:
                # TODO: Buscar push token da tb_dispositivos
                # if user has push token:
                #     dest["push_token"] = token
                # else:
                #     continue
                pass

            elif tp_canal == CanalEnvio.MENSAGEM_INTERNA:
                # Mensagem interna sempre funciona (não precisa contato)
                pass

            destinatarios.append(dest)

        return destinatarios

    @staticmethod
    async def listar_campanhas(
        db: AsyncSession,
        id_empresa: UUID,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 50
    ) -> Tuple[List[TbBroadcastCampanha], int]:
        """Lista campanhas com paginação e filtros"""
        query = select(TbBroadcastCampanha).where(
            TbBroadcastCampanha.id_empresa == id_empresa,
            TbBroadcastCampanha.fg_ativo == "S"
        )

        if status:
            query = query.where(TbBroadcastCampanha.st_campanha == status)

        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginação
        query = query.order_by(TbBroadcastCampanha.dt_criacao.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await db.execute(query)
        campanhas = result.scalars().all()

        return campanhas, total

    @staticmethod
    async def buscar_campanha(
        db: AsyncSession,
        id_campanha: UUID,
        id_empresa: UUID
    ) -> Optional[TbBroadcastCampanha]:
        """Busca campanha por ID"""
        query = select(TbBroadcastCampanha).where(
            TbBroadcastCampanha.id_campanha == id_campanha,
            TbBroadcastCampanha.id_empresa == id_empresa
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def gerar_preview(
        db: AsyncSession,
        id_campanha: UUID,
        id_empresa: UUID
    ) -> BroadcastPreview:
        """
        Gera preview da campanha antes de enviar

        Retorna:
        - Total de destinatários
        - Canais de destino
        - Amostra de 10 destinatários
        - Mensagem renderizada com variáveis substituídas
        - Custo estimado (se aplicável)
        """
        campanha = await BroadcastService.buscar_campanha(db, id_campanha, id_empresa)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        # Buscar destinatários
        query = select(TbBroadcastDestinatario).where(
            TbBroadcastDestinatario.id_campanha == id_campanha
        ).limit(10)
        result = await db.execute(query)
        destinatarios_sample = result.scalars().all()

        # Contar canais
        canais_destino = {campanha.tp_canal: campanha.nr_total_destinatarios}

        # Renderizar mensagem com exemplo de variáveis
        mensagem_renderizada = BroadcastService._renderizar_mensagem(
            campanha.ds_mensagem,
            {
                "nome": "João Silva",
                "email": "joao@example.com",
                "clinica": "Clínica Exemplo"
            }
        )

        # Custo estimado (se SMS)
        custo_estimado = None
        if campanha.tp_canal == CanalEnvio.SMS.value:
            # Supondo R$ 0,10 por SMS
            custo_estimado = campanha.nr_total_destinatarios * 0.10

        amostra = [
            {
                "id_user": str(d.id_user),
                "email": d.ds_email,
                "telefone": d.ds_telefone,
                "st_envio": d.st_envio
            }
            for d in destinatarios_sample
        ]

        return BroadcastPreview(
            total_destinatarios=campanha.nr_total_destinatarios,
            canais_destino=canais_destino,
            amostra_destinatarios=amostra,
            mensagem_renderizada=mensagem_renderizada,
            custo_estimado=custo_estimado
        )

    @staticmethod
    def _renderizar_mensagem(template: str, variaveis: Dict[str, Any]) -> str:
        """
        Substitui variáveis {{var}} no template

        Exemplo:
        - Input: "Olá {{nome}}, bem-vindo à {{clinica}}!"
        - Variáveis: {"nome": "João", "clinica": "Clínica X"}
        - Output: "Olá João, bem-vindo à Clínica X!"
        """
        mensagem = template
        for chave, valor in variaveis.items():
            placeholder = f"{{{{{chave}}}}}"
            mensagem = mensagem.replace(placeholder, str(valor))
        return mensagem

    @staticmethod
    async def enviar_campanha(
        db: AsyncSession,
        id_campanha: UUID,
        id_empresa: UUID
    ) -> TbBroadcastCampanha:
        """
        Envia campanha imediatamente

        Processo:
        1. Valida se campanha pode ser enviada
        2. Atualiza status para PROCESSANDO
        3. Processa destinatários em batch
        4. Chama serviço de envio apropriado
        5. Atualiza estatísticas
        """
        campanha = await BroadcastService.buscar_campanha(db, id_campanha, id_empresa)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        # Validações
        if campanha.st_campanha not in [StatusCampanha.RASCUNHO.value, StatusCampanha.AGENDADA.value]:
            raise ValueError(f"Campanha não pode ser enviada (status atual: {campanha.st_campanha})")

        if campanha.nr_total_destinatarios == 0:
            raise ValueError("Campanha não tem destinatários")

        # Atualizar status
        campanha.st_campanha = StatusCampanha.PROCESSANDO.value
        campanha.dt_inicio_envio = datetime.utcnow()
        await db.commit()

        # Buscar destinatários
        query = select(TbBroadcastDestinatario).where(
            TbBroadcastDestinatario.id_campanha == id_campanha,
            TbBroadcastDestinatario.st_envio == StatusDestinatario.PENDENTE.value
        )
        result = await db.execute(query)
        destinatarios = result.scalars().all()

        # Processar envio em batch
        batch_size = 100
        enviados = 0
        falhas = 0

        for i in range(0, len(destinatarios), batch_size):
            batch = destinatarios[i:i + batch_size]

            for dest in batch:
                try:
                    # TODO: Implementar envio real por canal
                    # await BroadcastService._enviar_por_canal(
                    #     canal=campanha.tp_canal,
                    #     destinatario=dest,
                    #     mensagem=campanha.ds_mensagem,
                    #     assunto=campanha.ds_assunto
                    # )

                    # Mock: Marca como enviado
                    dest.st_envio = StatusDestinatario.ENVIADO.value
                    dest.dt_enviado = datetime.utcnow()
                    enviados += 1

                except Exception as e:
                    dest.st_envio = StatusDestinatario.FALHA.value
                    dest.ds_mensagem_erro = str(e)
                    falhas += 1

            await db.commit()

        # Atualizar estatísticas da campanha
        campanha.st_campanha = StatusCampanha.ENVIADA.value
        campanha.dt_fim_envio = datetime.utcnow()
        campanha.nr_enviados = enviados
        campanha.nr_falhas = falhas

        await db.commit()
        await db.refresh(campanha)

        return campanha

    @staticmethod
    async def cancelar_campanha(
        db: AsyncSession,
        id_campanha: UUID,
        id_empresa: UUID
    ) -> TbBroadcastCampanha:
        """Cancela campanha agendada"""
        campanha = await BroadcastService.buscar_campanha(db, id_campanha, id_empresa)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        if campanha.st_campanha not in [StatusCampanha.RASCUNHO.value, StatusCampanha.AGENDADA.value]:
            raise ValueError("Apenas campanhas em rascunho ou agendadas podem ser canceladas")

        campanha.st_campanha = StatusCampanha.CANCELADA.value
        campanha.fg_ativo = False

        await db.commit()
        await db.refresh(campanha)

        return campanha

    @staticmethod
    async def obter_estatisticas(
        db: AsyncSession,
        id_campanha: UUID,
        id_empresa: UUID
    ) -> BroadcastEstatisticas:
        """
        Retorna estatísticas detalhadas da campanha

        Métricas:
        - Taxa de entrega: (entregues / enviados) × 100
        - Taxa de abertura: (abertos / entregues) × 100
        - Taxa de clique: (cliques / abertos) × 100
        - Taxa de falha: (falhas / enviados) × 100
        """
        campanha = await BroadcastService.buscar_campanha(db, id_campanha, id_empresa)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        # Calcular taxas
        taxa_entrega = (campanha.nr_entregues / campanha.nr_enviados * 100) if campanha.nr_enviados > 0 else 0
        taxa_abertura = (campanha.nr_abertos / campanha.nr_entregues * 100) if campanha.nr_entregues > 0 else 0
        taxa_clique = (campanha.nr_cliques / campanha.nr_abertos * 100) if campanha.nr_abertos > 0 else 0
        taxa_falha = (campanha.nr_falhas / campanha.nr_enviados * 100) if campanha.nr_enviados > 0 else 0

        # Calcular duração
        duracao_segundos = None
        if campanha.dt_inicio_envio and campanha.dt_fim_envio:
            duracao_segundos = int((campanha.dt_fim_envio - campanha.dt_inicio_envio).total_seconds())

        return BroadcastEstatisticas(
            id_campanha=campanha.id_campanha,
            nm_campanha=campanha.nm_campanha,
            st_campanha=campanha.st_campanha,
            total_destinatarios=campanha.nr_total_destinatarios,
            enviados=campanha.nr_enviados,
            entregues=campanha.nr_entregues,
            falhas=campanha.nr_falhas,
            abertos=campanha.nr_abertos,
            cliques=campanha.nr_cliques,
            taxa_entrega=round(taxa_entrega, 2),
            taxa_abertura=round(taxa_abertura, 2),
            taxa_clique=round(taxa_clique, 2),
            taxa_falha=round(taxa_falha, 2),
            dt_inicio_envio=campanha.dt_inicio_envio,
            dt_fim_envio=campanha.dt_fim_envio,
            duracao_segundos=duracao_segundos
        )

    # ========== Templates ==========

    @staticmethod
    async def criar_template(
        db: AsyncSession,
        id_empresa: UUID,
        nm_template: str,
        tp_canal: str,
        ds_corpo: str,
        ds_assunto: Optional[str] = None,
        ds_descricao: Optional[str] = None,
        variaveis: Optional[List[str]] = None,
        tp_categoria: Optional[str] = None
    ) -> TbBroadcastTemplate:
        """Cria template reutilizável"""
        template = TbBroadcastTemplate(
            id_empresa=id_empresa,
            nm_template=nm_template,
            ds_descricao=ds_descricao,
            tp_canal=tp_canal,
            ds_assunto=ds_assunto,
            ds_corpo=ds_corpo,
            ds_variaveis={"variaveis": variaveis or []},
            tp_categoria=tp_categoria
        )

        db.add(template)
        await db.commit()
        await db.refresh(template)

        return template

    @staticmethod
    async def listar_templates(
        db: AsyncSession,
        id_empresa: UUID,
        tp_canal: Optional[str] = None,
        fg_ativo: bool = True
    ) -> List[TbBroadcastTemplate]:
        """Lista templates disponíveis"""
        query = select(TbBroadcastTemplate).where(
            TbBroadcastTemplate.id_empresa == id_empresa,
            TbBroadcastTemplate.fg_ativo == fg_ativo
        )

        if tp_canal:
            query = query.where(TbBroadcastTemplate.tp_canal == tp_canal)

        query = query.order_by(TbBroadcastTemplate.nm_template)

        result = await db.execute(query)
        return result.scalars().all()
