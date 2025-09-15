import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DayBuilder from "@/src/components/day-builder";

import { useState } from "react";
import Layout from "../../layout";

export default function NewDayOfEating() {
    const [kcalTarget, setKcalTarget] = useState<number>(1900)
    return (
        <Layout>  
            <Label htmlFor="kcalTarget">Kcal Target</Label>
            <Input id="kcalTarget" type="number" value={kcalTarget} onChange={e => setKcalTarget(parseFloat(e.target.value || "0"))}/>
            <DayBuilder dayIndex={0} kcalTarget={kcalTarget} pct={{
                carb: 10,
                protein: 10,
                fat: 10
            }} />
        </Layout>
    )
}