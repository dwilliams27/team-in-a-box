import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pydantic import BaseModel

from app.schemas.common import get_current_utc_time
from app.utils.id_gen import generate_id
from typing import Generic, Type, TypeVar

K = TypeVar('K')
V = TypeVar('V')

class BaseDB(Generic[K, V]):
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str, prefix: str, model_class: Type[V]):
        self.db = db
        self.collection = db.get_collection(collection_name)
        self.prefix = prefix
        self.model_class = model_class

    async def create_obj(self, obj: K) -> V:
        dict = obj.model_dump()
        dict["id"] = generate_id(self.prefix)
        dict["created_at"] = dict["updated_at"] = get_current_utc_time()
        result = await self.collection.insert_one(dict)
        created_obj = await self.collection.find_one({"_id": result.inserted_id})
        return self.model_class(**created_obj)

    async def get_by_id(self, id: str) -> V:
        obj = await self.collection.find_one({"id": id})
        if obj:
            return self.model_class(**obj)

    async def update_obj(self, id: str, update_data: dict) -> V:
        update_data["updated_at"] = datetime.utcnow()
        await self.collection.update_one(
            {"id": id},
            {"$set": update_data}
        )
        updated_obj = await self.collection.find_one({"id": id})
        return self.model_class(**updated_obj)

    async def delete_obj(self, id: str) -> bool:
        result = await self.collection.delete_one({"id": id})
        return result.deleted_count > 0
