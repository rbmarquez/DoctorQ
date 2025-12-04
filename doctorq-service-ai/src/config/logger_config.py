# src/config/logger_config.py
import logging
import os
import sys
from logging.handlers import RotatingFileHandler

import colorlog
from dotenv import load_dotenv

load_dotenv(override=True)


class LoggerConfig:
    """ConfiguraÃ§Ã£o centralizada de logging"""

    def __init__(self):
        self.log_level = self._get_log_level()
        self.log_format = self._get_log_format()
        self.date_format = self._get_date_format()
        self.enable_file_logging = self._get_file_logging_enabled()
        self.log_file_path = self._get_log_file_path()
        self.max_file_size = self._get_max_file_size()
        self.backup_count = self._get_backup_count()

        # Configurar logging global
        self._setup_logging()

    def _get_log_level(self) -> int:
        """Obter nÃ­vel de log das variÃ¡veis de ambiente"""
        level_str = os.getenv("LOG_LEVEL", "INFO").upper()
        return getattr(logging, level_str, logging.INFO)

    def _get_log_format(self) -> str:
        """Formato das mensagens de log"""
        return os.getenv(
            "LOG_FORMAT", "%(asctime)s - %(levelname)s - %(name)s - %(message)s"
        )

    def _get_date_format(self) -> str:
        """Formato da data nos logs"""
        return os.getenv("LOG_DATE_FORMAT", "%Y-%m-%d %H:%M:%S")

    def _get_file_logging_enabled(self) -> bool:
        """Verificar se logging em arquivo estÃ¡ habilitado"""
        return os.getenv("LOG_FILE_ENABLED", "false").lower() == "true"

    def _get_log_file_path(self) -> str:
        """Caminho do arquivo de log"""
        return os.getenv("LOG_FILE_PATH", "/app/logs/app.log")

    def _get_max_file_size(self) -> int:
        """Tamanho mÃ¡ximo do arquivo de log em bytes"""
        try:
            # 10MB
            return int(os.getenv("LOG_MAX_FILE_SIZE", str(10 * 1024 * 1024)))
        except ValueError:
            return 10 * 1024 * 1024

    def _get_backup_count(self) -> int:
        """NÃºmero de arquivos de backup"""
        try:
            return int(os.getenv("LOG_BACKUP_COUNT", "5"))
        except ValueError:
            return 5

    def _setup_logging(self):
        """Configurar o sistema de logging global"""
        for handler in logging.root.handlers[:]:
            logging.root.removeHandler(handler)

        # Cria formatter colorido
        color_formatter = colorlog.ColoredFormatter(
            fmt="%(log_color)s%(asctime)s - %(levelname)s - %(name)s - %(message)s",
            datefmt=self.date_format,
            log_colors={
                "DEBUG": "cyan",
                "INFO": "green",
                "WARNING": "yellow",
                "ERROR": "red",
                "CRITICAL": "bold_red",
            },
        )

        # Configura handler para stdout com cores
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(color_formatter)

        # Configurar logging bÃ¡sico
        # Configura o root logger com o handler colorido
        logging.basicConfig(
            level=self.log_level,
            handlers=[console_handler],
            force=True,
        )

        # Adicionar handler para arquivo se habilitado
        if self.enable_file_logging:
            self._setup_file_handler()

        # Configurar loggers especÃ­ficos
        self._configure_specific_loggers()

    def _setup_file_handler(self):
        """Configurar handler para arquivo de log"""
        try:
            # Criar diretÃ³rio se nÃ£o existir
            os.makedirs(os.path.dirname(self.log_file_path), exist_ok=True)

            # Criar handler rotativo
            file_handler = RotatingFileHandler(
                self.log_file_path,
                maxBytes=self.max_file_size,
                backupCount=self.backup_count,
                encoding="utf-8",
            )

            file_handler.setFormatter(
                logging.Formatter(fmt=self.log_format, datefmt=self.date_format)
            )

            # Adicionar ao root logger
            logging.getLogger().addHandler(file_handler)

        except (OSError, PermissionError, ValueError) as e:
            print(f"Erro ao configurar logging em arquivo: {e}")

    def _configure_specific_loggers(self):
        """Configurar loggers especÃ­ficos"""
        # Silenciar logs muito verbosos
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logging.getLogger("python_multipart").setLevel(
            logging.WARNING
        )  # Silenciar logs verbose de upload
        logging.getLogger("python_multipart.multipart").setLevel(
            logging.WARNING
        )  # Silenciar logs especÃ­ficos do multipart

        # OpenAI - silenciar logs de debug que mostram API keys
        openai_log_level = os.getenv("OPENAI_LOG_LEVEL", "WARNING").upper()
        openai_level = getattr(logging, openai_log_level, logging.WARNING)

        logging.getLogger("openai").setLevel(openai_level)
        logging.getLogger("openai._base_client").setLevel(openai_level)
        logging.getLogger("azure.core.pipeline").setLevel(openai_level)

        # Azure OpenAI especÃ­fico
        logging.getLogger("azure.core").setLevel(logging.WARNING)
        logging.getLogger("azure.identity").setLevel(logging.WARNING)

        # SQLAlchemy - mostrar apenas warnings e erros
        if os.getenv("SQL_DEBUG", "false").lower() != "true":
            logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
            logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)

        # Uvicorn - manter informativo
        logging.getLogger("uvicorn.access").setLevel(logging.INFO)
        logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    def get_logger(self, name: str) -> logging.Logger:
        """Obter logger configurado"""
        return logging.getLogger(name)

    def log_startup_info(self):
        """Log informaÃ§Ãµes de inicializaÃ§Ã£o"""
        logger = self.get_logger("logger_config")
        logger.debug("Sistema de logging inicializado")

        if self.enable_file_logging:
            logger.debug("Arquivo de log: %s", self.log_file_path)


# InstÃ¢ncia global
logger_config = LoggerConfig()


def get_logger(name: str) -> logging.Logger:
    """FunÃ§Ã£o helper para obter logger"""
    return logger_config.get_logger(name)


def is_debug_level() -> bool:
    """Verificar se o nÃ­vel de log estÃ¡ configurado como DEBUG"""
    return logger_config.log_level == logging.DEBUG
