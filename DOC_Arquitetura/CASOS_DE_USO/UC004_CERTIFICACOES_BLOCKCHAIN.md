# UC004 - Certificações Blockchain com NFT

**Versão:** 1.0
**Data:** 13/11/2025
**Autor:** Sistema DoctorQ
**Status:** Planejado

---

## 1. Descrição

Este caso de uso descreve o sistema de certificações digitais verificáveis baseado em blockchain (Web3), onde alunos que concluem cursos recebem certificados como NFTs (Non-Fungible Tokens) na rede Polygon, garantindo autenticidade, imutabilidade e verificação pública.

---

## 2. Atores

### Ator Principal
- **Aluno** - Usuário que conclui curso e recebe certificado NFT

### Atores Secundários
- **Sistema de Certificação** - Gera certificados em PDF + NFT
- **Blockchain (Polygon)** - Rede onde NFTs são mintados
- **Smart Contract** - Contrato inteligente que emite NFTs
- **Wallet Provider (MetaMask)** - Carteira digital do aluno
- **Verificador Externo** - Empresa/profissional que valida certificado

---

## 3. Pré-condições

1. Aluno deve ter concluído curso com:
   - `pc_conclusao >= 80%`
   - `qt_avaliacoes_concluidas = qt_avaliacoes_obrigatorias`
   - `fg_certificado_emitido = false` (primeiro certificado)
2. Aluno deve ter carteira Web3 configurada (MetaMask, WalletConnect, etc.)
3. Smart contract de certificados deployed na Polygon
4. Gas fee pago pelo sistema DoctorQ (não pelo aluno)
5. Template de certificado configurado (PDF design)

---

## 4. Pós-condições

### Sucesso
1. Certificado PDF gerado e disponível para download
2. NFT mintado na blockchain Polygon
3. Registro em `tb_universidade_certificados` criado
4. Link público de verificação disponível
5. Notificação enviada ao aluno
6. XP bônus creditado (+200 XP por certificação)
7. Badge "Certificado" desbloqueado

### Falha
1. Se blockchain indisponível → apenas PDF gerado (NFT pendente)
2. Se wallet inválida → solicitar configuração
3. Se curso não elegível → exibir critérios faltantes

---

## 5. Fluxo Principal

### 5.1 Conclusão do Curso e Elegibilidade

**Passo 1: Aluno Completa Última Aula**

```python
# Backend detecta conclusão ao marcar última aula como concluída
@router.post("/universidade/aulas/{id_aula}/concluir/")
async def concluir_aula(id_aula: UUID, id_aluno: UUID):
    # 1. Marcar aula como concluída
    await marcar_aula_concluida(id_aula, id_aluno)

    # 2. Atualizar progresso do curso
    progresso = await atualizar_progresso_curso(id_aluno, id_aula)

    # 3. Verificar se completou o curso
    if progresso.pc_conclusao >= 80.0:
        # 4. Verificar se todas as avaliações obrigatórias foram feitas
        avaliacoes_ok = await verificar_avaliacoes_obrigatorias(id_aluno, progresso.id_curso)

        if avaliacoes_ok:
            # 5. Curso concluído! Marcar como tal
            await marcar_curso_concluido(id_aluno, progresso.id_curso)

            # 6. Disparar processo de certificação
            await iniciar_certificacao(id_aluno, progresso.id_curso)

            return {
                "mensagem": "🎉 Parabéns! Você concluiu o curso!",
                "fg_certificado_disponivel": True,
                "url_certificado": f"/universidade/certificados/{progresso.id_curso}"
            }
```

**Passo 2: Exibir Modal de Parabenização**

```javascript
// Frontend exibe modal animado
{
  "tipo": "modal_certificacao",
  "titulo": "🎓 Parabéns pela Conclusão!",
  "mensagem": "Você completou o curso 'Microblading Avançado' com 95% de aproveitamento!",
  "animacao": "confetti",
  "acoes": [
    {
      "label": "🏆 Emitir Certificado",
      "acao": "/universidade/certificados/emitir"
    },
    {
      "label": "📊 Ver Estatísticas",
      "acao": "/universidade/meus-cursos/{id}/estatisticas"
    }
  ]
}
```

### 5.2 Geração do Certificado PDF

**Passo 3: Gerar Certificado em PDF**

```python
# Backend - src/services/certificacao_service.py

async def gerar_certificado_pdf(id_aluno: UUID, id_curso: UUID) -> str:
    # 1. Buscar dados do aluno e curso
    aluno = await db.get_aluno(id_aluno)
    curso = await db.get_curso(id_curso)
    inscricao = await db.get_inscricao(id_aluno, id_curso)

    # 2. Calcular dados para o certificado
    dados_certificado = {
        "nm_aluno": aluno.nm_nome,
        "nm_curso": curso.nm_titulo,
        "qt_carga_horaria": curso.qt_carga_horaria,
        "dt_conclusao": inscricao.dt_conclusao.strftime("%d/%m/%Y"),
        "pc_aproveitamento": inscricao.pc_conclusao,
        "nm_instrutor": curso.nm_instrutor,
        "cd_verificacao": gerar_codigo_verificacao(id_aluno, id_curso),
        "url_verificacao": f"https://doctorq.app/verificar/{cd_verificacao}",
        "nm_empresa": "Universidade da Beleza - DoctorQ"
    }

    # 3. Renderizar template HTML
    html = render_template("certificado_template.html", **dados_certificado)

    # 4. Converter HTML para PDF (usando WeasyPrint ou similar)
    pdf_bytes = HTML(string=html).write_pdf()

    # 5. Upload para S3/CloudFlare R2
    url_pdf = await upload_certificado_s3(
        pdf_bytes,
        filename=f"certificado_{id_aluno}_{id_curso}.pdf"
    )

    return url_pdf
```

