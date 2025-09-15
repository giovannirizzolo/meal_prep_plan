export type FoodHit = {
  code: string; // OFF barcode or internal id when saved
  name: string;
  brand?: string;
  serving_size?: string;
  per_100g: { kcal: number; protein_g: number; carb_g: number; fat_g: number };
};

export const MacroNutrient = {
    CARBOHYDRATE: 'CARBOHYDRATE',
    PROTEIN: 'PROTEIN',
    FAT: 'FAT'
} as const

export type MacroNutrientType = typeof MacroNutrient[keyof typeof MacroNutrient]

export interface WeeklyPlan {
    daily_kcal: number
    days: number
    id: string
    macro_pct: {
      carb: number
      protein: number
      fat: number
    }
    name: string
}