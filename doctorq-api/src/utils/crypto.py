# src/services/crypto_service.py
import base64
import hashlib
import json
import os
import sys
from typing import Any, Dict

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from src.config.logger_config import get_logger

# Configurar logger
logger = get_logger(__name__)


class CryptoService:
    """ServiÃ§o de criptografia centralizado com AES-256-CBC e tratamento de erros crÃ­ticos"""

    def __init__(self):
        self._key = None
        self._initialize_encryption()

    def _initialize_encryption(self):
        """Inicializa o serviÃ§o de criptografia AES com validaÃ§Ã£o rigorosa"""

        # Validar variÃ¡vel de ambiente
        key_env = os.getenv("DATA_ENCRYPTION_KEY")
        if not key_env:
            error_msg = (
                "ERRO CRÃTICO: VariÃ¡vel de ambiente DATA_ENCRYPTION_KEY nÃ£o configurada"
            )
            logger.critical(error_msg)
            logger.critical(
                "APLICAÃ‡ÃƒO SERÃ ENCERRADA - ConfiguraÃ§Ã£o de seguranÃ§a obrigatÃ³ria"
            )
            sys.exit(1)

        # Validar formato da chave
        if not isinstance(key_env, str):
            error_msg = "ERRO CRÃTICO: DATA_ENCRYPTION_KEY deve ser uma string"
            logger.critical(error_msg)
            logger.critical("APLICAÃ‡ÃƒO SERÃ ENCERRADA - Formato de chave invÃ¡lido")
            sys.exit(1)

        # Derivar chave de 32 bytes (256 bits) para AES-256
        try:
            # Usar SHA-256 para derivar uma chave de tamanho fixo
            self._key = hashlib.sha256(key_env.encode("utf-8")).digest()

            # Teste de funcionamento
            test_data = "test_encryption_aes"
            encrypted = self._encrypt_bytes(test_data.encode("utf-8"))
            decrypted = self._decrypt_bytes(encrypted).decode("utf-8")

            if decrypted != test_data:
                raise ValueError("Teste de criptografia/descriptografia AES falhou")

        except Exception as e:
            error_msg = f"ERRO CRÃTICO: Falha ao inicializar AES: {e}"
            logger.critical(error_msg)
            logger.critical(
                "Dica: A chave pode ser qualquer string, serÃ¡ derivada com SHA-256"
            )
            logger.critical(
                "APLICAÃ‡ÃƒO SERÃ ENCERRADA - ConfiguraÃ§Ã£o de criptografia invÃ¡lida"
            )
            sys.exit(1)

    def _generate_iv(self) -> bytes:
        """Gera um IV aleatÃ³rio de 16 bytes para AES"""
        return os.urandom(16)

    def _encrypt_bytes(self, data: bytes) -> bytes:
        """
        Criptografa dados em bytes usando AES-256-CBC

        Args:
            data: Dados em bytes para criptografar

        Returns:
            IV + dados criptografados
        """
        # Gerar IV aleatÃ³rio
        iv = self._generate_iv()

        # Aplicar padding PKCS7
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(data)
        padded_data += padder.finalize()

        # Criptografar
        cipher = Cipher(
            algorithms.AES(self._key), modes.CBC(iv), backend=default_backend()
        )
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()

        # Retornar IV + ciphertext
        return iv + ciphertext

    def _decrypt_bytes(self, encrypted_data: bytes) -> bytes:
        """
        Descriptografa dados em bytes usando AES-256-CBC

        Args:
            encrypted_data: IV + dados criptografados

        Returns:
            Dados originais
        """
        # Extrair IV (primeiros 16 bytes)
        iv = encrypted_data[:16]
        ciphertext = encrypted_data[16:]

        # Descriptografar
        cipher = Cipher(
            algorithms.AES(self._key), modes.CBC(iv), backend=default_backend()
        )
        decryptor = cipher.decryptor()
        padded_data = decryptor.update(ciphertext) + decryptor.finalize()

        # Remover padding PKCS7
        unpadder = padding.PKCS7(128).unpadder()
        data = unpadder.update(padded_data)
        data += unpadder.finalize()

        return data

    def encrypt_text(self, plain_text: str) -> str:
        """
        Criptografa texto simples usando AES-256-CBC

        Args:
            plain_text: Texto a ser criptografado

        Returns:
            Token criptografado em base64

        Raises:
            ValueError: Se o texto for invÃ¡lido
            RuntimeError: Se houver erro na criptografia
        """
        if not isinstance(plain_text, str):
            error_msg = "Texto deve ser uma string"
            logger.error(f"encrypt_text: {error_msg}")
            raise ValueError(error_msg)

        if not plain_text:
            logger.warning("encrypt_text: Tentativa de criptografar texto vazio")
            return ""

        try:
            # Converter para bytes e criptografar
            data_bytes = plain_text.encode("utf-8")
            encrypted_bytes = self._encrypt_bytes(data_bytes)

            # Codificar em base64
            token_str = base64.b64encode(encrypted_bytes).decode("utf-8")
            return token_str

        except Exception as e:
            error_msg = f"Erro ao criptografar texto: {e}"
            logger.error(f"encrypt_text: {error_msg}", exc_info=True)
            raise RuntimeError(error_msg) from e

    def decrypt_text(self, token_str: str) -> str:
        """
        Descriptografa token usando AES-256-CBC

        Args:
            token_str: Token criptografado em base64

        Returns:
            Texto original

        Raises:
            ValueError: Se o token for invÃ¡lido
            RuntimeError: Se houver erro na descriptografia
        """
        if not isinstance(token_str, str):
            error_msg = "Token deve ser uma string"
            logger.error(f"decrypt_text: {error_msg}")
            raise ValueError(error_msg)

        if not token_str:
            logger.warning("decrypt_text: Tentativa de descriptografar token vazio")
            return ""

        try:
            # Decodificar base64
            encrypted_bytes = base64.b64decode(token_str)

            # Verificar tamanho mÃ­nimo (IV + pelo menos 1 bloco)
            if len(encrypted_bytes) < 32:  # 16 bytes IV + 16 bytes mÃ­nimo
                raise ValueError("Token muito pequeno para ser vÃ¡lido")

            # Descriptografar
            data_bytes = self._decrypt_bytes(encrypted_bytes)
            text = data_bytes.decode("utf-8")
            return text

        except (ValueError, UnicodeDecodeError) as e:
            error_msg = f"Token invÃ¡lido ou chave incorreta: {e}"
            logger.warning(f"decrypt_text: {error_msg}")
            raise ValueError(error_msg) from e

        except Exception as e:
            error_msg = f"Erro inesperado ao descriptografar: {e}"
            logger.error(f"decrypt_text: {error_msg}", exc_info=True)
            raise RuntimeError(error_msg) from e

    def encrypt_json(self, obj: Dict[str, Any]) -> str:
        """
        Serializa objeto para JSON e criptografa

        Args:
            obj: DicionÃ¡rio para criptografar

        Returns:
            Token criptografado em base64

        Raises:
            ValueError: Se o objeto for invÃ¡lido
            RuntimeError: Se houver erro na serializaÃ§Ã£o/criptografia
        """
        if not isinstance(obj, dict):
            error_msg = "Objeto deve ser um dicionÃ¡rio"
            logger.error(f"encrypt_json: {error_msg}")
            raise ValueError(error_msg)

        try:
            # Serializar JSON de forma compacta
            json_str = json.dumps(obj, separators=(",", ":"), ensure_ascii=False)
            token = self.encrypt_text(json_str)
            return token

        except (TypeError, ValueError) as e:
            error_msg = f"Erro ao serializar JSON: {e}"
            logger.error(f"encrypt_json: {error_msg}")
            raise ValueError(error_msg) from e

        except Exception as e:
            error_msg = f"Erro inesperado ao criptografar JSON: {e}"
            logger.error(f"encrypt_json: {error_msg}", exc_info=True)
            raise RuntimeError(error_msg) from e

    def decrypt_json(self, token_str: str) -> Dict[str, Any]:
        """
        Descriptografa token e deserializa JSON

        Args:
            token_str: Token criptografado em base64

        Returns:
            DicionÃ¡rio original

        Raises:
            ValueError: Se o token for invÃ¡lido ou JSON mal formado
            RuntimeError: Se houver erro na descriptografia/deserializaÃ§Ã£o
        """
        if not isinstance(token_str, str):
            error_msg = "Token deve ser uma string"
            logger.error(f"decrypt_json: {error_msg}")
            raise ValueError(error_msg)

        try:
            json_str = self.decrypt_text(token_str)
            obj = json.loads(json_str)

            if not isinstance(obj, dict):
                error_msg = "JSON descriptografado nÃ£o Ã© um dicionÃ¡rio"
                logger.error(f"decrypt_json: {error_msg}")
                raise ValueError(error_msg)
            return obj

        except json.JSONDecodeError as e:
            error_msg = f"JSON mal formado apÃ³s descriptografia: {e}"
            logger.error(f"decrypt_json: {error_msg}")
            raise ValueError(error_msg) from e

        except ValueError:
            # JÃ¡ logado em decrypt_text ou acima
            raise

        except Exception as e:
            error_msg = f"Erro inesperado ao descriptografar JSON: {e}"
            logger.error(f"decrypt_json: {error_msg}", exc_info=True)
            raise RuntimeError(error_msg) from e

    def encrypt_cryptojs_compatible(self, plain_text: str, password: str) -> str:
        """
        Criptografa texto de forma compatÃ­vel com CryptoJS

        Args:
            plain_text: Texto para criptografar
            password: Senha para derivaÃ§Ã£o da chave

        Returns:
            String em base64 com prefixo "Salted__"
        """
        try:
            # Gerar salt aleatÃ³rio
            salt = os.urandom(8)

            # Derivar chave e IV como CryptoJS faz
            key_iv = self._derive_key_and_iv_cryptojs(password.encode("utf-8"), salt)
            key = key_iv[:32]  # 256 bits para AES-256
            iv = key_iv[32:48]  # 128 bits para IV

            # Aplicar padding PKCS7
            padder = padding.PKCS7(128).padder()
            padded_data = padder.update(plain_text.encode("utf-8"))
            padded_data += padder.finalize()

            # Criptografar
            cipher = Cipher(
                algorithms.AES(key), modes.CBC(iv), backend=default_backend()
            )
            encryptor = cipher.encryptor()
            ciphertext = encryptor.update(padded_data) + encryptor.finalize()

            # Montar formato CryptoJS: "Salted__" + salt + ciphertext
            salted_prefix = b"Salted__"
            result = salted_prefix + salt + ciphertext

            return base64.b64encode(result).decode("utf-8")

        except Exception as e:
            error_msg = f"Erro ao criptografar compatÃ­vel com CryptoJS: {e}"
            logger.error(f"encrypt_cryptojs_compatible: {error_msg}")
            raise RuntimeError(error_msg) from e

    def decrypt_cryptojs_compatible(self, encrypted_data: str, password: str) -> str:
        """
        Descriptografa dados compatÃ­veis com CryptoJS

        Args:
            encrypted_data: String em base64 criptografada
            password: Senha para descriptografia

        Returns:
            Texto original
        """
        try:
            # Decodificar Base64
            encrypted_bytes = base64.b64decode(encrypted_data)

            # Verificar prefixo "Salted__"
            salted_prefix = b"Salted__"
            if not encrypted_bytes.startswith(salted_prefix):
                raise ValueError("Dados nÃ£o possuem o prefixo 'Salted__'")

            # Extrair salt e ciphertext
            salt = encrypted_bytes[8:16]
            ciphertext = encrypted_bytes[16:]

            # Derivar chave e IV
            key_iv = self._derive_key_and_iv_cryptojs(password.encode("utf-8"), salt)
            key = key_iv[:32]  # 256 bits
            iv = key_iv[32:48]  # 128 bits

            # Descriptografar
            cipher = Cipher(
                algorithms.AES(key), modes.CBC(iv), backend=default_backend()
            )
            decryptor = cipher.decryptor()
            padded_data = decryptor.update(ciphertext) + decryptor.finalize()

            # Remover padding PKCS7
            unpadder = padding.PKCS7(128).unpadder()
            data = unpadder.update(padded_data)
            data += unpadder.finalize()

            return data.decode("utf-8")

        except Exception as e:
            error_msg = f"Erro ao descriptografar compatÃ­vel com CryptoJS: {e}"
            logger.error(f"decrypt_cryptojs_compatible: {error_msg}")
            raise RuntimeError(error_msg) from e

    def _derive_key_and_iv_cryptojs(self, password: bytes, salt: bytes) -> bytes:
        """
        Deriva chave e IV usando o mesmo mÃ©todo do CryptoJS (EVP_BytesToKey)
        """
        key_iv = b""
        prev = b""

        while len(key_iv) < 48:  # 32 bytes key + 16 bytes IV
            prev = hashlib.md5(prev + password + salt).digest()
            key_iv += prev

        return key_iv


