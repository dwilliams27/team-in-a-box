from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.db.tickets import TicketDB
from app.schemas.ticket import TicketCreate, TicketInDB

router = APIRouter()

async def get_ticket_db(db: AsyncIOMotorDatabase = Depends(get_database)):
    return TicketDB(db)

@router.post("/tickets", response_model=TicketInDB)
async def create_ticket(ticket: TicketCreate, ticket_db: TicketDB = Depends(get_ticket_db)):
    return await ticket_db.create_obj(ticket)

@router.get("/tickets/{ticket_id}", response_model=TicketInDB)
async def get_ticket(ticket_id: str, ticket_db: TicketDB = Depends(get_ticket_db)):
    ticket = await ticket_db.get_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.put("/tickets/{ticket_id}", response_model=TicketInDB)
async def update_ticket(ticket_id: str, update_data: TicketCreate, ticket_db: TicketDB = Depends(get_ticket_db)):
    updated_ticket = await ticket_db.update_obj(ticket_id, update_data.model_dump())
    if not updated_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return updated_ticket

@router.delete("/tickets/{ticket_id}", response_model=bool)
async def delete_ticket(ticket_id: str, ticket_db: TicketDB = Depends(get_ticket_db)):
    deleted = await ticket_db.delete_obj(ticket_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return True