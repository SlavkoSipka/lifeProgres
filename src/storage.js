/* =========================================================
   ČUVANJE PODATAKA

   Podrazumevano: localStorage (radi odmah, bez ičega)
   Opciono: Supabase (ako hoćeš isto stanje na telefonu i laptopu)

   Da uključiš Supabase, napravi .env fajl:
     VITE_SUPABASE_URL=https://tvojprojekat.supabase.co
     VITE_SUPABASE_KEY=tvoj_anon_key
     VITE_KORISNIK=marko

   SQL za tabelu je u README.md
   ========================================================= */

const KLJUC = "tabla:v1";
const URL = import.meta.env?.VITE_SUPABASE_URL;
const KEY = import.meta.env?.VITE_SUPABASE_KEY;
const KORISNIK = import.meta.env?.VITE_KORISNIK || "ja";
const CLOUD = Boolean(URL && KEY);

export const rezimCuvanja = CLOUD ? "Supabase" : "ovaj uređaj";

function lokalnoUcitaj() {
  try {
    const s = localStorage.getItem(KLJUC);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function lokalnoSnimi(data) {
  try {
    localStorage.setItem(KLJUC, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

async function cloudUcitaj() {
  const r = await fetch(`${URL}/rest/v1/tabla?korisnik=eq.${KORISNIK}&select=podaci`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) throw new Error("supabase get");
  const redovi = await r.json();
  return redovi[0]?.podaci ?? null;
}

async function cloudSnimi(data) {
  const r = await fetch(`${URL}/rest/v1/tabla?on_conflict=korisnik`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ korisnik: KORISNIK, podaci: data, izmenjeno: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error("supabase post");
  return true;
}

/* Uvek piše i lokalno, pa Supabase služi samo za sinhronizaciju.
   Ako internet padne, aplikacija nastavlja da radi. */

export async function ucitaj() {
  const lokalno = lokalnoUcitaj();
  if (!CLOUD) return lokalno;
  try {
    const sa_neta = await cloudUcitaj();
    if (sa_neta) {
      lokalnoSnimi(sa_neta);
      return sa_neta;
    }
  } catch {
    /* nema veze, koristi lokalno */
  }
  return lokalno;
}

export async function snimi(data) {
  const ok = lokalnoSnimi(data);
  if (!CLOUD) return ok;
  try {
    await cloudSnimi(data);
    return true;
  } catch {
    return "samo-lokalno";
  }
}

export function izvezi(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL_OBJ(blob);
  a.download = `tabla-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

function URL_OBJ(blob) {
  return window.URL.createObjectURL(blob);
}
