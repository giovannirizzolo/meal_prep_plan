# Meal Prep Planner (MPP) – MVP Requirements & Environment Setup (Docker)

*Last updated: 28 Aug 2025*

## 0) Executive Summary

L’MVP del **Meal Prep Planner (MPP)** genera un piano multi‑giorno, con macro/kcal per alimento→pasto→giorno, e alla finalizzazione produce **meal‑prep plan** (eventi ICS) e **lista della spesa**. Fonti dati: **Open Food Facts** (prodotti IT) + **USDA FDC** (alimenti generici). Stack: **FastAPI + Postgres + Next.js**, orchestrati via **Docker Compose**.

---

## 1) Obiettivi

* **O1**: Permettere di definire obiettivi calorici e macro giornalieri e il numero di pasti/giorno.
* **O2**: Creare un piano per *N* giorni con dettaglio per **alimento/pasto/giorno** e **totali**.
* **O3**: Consentire l’aggiunta di alimenti da database (Italia‑friendly) + inserimento manuale.
* **O4**: Alla finalizzazione, generare **meal‑prep plan** (ICS) e **lista della spesa**.
* **O5**: Preparare basi per estensioni: inventario, indice freschezza, integrazioni (Google Calendar API).

### Fuori scope (MVP)

* Auth multi‑utente, ruoli;
* Ottimizzatore avanzato (costi €/preferenze apprese);
* Ricette composte & batch‑cooking ottimale per shelf‑life aperto/chiuso;
* Integrazione API Google Calendar (si usa ICS export).

---

## 2) Utenti & Casi d’uso

**Persona:** utente che segue una dieta con target macro; vuole un piano di 3–7 giorni e un paio di slot per cucinare in batch.

**User stories**

1. *Come utente* imposto kcal e macro target, n° pasti/giorno e giorni (3–7) → *voglio* un piano con macro/kcal per pasto e per giorno.
2. *Come utente* voglio cercare e aggiungere alimenti (generici o di marca italiana) → *per* costruire i pasti che il planner suggerisce.
3. *Come utente* alla finalizzazione voglio una **lista della spesa** aggregata e un **file ICS** con le attività di meal‑prep e task (es. scongelare).
4. *Come utente* voglio esportare il piano in JSON/CSV.

**Criteri di accettazione (DoD)**

* Calcolo corretto di kcal/P/C/F **per alimento, per pasto, per giorno** e totali piano;
* Tolleranza per pasto configurabile (es. ±10%);
* Generazione **shopping list** aggregata (grammi + unità suggerite se note);
* **ICS** scaricabile con almeno uno slot di meal‑prep per settimana di piano + task critici;
* Import da fonti pubbliche + inserimento manuale funzionanti.

---

## 3) Requisiti funzionali

**RF1.** Input obiettivi (kcal totali, macro in g o %, giorni, pasti/giorno, tolleranze).
**RF2.** Ricerca alimenti (OFF, FDC, manuale), con nutrienti *per 100 g*.
**RF3.** Planner multi‑giorno che propone quantità in g per ogni alimento/pasto/giorno.
**RF4.** Output dettagliato: tabella alimento→pasto→giorno con kcal/P/C/F e totali.
**RF5.** Finalizzazione ⇒ **shopping list** + **ICS** (meal‑prep & task).
**RF6.** Export JSON/CSV.

## 4) Requisiti non funzionali

* **Performance:** generazione piano 3–7 giorni in < 2 s con 100–500 alimenti candidati.
* **Qualità dati:** filtri su OFF (record completi, per\_100g); fallback FDC per generici.
* **Affidabilità:** unit test su calcoli nutrienti e aggregazioni.
* **Portabilità:** tutto containerizzato (Docker), 1 comando `docker compose up`.
* **Licenze:** OFF (ODbL, attribuzione), FDC (CC0). Nessuna ridistribuzione pubblica dei dump nel MVP.

---

## 5) Dati & Modello

**Fonti**: Open Food Facts (prodotti con barcode, Italia), USDA FDC (alimenti generici).

**Tabelle principali (PostgreSQL)**

* `food_items(id, source{FDC|OFF|USER}, source_id, brand, name, category, is_active)`
* `nutrients(food_id, per_100g_kcal, per_100g_protein, per_100g_carb, per_100g_fat, per_100g_fiber?, sodium_mg?)`
* `servings(id, food_id, label, grams)`
* `meal_plans(id, days, kcal_target, protein_target_g, carb_target_g, fat_target_g, meals_per_day, tolerance_pct, status)`
* `plan_days(id, plan_id, day_index)`
* `plan_meals(id, plan_day_id, meal_index, label)`
* `meal_items(id, plan_meal_id, food_id, quantity_g)`

*(Estensioni future: `inventory_*`, `shelf_life`, `prep_batches`, `calendar_tasks`)*

