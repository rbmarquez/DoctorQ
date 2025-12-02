# src/utils/security.py
import os
from datetime import datetime, timedelta
from typing import Optional

import jwt
from passlib.context import CryptContext

from src.config.logger_config import get_logger

logger = get_logger(__name__)

# Configuração de hashing de senha
# Usa pbkdf2_sha256 como padrão (evita problemas de compatibilidade do bcrypt)
# bcrypt tem problemas com a biblioteca em algumas versões do Python 3.12+
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"],
    default="pbkdf2_sha256",
    deprecated="auto",
    pbkdf2_sha256__default_rounds=30000,
)


def hash_password(plain_password: str) -> str:
    """Gera hash seguro para senha."""
    # Bcrypt tem limite de 72 bytes - truncar se necessário
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verifica senha contra hash armazenado."""
    try:
        # Bcrypt tem limite de 72 bytes - truncar se necessário (deve corresponder ao hash)
        if len(plain_password.encode('utf-8')) > 72:
            plain_password = plain_password[:72]
        return pwd_context.verify(plain_password, password_hash)
    except Exception:
        return False


def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[dict] = None,
) -> str:
    """Cria JWT assinado para autenticação local."""
    secret_key = os.getenv("JWT_SECRET", "inovaia-dev-secret")
    algorithm = os.getenv("JWT_ALG", "HS256")
    expire_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "120"))

    to_encode = {"sub": subject, "iat": datetime.utcnow()}
    if additional_claims:
        to_encode.update(additional_claims)

    if expires_delta is None:
        expires_delta = timedelta(minutes=expire_minutes)
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})

    token = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return token


def decode_access_token(token: str) -> Optional[dict]:
    """Decodifica e valida JWT, retorna claims ou None."""
    secret_key = os.getenv("JWT_SECRET", "inovaia-dev-secret")
    algorithms = [os.getenv("JWT_ALG", "HS256")]
    try:
        payload = jwt.decode(token, secret_key, algorithms=algorithms)
        logger.info(f"✅ JWT decodificado com sucesso: sub={payload.get('sub')}, uid={payload.get('uid')}, role={payload.get('role')}")
        return payload
    except Exception as e:
        logger.warning(f"❌ JWT inválido - token preview: {token[:30]}..., erro: {e}")
        return None