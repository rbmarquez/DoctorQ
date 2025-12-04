"""
Serviço de Exportação de Relatórios - UC115
Exportação de dados em múltiplos formatos com agendamento
"""
import os
import csv
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.export import (
    TbExportJob,
    TbExportAgendamento,
    ExportJobCreate,
    ExportFiltros,
    ExportEstatisticas,
    StatusExport,
    FormatoExport,
    TipoRelatorio,
    FrequenciaAgendamento
)


class ExportService:
    """Serviço para gerenciar exportação de relatórios"""

    # Diretório para armazenar arquivos exportados
    EXPORT_DIR = "/tmp/exports"  # TODO: Configurar para storage permanente (S3, MinIO)

    @staticmethod
    async def criar_export_job(
        db: AsyncSession,
        id_empresa: UUID,
        id_user: UUID,
        data: ExportJobCreate
    ) -> TbExportJob:
        """
        Cria job de exportação

        Processo:
        1. Valida filtros
        2. Cria job com status "pendente"
        3. Retorna job (processamento é assíncrono)
        """
        # Criar diretório se não existe
        os.makedirs(ExportService.EXPORT_DIR, exist_ok=True)

        job = TbExportJob(
            id_empresa=id_empresa,
            id_user_solicitante=id_user,
            tp_relatorio=data.tp_relatorio.value,
            ds_nome_relatorio=data.ds_nome_relatorio,
            tp_formato=data.tp_formato.value,
            ds_filtros=data.filtros.model_dump() if data.filtros else {},
            st_export=StatusExport.PENDENTE.value,
            dt_expiracao=datetime.utcnow() + timedelta(days=7)  # Expira em 7 dias
        )

        db.add(job)
        await db.commit()
        await db.refresh(job)

        # Processar job imediatamente (modo síncrono)
        # TODO: Em produção, usar Celery para processar assincronamente
        await ExportService._processar_job(db, job)

        return job

    @staticmethod
    async def _processar_job(
        db: AsyncSession,
        job: TbExportJob
    ):
        """
        Processa job de exportação

        Fluxo:
        1. Atualiza status para "processando"
        2. Busca dados do relatório
        3. Converte para formato solicitado
        4. Salva arquivo
        5. Atualiza job com resultado
        """
        try:
            # Atualizar status
            job.st_export = StatusExport.PROCESSANDO.value
            job.dt_inicio_processamento = datetime.utcnow()
            await db.commit()

            # Buscar dados
            dados = await ExportService._buscar_dados_relatorio(
                db=db,
                id_empresa=job.id_empresa,
                tp_relatorio=job.tp_relatorio,
                filtros=job.ds_filtros or {}
            )

            # Gerar arquivo
            arquivo_path = await ExportService._gerar_arquivo(
                job_id=str(job.id_export),
                tp_formato=job.tp_formato,
                tp_relatorio=job.tp_relatorio,
                dados=dados
            )

            # Atualizar job
            job.st_export = StatusExport.CONCLUIDO.value
            job.dt_fim_processamento = datetime.utcnow()
            job.ds_arquivo_path = arquivo_path
            job.ds_arquivo_url = f"/api/exports/download/{job.id_export}"
            job.nr_total_registros = len(dados)

            # Calcular tamanho do arquivo
            if os.path.exists(arquivo_path):
                job.nr_tamanho_bytes = os.path.getsize(arquivo_path)

            await db.commit()

        except Exception as e:
            job.st_export = StatusExport.ERRO.value
            job.ds_mensagem_erro = str(e)
            job.dt_fim_processamento = datetime.utcnow()
            await db.commit()
            raise

    @staticmethod
    async def _buscar_dados_relatorio(
        db: AsyncSession,
        id_empresa: UUID,
        tp_relatorio: str,
        filtros: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Busca dados do relatório baseado no tipo

        Mock implementation - retorna dados fake
        TODO: Implementar queries reais para cada tipo de relatório
        """
        # Mock data for demonstration
        if tp_relatorio == TipoRelatorio.AGENDAMENTOS.value:
            return [
                {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "paciente": "João Silva",
                    "profissional": "Dr. Maria Santos",
                    "data": "2025-11-08",
                    "hora": "10:00",
                    "status": "confirmado",
                    "procedimento": "Consulta Dermatológica",
                    "valor": 250.00
                },
                {
                    "id": "123e4567-e89b-12d3-a456-426614174001",
                    "paciente": "Maria Oliveira",
                    "profissional": "Dr. João Costa",
                    "data": "2025-11-08",
                    "hora": "14:30",
                    "status": "pendente",
                    "procedimento": "Limpeza de Pele",
                    "valor": 150.00
                }
            ]

        elif tp_relatorio == TipoRelatorio.FATURAMENTO.value:
            return [
                {
                    "data": "2025-11-01",
                    "receita": 15000.00,
                    "despesas": 3000.00,
                    "lucro": 12000.00,
                    "num_atendimentos": 45
                },
                {
                    "data": "2025-11-02",
                    "receita": 18000.00,
                    "despesas": 3500.00,
                    "lucro": 14500.00,
                    "num_atendimentos": 52
                }
            ]

        elif tp_relatorio == TipoRelatorio.ESTOQUE.value:
            return [
                {
                    "produto": "Creme Anti-Idade Premium",
                    "codigo": "EST001",
                    "estoque_atual": 25,
                    "estoque_minimo": 10,
                    "valor_unitario": 89.90,
                    "valor_total": 2247.50
                },
                {
                    "produto": "Sérum Vitamina C",
                    "codigo": "EST002",
                    "estoque_atual": 8,
                    "estoque_minimo": 15,
                    "valor_unitario": 65.00,
                    "valor_total": 520.00
                }
            ]

        # Outros tipos de relatório retornam dados vazios por enquanto
        return []

    @staticmethod
    async def _gerar_arquivo(
        job_id: str,
        tp_formato: str,
        tp_relatorio: str,
        dados: List[Dict[str, Any]]
    ) -> str:
        """
        Gera arquivo no formato solicitado

        Formatos suportados:
        - Excel (.xlsx)
        - CSV (.csv)
        - JSON (.json)
        - PDF (.pdf) - TODO: implementar
        """
        arquivo_nome = f"{tp_relatorio}_{job_id}.{tp_formato}"
        arquivo_path = os.path.join(ExportService.EXPORT_DIR, arquivo_nome)

        if tp_formato == FormatoExport.CSV.value:
            # CSV
            with open(arquivo_path, 'w', newline='', encoding='utf-8') as f:
                if dados:
                    writer = csv.DictWriter(f, fieldnames=dados[0].keys())
                    writer.writeheader()
                    writer.writerows(dados)

        elif tp_formato == FormatoExport.JSON.value:
            # JSON
            with open(arquivo_path, 'w', encoding='utf-8') as f:
                json.dump(dados, f, indent=2, ensure_ascii=False, default=str)

        elif tp_formato == FormatoExport.EXCEL.value:
            # Excel - Mock implementation (requires openpyxl)
            # TODO: Implementar com openpyxl
            # from openpyxl import Workbook
            # wb = Workbook()
            # ws = wb.active
            # ...
            # wb.save(arquivo_path)

            # Fallback para CSV temporariamente
            with open(arquivo_path.replace('.xlsx', '.csv'), 'w', newline='', encoding='utf-8') as f:
                if dados:
                    writer = csv.DictWriter(f, fieldnames=dados[0].keys())
                    writer.writeheader()
                    writer.writerows(dados)
            arquivo_path = arquivo_path.replace('.xlsx', '.csv')

        elif tp_formato == FormatoExport.PDF.value:
            # PDF - Mock implementation (requires reportlab)
            # TODO: Implementar com reportlab
            pass

        return arquivo_path

    @staticmethod
    async def listar_jobs(
        db: AsyncSession,
        id_empresa: UUID,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 50
    ) -> Tuple[List[TbExportJob], int]:
        """Lista jobs de exportação"""
        query = select(TbExportJob).where(TbExportJob.id_empresa == id_empresa)

        if status:
            query = query.where(TbExportJob.st_export == status)

        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginação
        query = query.order_by(TbExportJob.dt_solicitacao.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await db.execute(query)
        jobs = result.scalars().all()

        return jobs, total

    @staticmethod
    async def buscar_job(
        db: AsyncSession,
        id_export: UUID,
        id_empresa: UUID
    ) -> Optional[TbExportJob]:
        """Busca job por ID"""
        query = select(TbExportJob).where(
            TbExportJob.id_export == id_export,
            TbExportJob.id_empresa == id_empresa
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def download_arquivo(
        db: AsyncSession,
        id_export: UUID,
        id_empresa: UUID
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Retorna path do arquivo para download

        Returns:
        - (arquivo_path, nome_arquivo) se encontrado
        - (None, None) se não encontrado
        """
        job = await ExportService.buscar_job(db, id_export, id_empresa)

        if not job or job.st_export != StatusExport.CONCLUIDO.value:
            return None, None

        if not job.ds_arquivo_path or not os.path.exists(job.ds_arquivo_path):
            return None, None

        nome_arquivo = os.path.basename(job.ds_arquivo_path)
        return job.ds_arquivo_path, nome_arquivo

    # ========== Agendamentos ==========

    @staticmethod
    async def criar_agendamento(
        db: AsyncSession,
        id_empresa: UUID,
        id_user: UUID,
        nm_agendamento: str,
        tp_relatorio: str,
        tp_formato: str,
        tp_frequencia: str,
        nr_hora_execucao: int = 8,
        nr_dia_execucao: Optional[int] = None,
        filtros: Optional[Dict[str, Any]] = None,
        fg_enviar_email: bool = True,
        emails_destinatarios: Optional[List[str]] = None
    ) -> TbExportAgendamento:
        """Cria agendamento recorrente"""
        # Calcular próxima execução
        proxima_execucao = ExportService._calcular_proxima_execucao(
            tp_frequencia, nr_hora_execucao, nr_dia_execucao
        )

        agendamento = TbExportAgendamento(
            id_empresa=id_empresa,
            id_user_criador=id_user,
            nm_agendamento=nm_agendamento,
            tp_relatorio=tp_relatorio,
            tp_formato=tp_formato,
            ds_filtros=filtros or {},
            tp_frequencia=tp_frequencia,
            nr_hora_execucao=nr_hora_execucao,
            nr_dia_execucao=nr_dia_execucao,
            fg_enviar_email=fg_enviar_email,
            ds_emails_destinatarios={"emails": emails_destinatarios or []},
            dt_proxima_execucao=proxima_execucao
        )

        db.add(agendamento)
        await db.commit()
        await db.refresh(agendamento)

        return agendamento

    @staticmethod
    def _calcular_proxima_execucao(
        tp_frequencia: str,
        nr_hora: int,
        nr_dia: Optional[int] = None
    ) -> datetime:
        """Calcula próxima data de execução"""
        agora = datetime.utcnow()
        proxima = agora.replace(hour=nr_hora, minute=0, second=0, microsecond=0)

        if tp_frequencia == FrequenciaAgendamento.DIARIO.value:
            # Se já passou da hora hoje, agenda para amanhã
            if proxima <= agora:
                proxima += timedelta(days=1)

        elif tp_frequencia == FrequenciaAgendamento.SEMANAL.value:
            # nr_dia = dia da semana (1=segunda, 7=domingo)
            dias_ate_dia = (nr_dia - agora.isoweekday()) % 7
            if dias_ate_dia == 0 and proxima <= agora:
                dias_ate_dia = 7
            proxima += timedelta(days=dias_ate_dia)

        elif tp_frequencia == FrequenciaAgendamento.MENSAL.value:
            # nr_dia = dia do mês
            if nr_dia:
                proxima = proxima.replace(day=min(nr_dia, 28))  # Evitar erro com dias inválidos
                if proxima <= agora:
                    # Próximo mês
                    if proxima.month == 12:
                        proxima = proxima.replace(year=proxima.year + 1, month=1)
                    else:
                        proxima = proxima.replace(month=proxima.month + 1)

        return proxima

    @staticmethod
    async def listar_agendamentos(
        db: AsyncSession,
        id_empresa: UUID,
        fg_ativo: bool = True,
        page: int = 1,
        size: int = 50
    ) -> Tuple[List[TbExportAgendamento], int]:
        """Lista agendamentos"""
        query = select(TbExportAgendamento).where(
            TbExportAgendamento.id_empresa == id_empresa,
            TbExportAgendamento.fg_ativo == fg_ativo
        )

        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginação
        query = query.order_by(TbExportAgendamento.dt_criacao.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await db.execute(query)
        agendamentos = result.scalars().all()

        return agendamentos, total

    @staticmethod
    async def desativar_agendamento(
        db: AsyncSession,
        id_agendamento: UUID,
        id_empresa: UUID
    ) -> TbExportAgendamento:
        """Desativa agendamento"""
        query = select(TbExportAgendamento).where(
            TbExportAgendamento.id_agendamento == id_agendamento,
            TbExportAgendamento.id_empresa == id_empresa
        )
        result = await db.execute(query)
        agendamento = result.scalar_one_or_none()

        if not agendamento:
            raise ValueError("Agendamento não encontrado")

        agendamento.fg_ativo = False
        await db.commit()
        await db.refresh(agendamento)

        return agendamento

    @staticmethod
    async def obter_estatisticas(
        db: AsyncSession,
        id_empresa: UUID
    ) -> ExportEstatisticas:
        """Retorna estatísticas de exportações"""
        # Total de exports
        query = select(func.count()).select_from(TbExportJob).where(
            TbExportJob.id_empresa == id_empresa
        )
        result = await db.execute(query)
        total_exports = result.scalar() or 0

        # Por status
        query_concluidos = select(func.count()).select_from(TbExportJob).where(
            TbExportJob.id_empresa == id_empresa,
            TbExportJob.st_export == StatusExport.CONCLUIDO.value
        )
        result = await db.execute(query_concluidos)
        total_concluidos = result.scalar() or 0

        query_erro = select(func.count()).select_from(TbExportJob).where(
            TbExportJob.id_empresa == id_empresa,
            TbExportJob.st_export == StatusExport.ERRO.value
        )
        result = await db.execute(query_erro)
        total_erro = result.scalar() or 0

        query_pendentes = select(func.count()).select_from(TbExportJob).where(
            TbExportJob.id_empresa == id_empresa,
            TbExportJob.st_export == StatusExport.PENDENTE.value
        )
        result = await db.execute(query_pendentes)
        total_pendentes = result.scalar() or 0

        # Tamanho total
        query_tamanho = select(func.sum(TbExportJob.nr_tamanho_bytes)).where(
            TbExportJob.id_empresa == id_empresa
        )
        result = await db.execute(query_tamanho)
        tamanho_total_bytes = result.scalar() or 0
        tamanho_total_mb = tamanho_total_bytes / (1024 * 1024)

        # Mock para formatos e relatórios
        formatos_mais_usados = {"csv": 10, "excel": 8, "json": 5}
        relatorios_mais_exportados = {"agendamentos": 12, "faturamento": 7, "estoque": 4}

        return ExportEstatisticas(
            total_exports=total_exports,
            total_concluidos=total_concluidos,
            total_erro=total_erro,
            total_pendentes=total_pendentes,
            tamanho_total_mb=round(tamanho_total_mb, 2),
            formatos_mais_usados=formatos_mais_usados,
            relatorios_mais_exportados=relatorios_mais_exportados
        )
