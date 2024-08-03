import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..schemas.common import get_current_utc_time
from ..schemas.project import ProjectCreate, ProjectInDB

class ProjectDB:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = database.projects

    async def create_project(self, project: ProjectCreate) -> ProjectInDB:
        project_dict = project.dict()
        project_dict["created_at"] = project_dict["updated_at"] = get_current_utc_time()
        result = await self.collection.insert_one(project_dict)
        created_project = await self.collection.find_one({"_id": result.inserted_id})
        return ProjectInDB(**created_project)

    async def get_project_by_id(self, project_id: str) -> ProjectInDB:
        project = await self.collection.find_one({"_id": ObjectId(project_id)})
        if project:
            return ProjectInDB(**project)

    async def update_project(self, project_id: str, update_data: dict) -> ProjectInDB:
        update_data["updated_at"] = datetime.utcnow()
        await self.collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
        updated_project = await self.collection.find_one({"_id": ObjectId(project_id)})
        return ProjectInDB(**updated_project)

    async def delete_project(self, project_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(project_id)})
        return result.deleted_count > 0
