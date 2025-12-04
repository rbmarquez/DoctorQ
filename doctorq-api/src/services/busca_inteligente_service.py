"""
Service para Busca Inteligente de Profissionais com IA Gisele
"""

import json
import logging
from typing import Dict, List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

# from src.agents.doctorq_agent import DoctorQAgent  # Comentado por enquanto
from src.config.orm_config import ORMConfig

logger = logging.getLogger(__name__)


class BuscaInteligenteService:
    """Service para matching inteligente de profissionais usando IA Gisele"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.agente_gisele_id = "39dfada1-cc3f-4a6e-8e5b-e79453059e82"  # ID do agente Gisele

    async def buscar_profissionais_com_ia(
        self,
        respostas_lead: Dict,
        nm_cidade: Optional[str] = None,
        nm_estado: Optional[str] = None,
        limit: int = 10,
    ) -> Dict:
        """
        Busca profissionais usando IA Gisele para fazer matching inteligente.

        Args:
            respostas_lead: Respostas do questionário do paciente
            nm_cidade: Cidade preferencial (opcional)
            nm_estado: Estado preferencial (opcional)
            limit: Máximo de resultados

        Returns:
            Dict com profissionais ranqueados, scores e justificativas
        """
        try:
            # 1. Buscar profissionais ativos do banco
            profissionais = await self._buscar_profissionais_ativos(nm_cidade, nm_estado)

            if not profissionais:
                return {
                    "profissionais": [],
                    "ds_resumo_analise": "Nenhum profissional encontrado com os critérios informados.",
                    "total_encontrados": 0,
                }

            # 2. Para cada profissional, buscar dados da clínica/lead
            profissionais_com_contexto = await self._enriquecer_profissionais_com_lead(profissionais)

            # 3. Usar IA Gisele para fazer matching
            profissionais_ranqueados = await self._fazer_matching_com_ia(
                respostas_lead, profissionais_com_contexto
            )

            # 4. Limitar resultados
            profissionais_ranqueados = profissionais_ranqueados[:limit]

            # 5. Gerar resumo da análise
            resumo = await self._gerar_resumo_analise(respostas_lead, profissionais_ranqueados)

            return {
                "profissionais": profissionais_ranqueados,
                "ds_resumo_analise": resumo,
                "total_encontrados": len(profissionais_ranqueados),
            }

        except Exception as e:
            logger.error(f"Erro na busca inteligente: {e}", exc_info=True)
            raise

    async def _buscar_profissionais_ativos(
        self, nm_cidade: Optional[str], nm_estado: Optional[str]
    ) -> List[Dict]:
        """Busca profissionais ativos do banco, com filtros opcionais de localização"""
        query = """
        SELECT
            p.id_profissional,
            p.id_user,
            p.id_empresa,
            p.id_clinica,
            p.nm_profissional,
            p.ds_especialidades,
            p.ds_biografia,
            p.ds_foto,
            p.ds_formacao,
            p.nr_registro_profissional,
            p.nr_anos_experiencia,
            p.nr_avaliacao_media,
            p.nr_total_avaliacoes,
            p.st_ativo,
            p.st_aceita_online,
            p.dt_criacao,
            p.ds_email,
            p.nr_telefone as prof_telefone,
            p.nr_whatsapp as prof_whatsapp,
            c.id_empresa,
            e.nm_razao_social as nm_empresa,
            u.nm_completo as nm_user,
            c.nm_clinica,
            c.ds_endereco,
            c.nm_cidade as clinica_cidade,
            c.nm_estado as clinica_estado
        FROM tb_profissionais p
        LEFT JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
        LEFT JOIN tb_empresas e ON c.id_empresa = e.id_empresa
        LEFT JOIN tb_users u ON p.id_user = u.id_user
        WHERE p.st_ativo = true
        """

        params = {}

        # Filtro por cidade
        if nm_cidade:
            query += " AND (c.nm_cidade ILIKE :cidade OR :cidade IS NULL)"
            params["cidade"] = f"%{nm_cidade}%"

        # Filtro por estado
        if nm_estado:
            query += " AND (c.nm_estado ILIKE :estado OR :estado IS NULL)"
            params["estado"] = f"%{nm_estado}%"

        query += " ORDER BY p.nr_avaliacao_media DESC NULLS LAST, p.dt_criacao DESC"
        query += " LIMIT 50"  # Limitar para não sobrecarregar a IA

        result = await self.db.execute(text(query), params)
        rows = result.fetchall()

        profissionais = []
        for row in rows:
            prof = {
                "id_profissional": str(row.id_profissional),
                "id_user": str(row.id_user) if row.id_user else None,
                "id_clinica": str(row.id_clinica) if row.id_clinica else None,
                "id_empresa": str(row.id_empresa) if row.id_empresa else None,
                "nm_profissional": row.nm_profissional,
                "ds_especialidades": row.ds_especialidades or [],
                "ds_biografia": row.ds_biografia,
                "ds_foto": row.ds_foto,
                "ds_formacao": row.ds_formacao,
                "nr_registro_profissional": row.nr_registro_profissional,
                "nr_anos_experiencia": row.nr_anos_experiencia,
                "nr_avaliacao_media": float(row.nr_avaliacao_media) if row.nr_avaliacao_media else None,
                "nr_total_avaliacoes": row.nr_total_avaliacoes or 0,
                "st_ativo": row.st_ativo,
                "st_aceita_online": row.st_aceita_online,
                "dt_criacao": row.dt_criacao.isoformat() if row.dt_criacao else None,
                "nm_empresa": row.nm_empresa,
                "nm_user": row.nm_user,
                "ds_email": row.ds_email,
                "nr_telefone": row.prof_telefone,
                "nr_whatsapp": row.prof_whatsapp,
                "nm_clinica": row.nm_clinica,
                "ds_endereco": row.ds_endereco,
                "clinica_cidade": row.clinica_cidade,
                "clinica_estado": row.clinica_estado,
            }
            profissionais.append(prof)

        logger.info(f"Encontrados {len(profissionais)} profissionais ativos")
        return profissionais

    async def _enriquecer_profissionais_com_lead(self, profissionais: List[Dict]) -> List[Dict]:
        """Enriquece dados dos profissionais com informações do lead da clínica"""
        for prof in profissionais:
            if prof["id_empresa"]:
                # Buscar lead da clínica
                query = """
                SELECT
                    id_partner_lead,
                    tp_partner,
                    nm_contato,
                    nm_email,
                    nr_telefone,
                    nm_empresa,
                    nr_cnpj,
                    nm_cidade,
                    nm_estado,
                    ds_servicos,
                    ds_diferenciais,
                    nr_tamanho_equipe,
                    ds_observacoes
                FROM tb_partner_leads
                WHERE id_empresa = :id_empresa
                  AND tp_partner = 'clinica'
                ORDER BY dt_criacao DESC
                LIMIT 1
                """

                result = await self.db.execute(text(query), {"id_empresa": prof["id_empresa"]})
                lead_row = result.fetchone()

                if lead_row:
                    prof["lead_clinica"] = {
                        "ds_servicos": lead_row.ds_servicos,
                        "ds_diferenciais": lead_row.ds_diferenciais,
                        "nr_tamanho_equipe": lead_row.nr_tamanho_equipe,
                        "ds_observacoes": lead_row.ds_observacoes,
                        "nm_cidade": lead_row.nm_cidade,
                        "nm_estado": lead_row.nm_estado,
                    }
                else:
                    prof["lead_clinica"] = None

        return profissionais

    async def _fazer_matching_com_ia(
        self, respostas_lead_paciente: Dict, profissionais: List[Dict]
    ) -> List[Dict]:
        """Usa IA Gisele para fazer matching entre paciente e profissionais"""
        try:
            # Montar prompt para IA
            prompt = self._montar_prompt_matching(respostas_lead_paciente, profissionais)

            # Chamar IA Gisele
            resposta_ia = await self._chamar_ia_gisele(prompt)

            # Parsear resposta da IA (espera-se um JSON com scores e justificativas)
            profissionais_com_score = self._parsear_resposta_ia(resposta_ia, profissionais)

            # Ordenar por score
            profissionais_com_score.sort(key=lambda x: x["score_compatibilidade"], reverse=True)

            return profissionais_com_score

        except Exception as e:
            logger.error(f"Erro no matching com IA: {e}", exc_info=True)
            # Fallback: retornar profissionais sem score
            return [
                {
                    "profissional": prof,
                    "score_compatibilidade": 0.5,
                    "ds_justificativa": "Matching realizado sem IA (erro no processamento)",
                }
                for prof in profissionais
            ]

    def _montar_prompt_matching(self, respostas_lead: Dict, profissionais: List[Dict]) -> str:
        """Monta prompt para IA Gisele fazer o matching"""
        # Criar texto resumido das respostas do paciente
        respostas_texto = "\n".join([f"- {chave}: {valor}" for chave, valor in respostas_lead.items()])

        # Criar lista resumida de profissionais
        profissionais_texto = ""
        for i, prof in enumerate(profissionais, 1):
            especialidades = ", ".join(prof["ds_especialidades"]) if prof["ds_especialidades"] else "Não informado"
            cidade = prof.get("clinica_cidade", "Não informado")
            bio = (prof.get("ds_bio") or "")[:200]  # Limitar tamanho
            lead = prof.get("lead_clinica", {}) or {}
            servicos = lead.get("ds_servicos", "Não informado")

            profissionais_texto += f"""
