from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...db.mongodb import get_database
from ...db.projects import ProjectDB
from ...schemas.project import ProjectCreate, ProjectInDB

router = APIRouter()

async def get_project_db(db: AsyncIOMotorDatabase = Depends(get_database)):
    return ProjectDB(db)

@router.post("/projects", response_model=ProjectInDB)
async def create_project(project: ProjectCreate, project_db: ProjectDB = Depends(get_project_db)):
    return await project_db.create_project(project)

@router.get("/projects/{project_id}", response_model=ProjectInDB)
async def get_project(project_id: str, project_db: ProjectDB = Depends(get_project_db)):
    project = await project_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/projects/{project_id}", response_model=ProjectInDB)
async def update_project(project_id: str, update_data: ProjectCreate, project_db: ProjectDB = Depends(get_project_db)):
    updated_project = await project_db.update_project(project_id, update_data.dict())
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project

@router.delete("/projects/{project_id}", response_model=bool)
async def delete_project(project_id: str, project_db: ProjectDB = Depends(get_project_db)):
    deleted = await project_db.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return True