---

## 6) API (MVP)

**`POST /foods/import`** – importa batch da OFF/FDC (subset categorie).
**`GET /foods?query=&source=`** – ricerca alimenti.
**`POST /foods`** – inserimento manuale alimento+nutrienti.
**`POST /plan`** – crea piano: `{days, meals_per_day, kcal_target, protein_target_g, carb_target_g, fat_target_g, tolerance_pct, filters…}`.
**`GET /plan/{id}`** – dettaglio completo con totali.
**`POST /plan/{id}/finalize`** – blocca piano, produce artifacts.
**`GET /plan/{id}/shopping-list`** – lista spesa aggregata.
**`GET /plan/{id}/prep.ics`** – calendario meal‑prep (ICS).

*Schema nutrienti per item*
`kcal = q_g * per_100g_kcal / 100`, idem per P/C/F.

---

## 7) Planner – Strategia MVP

* Default: **Heuristic “template + scaling + greedy fix”** per pasto (carb + proteina + grasso), con step 5 g e vincoli di tolleranza per pasto.
* Opzione (flag): **LP semplice (PuLP/OR‑Tools)** — attivabile in container separato (non obbligatorio all’MVP).

**Tolleranze** per pasto: ±`tolerance_pct` sui target giornalieri divisi per `meals_per_day`.

---

## 8) Meal‑prep & ICS (MVP)

* Raggruppa ingredienti “cucinabili” in 1–2 **batch** per la settimana.
* Crea eventi ICS: `SUMMARY: Meal Prep – Batch Giorni 1–3`, `DESCRIPTION: step sintetici` + eventuali task (es. “Scongela pollo”).
* Endpoint: `GET /plan/{id}/prep.ics` (Content‑Type `text/calendar`).

---

## 9) UX (wireframe testuale)

* **Form**: kcal, macro (g/%), giorni, pasti/giorno, tolleranza, filtri alimenti.
* **Tab Piano**: griglia Giorno→Pasto→(Alimenti, g) + totali pasto e giorno.
* **Pannello Totali**: scostamento vs target.
* **Finalizza**: pulsanti “Scarica ICS” e “Lista spesa”.

---

## 10) Rischi & Mitigazioni

* **Qualità OFF** disomogenea → filtri record completi; fallback FDC.
* **Solver LP** con dipendenze native → tenerlo opzionale; heuristica default.
* **Licenze** → attribuzione chiara in UI e README; niente ridistribuzione dump.

---

## 11) Metriche di successo (MVP)

* Tempo generazione piano < 2 s (3–7 giorni, 3 pasti/giorno).
* Scostamento medio per pasto ≤ tolleranza.
* 0 errori nei calcoli macro/kcal (unit test).

---

## 12) Roadmap breve

* **D0–D1**: Schema DB, importer OFF/FDC (subset), endpoint `/foods`, planner heuristico, `/plan` + `/plan/{id}`.
* **D2**: Finalizzazione (shopping list + ICS), UI minima Next.js, docker‑compose.

---

# Parte B — Environment Setup (Docker)

## B1) Architettura (servizi)

* **db**: PostgreSQL 16
* **api**: FastAPI + Uvicorn (planner incluso)
* **web**: Next.js (UI minima)
* **importer**: job on‑demand per import FDC/OFF (eseguito a richiesta)
* **pgadmin** (opzionale, comodo in locale)

## B2) Struttura repo

```
mpp/
  docker-compose.yml
  .env.example
  api/
    Dockerfile
    requirements.txt
    app/
      __init__.py
      main.py
      models.py
      schemas.py
      db.py
      planner/
        __init__.py
        heuristic.py
  web/
    Dockerfile
    package.json
    next.config.js
    src/pages/index.tsx
  db/
    init/001_schema.sql
  importer/
    Dockerfile
    requirements.txt
    run.py
```
---

## B3) Avvio & Comandi

```bash
cp .env.example .env
```
---
```bash
make start
```
oppure 
```bash
docker compose up -d --build
# opzionale: run importer quando pronto
# docker compose run --rm importer
```

API disponibile su `http://localhost:8000/docs`, web su `http://localhost:3000`, pgAdmin su `http://localhost:5050`.

---

## B4) Testing minimo

* **Unit test** su: conversione per\_100g → quantità, aggregazione totali pasto/giorno, shopping list.
* Endpoint `/health`, `/plan` smoke test con dati mock.

---

## B5) Prossimi passi

1. Implementare `001_schema.sql` + modelli SQLAlchemy.
2. Completare planner **heuristic** e calcoli totali.
3. Implementare shopping list + generatore **ICS**.
4. UI: form obiettivi → chiamata `/plan` → griglia piano → pulsante **Finalizza** (download ICS + lista spesa).
