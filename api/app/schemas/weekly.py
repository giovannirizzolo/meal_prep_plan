from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional


KCAL_PER_G = {"carb": 4.0, "protein": 4.0, "fat": 9.0}


class MacroPct(BaseModel):
    carb: float = Field(..., ge=0)
    protein: float = Field(..., ge=0)
    fat: float = Field(..., ge=0)


@field_validator("fat")
@classmethod
def validate_sum(cls, v, values):
    c = float(values.get("carb", 0))
    p = float(values.get("protein", 0))
    if abs(c + p + float(v) - 100.0) > 0.001:
        raise ValueError("Macro percentages must sum to 100")
    return v


class CreateWeeklyPlan(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    days: int = Field(7, ge=1, le=14)
    daily_kcal: float = Field(..., gt=0)
    macro_pct: MacroPct


class MealItemIn(BaseModel):
    food_id: Optional[int] = None
    off_code: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    per_100g_kcal: Optional[float] = None
    per_100g_protein: Optional[float] = None
    per_100g_carb: Optional[float] = None
    per_100g_fat: Optional[float] = None
    quantity_g: float


class MealIn(BaseModel):
    meal_index: int
    label: Optional[str] = None
    items: List[MealItemIn]


class FinalizeDayIn(BaseModel):
    meals: List[MealIn]


class DaySummary(BaseModel):
    day_index: int
    kcal_total_target: float
    kcal_consumed: float
    kcal_remaining: float
    macro_pct: MacroPct
    macro_target_g: Dict[str, float]
    macro_consumed_g: Dict[str, float]
    macro_remaining_g: Dict[str, float]


# --- Grocery list ---
class GroceryRequest(BaseModel):
    days: int = Field(..., ge=1, le=31)
    # opzionale: dimensione confezione (g) per food_id o source_id (string keys)
    package_sizes: Optional[Dict[str, float]] = None


class GroceryItemOut(BaseModel):
    key: str # preferibilmente food_id come string
    name: str
    brand: Optional[str] = None
    source: Optional[str] = None
    source_id: Optional[str] = None # OFF barcode se disponibile
    grams_per_day: float
    total_grams: float
    package_size_g: Optional[float] = None
    packages_needed: Optional[int] = None


class GroceryResponse(BaseModel):
    plan_id: str
    day_index: int
    days: int
    items: List[GroceryItemOut]
    totals: Dict[str, float]
    
class DeleteWeeklyPlan(BaseModel):
    plan_id: str
    name: str