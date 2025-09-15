import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient, useApiCall } from "@/src/lib/api-client";
import { gramsFromPct } from "@/src/lib/macros";
import { ChangeEvent, useEffect, useState } from "react";
import { MacroPct } from "../lib/macros";
import { MacroNutrient, MacroNutrientType } from "../types/food";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function PlanCreation() {
    const [planName, setPlanName] = useState("Piano settimanale");
    const [dailyKcal, setDailyKcal] = useState(2200);
    const [planId, setPlanId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { callApi } = useApiCall();

    const [pct, setPct] = useState<MacroPct>({ carb: 45, protein: 25, fat: 30 });
    const [maxCarbPct, setmaxCarbPct] = useState<number>()
    const [maxProteinPct, setmaxProteinPct] = useState<number>()
    const [maxFatPct, setmaxFatPct] = useState<number>()

    useEffect(() => {
            const { carb, protein, fat } = pct;
            const total = carb + protein + fat;
    
            setmaxCarbPct(100 - protein - fat);
            setmaxProteinPct(100 - carb - fat);
            setmaxFatPct(100 - carb - protein);
    
        }, [pct]);


    async function createPlan() {
        setLoading(true);
        const result = await callApi(
            () => apiClient.post(`${API}/weekly-plans`, {
                name: planName,
                days: 7,
                daily_kcal: dailyKcal,
                macro_pct: pct
            }),
            {
                errorMessage: "Failed to create weekly plan",
                showSuccess: true,
                successMessage: "Weekly plan created successfully!"
            }
        );

        setLoading(false);
    }

    const handleMacroNutrientPctChange = (e: ChangeEvent<HTMLInputElement>, macrosType: MacroNutrientType) => {

        if (macrosType === MacroNutrient.CARBOHYDRATE) {
            const carb = Math.min(parseFloat(e.target.value || "0"), maxCarbPct)
            setPct({ ...pct, carb })
        }
        if (macrosType === MacroNutrient.PROTEIN) {
            const protein = Math.min(parseFloat(e.target.value || "0"), maxProteinPct)
            setPct({ ...pct, protein })
        }
        if (macrosType === MacroNutrient.FAT) {
            const fat = Math.min(parseFloat(e.target.value || "0"), maxFatPct)
            setPct({ ...pct, fat })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Piano settimanale</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-6">
                <div>
                    <label className="text-xs opacity-70">Nome piano</label>
                    <Input type="text" value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Inserisci nome piano" />
                </div>
                <div>
                    <label className="text-xs opacity-70">kcal/giorno</label>
                    <Input type="number" value={dailyKcal} onChange={e => setDailyKcal(parseInt(e.target.value || "0"))} />
                </div>
                <div>
                    <label className="text-xs opacity-70">Carbo % ({gramsFromPct(dailyKcal, pct).carb} g)</label>
                    <Input max={maxCarbPct} type="number" value={pct.carb} onChange={e => handleMacroNutrientPctChange(e, MacroNutrient.CARBOHYDRATE)} />
                </div>
                <div>
                    <label className="text-xs opacity-70">Proteine % ({gramsFromPct(dailyKcal, pct).protein} g)</label>
                    <Input max={maxProteinPct} type="number" value={pct.protein} onChange={e => handleMacroNutrientPctChange(e, MacroNutrient.PROTEIN)} />
                </div>
                <div>
                    <label className="text-xs opacity-70">Grassi % ({gramsFromPct(dailyKcal, pct).fat} g)</label>
                    <Input max={maxFatPct} type="number" value={pct.fat} onChange={e => handleMacroNutrientPctChange(e, MacroNutrient.FAT)} />
                </div>
                <div className="flex items-end">
                    <Button onClick={createPlan} disabled={loading}>
                        {loading ? "Creating..." : "Crea piano"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}