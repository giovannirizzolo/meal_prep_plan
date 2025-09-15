export const KCAL_PER_G = { carb: 4, protein: 4, fat: 9 } as const; // USDA 4/4/9

export type MacroPct = { carb: number; protein: number; fat: number };

export function gramsFromPct(kcal: number, pct: MacroPct) {
  return {
    carb: +(kcal * pct.carb / 100 / KCAL_PER_G.carb).toFixed(1),
    protein: +(kcal * pct.protein / 100 / KCAL_PER_G.protein).toFixed(1),
    fat: +(kcal * pct.fat / 100 / KCAL_PER_G.fat).toFixed(1),
  };
}

export function dayTotals(kcalTarget: number, pct: MacroPct, meals: ItemDraft[][]) {
  let kcal = 0, c = 0, p = 0, f = 0;
  meals.flat().forEach(it => {
    const n = it.food.per_100g; const g = it.grams;
    kcal += g * n.kcal / 100;
    c += g * n.carb_g / 100;
    p += g * n.protein_g / 100;
    f += g * n.fat_g / 100;
  });
  const target = gramsFromPct(kcalTarget, pct);
  return {
    consumed: { kcal: Math.round(kcal), carb_g: +c.toFixed(1), protein_g: +p.toFixed(1), fat_g: +f.toFixed(1) },
    target,
    remaining: {
      kcal: Math.max(0, Math.round(kcalTarget - kcal)),
      carb_g: Math.max(0, +(target.carb - c).toFixed(1)),
      protein_g: Math.max(0, +(target.protein - p).toFixed(1)),
      fat_g: Math.max(0, +(target.fat - f).toFixed(1)),
    }
  }
}

export type ItemDraft = { food: import("@/types/food").FoodHit; grams: number };