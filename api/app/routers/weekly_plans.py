from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.orm import Session
from uuid import uuid4

from ..db import SessionLocal
from ..models.weekly import WeeklyPlan, WeeklyDay, Meal, MealItem
from ..schemas.weekly import (
    CreateWeeklyPlan, DeleteWeeklyPlan, MacroPct, FinalizeDayIn, DaySummary, GroceryItemOut, GroceryRequest, GroceryResponse, KCAL_PER_G
)

# also use your existing Food models (food_items, nutrients)
from ..models.food import FoodItem, Nutrients

router = APIRouter(prefix="/weekly-plans", tags=["weekly-plans"])

# ---- deps ----

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---- utils ----

def _macro_grams_from_pct(kcal: float, pct: MacroPct) -> dict[str, float]:
    return {
        "carb": round((kcal * pct.carb / 100.0) / KCAL_PER_G["carb"], 1),
        "protein": round((kcal * pct.protein / 100.0) / KCAL_PER_G["protein"], 1),
        "fat": round((kcal * pct.fat / 100.0) / KCAL_PER_G["fat"], 1),
    }

@router.post("/{plan_id}/days/{day_index}/grocery", response_model=GroceryResponse)
def generate_grocery(plan_id: str, day_index: int, req: GroceryRequest, db: Session = Depends(get_db)):
    plan = db.get(WeeklyPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")


    day = db.scalar(select(WeeklyDay).where(WeeklyDay.plan_id == plan_id, WeeklyDay.day_index == day_index))
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")


    # somma grammi per alimento nel giorno
    rows = db.execute(
    select(
    FoodItem.id,
    FoodItem.name,
    FoodItem.brand,
    FoodItem.source,
    FoodItem.source_id,
    func.sum(MealItem.quantity_g).label("g_per_day"),
    )
    .join(Meal, Meal.id == MealItem.meal_id)
    .join(FoodItem, FoodItem.id == MealItem.food_id)
    .where(Meal.plan_day_id == day.id)
    .group_by(FoodItem.id, FoodItem.name, FoodItem.brand, FoodItem.source, FoodItem.source_id)
    .order_by(FoodItem.name)
    ).all()


    items: list[GroceryItemOut] = []
    total_grams_all = 0.0


    for (fid, name, brand, source, source_id, g_per_day) in rows:
        g_per_day = float(g_per_day or 0)
        total = round(g_per_day * req.days, 1)
        total_grams_all += total


        # risolvi pack size: priorità key = str(fid), fallback source_id (OFF)
        pack = None
        if req.package_sizes:
            key_by_id = str(fid)
            if key_by_id in req.package_sizes:
                pack = float(req.package_sizes[key_by_id])
            elif source_id and source_id in req.package_sizes:
                pack = float(req.package_sizes[source_id])
        packages = math.ceil(total / pack) if pack and pack > 0 else None

        items.append(GroceryItemOut(
            key=str(fid), name=name, brand=brand, source=source, source_id=source_id,
            grams_per_day=round(g_per_day, 1), total_grams=total,
            package_size_g=pack, packages_needed=packages
        ))


    return GroceryResponse(
        plan_id=plan_id, day_index=day_index, days=req.days,
        items=items,
        totals={"total_grams": round(total_grams_all, 1), "items": len(items)}
    )
    # minimal get-or-create by OFF code (if provided in finalize payload)

def ensure_food_by_off_code(db: Session, off_code: str, name: str | None, brand: str | None,
                            n_kcal: float, n_p: float, n_c: float, n_f: float) -> int:
    fi = db.execute(select(FoodItem).where(FoodItem.source == "OFF", FoodItem.source_id == off_code)).scalar_one_or_none()
    if fi:
        return fi.id
    fi = FoodItem(source="OFF", source_id=off_code, name=name or f"OFF {off_code}", brand=brand)
    db.add(fi)
    db.flush()  # get id
    nu = Nutrients(food_id=fi.id,
                   per_100g_kcal=n_kcal,
                   per_100g_protein=n_p,
                   per_100g_carb=n_c,
                   per_100g_fat=n_f)
    db.add(nu)
    db.flush()
    return fi.id

# ---- endpoints ----

@router.post("/")
def create_weekly_plan(req: CreateWeeklyPlan, db: Session = Depends(get_db)):
    try:
        plan_id = str(uuid4())
        total_pct = req.macro_pct.carb + req.macro_pct.protein + req.macro_pct.fat
        if not (99.9 <= total_pct <= 100.1):  # Allow tiny rounding errors
            raise HTTPException(status_code=400, detail=f"Macro percentages must sum to 100% (got {total_pct}%)")
            
        plan = WeeklyPlan(
            id=plan_id,
            name=req.name,
            days=req.days,
            daily_kcal=req.daily_kcal,
            pct_carb=req.macro_pct.carb,
            pct_protein=req.macro_pct.protein,
            pct_fat=req.macro_pct.fat,
        )
        db.add(plan)
        db.flush()

        for i in range(req.days):
            db.add(WeeklyDay(plan_id=plan_id, day_index=i, kcal_total=req.daily_kcal))

        db.commit()
        return {
            "id": plan_id,
            "days": req.days,
            "daily_kcal": req.daily_kcal,
            "macro_pct": req.macro_pct.model_dump(),
        "days_detail": [
            {
                "day_index": i,
                "kcal_total": req.daily_kcal,
                "kcal_remaining": req.daily_kcal,
                "macro_pct": req.macro_pct.model_dump(),
                "macro_grams_total": _macro_grams_from_pct(req.daily_kcal, req.macro_pct),
                "macro_grams_remaining": _macro_grams_from_pct(req.daily_kcal, req.macro_pct),
            }
            for i in range(req.days)
        ],
    }
    except Exception as e:
        db.rollback()
        print(f"Error creating weekly plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create weekly plan: {str(e)}")

@router.get("/plans")
def get_weekly_plans(db: Session = Depends(get_db)):
    plans = db.scalars(select(WeeklyPlan)).all()
    result = []
    
    for plan in plans:
        pct = MacroPct(carb=float(plan.pct_carb), protein=float(plan.pct_protein), fat=float(plan.pct_fat))
        result.append({
            "id": plan.id,
            "name": plan.name,
            "days": plan.days,
            "daily_kcal": float(plan.daily_kcal),
            "macro_pct": pct.model_dump()
        })
    
    return result
    
@router.get("/{plan_id}")
def get_weekly_plan(plan_id: str, db: Session = Depends(get_db)):
    plan = db.get(WeeklyPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    pct = MacroPct(carb=float(plan.pct_carb), protein=float(plan.pct_protein), fat=float(plan.pct_fat))
    grams_total = _macro_grams_from_pct(float(plan.daily_kcal), pct)

    # summarize days from view v_day_totals
    summaries = []
    for day in db.scalars(select(WeeklyDay).where(WeeklyDay.plan_id == plan_id).order_by(WeeklyDay.day_index)).all():
        totals = db.execute(
            select(
                func.coalesce(func.sum((Nutrients.per_100g_kcal * (MealItem.quantity_g/100))), 0),
                func.coalesce(func.sum((Nutrients.per_100g_carb * (MealItem.quantity_g/100))), 0),
                func.coalesce(func.sum((Nutrients.per_100g_protein * (MealItem.quantity_g/100))), 0),
                func.coalesce(func.sum((Nutrients.per_100g_fat * (MealItem.quantity_g/100))), 0),
            )
            .join(Meal, Meal.id == MealItem.meal_id, isouter=True)
            .join(WeeklyDay, WeeklyDay.id == Meal.plan_day_id, isouter=True)
            .join(Nutrients, Nutrients.food_id == MealItem.food_id, isouter=True)
            .where(WeeklyDay.id == day.id)
        ).one()
        kcal = float(totals[0] or 0)
        carb = float(totals[1] or 0)
        prot = float(totals[2] or 0)
        fat  = float(totals[3] or 0)
        remaining_kcal = max(0.0, float(day.kcal_total) - kcal)
        target = grams_total
        remaining = {
            "carb": round(max(0.0, target["carb"] - carb), 1),
            "protein": round(max(0.0, target["protein"] - prot), 1),
            "fat": round(max(0.0, target["fat"] - fat), 1),
        }
        summaries.append({
            "day_index": day.day_index,
            "kcal_total": float(day.kcal_total),
            "kcal_remaining": round(remaining_kcal),
            "macro_pct": pct.model_dump(),
            "macro_grams_total": target,
            "macro_grams_remaining": remaining,
        })

    return {
        "id": plan.id,
        "days": plan.days,
        "daily_kcal": float(plan.daily_kcal),
        "macro_pct": pct.model_dump(),
        "days_detail": summaries,
    }

@router.post("/{plan_id}/days/{day_index}/finalize")
def finalize_day(plan_id: str, day_index: int, payload: FinalizeDayIn, db: Session = Depends(get_db)) -> DaySummary:
    plan = db.get(WeeklyPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    day = db.scalar(select(WeeklyDay).where(WeeklyDay.plan_id == plan_id, WeeklyDay.day_index == day_index))
    if not day:
        day = WeeklyDay(plan_id=plan_id, day_index=day_index, kcal_total=plan.daily_kcal)
        db.add(day)
        db.flush()

    # replace meals for that day
    db.execute(delete(Meal).where(Meal.plan_day_id == day.id))
    db.flush()

    for m in payload.meals:
        meal = Meal(plan_day_id=day.id, meal_index=m.meal_index, label=m.label)
        db.add(meal)
        db.flush()
        for it in m.items:
            if it.food_id is None:
                if not (it.off_code and it.per_100g_kcal is not None and it.per_100g_protein is not None and it.per_100g_carb is not None and it.per_100g_fat is not None):
                    raise HTTPException(status_code=400, detail="Missing food_id or OFF payload")
                # create in local catalog
                food_id = ensure_food_by_off_code(db, it.off_code, it.name, it.brand,
                                                  it.per_100g_kcal, it.per_100g_protein, it.per_100g_carb, it.per_100g_fat)
            else:
                food_id = it.food_id
            db.add(MealItem(meal_id=meal.id, food_id=food_id, quantity_g=it.quantity_g))

    db.commit()

    # compute authoritative totals
    pct = MacroPct(carb=float(plan.pct_carb), protein=float(plan.pct_protein), fat=float(plan.pct_fat))
    target_g = _macro_grams_from_pct(float(plan.daily_kcal), pct)

    totals = db.execute(
        select(
            func.coalesce(func.sum((Nutrients.per_100g_kcal * (MealItem.quantity_g/100))), 0),
            func.coalesce(func.sum((Nutrients.per_100g_carb * (MealItem.quantity_g/100))), 0),
            func.coalesce(func.sum((Nutrients.per_100g_protein * (MealItem.quantity_g/100))), 0),
            func.coalesce(func.sum((Nutrients.per_100g_fat * (MealItem.quantity_g/100))), 0),
        )
        .join(Meal, Meal.id == MealItem.meal_id)
        .join(Nutrients, Nutrients.food_id == MealItem.food_id)
        .where(Meal.plan_day_id == day.id)
    ).one()

    kcal = float(totals[0] or 0)
    carb = float(totals[1] or 0)
    prot = float(totals[2] or 0)
    fat  = float(totals[3] or 0)

    remaining_kcal = max(0.0, float(plan.daily_kcal) - kcal)
    rem_g = {
        "carb": round(max(0.0, target_g["carb"] - carb), 1),
        "protein": round(max(0.0, target_g["protein"] - prot), 1),
        "fat": round(max(0.0, target_g["fat"] - fat), 1),
    }

    return DaySummary(
        day_index=day_index,
        kcal_total_target=float(plan.daily_kcal),
        kcal_consumed=round(kcal),
        kcal_remaining=round(remaining_kcal),
        macro_pct=pct,
        macro_target_g=target_g,
        macro_consumed_g={"carb": round(carb,1), "protein": round(prot,1), "fat": round(fat,1)},
        macro_remaining_g=rem_g,
    )
    
# @router.delete("{plan_id}")
#     async def delete_weekly_plan(plan_id: str, db: Session = Depends(get_db)) -> DeleteWeeklyPlan:
        