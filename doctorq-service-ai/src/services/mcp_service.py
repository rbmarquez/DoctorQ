import json
from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.models import mcp_model, mcp_schema
from src.services.variable_service import VariableService


def _find_and_mask_secrets_recursive(data: dict, env_vars: dict, key_path: str = ""):
    """
    Navega recursivamente por um dicionÃ¡rio, busca por chaves que parecem segredos,
    move seus valores para env_vars e substitui por uma referÃªncia.
    """
    if not isinstance(data, dict):
        return

    sensitive_keywords = ["KEY", "SECRET", "PASSWORD", "TOKEN"]

    for key, value in list(data.items()):
        current_path = f"{key_path}_{key}" if key_path else key

        if isinstance(value, dict):
            _find_and_mask_secrets_recursive(value, env_vars, current_path)

        elif (
            any(keyword in key.upper() for keyword in sensitive_keywords)
            and isinstance(value, str)
            and not value.startswith("${")
        ):
            var_name = current_path.replace("-", "_").upper()
            if var_name not in env_vars:
                env_vars[var_name] = value
            data[key] = f"${{{var_name}}}"


async def _handle_sensitive_data(
    db: AsyncSession, mcp_id: UUID, mcp_name: str, data: dict
) -> dict:  # <-- mcp_name adicionado
    """
    Coleta todas as variÃ¡veis, salva em um Ãºnico registro JSON e mascara a resposta.
    """
    env_vars = data.get("env_variables", {}) or {}
    config_mcp = data.get("config_mcp", {}) or {}

    real_env_values = {}

    if config_mcp:
        _find_and_mask_secrets_recursive(config_mcp, real_env_values)

    for key, value in env_vars.items():
        if value and value != "********":
            real_env_values[key] = value

    if real_env_values:
        variable_service = VariableService(db)
        await variable_service.save_mcp_variables(
            mcp_id, mcp_name, real_env_values
        )  # <-- mcp_name adicionado

    data["env_variables"] = {k: "********" for k in real_env_values}
    data["config_mcp"] = config_mcp
    return data


async def resolve_headers_with_env(
    db: AsyncSession, headers: dict, mcp_id: UUID
) -> dict:
    """
    Substitui placeholders nos headers (ex: ${VAR_NAME}) pelos seus valores reais
    armazenados no serviÃ§o de variÃ¡veis.
    """
    resolved_headers = headers.copy()
    variable_service = VariableService(db)

    # Busca todas as variÃ¡veis salvas para este MCP
    mcp_variables = await variable_service.get_mcp_variables(mcp_id)

    for key, value in resolved_headers.items():
        if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
            # Extrai o nome da variÃ¡vel de dentro de ${...}
            var_name = value[2:-1]

            # Busca o valor real no dicionÃ¡rio de variÃ¡veis
            real_value = mcp_variables.get(var_name)

            if real_value:
                resolved_headers[key] = real_value
            else:
                # Se a variÃ¡vel nÃ£o for encontrada, lanÃ§a um erro claro
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"VariÃ¡vel de ambiente '{var_name}' nÃ£o encontrada para o MCP {mcp_id}",
                )
    return resolved_headers


async def create_mcp(db: AsyncSession, mcp: mcp_schema.MCPCreate):
    """Cria um novo MCP, mascarando variÃ¡veis e registrando Tool vinculada."""

    mcp_id = uuid4()
    mcp_data = mcp.model_dump()
    processed_data = await _handle_sensitive_data(db, mcp_id, mcp.nm_mcp, mcp_data)

    db_mcp = mcp_model.MCP(id=mcp_id, **processed_data)

    db.add(db_mcp)

    try:
        await db.flush()

        await db.execute(
            text(
                """
                INSERT INTO tb_tools (id_tool, nm_tool, ds_tool, tp_tool, config_tool, st_ativo)
                VALUES (:id_tool, :nm_tool, :ds_tool, 'mcp', :config_tool, true) -- <-- ALTERAÃ‡ÃƒO DE 'api' PARA 'mcp'
                ON CONFLICT (id_tool) DO UPDATE SET
                    nm_tool = EXCLUDED.nm_tool,
                    ds_tool = EXCLUDED.ds_tool,
                    tp_tool = EXCLUDED.tp_tool, -- Garante que o tipo seja atualizado se necessÃ¡rio
                    config_tool = EXCLUDED.config_tool,
                    dt_atualizacao = now()
            """
            ),
            {
                "id_tool": str(db_mcp.id),
                "nm_tool": db_mcp.nm_mcp,
                "ds_tool": db_mcp.ds_mcp or f"Tool gerada do MCP {db_mcp.nm_mcp}",
                "config_tool": json.dumps(
                    {
                        "mcp_id": str(db_mcp.id),
                        "capabilities": db_mcp.capabilities,
                    }
                ),
            },
        )
        await db.commit()
        await db.refresh(db_mcp)
        return db_mcp
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar MCP: {e}")


