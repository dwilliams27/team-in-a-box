from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.db.base import BaseDB

from app.schemas.agent import AgentCreate, AgentInDB

class AgentDB(BaseDB[AgentCreate, AgentInDB]):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "Agents", "agnt", AgentInDB)
