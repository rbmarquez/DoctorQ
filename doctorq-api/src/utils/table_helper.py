"""
Helper para reflection de tabelas com AsyncSession
"""

from sqlalchemy import Table, MetaData
from sqlalchemy.ext.asyncio import AsyncSession


async def get_table(db: AsyncSession, table_name: str) -> Table:
    """
    Obtém uma Table com reflection usando AsyncSession corretamente

    Args:
        db: AsyncSession
        table_name: Nome da tabela

    Returns:
        Table object com colunas refletidas
    """
    metadata = MetaData()

    # Usar run_sync para reflection
    def reflect_table(conn):
        table = Table(table_name, metadata, autoload_with=conn)
        return table

    # Executar reflection de forma síncrona dentro do async
    async with db.begin():
        table = await db.connection(lambda conn: conn.run_sync(reflect_table))

    return table


async def get_tables(db: AsyncSession, *table_names: str) -> dict:
    """
    Obtém múltiplas tables com reflection

    Args:
        db: AsyncSession
        table_names: Nomes das tabelas

    Returns:
        Dict com {nome: Table}
    """
    metadata = MetaData()

    def reflect_tables(conn):
        tables = {}
        for name in table_names:
            tables[name] = Table(name, metadata, autoload_with=conn)
        return tables

    # Executar reflection de forma síncrona dentro do async
    tables = await db.run_sync(reflect_tables)

    return tables
