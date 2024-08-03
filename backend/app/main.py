from fastapi import FastAPI
from .db.mongodb import connect_to_mongo, close_mongo_connection
from .api.routes import projects

app = FastAPI()

app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

app.include_router(projects.router)
