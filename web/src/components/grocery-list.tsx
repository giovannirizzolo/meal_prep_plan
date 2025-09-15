import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ItemDraft } from "@/src/lib/macros";


function parseGFromServing(s?: string): number | null {
    if (!s) return null;
    const m = s.match(/(\d+(?:[\.,]\d+)?)\s*g/i);
    if (!m) return null;
    return parseFloat(m[1].replace(",", "."));
}


type Row = {
    key: string; name: string; brand?: string;
    perDayG: number; days: number; totalG: number;
    packG: number | null; packages: number | null;
};


type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    meals: ItemDraft[][]; // day selections (FE state)
    defaultDays?: number;
};


export default function GroceryListDialog({ open, onOpenChange, meals, defaultDays = 5 }: Props) {
    const [days, setDays] = useState<number>(defaultDays);
    const [packSizes, setPackSizes] = useState<Record<string, number>>({});


    useEffect(() => { if (open) setDays(defaultDays); }, [open, defaultDays]);


    const rows: Row[] = useMemo(() => {
        const map = new Map<string, { name: string; brand?: string; perDayG: number; packGuess: number | null }>();
        meals.flat().forEach(it => {
            const k = it.food.code || it.food.name;
            const cur = map.get(k) || { name: it.food.name, brand: it.food.brand, perDayG: 0, packGuess: parseGFromServing(it.food.serving_size) };
            cur.perDayG += it.grams; map.set(k, cur);
        });
        return Array.from(map.entries()).map(([key, v]) => {
            const totalG = +(v.perDayG * days).toFixed(1);
            const packG = packSizes[key] ?? v.packGuess ?? null;
            const packages = packG && packG > 0 ? Math.ceil(totalG / packG) : null;
            return { key, name: v.name, brand: v.brand, perDayG: +v.perDayG.toFixed(1), days, totalG, packG, packages };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [meals, days, packSizes]);


    function setPack(key: string, val: number) {
        setPackSizes(prev => ({ ...prev, [key]: val }));
    }


    function copyText() {
        const lines = rows.map(r => `${r.name}${r.brand ? ` (${r.brand})` : ''}: ${r.totalG} g` + (r.packG ? ` • ${r.packages} x ${r.packG}g` : ''));
        navigator.clipboard?.writeText(lines.join("\n"));
    }


    function downloadCSV() {
        const header = ['Item', 'Brand', 'PerDay_g', 'Days', 'Total_g', 'Pack_g', 'Packages'];
        const body = rows.map(r => [r.name, r.brand || '', r.perDayG, r.days, r.totalG, r.packG || '', r.packages || '']);
        const csv = [header, ...body].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `grocery_list_${days}d.csv`; a.click();
        URL.revokeObjectURL(url);
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Lista della spesa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-end gap-3">
                        <div>
                            <label className="text-xs opacity-70">Giorni da coprire</label>
                            <Input type="number" value={days} onChange={e => setDays(parseInt(e.target.value || '1'))} />
                        </div>
                        <div className="ml-auto flex gap-2">
                            <Button variant="secondary" onClick={copyText}>Copy</Button>
                            <Button onClick={downloadCSV}>Export CSV</Button>
                        </div>
                    </div>


                    <div className="border rounded">
                        <div className="grid grid-cols-6 px-3 py-2 text-xs font-medium">
                            <div className="col-span-2">Alimento</div>
                            <div className="text-right">g/giorno</div>
                            <div className="text-right">g totali</div>
                            <div className="text-right">Pack (g)</div>
                            <div className="text-right">Confezioni</div>
                        </div>
                        <div className="divide-y">
                            {rows.map(r => (
                                <div key={r.key} className="grid grid-cols-6 px-3 py-2 text-sm items-center">
                                    <div className="col-span-2 truncate" title={r.name}>{r.name}{r.brand ? ` – ${r.brand}` : ''}</div>
                                    <div className="text-right tabular-nums">{r.perDayG}</div>
                                    <div className="text-right tabular-nums">{r.totalG}</div>
                                    <div className="text-right">
                                        <Input className="h-8 w-24 ml-auto text-right" type="number" value={r.packG ?? ''} placeholder="es. 150"
                                            onChange={e => setPack(r.key, parseFloat(e.target.value || '0'))} />
                                    </div>
                                    <div className="text-right tabular-nums">{r.packages ?? '—'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}