**Template de Certificado (HTML):**

```html
<!-- templates/certificado_template.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@300;400&display=swap');

    body {
      font-family: 'Roboto', sans-serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .certificado {
      background: white;
      border: 20px solid #f0f0f0;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      padding: 60px;
      max-width: 800px;
      margin: 0 auto;
      position: relative;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .logo {
      width: 150px;
      margin-bottom: 20px;
    }
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 48px;
      color: #667eea;
      margin: 0;
    }
    .conteudo {
      text-align: center;
      line-height: 1.8;
      font-size: 18px;
      color: #333;
    }
    .nome-aluno {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      color: #764ba2;
      margin: 30px 0;
      font-weight: 700;
    }
    .curso {
      font-size: 24px;
      font-weight: 500;
      color: #333;
      margin: 20px 0;
    }
    .detalhes {
      margin: 40px 0;
      display: flex;
      justify-content: space-around;
    }
    .detalhe-item {
      text-align: center;
    }
    .detalhe-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .detalhe-valor {
      font-size: 16px;
      color: #333;
      font-weight: 500;
      margin-top: 5px;
    }
    .assinaturas {
      display: flex;
      justify-content: space-around;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .assinatura {
      text-align: center;
    }
    .linha-assinatura {
      border-top: 2px solid #333;
      width: 200px;
      margin: 10px auto;
    }
    .qr-code {
      position: absolute;
      bottom: 40px;
      right: 40px;
      width: 100px;
      height: 100px;
    }
    .verificacao {
      position: absolute;
      bottom: 40px;
      left: 40px;
      font-size: 10px;
      color: #999;
    }
    .selo-blockchain {
      position: absolute;
      top: 40px;
      right: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="certificado">
    <div class="selo-blockchain">🔒 Blockchain Verified</div>

    <div class="header">
      <img src="https://doctorq.app/logo.png" alt="Logo" class="logo">
      <h1>Certificado de Conclusão</h1>
      <p style="color: #999; font-size: 14px;">Universidade da Beleza</p>
    </div>

    <div class="conteudo">
      <p>Certificamos que</p>
      <div class="nome-aluno">{{ nm_aluno }}</div>
      <p>concluiu com êxito o curso</p>
      <div class="curso">{{ nm_curso }}</div>
      <p>com aproveitamento de <strong>{{ pc_aproveitamento }}%</strong></p>
    </div>

    <div class="detalhes">
      <div class="detalhe-item">
        <div class="detalhe-label">Carga Horária</div>
        <div class="detalhe-valor">{{ qt_carga_horaria }} horas</div>
      </div>
      <div class="detalhe-item">
        <div class="detalhe-label">Data de Conclusão</div>
        <div class="detalhe-valor">{{ dt_conclusao }}</div>
      </div>
      <div class="detalhe-item">
        <div class="detalhe-label">Código de Verificação</div>
        <div class="detalhe-valor">{{ cd_verificacao }}</div>
      </div>
    </div>

    <div class="assinaturas">
      <div class="assinatura">
        <div class="linha-assinatura"></div>
        <p><strong>{{ nm_instrutor }}</strong></p>
        <p style="font-size: 12px; color: #999;">Instrutor do Curso</p>
      </div>
      <div class="assinatura">
        <div class="linha-assinatura"></div>
        <p><strong>Dr. Carlos Mendes</strong></p>
        <p style="font-size: 12px; color: #999;">Diretor Acadêmico</p>
      </div>
    </div>

    <img src="{{ qr_code_data }}" alt="QR Code" class="qr-code">
    <div class="verificacao">
      Verifique a autenticidade em:<br>
      {{ url_verificacao }}
    </div>
  </div>
</body>
</html>
```

### 5.3 Mintagem do NFT na Blockchain

**Passo 4: Verificar/Criar Wallet do Aluno**

```python
# Verificar se aluno já possui wallet configurada
wallet = await db.query(
    "SELECT wallet_address FROM tb_universidade_ranking WHERE id_aluno = $1",
    id_aluno
)

if not wallet or not wallet['wallet_address']:
    # Solicitar configuração de wallet
    return {
        "fg_wallet_necessaria": True,
        "mensagem": "Para receber seu certificado NFT, configure sua carteira Web3",
        "url_configuracao": "/universidade/configuracoes/wallet"
    }
```

**Passo 5: Mintar NFT no Smart Contract**

