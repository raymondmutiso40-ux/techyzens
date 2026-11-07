import logging
import ssl
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

def get_engine_args(url: str):
    if "sqlite" in url:
        return {"connect_args": {"check_same_thread": False}}
    elif "postgresql" in url:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return {"connect_args": {"ssl": ctx}}
    return {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    **get_engine_args(settings.DATABASE_URL)
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

def switch_to_sqlite():
    global engine, AsyncSessionLocal
    fallback_url = f"sqlite+aiosqlite:///{settings.STORAGE_DIR}/bid_desk.db"
    settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    engine = create_async_engine(fallback_url, echo=settings.DEBUG, future=True, connect_args={"check_same_thread": False})
    AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)
    return fallback_url

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    global engine, AsyncSessionLocal
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"Database initialized with URL: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    except Exception as exc:
        if "postgresql" in settings.DATABASE_URL:
            logger.warning(
                f"PostgreSQL connection to {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'target'} failed ({exc}). "
                f"Falling back to local SQLite database so server can start."
            )
            fallback_url = switch_to_sqlite()
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info(f"Fallback SQLite database initialized successfully at {fallback_url}")
        else:
            raise exc
