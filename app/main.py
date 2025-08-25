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
# Docker Compose içinde servis adı "mongodb" olsun, .env'de MONGO_URI=mongodb://mongodb:27017
mongo_uri = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
client = AsyncIOMotorClient(mongo_uri)
db = client["features_app"]
users_collection = db["clients"]

# --- Templates & Statics ---
# Dizin yapınız: app/static , app/template  (tekil!)
templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# --- Routes ---
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def home(request: Request):
    # app/template/index.html dosyasını Jinja ile gönderiyoruz
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/summary")
async def save_summary(payload: dict = Body(...)):
    # Aynen gelen JSON'u 'summaries' koleksiyonuna kaydediyoruz
    res = await db["summaries"].insert_one(payload)
    return {"id": str(res.inserted_id)}

@app.get("/health", include_in_schema=False)
async def health():
    return {"ok": True}

# (İleride API ekleyecekseniz router'ı dahil edin)
app.include_router(router, prefix="")  # şu an boş; ileride /api/... ekleyebilirsiniz
