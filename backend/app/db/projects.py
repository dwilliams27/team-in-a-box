from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.base import BaseDB

from app.schemas.project import ProjectCreate, ProjectInDB

class ProjectDB(BaseDB[ProjectCreate, ProjectInDB]):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "Projects", "proj", ProjectInDB)
