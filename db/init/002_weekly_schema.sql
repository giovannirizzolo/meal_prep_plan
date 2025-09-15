-- Weekly plan schema (PostgreSQL)
-- Run after 001_schema.sql (food_items, nutrients)
-- If you already created weekly_plans without "name", run the ALTERs below.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    days INT NOT NULL CHECK (
        days BETWEEN 1 AND 14
    ),
    daily_kcal NUMERIC NOT NULL CHECK (daily_kcal > 0),
    pct_carb NUMERIC NOT NULL CHECK (pct_carb >= 0),
    pct_protein NUMERIC NOT NULL CHECK (pct_protein >= 0),
    pct_fat NUMERIC NOT NULL CHECK (pct_fat >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
-- Se vuoi testare manualmente, usa questo invece del blocco DO:
-- ALTER TABLE weekly_plans ADD COLUMN IF NOT EXISTS name TEXT;
-- UPDATE weekly_plans SET name = 'Piano settimanale' WHERE name IS NULL;
-- ALTER TABLE weekly_plans ALTER COLUMN name SET NOT NULL;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'weekly_plans'
        AND column_name = 'name'
) THEN
ALTER TABLE weekly_plans
ADD COLUMN name TEXT;
UPDATE weekly_plans
SET name = 'Piano settimanale';
ALTER TABLE weekly_plans
ALTER COLUMN name
SET NOT NULL;
END IF;
END $$;
CREATE TABLE IF NOT EXISTS weekly_days (
    id SERIAL PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
    day_index INT NOT NULL,
    kcal_total NUMERIC NOT NULL,
    UNIQUE (plan_id, day_index)
);
CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    plan_day_id INT NOT NULL REFERENCES weekly_days(id) ON DELETE CASCADE,
    meal_index INT NOT NULL,
    label TEXT,
    UNIQUE (plan_day_id, meal_index)
);
CREATE TABLE IF NOT EXISTS meal_items (
    id SERIAL PRIMARY KEY,
    meal_id INT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_id INT NOT NULL REFERENCES food_items(id),
    quantity_g NUMERIC NOT NULL CHECK (quantity_g > 0)
);
CREATE OR REPLACE VIEW v_day_totals AS
SELECT 
    d.id AS plan_day_id,
    COALESCE(SUM(meal_items.quantity_g * nutrients.per_100g_kcal / 100), 0) AS kcal,
    COALESCE(SUM(meal_items.quantity_g * nutrients.per_100g_carb / 100), 0) AS carb_g,
    COALESCE(SUM(meal_items.quantity_g * nutrients.per_100g_protein / 100), 0) AS protein_g,
    COALESCE(SUM(meal_items.quantity_g * nutrients.per_100g_fat / 100), 0) AS fat_g
FROM weekly_days d
    LEFT JOIN meals ON meals.plan_day_id = d.id
    LEFT JOIN meal_items ON meal_items.meal_id = meals.id
    LEFT JOIN nutrients ON nutrients.food_id = meal_items.food_id
GROUP BY d.id;
CREATE INDEX IF NOT EXISTS idx_meals_plan_day ON meals(plan_day_id);
CREATE INDEX IF NOT EXISTS idx_items_meal ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_items_food ON meal_items(food_id);