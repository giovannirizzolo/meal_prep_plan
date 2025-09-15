import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { ErrorTestComponent } from "@/src/components/error-test";
import MacroGauge from "@/src/components/macro-gauge";

import { gramsFromPct } from "@/src/lib/macros";
import { PlansList } from "../components/plans-list";

import { apiClient, useApiCall } from "../lib/api-client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useEffect, useMemo, useState } from "react";
import { WeeklyPlan } from "../types/food";
import { PlanCreation } from "../components/plan-creation";
import { NavigationMenuCustom } from "@/src/components/navigation-menu";
import Layout from "./layout";



const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function Home() {

    const [planId, setPlanId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const { callApi } = useApiCall()
    const [plans, setPlans] = useState<WeeklyPlan[]>(null)
    const [showCreatePlan, setShowCreatePlan] = useState<boolean>(false)

    async function getPlans() {
        setIsLoading(true)
        const results = await callApi(
            () => apiClient.get(`${API}/weekly-plans/plans`),
            {
                errorMessage: 'Failed to fetch all plans',
                showSuccess: true,
                successMessage: "Plans fetched successfully"
            }
        )
        if (results) {
            setPlans(results)
        }
        setIsLoading(false)
    }
    useEffect(() => {
        getPlans()
    }, [])

    const currentPlan: WeeklyPlan = useMemo(() => {
        if (!plans) return null;
        return plans.find(plan => plan.id === planId);
    }, [planId, plans])

    return (
        <Layout>
            <NavigationMenuCustom />
            <PlansList plansList={plans} isLoading={isLoading} handleCreateNew={() => setShowCreatePlan(!showCreatePlan)} />
            <Select onValueChange={(value) => setPlanId(value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                    {plans?.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {showCreatePlan && <PlanCreation />}

            {planId && (
                <>
                    <Card>
                        <CardHeader><CardTitle>Gauge (target giornaliero)</CardTitle></CardHeader>
                        <CardContent>
                            <CardDescription>{currentPlan.daily_kcal}kcal</CardDescription>
                            <MacroGauge totalKcal={currentPlan.daily_kcal} />
                            <div className="text-xs text-muted-foreground mt-10 mb-4">
                                Target(g):
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                                C {gramsFromPct(currentPlan.daily_kcal, currentPlan.macro_pct).carb} • P {gramsFromPct(currentPlan.daily_kcal, currentPlan.macro_pct).protein} • F {gramsFromPct(currentPlan.daily_kcal, currentPlan.macro_pct).fat}
                            </div>
                        </CardContent>
                    </Card>


                </>
            )}

            {/* Development error testing - remove in production */}
            {process.env.NODE_ENV === 'development' && (
                <ErrorTestComponent />
            )}
        </Layout>
    );
}