```python
# Backend - src/services/blockchain_service.py

from web3 import Web3
from eth_account import Account
import json

# Conectar à Polygon (rede de baixo custo)
w3 = Web3(Web3.HTTPProvider(os.getenv("POLYGON_RPC_URL")))

# Carregar smart contract
contract_address = os.getenv("CERTIFICADO_NFT_CONTRACT_ADDRESS")
with open("contracts/CertificadoNFT.json") as f:
    contract_abi = json.load(f)["abi"]

contract = w3.eth.contract(address=contract_address, abi=contract_abi)

async def mintar_certificado_nft(
    wallet_address: str,
    id_certificado: str,
    dados_certificado: dict
) -> str:
    """
    Mintar certificado como NFT na blockchain Polygon
    """

    # 1. Preparar metadata (padrão ERC-721)
    metadata = {
        "name": f"Certificado - {dados_certificado['nm_curso']}",
        "description": f"Certificado de conclusão do curso {dados_certificado['nm_curso']} por {dados_certificado['nm_aluno']}",
        "image": dados_certificado['url_imagem_certificado'],  # PNG do certificado
        "attributes": [
            {"trait_type": "Curso", "value": dados_certificado['nm_curso']},
            {"trait_type": "Aluno", "value": dados_certificado['nm_aluno']},
            {"trait_type": "Data Conclusão", "value": dados_certificado['dt_conclusao']},
            {"trait_type": "Aproveitamento", "value": f"{dados_certificado['pc_aproveitamento']}%"},
            {"trait_type": "Carga Horária", "value": f"{dados_certificado['qt_carga_horaria']}h"},
            {"trait_type": "Instituição", "value": "Universidade da Beleza - DoctorQ"}
        ],
        "external_url": dados_certificado['url_verificacao']
    }

    # 2. Upload metadata para IPFS (armazenamento descentralizado)
    ipfs_hash = await upload_to_ipfs(metadata)
    token_uri = f"ipfs://{ipfs_hash}"

    # 3. Preparar transação de mint
    # Conta administrativa do sistema (paga gas fee)
    admin_account = Account.from_key(os.getenv("ADMIN_PRIVATE_KEY"))

    tx = contract.functions.mintCertificado(
        wallet_address,  # Endereço do aluno que receberá o NFT
        token_uri,       # URI do metadata no IPFS
        id_certificado   # ID único do certificado
    ).build_transaction({
        'from': admin_account.address,
        'nonce': w3.eth.get_transaction_count(admin_account.address),
        'gas': 200000,
        'gasPrice': w3.eth.gas_price
    })

    # 4. Assinar e enviar transação
    signed_tx = admin_account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

    # 5. Aguardar confirmação (1 bloco)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

    # 6. Extrair token ID do evento emitido
    token_id = contract.events.CertificadoMintado().process_receipt(receipt)[0]['args']['tokenId']

    # 7. Retornar dados da transação
    return {
        "tx_hash": tx_hash.hex(),
        "token_id": token_id,
        "network": "Polygon",
        "wallet_address": wallet_address,
        "explorer_url": f"https://polygonscan.com/tx/{tx_hash.hex()}",
        "opensea_url": f"https://opensea.io/assets/matic/{contract_address}/{token_id}"
    }
```

**Smart Contract (Solidity):**

```solidity
// contracts/CertificadoNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CertificadoNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Mapeamento de certificado ID para token ID (prevenir duplicação)
    mapping(string => uint256) public certificadoToToken;
    mapping(uint256 => string) public tokenToCertificado;

    // Evento emitido ao mintar certificado
    event CertificadoMintado(
        uint256 indexed tokenId,
        address indexed alunoWallet,
        string certificadoId,
        string tokenURI
    );

    constructor() ERC721("DoctorQ Certificado", "ESTQCERT") {}

    /**
     * @dev Mintar certificado NFT para um aluno
     * @param alunoWallet Endereço da carteira do aluno
     * @param tokenURI URI do metadata no IPFS
     * @param certificadoId ID único do certificado no banco de dados
     */
    function mintCertificado(
        address alunoWallet,
        string memory tokenURI,
        string memory certificadoId
    ) public onlyOwner returns (uint256) {
        // Verificar se certificado já foi mintado
        require(
            certificadoToToken[certificadoId] == 0,
            "Certificado ja foi mintado"
        );

        // Incrementar contador de tokens
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        // Mintar NFT para o aluno
        _safeMint(alunoWallet, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        // Registrar mapeamento
        certificadoToToken[certificadoId] = newTokenId;
        tokenToCertificado[newTokenId] = certificadoId;

        // Emitir evento
        emit CertificadoMintado(newTokenId, alunoWallet, certificadoId, tokenURI);

        return newTokenId;
    }

    /**
     * @dev Verificar se certificado existe
     */
    function verificarCertificado(string memory certificadoId)
        public
        view
        returns (bool existe, uint256 tokenId, address owner)
    {
        tokenId = certificadoToToken[certificadoId];
        existe = tokenId != 0;
        if (existe) {
            owner = ownerOf(tokenId);
        }
    }

    /**
     * @dev Prevenir transferência (certificados são não-transferíveis)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        // Permitir apenas mint (from = address(0))
        // Bloquear transferências entre usuários
        require(
            from == address(0),
            "Certificados nao podem ser transferidos"
        );
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
```

**Passo 6: Registrar Certificado no Banco**

```sql
-- Salvar dados do certificado emitido
INSERT INTO tb_universidade_certificados (
  id_certificado,
  id_aluno,
  id_curso,
  id_inscricao,
  cd_verificacao,
  url_pdf,
  url_imagem,

  -- Blockchain data
  fg_nft_emitido,
  tx_hash,
  token_id,
  nm_network,
  wallet_address,
  url_explorer,
  url_marketplace,

  -- Metadata
  ds_metadata,

  dt_emissao
) VALUES (
  gen_random_uuid(),
  :id_aluno,
  :id_curso,
  :id_inscricao,
  :cd_verificacao,
  :url_pdf,
  :url_imagem,

  true,
  :tx_hash,
  :token_id,
  'Polygon',
  :wallet_address,
  :url_explorer,
  :url_opensea,

  jsonb_build_object(
    'nm_curso', :nm_curso,
    'nm_aluno', :nm_aluno,
    'pc_aproveitamento', :pc_aproveitamento,
    'qt_carga_horaria', :qt_carga_horaria
  ),

  now()
);

-- Marcar inscrição como certificada
UPDATE tb_universidade_inscricoes
SET fg_certificado_emitido = true,
    dt_atualizacao = now()
WHERE id_inscricao = :id_inscricao;
```