# InstÃ¢ncia global do serviÃ§o
_CRYPTO_SERVICE = None


def get_crypto_service() -> CryptoService:
    """
    ObtÃ©m a instÃ¢ncia global do serviÃ§o de criptografia

    Returns:
        InstÃ¢ncia do CryptoService
    """
    # pylint: disable=global-statement
    global _CRYPTO_SERVICE
    if _CRYPTO_SERVICE is None:
        _CRYPTO_SERVICE = CryptoService()
    return _CRYPTO_SERVICE


# FunÃ§Ãµes de conveniÃªncia para compatibilidade
def encrypt_text(plain_text: str) -> str:
    """FunÃ§Ã£o de conveniÃªncia para criptografar texto"""
    return get_crypto_service().encrypt_text(plain_text)


def decrypt_text(token_str: str) -> str:
    """FunÃ§Ã£o de conveniÃªncia para descriptografar texto"""
    return get_crypto_service().decrypt_text(token_str)


def encrypt_json(obj: Dict[str, Any]) -> str:
    """FunÃ§Ã£o de conveniÃªncia para criptografar JSON"""
    return get_crypto_service().encrypt_json(obj)


def decrypt_json(token_str: str) -> Dict[str, Any]:
    """FunÃ§Ã£o de conveniÃªncia para descriptografar JSON"""
    return get_crypto_service().decrypt_json(token_str)


def decrypt_cryptojs(encrypted_data: str, password: str) -> str:
    """FunÃ§Ã£o de conveniÃªncia para descriptografar dados do CryptoJS"""
    return get_crypto_service().decrypt_cryptojs_compatible(encrypted_data, password)