async def update_mcp(db: AsyncSession, mcp_id: UUID, mcp_update: mcp_schema.MCPUpdate):
    """Atualiza um MCP existente, incluindo variÃ¡veis e a Tool vinculada."""
    db_mcp = await get_mcp_by_id(db, mcp_id)

    update_data = mcp_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_mcp, key, value)

    full_data_to_process = {
        "env_variables": update_data.get("env_variables"),
        "config_mcp": update_data.get("config_mcp"),
    }

    processed_data = await _handle_sensitive_data(
        db, mcp_id, db_mcp.nm_mcp, full_data_to_process
    )

    if processed_data.get("env_variables") is not None:
        db_mcp.env_variables = processed_data["env_variables"]
    if processed_data.get("config_mcp") is not None:
        db_mcp.config_mcp = processed_data["config_mcp"]

    try:
        await db.flush()

        await db.execute(
            text(
                """
                UPDATE tb_tools SET
                    nm_tool = :nm_tool,
                    ds_tool = :ds_tool,
                    tp_tool = 'mcp', -- <-- ALTERAÃ‡ÃƒO DE 'api' PARA 'mcp'
                    config_tool = :config_tool,
                    dt_atualizacao = now()
                WHERE id_tool = :id_tool
            """
            ),
            {
                "id_tool": str(db_mcp.id),
                "nm_tool": db_mcp.nm_mcp,
                "ds_tool": db_mcp.ds_mcp or f"Tool gerada do MCP {db_mcp.nm_mcp}",
                "config_tool": json.dumps(
                    {
                        "mcp_id": str(db_mcp.id),
                        "capabilities": db_mcp.capabilities,
                    }
                ),
            },
        )
        await db.commit()
        await db.refresh(db_mcp)
        return db_mcp
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar MCP: {e}")


async def delete_mcp(db: AsyncSession, mcp_id: UUID):
    """Exclui um MCP, sua Tool e variÃ¡veis vinculadas."""
    db_mcp = await get_mcp_by_id(db, mcp_id)

    try:
        variable_service = VariableService(db)
        variable_record = await variable_service.get_variable_by_id(mcp_id)
        if variable_record:
            await db.delete(variable_record)

        await db.execute(
            text("DELETE FROM tb_tools WHERE id_tool = :mcp_id"),
            {"mcp_id": str(mcp_id)},
        )

        await db.delete(db_mcp)
        await db.commit()
        return {"detail": f"MCP {mcp_id} e seus dados vinculados foram excluÃ­dos."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao excluir MCP: {e}")


async def list_mcps(db: AsyncSession):
    """Retorna uma lista de todos os MCPs."""
    result = await db.execute(select(mcp_model.MCP).order_by(mcp_model.MCP.nm_mcp))
    return result.scalars().all()


async def get_mcp_by_id(db: AsyncSession, mcp_id: UUID):
    """Busca um MCP pelo seu ID."""
    result = await db.execute(select(mcp_model.MCP).filter(mcp_model.MCP.id == mcp_id))
    mcp = result.scalars().first()
    if not mcp:
        raise HTTPException(
            status_code=404, detail=f"MCP com ID {mcp_id} nÃ£o encontrado."
        )
    return mcp


async def execute_mcp_client(
    db: AsyncSession, request: mcp_schema.MCPClientRequest
) -> mcp_schema.MCPClientResponse:
    """Busca, resolve e executa um MCP externo."""
    try:
        mcp = await get_mcp_by_id(db, request.mcp_id)

        config = mcp.config_mcp
        base_url = config.get("base_url")
        endpoint = config.get("endpoints", {}).get("search")
        headers = config.get("headers", {})

        if not base_url or not endpoint:
            raise HTTPException(
                status_code=400,
                detail="ConfiguraÃ§Ã£o do MCP (base_url, endpoint) invÃ¡lida",
            )

        resolved_headers = await resolve_headers_with_env(db, headers, mcp.id)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}{endpoint}",
                headers=resolved_headers,
                json={"q": request.query},
                timeout=30.0,
            )
            response.raise_for_status()
            response_data = response.json()

        return mcp_schema.MCPClientResponse(
            mcp_id=mcp.id,
            original_query=request.query,
            response_data=response_data,
            capabilities=mcp.capabilities,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Erro no servidor MCP externo: {e.response.text}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"NÃ£o foi possÃ­vel conectar ao servidor MCP externo: {str(e)}",
        )