### 5.4 Notificação e Gamificação

**Passo 7: Enviar Notificação de Certificado Emitido**

```python
# Email com certificado
await enviar_email({
    "destinatario": aluno.email,
    "assunto": "🎓 Seu Certificado está Pronto!",
    "template": "certificado_emitido",
    "dados": {
        "nm_aluno": aluno.nm_nome,
        "nm_curso": curso.nm_titulo,
        "url_download_pdf": certificado.url_pdf,
        "url_visualizar_nft": certificado.url_opensea,
        "cd_verificacao": certificado.cd_verificacao
    },
    "anexos": [certificado.url_pdf]  # PDF anexado
})

# Notificação in-app
await criar_notificacao({
    "id_usuario": id_aluno,
    "ds_titulo": "🎓 Certificado Emitido!",
    "ds_mensagem": f"Seu certificado de '{curso.nm_titulo}' está disponível!",
    "ds_tipo": "certificado",
    "url_acao": f"/universidade/certificados/{certificado.id_certificado}"
})
```

**Passo 8: Creditar XP e Badge**

```python
# Creditar XP bônus por certificação
await creditar_xp(
    id_aluno=id_aluno,
    tipo_acao="certificacao_curso",
    xp_ganho=200,
    id_referencia=id_curso
)

# Desbloquear badge "Certificado"
await verificar_badges(id_aluno, tipo_acao="certificacao")
```

### 5.5 Verificação Pública do Certificado

**Passo 9: Página de Verificação Pública**

```python
# Rota pública (sem autenticação)
@router.get("/verificar/{cd_verificacao}/")
async def verificar_certificado(cd_verificacao: str):
    # Buscar certificado
    certificado = await db.query(
        """SELECT c.*, u.nm_nome, cur.nm_titulo
           FROM tb_universidade_certificados c
           JOIN tb_users u ON c.id_aluno = u.id_usuario
           JOIN tb_universidade_cursos cur ON c.id_curso = cur.id_curso
           WHERE c.cd_verificacao = $1 AND c.fg_ativo = true""",
        cd_verificacao
    )

    if not certificado:
        raise HTTPException(status_code=404, detail="Certificado não encontrado")

    # Verificar na blockchain (se NFT emitido)
    blockchain_verificado = False
    if certificado['fg_nft_emitido']:
        tx_receipt = await verificar_transacao_blockchain(certificado['tx_hash'])
        blockchain_verificado = tx_receipt['status'] == 1

    return {
        "fg_valido": True,
        "aluno": {
            "nm_nome": certificado['nm_nome']
        },
        "curso": {
            "nm_titulo": certificado['nm_titulo'],
            "qt_carga_horaria": certificado['ds_metadata']['qt_carga_horaria']
        },
        "dt_emissao": certificado['dt_emissao'].strftime("%d/%m/%Y"),
        "pc_aproveitamento": certificado['ds_metadata']['pc_aproveitamento'],

        # Blockchain
        "fg_blockchain_verificado": blockchain_verificado,
        "tx_hash": certificado['tx_hash'] if certificado['fg_nft_emitido'] else None,
        "url_explorer": certificado['url_explorer'],
        "url_marketplace": certificado['url_marketplace'],

        # Downloads
        "url_pdf": certificado['url_pdf'],
        "url_imagem": certificado['url_imagem']
    }
```

**Tela de Verificação:**

```html
<!-- https://doctorq.app/verificar/ABC123XYZ -->
<!DOCTYPE html>
<html>
<head>
  <title>Verificação de Certificado - DoctorQ</title>
</head>
<body>
  <div class="verificacao-container">
    <div class="status-badge valido">
      ✓ Certificado Válido
    </div>

    <div class="info-certificado">
      <h1>{{ curso.nm_titulo }}</h1>
      <p class="aluno">Concluído por: <strong>{{ aluno.nm_nome }}</strong></p>
      <p class="data">Emitido em: {{ dt_emissao }}</p>
      <p class="carga">Carga Horária: {{ curso.qt_carga_horaria }}h</p>
      <p class="aproveitamento">Aproveitamento: {{ pc_aproveitamento }}%</p>
    </div>

    {% if fg_blockchain_verificado %}
    <div class="blockchain-seal">
      <img src="/assets/blockchain-verified.svg" alt="Blockchain Verified">
      <h3>🔒 Verificado na Blockchain</h3>
      <p>Este certificado é um NFT verificável na rede Polygon.</p>
      <a href="{{ url_explorer }}" target="_blank">
        Ver na Blockchain ↗
      </a>
      <a href="{{ url_marketplace }}" target="_blank">
        Ver no OpenSea ↗
      </a>
    </div>
    {% endif %}

    <div class="acoes">
      <a href="{{ url_pdf }}" download class="btn-download">
        📄 Baixar PDF
      </a>
      <a href="{{ url_imagem }}" download class="btn-download">
        🖼️ Baixar Imagem
      </a>
    </div>

    <div class="qr-code">
      <img src="/api/qr-code?url={{ request.url }}" alt="QR Code">
      <p>Escaneie para verificar</p>
    </div>
  </div>
</body>
</html>
```

