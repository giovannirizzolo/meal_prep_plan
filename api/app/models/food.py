from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Column, Integer, Float, Text, ForeignKey, Numeric, VARCHAR, Boolean
from sqlalchemy.dialects.postgresql import UUID
from ..db import Base

class FoodItem(Base):
    __tablename__ = "food_items"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    source: Mapped[str] = mapped_column(VARCHAR, nullable=False)
    source_id: Mapped[str] = mapped_column(VARCHAR, nullable=True)
    brand: Mapped[str] = mapped_column(Text, nullable=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=True)
    
class Nutrients(Base):
    __tablename__ = 'nutrients'
    food_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    per_100g_kcal: Mapped[int] = mapped_column(Numeric, nullable=False)
    per_100g_protein: Mapped[int] = mapped_column(Numeric, nullable=False)
    per_100g_carb: Mapped[int] = mapped_column(Numeric, nullable=False)
    per_100g_fat: Mapped[int] = mapped_column(Numeric, nullable=False)
    per_100g_fiber: Mapped[int] = mapped_column(Numeric, nullable=True)
    sodium_mg: Mapped[int] = mapped_column(Numeric, nullable=True)