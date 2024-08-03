from motor.motor_asyncio import AsyncIOMotorClient
from ..core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None

db = MongoDB()

async def get_database() -> AsyncIOMotorClient:
    return db.client[settings.MONGO_DB]

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGO_URL)
    
async def close_mongo_connection():
    db.client.close()