---

## 6. Fluxos Alternativos

### 6.A - Aluno Sem Wallet (Certificado Tradicional)

**Condição:** Aluno não quer configurar wallet Web3

**Fluxo:**
1. Sistema detecta ausência de wallet
2. Exibe modal: "Deseja receber certificado NFT ou apenas PDF?"
3. Se "Apenas PDF":
   - Gera PDF normalmente
   - Marca `fg_nft_emitido = false`
   - Permite reivindicar NFT posteriormente via `/certificados/reivindicar-nft`
4. Se "Configurar Wallet":
   - Redireciona para `/configuracoes/wallet`
   - Instruções de instalação de MetaMask
   - Após configurar, processa NFT

### 6.B - Blockchain Temporariamente Indisponível

**Condição:** Polygon RPC ou IPFS fora do ar

**Fluxo:**
1. Sistema tenta mintar NFT
2. Timeout ou erro de conexão
3. Fallback:
   ```python
   try:
       nft_data = await mintar_certificado_nft(...)
   except BlockchainError as e:
       logger.error(f"Blockchain indisponível: {e}")

       # Marcar para retry
       await criar_fila_retry_nft(id_certificado)

       # Gerar apenas PDF
       url_pdf = await gerar_certificado_pdf(id_aluno, id_curso)

       return {
           "fg_certificado_emitido": True,
           "url_pdf": url_pdf,
           "fg_nft_pendente": True,
           "mensagem": "Certificado PDF gerado. NFT será emitido em breve."
       }
   ```
4. Job cron tenta novamente a cada 1 hora:
   ```python
   # Cron job: retry NFTs pendentes
   async def processar_nfts_pendentes():
       certificados_pendentes = await db.query(
           "SELECT * FROM tb_universidade_certificados WHERE fg_nft_emitido = false AND dt_emissao > now() - INTERVAL '7 days'"
       )

       for cert in certificados_pendentes:
           try:
               nft_data = await mintar_certificado_nft(...)
               await atualizar_certificado_com_nft(cert.id_certificado, nft_data)
               await notificar_nft_emitido(cert.id_aluno, cert.id_certificado)
           except:
               continue  # Tenta na próxima execução
   ```

### 6.C - Emissão de Segunda Via

**Condição:** Aluno perdeu PDF ou quer reemitir

**Fluxo:**
1. Aluno acessa `/universidade/certificados/{id}/reemitir`
2. Sistema verifica se já existe certificado:
   ```sql
   SELECT * FROM tb_universidade_certificados WHERE id_certificado = :id
   ```
3. Se já existe:
   - **PDF:** Permite download novamente (mesmo arquivo)
   - **NFT:** NFT não pode ser "reenviado" (já está na wallet)
   - Exibe link para visualizar NFT no OpenSea
4. Se não existe (caso raro):
   - Regera PDF
   - NFT já está na blockchain (imutável)

### 6.D - Certificado Fraudulento (Detecção)

**Condição:** Verificador detecta código de verificação inválido ou adulterado

**Fluxo:**
1. Verificador acessa `/verificar/CODIGO_FALSO`
2. Sistema busca no banco: não encontrado
3. Retorna status 404:
   ```json
   {
     "fg_valido": false,
     "ds_motivo": "Código de verificação não encontrado",
     "mensagem": "Este certificado não foi emitido pela Universidade da Beleza - DoctorQ. Desconfie de fraudes!"
   }
   ```
4. Tela exibe alerta vermelho: "❌ Certificado Inválido"
5. (Opcional) Sistema registra tentativa de verificação fraudulenta:
   ```sql
   INSERT INTO tb_universidade_tentativas_fraude (
     cd_verificacao_invalido, ip_verificador, dt_tentativa
   ) VALUES (:codigo, :ip, now());
   ```

---

## 7. Fluxos de Exceção

### 7.A - Erro ao Mintar NFT (Gas Fee Alto)

**Erro:** Gas price da Polygon disparou (congestionamento)

**Tratamento:**
```python
MAX_GAS_PRICE = w3.to_wei(100, 'gwei')  # Limite de 100 gwei

gas_price_atual = w3.eth.gas_price

if gas_price_atual > MAX_GAS_PRICE:
    logger.warning(f"Gas price alto: {gas_price_atual}")

    # Adiar mint para horário de menor congestionamento
    await agendar_mint_nft(id_certificado, horario_preferencial='02:00-06:00')

    return {
        "mensagem": "Certificado PDF gerado. NFT será emitido em algumas horas (aguardando melhores condições de rede).",
        "fg_nft_pendente": True
    }
```

### 7.B - Wallet Inválida ou Não-Compatível

**Erro:** Endereço de wallet fornecido é inválido

**Tratamento:**
```python
from web3 import Web3

if not Web3.is_address(wallet_address):
    raise HTTPException(
        status_code=400,
        detail="Endereço de wallet inválido. Verifique e tente novamente."
    )

# Verificar se não é contrato (apenas EOA - Externally Owned Account)
if w3.eth.get_code(wallet_address) != b'':
    raise HTTPException(
        status_code=400,
        detail="Endereço de contrato inteligente não é suportado. Use uma wallet pessoal (MetaMask, Trust Wallet, etc.)."
    )
```

### 7.C - IPFS Upload Falha

**Erro:** Upload de metadata para IPFS retorna erro

