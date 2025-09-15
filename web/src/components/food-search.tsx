import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";



const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";


type FoodHit = {
    code: string;
    name: string;
    brand?: string;
    nutrition_data_per?: string; // often "100g"
    serving_size?: string; // e.g. "170 g"
    per_100g: { kcal: number; protein_g: number; carb_g: number; fat_g: number };
};


type SearchResp = { count: number; results: FoodHit[] };


export default function FoodSearch() {
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [hits, setHits] = useState<FoodHit[]>([]);
    const [selected, setSelected] = useState<FoodHit | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const debouncedQ = useDebounce(q, 600);


    useEffect(() => {
        if (!debouncedQ || debouncedQ.length < 2) {
            setHits([]); setSelected(null); return;
        }
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoading(true);
        fetch(`${API}/foods/search?q=${encodeURIComponent(debouncedQ)}&size=5`, { signal: ac.signal })
            .then(r => r.json())
            .then((data: SearchResp) => { setHits(data.results || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [debouncedQ]);


    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Cerca alimento</CardTitle>
                    <CardDescription>Fonte: Open Food Facts (Italia)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-3">
                        <Input
                            placeholder="Es: yogurt greco fage total"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-72 rounded border">
                        <div className="p-2">
                            {loading && <LoadingList />}
                            {!loading && hits.map(h => (
                                <div key={h.code} className={cn("p-2 rounded hover:bg-accent cursor-pointer")}
                                    onClick={() => setSelected(h)}>
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium">{h.name} {h.brand ? `– ${h.brand}` : ""}</div>
                                        <Badge variant="secondary">{h.per_100g.kcal} kcal /100g</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">P {h.per_100g.protein_g} g • C {h.per_100g.carb_g} g • F {h.per_100g.fat_g} g</div>
                                    <Separator className="my-2" />
                                </div>
                            ))}
                            {!loading && hits.length === 0 && debouncedQ.length >= 2 && (
                                <div className="text-sm text-muted-foreground p-2">Nessun risultato.</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>


            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Dettaglio alimento</CardTitle>
                    <CardDescription>Macro e kcal per 100 g e per porzione</CardDescription>
                </CardHeader>
                <CardContent>
                    {!selected ? (
                        <div className="text-sm text-muted-foreground">Seleziona un elemento dalla lista…</div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-lg font-semibold">{selected.name} {selected.brand ? `– ${selected.brand}` : ""}</div>
                            <div className="text-xs text-muted-foreground">nutrition_data_per: {selected.nutrition_data_per || "n/d"} {selected.serving_size ? `• porzione: ${selected.serving_size}` : ""}</div>


                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Per</TableHead>
                                        <TableHead className="text-right">kcal</TableHead>
                                        <TableHead className="text-right">Proteine</TableHead>
                                        <TableHead className="text-right">Carbo</TableHead>
                                        <TableHead className="text-right">Grassi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>100 g</TableCell>
                                        <TableCell className="text-right">{selected.per_100g.kcal}</TableCell>
                                        <TableCell className="text-right">{selected.per_100g.protein_g} g</TableCell>
                                        <TableCell className="text-right">{selected.per_100g.carb_g} g</TableCell>
                                        <TableCell className="text-right">{selected.per_100g.fat_g} g</TableCell>
                                    </TableRow>
                                    {selected.serving_size && (
                                        <TableRow>
                                            <TableCell>porzione ({selected.serving_size})</TableCell>
                                            <TableCell className="text-right">{Math.round(scale(selected, "kcal"))}</TableCell>
                                            <TableCell className="text-right">{fmt(scale(selected, "protein_g"))} g</TableCell>
                                            <TableCell className="text-right">{fmt(scale(selected, "carb_g"))} g</TableCell>
                                            <TableCell className="text-right">{fmt(scale(selected, "fat_g"))} g</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


function useDebounce<T>(val: T, ms = 300) {
    const [v, setV] = useState(val);
    useEffect(() => { const t = setTimeout(() => setV(val), ms); return () => clearTimeout(t); }, [val, ms]);
    return v;
}


function parseServingGrams(serving?: string): number | null {
    if (!serving) return null;
    const m = serving.match(/(\d+(?:[\.,]\d+)?)\s*g/i);
    if (!m) return null;
    return parseFloat(m[1].replace(",", "."));
}


function scale(h: FoodHit, key: keyof FoodHit["per_100g"]) {
    const g = parseServingGrams(h.serving_size);
    if (!g) return (h.per_100g as any)[key];
    return (Number((h.per_100g as any)[key]) * g) / 100;
}


function fmt(n: number) {
    return (Math.round(n * 10) / 10).toFixed(1);
}


function LoadingList() {
    return (
        <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Separator />
                </div>
            ))}
        </div>
    );
}
