import logging
import ssl

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _sqlite_fallback_url() -> str:
    settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    return f"sqlite+aiosqlite:///{settings.STORAGE_DIR / 'bid_desk.db'}"


def _get_database_url() -> str:
    """Validate and normalize DATABASE_URL before SQLAlchemy creates the engine.

    A missing or malformed deployment variable should not prevent the API from
    starting. In that case, use the same local SQLite fallback used elsewhere.
    """
    raw_url = (settings.DATABASE_URL or "").strip()
    if not raw_url:
        logger.warning("DATABASE_URL is empty; starting with local SQLite fallback.")
        settings.DATABASE_URL = _sqlite_fallback_url()
        return settings.DATABASE_URL

    try:
        parsed = make_url(raw_url)
        # Async SQLAlchemy requires an async driver. Rumpty may provide the
        # standard postgres:// or postgresql:// form, so normalize it.
        if parsed.drivername in ("postgres", "postgresql"):
            parsed = parsed.set(drivername="postgresql+asyncpg")
        elif parsed.drivername == "sqlite":
            parsed = parsed.set(drivername="sqlite+aiosqlite")

        if parsed.drivername not in ("postgresql+asyncpg", "sqlite+aiosqlite"):
            raise ValueError("DATABASE_URL must use PostgreSQL or SQLite with an async driver")

        settings.DATABASE_URL = parsed.render_as_string(hide_password=False)
        return settings.DATABASE_URL
    except Exception as exc:
        logger.warning(
            "DATABASE_URL is invalid (%s); starting with local SQLite fallback. "
            "Set DATABASE_URL to a valid async PostgreSQL connection string for persistent cloud storage.",
            type(exc).__name__,
        )
        settings.DATABASE_URL = _sqlite_fallback_url()
        return settings.DATABASE_URL


def get_engine_args(url: str):
    if url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    if url.startswith("postgresql+asyncpg"):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return {"connect_args": {"ssl": ctx}}
    return {}


DATABASE_URL = _get_database_url()

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    **get_engine_args(DATABASE_URL),
)

_active_sessionmaker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class AsyncSessionLocalProxy:
    def __call__(self, *args, **kwargs):
        return _active_sessionmaker(*args, **kwargs)


AsyncSessionLocal = AsyncSessionLocalProxy()

Base = declarative_base()


def switch_to_sqlite():
    global engine, _active_sessionmaker, DATABASE_URL
    fallback_url = _sqlite_fallback_url()
    settings.DATABASE_URL = fallback_url
    DATABASE_URL = fallback_url
    engine = create_async_engine(
        fallback_url,
        echo=settings.DEBUG,
        future=True,
        connect_args={"check_same_thread": False},
    )
    _active_sessionmaker = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    return fallback_url


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    global engine, _active_sessionmaker
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully using %s.", DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL)
    except Exception as exc:
        if DATABASE_URL.startswith("postgresql+asyncpg://"):
            logger.warning(
                "PostgreSQL initialization failed (%s). Falling back to local SQLite so the API can start.",
                type(exc).__name__,
            )
            fallback_url = switch_to_sqlite()
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Fallback SQLite database initialized successfully at %s", fallback_url)
        else:
            raise
