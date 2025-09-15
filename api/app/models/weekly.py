from sqlalchemy import Column, Integer, Float, Text, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from ..db import Base

class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    days: Mapped[int] = mapped_column(Integer, nullable=False)
    daily_kcal: Mapped[float] = mapped_column(Numeric, nullable=False)
    pct_carb: Mapped[float] = mapped_column(Numeric, nullable=False)
    pct_protein: Mapped[float] = mapped_column(Numeric, nullable=False)
    pct_fat: Mapped[float] = mapped_column(Numeric, nullable=False)

    days_rel: Mapped[list["WeeklyDay"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan"
    )

class WeeklyDay(Base):
    __tablename__ = "weekly_days"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("weekly_plans.id", ondelete="CASCADE"))
    day_index: Mapped[int] = mapped_column(Integer, nullable=False)
    kcal_total: Mapped[float] = mapped_column(Numeric, nullable=False)

    plan: Mapped["WeeklyPlan"] = relationship(back_populates="days_rel")
    meals: Mapped[list["Meal"]] = relationship(back_populates="day", cascade="all, delete-orphan")

class Meal(Base):
    __tablename__ = "meals"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_day_id: Mapped[int] = mapped_column(Integer, ForeignKey("weekly_days.id", ondelete="CASCADE"))
    meal_index: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str | None] = mapped_column(Text)

    day: Mapped["WeeklyDay"] = relationship(back_populates="meals")
    items: Mapped[list["MealItem"]] = relationship(back_populates="meal", cascade="all, delete-orphan")

class MealItem(Base):
    __tablename__ = "meal_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meal_id: Mapped[int] = mapped_column(Integer, ForeignKey("meals.id", ondelete="CASCADE"))
    food_id: Mapped[int] = mapped_column(Integer, ForeignKey("food_items.id"))
    quantity_g: Mapped[float] = mapped_column(Numeric, nullable=False)

    meal: Mapped["Meal"] = relationship(back_populates="items")