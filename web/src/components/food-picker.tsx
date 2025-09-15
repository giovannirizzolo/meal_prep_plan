import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { FoodHit } from "@/types/food";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type Props = { onPick: (food: FoodHit) => void };

export default function FoodPicker({ onPick }: Props) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<FoodHit[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!q || q.length < 2) { setHits([]); return; }
    abortRef.current?.abort();
    const ac = new AbortController(); abortRef.current = ac; setLoading(true);
    fetch(`${API}/foods/search?q=${encodeURIComponent(q)}&size=5`, { signal: ac.signal })
      .then(r => r.json()).then(d => { setHits(d.results || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q]);

  return (
    <Card>
      <CardContent className="p-3">
        <Input placeholder="Cerca alimento..." value={q} onChange={e => setQ(e.target.value)} />
        <ScrollArea className="h-56 mt-3 rounded border">
          <div className="p-2">
            {loading && <div className="text-sm opacity-70">Caricamento…</div>}
            {!loading && hits.map(h => (
              <div key={h.code} className="p-2 rounded hover:bg-accent cursor-pointer" onClick={() => onPick(h)}>
                <div className="font-medium">{h.name} {h.brand ? `– ${h.brand}` : ""}</div>
                <div className="text-xs text-muted-foreground">{h.per_100g.kcal} kcal/100g • P {h.per_100g.protein_g} • C {h.per_100g.carb_g} • F {h.per_100g.fat_g}</div>
                <Separator className="my-2" />
              </div>
            ))}
            {!loading && hits.length === 0 && q.length >= 2 && (
              <div className="text-sm text-muted-foreground">Nessun risultato.</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}