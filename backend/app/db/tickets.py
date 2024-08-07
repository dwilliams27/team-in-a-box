from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.db.base import BaseDB

from app.schemas.ticket import TicketCreate, TicketInDB


class TicketDB(BaseDB[TicketCreate, TicketInDB]):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "Tickets", "tckt", TicketInDB)
