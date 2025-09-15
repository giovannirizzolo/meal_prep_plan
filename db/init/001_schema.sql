CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE food_items(
  id SERIAL PRIMARY KEY,
  source VARCHAR(10) NOT NULL,
  source_id VARCHAR(64),
  brand TEXT,
  name TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE nutrients(
  food_id INT PRIMARY KEY REFERENCES food_items(id) ON DELETE CASCADE,
  per_100g_kcal NUMERIC NOT NULL,
  per_100g_protein NUMERIC NOT NULL,
  per_100g_carb NUMERIC NOT NULL,
  per_100g_fat NUMERIC NOT NULL,
  per_100g_fiber NUMERIC,
  sodium_mg NUMERIC
);

CREATE TABLE servings(
  id SERIAL PRIMARY KEY,
  food_id INT REFERENCES food_items(id) ON DELETE CASCADE,
  label TEXT,
  grams NUMERIC NOT NULL
);

CREATE TABLE meal_plans(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  days INT NOT NULL,
  meals_per_day INT NOT NULL,
  kcal_target NUMERIC NOT NULL,
  protein_target_g NUMERIC NOT NULL,
  carb_target_g NUMERIC NOT NULL,
  fat_target_g NUMERIC NOT NULL,
  tolerance_pct NUMERIC DEFAULT 0.10,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE plan_days(
  id SERIAL PRIMARY KEY,
  plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_index INT NOT NULL
);

CREATE TABLE plan_meals(
  id SERIAL PRIMARY KEY,
  plan_day_id INT REFERENCES plan_days(id) ON DELETE CASCADE,
  meal_index INT NOT NULL,
  label TEXT
);

CREATE TABLE meal_items(
  id SERIAL PRIMARY KEY,
  plan_meal_id INT REFERENCES plan_meals(id) ON DELETE CASCADE,
  food_id INT REFERENCES food_items(id),
  quantity_g NUMERIC NOT NULL
);
