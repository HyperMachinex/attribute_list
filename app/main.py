# app/main.py
from fastapi import FastAPI, Request, APIRouter, Body
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter()
app = FastAPI()

# --- MongoDB ---
mongo_uri = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
client = AsyncIOMotorClient(mongo_uri)
db = client["features_app"]
users_collection = db["clients"]

# --- Templates & Statics ---
templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# --- Routes ---
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/summary")
async def save_summary(payload: dict = Body(...)):
    res = await db["summaries"].insert_one(payload)
    return {"id": str(res.inserted_id)}

@app.get("/health", include_in_schema=False)
async def health():
    return {"ok": True}

app.include_router(router, prefix="")
