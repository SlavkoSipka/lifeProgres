# Tabla

Praćenje dnevnih, nedeljnih i kvartalnih ciljeva do 30.09.2027.

---

## Pokretanje na laptopu

Treba ti Node 18 ili noviji.

```bash
npm install
npm run dev
```

Otvori adresu koju ispiše (obično http://localhost:5173).

---

## Gde se menjaju pravila

**Sve je u `src/config.js`.** Jedan fajl, sve na jednom mestu:

| Šta | Gde u config.js |
|---|---|
| Dnevne stavke i ciljevi | `DNEVNO` |
| Nedeljne oblasti, stavke, bodovi | `OBLASTI` |
| Kvartali, kapije, nagrade | `KVARTALI` |
| Neto imovina i MRR ciljevi | `BAZA`, `GODINA_CILJ` |
| Nagrada i kazna | `ULOG` |
| Tekst u tabu Pravila | `PRAVILA` |

Nedeljne stavke možeš da menjaš i **u samoj aplikaciji** — tab Nedelja, dugme
„Uredi kriterijume“. Tu menjaš tekst, bodove, brišeš i dodaješ stavke.
Te izmene se čuvaju sa podacima i prebijaju ono iz `config.js`.
Dugme „Vrati kriterijume“ u tabu Pravila ih poništava.

### Pravilo za menjanje

Stavku smeš da izbaciš samo ako možeš da kažeš **koji cilj iz 2027. ona ne služi.**
„Neprijatno mi je“ nije razlog — to je obično znak da stavka radi.

---

## Kako se računa ocena

- Bodovi su binarni. 4 treninga od 5 je 0 bodova za taj red.
- Ocena oblasti = osvojeni bodovi / mogući bodovi, skalirano na 10.
- Stavke sa `auto` se računaju same iz dnevnih unosa i ne mogu ručno da se čekiraju.
  Format je `polje>=broj`, gde se `polje` zbraja kroz sedam dana nedelje.
  Primer: `trening>=5` znači pet treninga u nedelji.
- Ukupno = zbir ocena svih oblasti.

---

## Objavljivanje na Netlify

**Preko GitHuba (preporučeno):**

1. Napravi repo i pošalji kod:
   ```bash
   git init && git add . && git commit -m "prvi"
   git remote add origin https://github.com/KORISNIK/tabla.git
   git push -u origin main
   ```
2. Na Netlify: Add new site → Import an existing project → izaberi repo.
3. Build command i publish folder se čitaju iz `netlify.toml`, ne diraj ih.

**Bez GitHuba:**

```bash
npm run build
```
Pa prevuci folder `dist` na netlify.com/drop.

Kad je objavljeno, na telefonu otvori adresu i dodaj na početni ekran —
ponaša se kao aplikacija.

---

## Supabase (opciono)

Bez ovoga sve radi, ali podaci stoje samo na uređaju na kom si ih uneo.
Supabase treba ako hoćeš isto stanje na telefonu i na laptopu.

**1. Napravi projekat** na supabase.com i u SQL Editoru pokreni:

```sql
create table tabla (
  korisnik text primary key,
  podaci jsonb not null default '{}'::jsonb,
  izmenjeno timestamptz default now()
);

alter table tabla enable row level security;

-- Jednostavno: anon ključ sme da čita i piše.
-- Dovoljno za ličnu upotrebu jer adresa nije javna,
-- ali ne stavljaj ovde ništa što ne sme da procuri.
create policy "citanje" on tabla for select using (true);
create policy "pisanje" on tabla for insert with check (true);
create policy "izmena"  on tabla for update using (true);
```

**2. Napravi `.env` fajl** u korenu projekta:

```
VITE_SUPABASE_URL=https://tvojprojekat.supabase.co
VITE_SUPABASE_KEY=tvoj_anon_key
VITE_KORISNIK=marko
```

Ključeve nađeš u Supabase: Settings → API.

**3. Na Netlify** iste tri promenljive dodaj u Site settings → Environment variables,
pa pokreni novi deploy.

Aplikacija uvek prvo piše lokalno, pa onda šalje na Supabase.
Ako internet padne, nastavlja da radi i ne gubiš unos.

Ako Strahinja radi isto — isti projekat, druga vrednost `VITE_KORISNIK`.

---

## Rezervna kopija

Tab Pravila → „Izvezi kao JSON“. Uradi to na kraju svakog kvartala.

---

## Struktura

```
src/
  config.js    sva pravila, ciljevi, bodovi        ← ovde se menja
  storage.js   localStorage + opcioni Supabase
  App.jsx      ekrani i logika ocenjivanja
  stil.css     izgled
  main.jsx     ulazna tačka
```
