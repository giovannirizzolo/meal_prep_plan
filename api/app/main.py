from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from .routers import foods, weekly_plans


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",  # In case Next.js is on different port
    "http://127.0.0.1:3001",
]

app = FastAPI(title="MPP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"]
)


class PlanRequest(BaseModel):
    days: int
    meals_per_day: int
    kcal_target: float
    protein_target_g: float
    carb_target_g: float
    fat_target_g: float
    tolerance_pct: float = 0.10


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/plan")
async def create_plan(req: PlanRequest):
    # TODO: fetch candidate foods, run heuristic planner, persist & return detail
    return {"id": "demo", "days": req.days}


@app.get("/plan/{plan_id}")
async def get_plan(plan_id: str):
    return {"id": plan_id}


@app.post("/plan/{plan_id}/finalize")
async def finalize_plan(plan_id: str):
    # TODO: compute shopping list and build ICS text
    return {"plan_id": plan_id, "shopping_list": [], "ics": "BEGIN:VCALENDAR..."}

app.include_router(foods.router)
app.include_router(weekly_plans.router)