**Tratamento:**
```python
try:
    ipfs_hash = await upload_to_ipfs(metadata)
except IPFSError:
    logger.error("IPFS upload failed, using fallback")

    # Fallback: usar S3/CloudFlare R2 como armazenamento
    metadata_url = await upload_metadata_to_s3(metadata)

    # Mintar NFT com URL https:// em vez de ipfs://
    token_uri = metadata_url
```

---

## 8. Regras de Negócio

### RN001 - Critérios de Elegibilidade
- **Regra:** Para emitir certificado, aluno deve ter:
  - `pc_conclusao >= 80%`
  - Todas avaliações obrigatórias concluídas
  - Curso ativo por pelo menos 7 dias (prevenir fraude)
- **Validação:** Verificar antes de gerar certificado

### RN002 - NFTs Não-Transferíveis (Soulbound)
- **Regra:** Certificados NFT não podem ser transferidos entre wallets
- **Implementação:** Smart contract bloqueia transferências (ver `_beforeTokenTransfer`)
- **Objetivo:** Evitar venda de certificados

### RN003 - Limite de Certificados por Curso
- **Regra:** 1 certificado por curso por aluno
- **Validação:** `UNIQUE(id_aluno, id_curso)` em `tb_universidade_certificados`
- **Exceção:** Cursos com "recertificação anual" podem ter múltiplos certificados

### RN004 - Validade Permanente
- **Regra:** Certificados NFT são válidos permanentemente (imutáveis na blockchain)
- **Exceção:** Se curso for descontinuado, certificado continua válido mas com nota explicativa

### RN005 - Gas Fee Pago pelo Sistema
- **Regra:** Aluno NÃO paga gas fee para receber NFT
- **Custo:** Sistema DoctorQ arca com ~$0.01-0.05 por mint na Polygon
- **Budget:** Prever custo de 1000 certificados/mês = $10-50/mês

### RN006 - Revogação de Certificado (Casos Extremos)
- **Regra:** Certificado pode ser revogado apenas em casos de:
  - Fraude comprovada (aluno não completou curso)
  - Violação de ética profissional grave
  - Ordem judicial
- **Implementação:**
  - Marcar `fg_ativo = false` no banco
  - Página de verificação mostra "Certificado Revogado"
  - NFT permanece na blockchain (imutável) mas plataforma não o reconhece

---

## 9. Requisitos Não-Funcionais

### RNF001 - Tempo de Emissão
- Geração de PDF: < 5s
- Mint de NFT: < 60s (incluindo confirmação blockchain)
- Disponibilização ao aluno: < 90s após conclusão

### RNF002 - Custo de Operação
- Gas fee por NFT: < $0.05 (Polygon)
- IPFS storage: ~$0.001/certificado
- Total: < $0.10 por certificado

### RNF003 - Segurança
- Private keys armazenadas em secrets manager (AWS Secrets, HashiCorp Vault)
- Metadata IPFS immutable (hash verificável)
- PDF com QR Code + watermark (anti-falsificação)

### RNF004 - Escalabilidade
- Suportar 1.000 certificados/dia
- Smart contract otimizado para batch minting (se necessário)
- Cache de verificações (Redis) para reduzir queries

### RNF005 - Disponibilidade
- Certificados acessíveis 99.9% do tempo (mesmo se blockchain offline)
- PDF sempre disponível (CDN com múltiplas regiões)
- Fallback para emissão offline

---

## 10. Entidades e Relacionamentos

### Tabelas Principais

#### `tb_universidade_certificados`
```sql
CREATE TABLE tb_universidade_certificados (
  id_certificado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aluno UUID REFERENCES tb_users(id_usuario),
  id_curso UUID REFERENCES tb_universidade_cursos(id_curso),
  id_inscricao UUID REFERENCES tb_universidade_inscricoes(id_inscricao),

  -- Código de verificação único (8-12 caracteres alfanuméricos)
  cd_verificacao VARCHAR(20) UNIQUE NOT NULL,

  -- Arquivos
  url_pdf VARCHAR(500) NOT NULL,
  url_imagem VARCHAR(500), -- PNG/JPG do certificado para redes sociais

  -- Blockchain (NFT)
  fg_nft_emitido BOOLEAN DEFAULT false,
  tx_hash VARCHAR(100), -- Hash da transação na blockchain
  token_id BIGINT, -- ID do token NFT
  nm_network VARCHAR(50) DEFAULT 'Polygon', -- "Polygon", "Ethereum", etc.
  wallet_address VARCHAR(100), -- Endereço da wallet do aluno
  url_explorer VARCHAR(500), -- Link para Polygonscan
  url_marketplace VARCHAR(500), -- Link para OpenSea
  ipfs_hash VARCHAR(100), -- Hash do metadata no IPFS

  -- Metadata do certificado (JSON)
  ds_metadata JSONB NOT NULL,
  /* Exemplo:
  {
    "nm_curso": "Microblading Avançado",
    "nm_aluno": "João Silva",
    "pc_aproveitamento": 95.5,
    "qt_carga_horaria": 40,
    "nm_instrutor": "Dra. Maria Silva",
    "dt_conclusao": "2025-11-13"
  }
  */

  -- Auditoria
  dt_emissao TIMESTAMP DEFAULT now(),
  fg_ativo BOOLEAN DEFAULT true, -- Pode ser revogado
  ds_motivo_revogacao TEXT,
  dt_revogacao TIMESTAMP,

  UNIQUE(id_aluno, id_curso) -- 1 certificado por curso por aluno
);

CREATE INDEX idx_certificado_aluno ON tb_universidade_certificados(id_aluno);
CREATE INDEX idx_certificado_curso ON tb_universidade_certificados(id_curso);
CREATE INDEX idx_certificado_verificacao ON tb_universidade_certificados(cd_verificacao);
CREATE INDEX idx_certificado_wallet ON tb_universidade_certificados(wallet_address);
```