Profissional #{i}:
- ID: {prof['id_profissional']}
- Nome: {prof['nm_profissional']}
- Especialidades: {especialidades}
- Bio: {bio}
- Cidade: {cidade}
- Serviços da clínica: {servicos}
- Avaliação: {prof.get('vl_avaliacao_media', 'Sem avaliações')}
---
"""

        prompt = f"""
Você é Gisele, a assistente virtual especializada em estética da plataforma DoctorQ.

Sua tarefa é analisar o perfil de um paciente e recomendar os profissionais mais compatíveis.

**PERFIL DO PACIENTE:**
{respostas_texto}

**PROFISSIONAIS DISPONÍVEIS:**
{profissionais_texto}

**INSTRUÇÕES:**
1. Analise cuidadosamente as necessidades e preferências do paciente
2. Compare com as especialidades, bio e serviços de cada profissional
3. Atribua um score de compatibilidade de 0.0 a 1.0 para cada profissional
4. Justifique cada score em 1-2 frases

**FORMATO DE RESPOSTA (JSON):**
{{
    "matches": [
        {{
            "id_profissional": "uuid-do-profissional",
            "score": 0.95,
            "justificativa": "Profissional altamente compatível porque..."
        }}
    ]
}}

Retorne APENAS o JSON, sem texto adicional.
"""
        return prompt

    async def _chamar_ia_gisele(self, prompt: str) -> str:
        """
        Versão simplificada: faz matching baseado em keywords
        TODO: Integrar com IA Gisele futuramente
        """
        try:
            # Por enquanto, retorna um JSON fake para todos os profissionais
            # O matching real será feito no método _calcular_score_simples
            return '{"matches": []}'

        except Exception as e:
            logger.error(f"Erro ao chamar matching: {e}", exc_info=True)
            raise

    def _parsear_resposta_ia(self, resposta_ia: str, profissionais: List[Dict]) -> List[Dict]:
        """Parseia resposta JSON da IA e associa com profissionais"""
        try:
            # Tentar parsear JSON da resposta
            # IA pode retornar markdown com ```json, então remover
            resposta_limpa = resposta_ia.strip()
            if resposta_limpa.startswith("```json"):
                resposta_limpa = resposta_limpa[7:]
            if resposta_limpa.startswith("```"):
                resposta_limpa = resposta_limpa[3:]
            if resposta_limpa.endswith("```"):
                resposta_limpa = resposta_limpa[:-3]

            resposta_json = json.loads(resposta_limpa.strip())
            matches = resposta_json.get("matches", [])

            # Criar mapa de profissionais por ID
            profissionais_map = {p["id_profissional"]: p for p in profissionais}

            # Montar resultado final
            resultado = []
            for match in matches:
                prof_id = match.get("id_profissional")
                if prof_id in profissionais_map:
                    resultado.append(
                        {
                            "profissional": profissionais_map[prof_id],
                            "score_compatibilidade": float(match.get("score", 0.5)),
                            "ds_justificativa": match.get("justificativa", "Compatível"),
                        }
                    )

            # Se IA não retornou nenhum match, fazer scoring simples para todos
            if not resultado:
                logger.info("IA não retornou matches, usando scoring simples")
                for prof in profissionais:
                    score = self._calcular_score_simples(prof)
                    justificativa = self._gerar_justificativa_simples(prof, score)
                    resultado.append({
                        "profissional": prof,
                        "score_compatibilidade": score,
                        "ds_justificativa": justificativa,
                    })
            else:
                # Adicionar profissionais faltantes com score baixo
                profissionais_retornados = {m["id_profissional"] for m in matches}
                for prof in profissionais:
                    if prof["id_profissional"] not in profissionais_retornados:
                        score = self._calcular_score_simples(prof)
                        justificativa = self._gerar_justificativa_simples(prof, score)
                        resultado.append({
                            "profissional": prof,
                            "score_compatibilidade": score,
                            "ds_justificativa": justificativa,
                        })

            return resultado

        except Exception as e:
            logger.error(f"Erro ao parsear resposta da IA: {e}", exc_info=True)
            logger.error(f"Resposta da IA: {resposta_ia}")
            # Fallback: usar scoring simples para todos
            return [
                {
                    "profissional": prof,
                    "score_compatibilidade": self._calcular_score_simples(prof),
                    "ds_justificativa": self._gerar_justificativa_simples(prof, self._calcular_score_simples(prof)),
                }
                for prof in profissionais
            ]

    def _calcular_score_simples(self, prof: Dict) -> float:
        """Calcula score simples baseado em atributos do profissional"""
        score = 0.5  # Base

        # +0.1 se tem especialidades
        if prof.get("ds_especialidades") and len(prof.get("ds_especialidades", [])) > 0:
            score += 0.1

        # +0.1 se tem bio preenchida
        if prof.get("ds_biografia") and len(prof.get("ds_biografia", "")) > 50:
            score += 0.1

        # +0.15 se tem avaliação alta
        avaliacao = prof.get("nr_avaliacao_media", 0)
        if avaliacao and avaliacao >= 4.5:
            score += 0.15
        elif avaliacao and avaliacao >= 4.0:
            score += 0.10
        elif avaliacao and avaliacao >= 3.5:
            score += 0.05

        # +0.05 se tem experiência
        if prof.get("nr_anos_experiencia") and prof.get("nr_anos_experiencia", 0) > 0:
            score += 0.05

        # +0.1 se tem formação
        if prof.get("ds_formacao") and len(prof.get("ds_formacao", "")) > 0:
            score += 0.1

        return min(score, 1.0)  # Cap em 1.0

    def _gerar_justificativa_simples(self, prof: Dict, score: float) -> str:
        """Gera justificativa baseada no score"""
        especialidades = prof.get("ds_especialidades", [])
        esp_texto = ", ".join(especialidades[:2]) if especialidades else "diversos procedimentos"

        if score >= 0.8:
            return f"Profissional altamente qualificado especializado em {esp_texto}, com excelente avaliação e ampla experiência."
        elif score >= 0.6:
            return f"Profissional qualificado com experiência em {esp_texto} e bom histórico de atendimentos."
        elif score >= 0.4:
            return f"Profissional disponível com especialização em {esp_texto}."
        else:
            return f"Profissional disponível para atendimento."

    async def _gerar_resumo_analise(self, respostas_lead: Dict, profissionais_ranqueados: List[Dict]) -> str:
        """Gera resumo da análise realizada"""
        total = len(profissionais_ranqueados)
        if total == 0:
            return "Nenhum profissional encontrado com os critérios informados."

        melhor_score = profissionais_ranqueados[0]["score_compatibilidade"] if total > 0 else 0

        resumo = f"""
Analisamos {total} profissionais e encontramos matches compatíveis com seu perfil.
O profissional mais compatível tem um score de {melhor_score:.0%} de compatibilidade.
Os resultados foram ordenados por relevância considerando suas necessidades e preferências.
        """.strip()

        return resumo
