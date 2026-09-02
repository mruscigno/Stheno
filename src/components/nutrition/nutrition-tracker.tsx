/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { PlanExperience } from "@/components/plan/plan-experience";
import "./nutrition-tracker.css";
type Food = {
  id?: string;
  name?: string;
  food_name_snapshot?: string;
  brand?: string;
  brand_snapshot?: string;
  servingQuantity?: number;
  serving_quantity?: number;
  servingUnit?: string;
  serving_unit?: string;
  calories: number;
  protein?: number;
  protein_g?: number;
  carbs?: number;
  carbs_g?: number;
  fat?: number;
  fat_g?: number;
  fiber?: number;
  fiber_g?: number;
  provider?: string;
  providerItemId?: string;
};
type Day = {
  entries: (Food & { id: string; meal_type: string })[];
  recent: Food[];
  summary: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    loggingStatus: string;
    target?: { calories_kcal: number; protein_g: number };
  };
  adherence: {
    completeDays: number;
    calorieAdherence: number | null;
    proteinAdherence: number | null;
    confidence: string;
  };
};
const today = () => {
  const d = new Date(),
    offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};
export function NutritionTracker() {
  const [date, setDate] = useState(today),
    [data, setData] = useState<Day | null>(null),
    [meal, setMeal] = useState("breakfast"),
    [search, setSearch] = useState(""),
    [results, setResults] = useState<Food[]>([]),
    [showGuidance, setShowGuidance] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [searched, setSearched] = useState(false);
  const load = useCallback(async () => {
    const r = await fetch(`/api/nutrition/day?date=${date}`, {
      cache: "no-store",
    });
    const b = await r.json();
    if (r.ok) setData(b);
    else setError(b.error ?? "Unable to load today.");
  }, [date]);
  useEffect(() => {
    void load();
  }, [load]);
  async function add(f: Food, sourceType = "search") {
    setBusy(true);
    const r = await fetch("/api/nutrition/day", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        localDate: date,
        mealType: meal,
        name: f.name ?? f.food_name_snapshot,
        brand: f.brand ?? f.brand_snapshot,
        servingQuantity: f.servingQuantity ?? f.serving_quantity ?? 1,
        servingUnit: f.servingUnit ?? f.serving_unit ?? "serving",
        calories: Number(f.calories),
        protein: Number(f.protein ?? f.protein_g ?? 0),
        carbs: Number(f.carbs ?? f.carbs_g ?? 0),
        fat: Number(f.fat ?? f.fat_g ?? 0),
        fiber: Number(f.fiber ?? f.fiber_g ?? 0),
        sourceType,
        provider: f.provider,
        providerItemId: f.providerItemId,
      }),
    });
    setBusy(false);
    if (r.ok) {
      setResults([]);
      setSearch("");
      await load();
    } else setError((await r.json()).error);
  }
  async function find(e: FormEvent) {
    e.preventDefault();
    if (search.trim().length < 2) return;
    setBusy(true); setError(""); setSearched(false);
    try { const r = await fetch(`/api/food/search?q=${encodeURIComponent(search)}`), b = await r.json(); if(!r.ok)throw new Error(b.error??"Food search is unavailable."); setResults(b.results ?? []); setSearched(true); }
    catch(cause){setResults([]);setError(cause instanceof Error?cause.message:"Food search is unavailable.");}
    finally{setBusy(false)}
  }
  async function remove(id: string) {
    await fetch("/api/nutrition/day", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, localDate: date }),
    });
    await load();
  }
  async function complete() {
    await fetch("/api/nutrition/day", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "complete", localDate: date }),
    });
    await load();
  }
  const t = data?.summary.target,
    pct = t
      ? Math.min(
          100,
          Math.round((data!.summary.calories / Number(t.calories_kcal)) * 100),
        )
      : 0;
  return (
    <main className="nutrition-tracker">
      <header className="tracker-hero">
        <div>
          <p className="eyebrow">Nutrition intelligence</p>
          <h1>
            Track enough.
            <br />
            Learn what works.
          </h1>
          <p>
            Log meals without turning food into a test. Only days you explicitly
            complete count toward adherence or coaching decisions.
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => setShowGuidance((v) => !v)}
        >
          {showGuidance ? "Back to today" : "View my targets & guidance"}
        </button>
      </header>
      {showGuidance ? (
        <PlanExperience />
      ) : (
        <>
          <section className="day-toolbar">
            <label>
              Day
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <div>
              <span>{data?.summary.loggingStatus ?? "none"} log</span>
              <button
                className="button"
                onClick={complete}
                disabled={!data?.entries.length}
              >
                Mark day complete
              </button>
            </div>
          </section>
          <section className="today-grid">
            <article className="daily-card">
              <p className="eyebrow">Daily picture</p>
              <div
                className="calorie-ring"
                style={
                  { "--progress": `${pct * 3.6}deg` } as React.CSSProperties
                }
              >
                <strong>{Math.round(data?.summary.calories ?? 0)}</strong>
                <span>of {t?.calories_kcal ?? "—"} kcal</span>
              </div>
              <div className="macro-row">
                <span>
                  <b>{Math.round(data?.summary.protein ?? 0)}g</b> protein
                </span>
                <span>
                  <b>{Math.round(data?.summary.carbs ?? 0)}g</b> carbs
                </span>
                <span>
                  <b>{Math.round(data?.summary.fat ?? 0)}g</b> fat
                </span>
              </div>
            </article>
            <article className="adherence-card">
              <p className="eyebrow">Seven-day evidence</p>
              <h2>{data?.adherence.completeDays ?? 0} complete days</h2>
              {data?.adherence.calorieAdherence === null ? (
                <p>
                  Complete at least three days before STHENO interprets
                  adherence. Partial logs are never treated as under-eating.
                </p>
              ) : (
                <div className="adherence-stats">
                  <span>
                    <b>{data?.adherence.calorieAdherence ?? 0}%</b> calorie range
                  </span>
                  <span>
                    <b>{data?.adherence.proteinAdherence ?? 0}%</b> protein range
                  </span>
                </div>
              )}
              <small>Confidence: {data?.adherence.confidence ?? "low"}</small>
            </article>
          </section>
          <section className="log-panel">
            <div className="log-heading">
              <div>
                <p className="eyebrow">Add food</p>
                <h2>What did you eat?</h2>
              </div>
              <select
                aria-label="Meal"
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <form className="food-search" onSubmit={find} aria-busy={busy}>
              <input
                aria-label="Search food"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a food or brand"
              />
              <button className="button" disabled={busy}>
                {busy ? "Searching…" : "Search"}
              </button>
            </form>
            {error && <p role="alert">{error}</p>}
            {searched && results.length === 0 && !error ? <p className="search-empty" role="status">No matches found. Try a simpler food name or use quick add below.</p> : null}
            {results.length > 0 && (
              <div className="search-results">
                {results.map((f) => (
                  <button key={f.id} onClick={() => add(f)}>
                    <span>
                      <b>{f.name}</b>
                      <small>{f.brand || "Open Food Facts"} · per 100g</small>
                    </span>
                    <strong>{Math.round(f.calories)} kcal</strong>
                  </button>
                ))}
              </div>
            )}
            <details className="quick-add">
              <summary>Quick add nutrition totals</summary>
              <QuickAdd onAdd={(f) => add(f, "quick_add")} />
            </details>
          </section>
          <section className="meal-log">
            <div>
              <p className="eyebrow">Today’s log</p>
              <h2>{data?.entries.length ?? 0} items</h2>
            </div>
            {["breakfast", "lunch", "dinner", "snack"].map((m) => (
              <article key={m}>
                <h3>{m}</h3>
                {data?.entries
                  .filter((e) => e.meal_type === m)
                  .map((e) => (
                    <div className="entry" key={e.id}>
                      <span>
                        <b>{e.food_name_snapshot}</b>
                        <small>
                          {e.serving_quantity} {e.serving_unit} ·{" "}
                          {Math.round(e.protein_g ?? 0)}g protein
                        </small>
                      </span>
                      <strong>{Math.round(e.calories)} kcal</strong>
                      <button
                        aria-label={`Remove ${e.food_name_snapshot}`}
                        onClick={() => remove(e.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                {!data?.entries.some((e) => e.meal_type === m) && (
                  <p className="empty-meal">Nothing logged.</p>
                )}
              </article>
            ))}
          </section>
          {Boolean(data?.recent.length) && (
            <section className="recent-foods">
              <p className="eyebrow">Recent foods</p>
              <div>
                {data!.recent.slice(0, 6).map((f, i) => (
                  <button
                    key={`${f.food_name_snapshot}-${i}`}
                    onClick={() => add(f, "recent")}
                  >
                    {f.food_name_snapshot}
                    <span>{Math.round(f.calories)} kcal</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <p className="provider-note">
            Food search data: Open Food Facts (ODbL). Values are saved as
            entered so later catalog changes never rewrite your history. Verify
            packaged-food labels when precision matters.
          </p>
        </>
      )}
    </main>
  );
}
function QuickAdd({ onAdd }: { onAdd: (f: Food) => void }) {
  const [name, setName] = useState(""),
    [calories, setCalories] = useState(""),
    [protein, setProtein] = useState(""),
    [carbs, setCarbs] = useState(""),
    [fat, setFat] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd({
          name,
          calories: Number(calories),
          protein: Number(protein),
          carbs: Number(carbs),
          fat: Number(fat),
        });
      }}
    >
      <label>
        Food or meal
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Calories
        <input
          required
          min="0"
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
      </label>
      <label>
        Protein (g)
        <input
          min="0"
          type="number"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />
      </label>
      <label>
        Carbs (g)
        <input
          min="0"
          type="number"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />
      </label>
      <label>
        Fat (g)
        <input
          min="0"
          type="number"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
        />
      </label>
      <button className="button">Add to meal</button>
    </form>
  );
}