#### `tb_universidade_tentativas_fraude`
```sql
CREATE TABLE tb_universidade_tentativas_fraude (
  id_tentativa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cd_verificacao_invalido VARCHAR(20),
  ip_verificador VARCHAR(50),
  ds_user_agent TEXT,
  ds_referer VARCHAR(500),

  dt_tentativa TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_fraude_codigo ON tb_universidade_tentativas_fraude(cd_verificacao_invalido);
CREATE INDEX idx_fraude_ip ON tb_universidade_tentativas_fraude(ip_verificador);
CREATE INDEX idx_fraude_data ON tb_universidade_tentativas_fraude(dt_tentativa DESC);
```

#### Modificação em `tb_universidade_ranking`
```sql
ALTER TABLE tb_universidade_ranking
ADD COLUMN wallet_address VARCHAR(100) UNIQUE,
ADD COLUMN dt_wallet_configurada TIMESTAMP;

CREATE INDEX idx_ranking_wallet ON tb_universidade_ranking(wallet_address);
```

---

## 11. Endpoints da API

### POST `/universidade/certificados/emitir/`
**Descrição:** Emitir certificado de conclusão de curso

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "id_curso": "uuid",
  "fg_nft": true // Se false, gera apenas PDF
}
```

**Response 201:**
```json
{
  "id_certificado": "uuid",
  "cd_verificacao": "ABC123XYZ",
  "url_pdf": "https://cdn.doctorq.app/certificados/...",
  "url_imagem": "https://cdn.doctorq.app/certificados/...",
  "fg_nft_emitido": true,
  "nft": {
    "tx_hash": "0xabc123...",
    "token_id": 42,
    "network": "Polygon",
    "url_explorer": "https://polygonscan.com/tx/0xabc123...",
    "url_opensea": "https://opensea.io/assets/matic/0x.../42"
  },
  "mensagem": "🎉 Certificado emitido com sucesso!"
}
```

**Response 400 (Não Elegível):**
```json
{
  "erro": "Curso não concluído",
  "detalhes": {
    "pc_conclusao": 75.5,
    "pc_minimo": 80.0,
    "qt_avaliacoes_faltantes": 2
  },
  "mensagem": "Você precisa completar 80% do curso e todas as avaliações obrigatórias."
}
```

### GET `/universidade/certificados/meus/`
**Descrição:** Listar certificados do aluno

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "certificados": [
    {
      "id_certificado": "uuid",
      "curso": {
        "nm_titulo": "Microblading Avançado",
        "url_thumbnail": "..."
      },
      "cd_verificacao": "ABC123XYZ",
      "dt_emissao": "2025-11-13T10:30:00Z",
      "pc_aproveitamento": 95.5,
      "url_pdf": "...",
      "url_imagem": "...",
      "fg_nft_emitido": true,
      "nft": {
        "token_id": 42,
        "url_opensea": "..."
      }
    }
  ]
}
```

### GET `/verificar/{cd_verificacao}/`
**Descrição:** Verificar autenticidade de certificado (rota pública)

**Response:**
```json
{
  "fg_valido": true,
  "aluno": {
    "nm_nome": "João Silva"
  },
  "curso": {
    "nm_titulo": "Microblading Avançado",
    "qt_carga_horaria": 40
  },
  "dt_emissao": "13/11/2025",
  "pc_aproveitamento": 95.5,
  "fg_blockchain_verificado": true,
  "tx_hash": "0xabc123...",
  "url_explorer": "https://polygonscan.com/tx/...",
  "url_marketplace": "https://opensea.io/assets/...",
  "url_pdf": "...",
  "url_imagem": "..."
}
```

