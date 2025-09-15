import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MacroGauge from "@/src/components/macro-gauge";
import FoodPicker from "@/src/components/food-picker";
import type { FoodHit } from "@/types/food";
import { dayTotals, gramsFromPct, ItemDraft, KCAL_PER_G, MacroPct } from "@/src/lib/macros";
import GroceryListDialog from "./grocery-list";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function DayBuilder({ kcalTarget, pct }:{ planId?:string; dayIndex?:number; kcalTarget:number; pct: MacroPct }){
  const [meals, setMeals] = useState<ItemDraft[][]>([[],[],[]]);
  const [labels, setLabels] = useState<string[]>(["Colazione","Pranzo","Cena"]);
  const [openGroceryList, setOpenGroceryList] = useState(false);
  const [templateName, setTemplateName] = useState<string>('Your day of eating')

  const totals = useMemo(()=> dayTotals(kcalTarget, pct, meals), [kcalTarget, pct, meals]);

  function addFoodToMeal(mealIdx:number, food:FoodHit){
    const grams = food.serving_size?.match(/(\d+(?:[\.,]\d+)?)\s*g/i)?.[1];
    const g = grams ? parseFloat(grams.replace(",",".")) : 100;
    setMeals(prev => prev.map((arr,idx)=> idx===mealIdx ? [...arr, {food, grams:g}] : arr));
  }

  function updateGrams(mealIdx:number, itemIdx:number, g:number){
    setMeals(prev => prev.map((arr,idx)=> idx===mealIdx ? arr.map((it,i)=> i===itemIdx? {...it, grams:g}: it) : arr));
  }

  function removeItem(mealIdx:number, itemIdx:number){
    setMeals(prev => prev.map((arr,idx)=> idx===mealIdx ? arr.filter((_,i)=> i!==itemIdx) : arr));
  }

  function addMeal() {
    setMeals(prev => [...prev, []]);
    setLabels(prev => [...prev, `Meal ${prev.length + 1}`]);
  }

  function moveMeal(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= meals.length) return;
    
    setMeals(prev => {
      const newMeals = [...prev];
      const [removed] = newMeals.splice(fromIndex, 1);
      newMeals.splice(toIndex, 0, removed);
      return newMeals;
    });

    setLabels(prev => {
      const newLabels = [...prev];
      const [removed] = newLabels.splice(fromIndex, 1);
      newLabels.splice(toIndex, 0, removed);
      return newLabels;
    });
  }
  async function saveDayOfEating(){
    
  }
  // async function finalizeDay(){
  //   const payload = {
  //     meals: meals.map((items, idx) => ({
  //       meal_index: idx,
  //       label: labels[idx],
  //       items: items.map(it => ({
  //         off_code: it.food.code,
  //         name: it.food.name,
  //         brand: it.food.brand,
  //         per_100g_kcal: it.food.per_100g.kcal,
  //         per_100g_protein: it.food.per_100g.protein_g,
  //         per_100g_carb: it.food.per_100g.carb_g,
  //         per_100g_fat: it.food.per_100g.fat_g,
  //         quantity_g: it.grams
  //       }))
  //     }))
  //   };
  //   const res = await fetch(`${API}/weekly-plans/${planId}/days/${dayIndex}/finalize`, {
  //     method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)
  //   });
  //   const json = await res.json();
  //   // Optionally reconcile state with authoritative totals
  //   alert(`Finalizzato: consumate ${json.kcal_consumed} kcal, restano ${json.kcal_remaining} kcal`);
  // }

  return (
    <Card>
      <CardHeader><CardTitle>
        <Input value={templateName} onChange={e=>setTemplateName(e.target.value)}/>
        </CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <MacroGauge totalKcal={totals.remaining.kcal} pct={pct}/>

        
        {meals.map((items, idx) => (
          <div key={idx} className="rounded border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm opacity-80">
                <Input value={labels[idx]} onChange={e=>setLabels(prev => prev.map((l,i)=> i===idx? e.target.value : l))}/>
              </div>
              <div className="text-xs text-muted-foreground">Items: {items.length}</div>
            </div>

            <FoodPicker onPick={(f)=>addFoodToMeal(idx, f)}/>

            <div className="mt-3 space-y-1 text-sm">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">{it.food.name} {it.food.brand?`– ${it.food.brand}`:""}</div>
                  <div className="w-40">
                    <Input type="number" value={it.grams} onChange={e=>updateGrams(idx, i, parseFloat(e.target.value||"0"))}/>
                  </div>
                  <Button variant="ghost" onClick={()=>removeItem(idx,i)}>Rimuovi</Button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" onClick={addMeal}>Add meal</Button>
        </div>

        <div className="text-xs">
          Target (g): C {gramsFromPct(kcalTarget, pct).carb} • P {gramsFromPct(kcalTarget, pct).protein} • F {gramsFromPct(kcalTarget, pct).fat}
        </div>
        <div className="text-xs">
          Consumato (g): C {totals.consumed.carb_g} • P {totals.consumed.protein_g} • F {totals.consumed.fat_g}
        </div>
        <div className="text-xs">
          Rimangono (g): C {totals.remaining.carb_g} • P {totals.remaining.protein_g} • F {totals.remaining.fat_g}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={()=>setOpenGroceryList(true)}>Lista della spesa</Button>
          <Button onClick={saveDayOfEating}>Salva</Button>
        </div>

        <GroceryListDialog open={openGroceryList} onOpenChange={setOpenGroceryList} meals={meals} defaultDays={5} />
      </CardContent>
    </Card>
  );
}