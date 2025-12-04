# src/models/__init__.py
# Importar modelos na ordem correta para evitar problemas de relacionamento circular

# Base deve ser importada primeiro
from src.models.base import Base

# Modelos sem dependências (tabelas intermediárias e auxiliares)
# REMOVED: AI models migrated to doctorq-service-ai
# from src.models.documento_store_file_chunk import DocumentoStoreFileChunk
# from src.models.agent_document_store import AgentDocumentStore

# Modelos que dependem de outros (relationships)
# Importar na ordem: primeiro os modelos que são referenciados, depois os que referenciam
# REMOVED: AI models migrated to doctorq-service-ai
# from src.models.documento_store import DocumentoStore
# from src.models.agent import Agent

from src.models.partner_lead import (
    PartnerLead,
    PartnerLeadService,
    PartnerServiceDefinition,
)
from src.models.partner_package import (
    PartnerLicense,
    PartnerPackage,
    PartnerPackageItem,
)

# DoctorQ Marketplace ORM Models
from src.models.produto_orm import (
    ProdutoORM,
    CategoriaProdutoORM,
    ProdutoVariacaoORM,
)
from src.models.fornecedor_orm import FornecedorORM
from src.models.carrinho_orm import CarrinhoORM
from src.models.pedido_orm import (
    PedidoORM,
    ItemPedidoORM,
    PedidoHistoricoORM,
)

# Sistema de Carreiras (Jobs & Recruitment)
from src.models.curriculo import TbCurriculos
from src.models.favorito import TbFavoritos  # Importar antes de TbVagas (relacionamento)
from src.models.vaga import TbVagas
from src.models.candidatura import TbCandidaturas

# Configuração de Visibilidade de Telas
from src.models.telas_config import TelasConfig

__all__ = [
    "Base",
    # REMOVED: AI models migrated to doctorq-service-ai
    # "DocumentoStoreFileChunk",
    # "AgentDocumentStore",
    # "DocumentoStore",
    # "Agent",
    "PartnerLead",
    "PartnerLeadService",
    "PartnerServiceDefinition",
    "PartnerPackage",
    "PartnerPackageItem",
    "PartnerLicense",
    # DoctorQ Marketplace
    "ProdutoORM",
    "CategoriaProdutoORM",
    "ProdutoVariacaoORM",
    "FornecedorORM",
    "CarrinhoORM",
    "PedidoORM",
    "ItemPedidoORM",
    "PedidoHistoricoORM",
    # Sistema de Carreiras
    "TbCurriculos",
    "TbFavoritos",
    "TbVagas",
    "TbCandidaturas",
    # Configuração de Telas
    "TelasConfig",
]