### POST `/universidade/configuracoes/wallet/`
**Descrição:** Configurar wallet Web3 do aluno

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
}
```

**Response 200:**
```json
{
  "mensagem": "Wallet configurada com sucesso!",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
  "fg_certificados_pendentes": true,
  "qt_certificados_pendentes": 2
}
```

### POST `/universidade/certificados/{id}/reivindicar-nft/`
**Descrição:** Reivindicar NFT de certificado já emitido (só PDF)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response 200:**
```json
{
  "mensagem": "NFT mintado com sucesso!",
  "nft": {
    "tx_hash": "0xabc123...",
    "token_id": 42,
    "url_opensea": "..."
  }
}
```

---

## 12. Telas e Wireframes

### Tela 1: Modal de Conclusão do Curso

**Layout:**
```
+----------------------------------------------------------+
|                     [Confetti Animation] 🎉              |
|                                                            |
|                  🎓 PARABÉNS! 🎓                           |
|                                                            |
|          Você concluiu o curso                             |
|          "Microblading Avançado"                           |
|                                                            |
|          Aproveitamento: 95.5%                             |
|          Carga Horária: 40 horas                           |
|                                                            |
|          [🏆 Emitir Certificado]                           |
|          [📊 Ver Estatísticas]                             |
|                                                            |
+----------------------------------------------------------+
```

### Tela 2: Página de Certificado

**Layout:**
```
+----------------------------------------------------------+
|  [Navbar]                                                  |
+----------------------------------------------------------+
|  🎓 Meu Certificado - Microblading Avançado               |
|                                                            |
|  +----------------------------------------------------+   |
|  | [Preview do Certificado PDF]                       |   |
|  |                                                    |   |
|  | CERTIFICADO DE CONCLUSÃO                           |   |
|  | Certificamos que João Silva...                     |   |
|  | [...]                                              |   |
|  +----------------------------------------------------+   |
|                                                            |
|  ✓ Verificado na Blockchain Polygon                       |
|  Transaction: 0xabc123...def456                            |
|  Token ID: #42                                             |
|                                                            |
|  +--------------------------------------------------+     |
|  | 📄 Baixar PDF                                    |     |
|  | 🖼️ Baixar Imagem (compartilhar em redes sociais)|     |
|  | 🔗 Copiar Link de Verificação                    |     |
|  | 🌐 Ver no OpenSea                                |     |
|  | 🔍 Ver na Blockchain (Polygonscan)               |     |
|  +--------------------------------------------------+     |
|                                                            |
|  Código de Verificação: ABC123XYZ                         |
|  Compartilhe: https://doctorq.app/verificar/ABC123XYZ     |
|                                                            |
|  [QR Code]                                                 |
+----------------------------------------------------------+
```

### Tela 3: Configuração de Wallet

**Layout:**
```
+----------------------------------------------------------+
|  [Navbar]                                                  |
+----------------------------------------------------------+
|  🔒 Configurar Wallet Web3                                |
|                                                            |
|  Para receber certificados NFT verificáveis na blockchain, |
|  você precisa de uma carteira digital.                     |
|                                                            |
|  O que é uma Wallet?                                       |
|  Uma wallet (carteira) é como uma conta bancária digital   |
|  que armazena seus NFTs e criptomoedas.                    |
|                                                            |
|  +--------------------------------------------------+     |
|  | Opção 1: Usar MetaMask (Recomendado)            |     |
|  |                                                  |     |
|  | [🦊 Conectar MetaMask]                           |     |
|  |                                                  |     |
|  | Não tem MetaMask?                                |     |
|  | [📥 Instalar MetaMask]                           |     |
|  +--------------------------------------------------+     |
|                                                            |
|  +--------------------------------------------------+     |
|  | Opção 2: Inserir Endereço Manualmente           |     |
|  |                                                  |     |
|  | Wallet Address (0x...):                          |     |
|  | [____________________________________________]   |     |
|  |                                                  |     |
|  | [Salvar]                                         |     |
|  +--------------------------------------------------+     |
|                                                            |
|  ❓ Precisa de ajuda? [Assistir Tutorial em Vídeo]        |
+----------------------------------------------------------+
```

### Tela 4: Página de Verificação Pública

**Layout:**
```
+----------------------------------------------------------+
|  [Logo DoctorQ]                    Verificar Certificado  |
+----------------------------------------------------------+
|                                                            |
|                  ✓ CERTIFICADO VÁLIDO                      |
|                                                            |
|  +----------------------------------------------------+   |
|  | Microblading Avançado                              |   |
|  | Concluído por: João Silva                          |   |
|  | Emitido em: 13/11/2025                             |   |
|  | Carga Horária: 40 horas                            |   |
|  | Aproveitamento: 95.5%                              |   |
|  +----------------------------------------------------+   |
|                                                            |
|  🔒 Blockchain Verified                                   |
|  Este certificado é um NFT verificável na rede Polygon.    |
|                                                            |
|  Transaction Hash: 0xabc123...def456                       |
|  [Ver na Blockchain ↗]  [Ver no OpenSea ↗]                |
|                                                            |
|  +--------------------------------------------------+     |
|  | [📄 Baixar PDF]  [🖼️ Baixar Imagem]             |     |
|  +--------------------------------------------------+     |
|                                                            |
|  [QR Code para verificação]                                |
|                                                            |
|  Emitido por: Universidade da Beleza - DoctorQ             |
+----------------------------------------------------------+
```

---

## 13. Critérios de Aceitação

### ✅ Funcionalidades Obrigatórias

1. **Geração de Certificado**
   - [ ] PDF gerado com design profissional
   - [ ] Código de verificação único (8-12 caracteres)
   - [ ] QR Code aponta para URL de verificação
   - [ ] Metadata correta (nome, curso, data, aproveitamento)

2. **NFT na Blockchain**
   - [ ] NFT mintado na Polygon (gas fee < $0.05)
   - [ ] Metadata no IPFS (immutable)
   - [ ] Transaction confirmada em < 60s
   - [ ] Link do OpenSea funcional

3. **Verificação Pública**
   - [ ] Página de verificação acessível sem login
   - [ ] Status blockchain verificado (tx_hash válido)
   - [ ] Certificados inválidos retornam 404
   - [ ] QR Code scannável

4. **Segurança**
   - [ ] NFTs não-transferíveis (soulbound)
   - [ ] Private keys em secrets manager
   - [ ] Certificados duplicados bloqueados

5. **UX**
   - [ ] Configuração de wallet fácil (MetaMask)
   - [ ] Download de PDF imediato
   - [ ] Compartilhamento em redes sociais (imagem otimizada)

---

## 14. Histórico de Revisões

| Versão | Data       | Autor           | Descrição                 |
|--------|------------|-----------------|---------------------------|
| 1.0    | 13/11/2025 | Sistema DoctorQ | Criação inicial do UC004  |

---

**Documento gerado como parte do projeto DoctorQ - Universidade da Beleza**
