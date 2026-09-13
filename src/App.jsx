import React, { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DNEVNO, OBLASTI, KVARTALI, PRAVILA, ULOG, BAZA, GODINA_CILJ, POCETAK, KRAJ } from "./config.js";
import { ucitaj, snimi as snimiUStorage, rezimCuvanja, izvezi } from "./storage.js";

/* ============================ POMOĆNE ============================ */

/* Datum u "YYYY-MM-DD", iz LOKALNIH komponenti.
   Ne koristi toISOString() — on je UTC, pa je u Beogradu (UTC+1/+2)
   vraćao dan ranije i pomerao ceo nedeljni prozor. */
function iso(d) {
  if (typeof d === "string") return d.slice(0, 10);
  const x = d instanceof Date ? d : new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${dd}`;
}
const danas = () => iso(new Date());
const fmt = (n) => (Number(n) || 0).toLocaleString("sr-RS");

function ponedeljak(d) {
  const x = new Date(d);
  const dan = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dan);
  return iso(x);
}

function nedeljaDani(mon) {
  const out = [];
  const d = new Date(mon + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    out.push(iso(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const danaDo = (c) => Math.max(0, Math.ceil((new Date(c) - new Date()) / 86400000));

function tekuciKvartal() {
  const t = danas();
  return KVARTALI.find((q) => t >= q.od && t <= q.do) || KVARTALI[0];
}

function prazno() {
  return {
    dani: {},
    nedelje: {},
    kvartali: {},
    stanje: { status: "sam", netto: BAZA.netto, mrr: BAZA.mrr },
    dnevno: JSON.parse(JSON.stringify(DNEVNO)),
    oblasti: JSON.parse(JSON.stringify(OBLASTI)),
  };
}

/* ============================ APLIKACIJA ============================ */

export default function App() {
  const [tab, setTab] = useState("danas");
  const [data, setData] = useState(null);
  const [poruka, setPoruka] = useState("");
  const [datum, setDatum] = useState(danas());

  useEffect(() => {
    (async () => {
      const d = await ucitaj();
      if (!d) return setData(prazno());
      setData({ ...prazno(), ...d, dnevno: d.dnevno || prazno().dnevno, oblasti: d.oblasti || prazno().oblasti });
    })();
  }, []);

  const snimi = async (novo) => {
    setData(novo);
    const r = await snimiUStorage(novo);
    if (r === "samo-lokalno") setPoruka("Snimljeno lokalno. Sinhronizacija nije prošla.");
    else if (!r) setPoruka("Nije snimljeno.");
    else setPoruka("");
  };

  if (!data) return <div className="tb-load">učitavam</div>;

  return (
    <div className="tb">
      <Zaglavlje />
      {poruka && <div className="tb-greska">{poruka}</div>}

      <nav className="tb-tabs">
        {[["danas", "Danas"], ["nedelja", "Nedelja"], ["kvartal", "Kvartal"], ["godina", "Godina"], ["pravila", "Pravila"]].map(
          ([k, ime]) => (
            <button key={k} onClick={() => setTab(k)} className={tab === k ? "tb-tab tb-tab-on" : "tb-tab"}>
              {ime}
            </button>
          )
        )}
      </nav>

      <main className="tb-main">
        {tab === "danas" && <Danas data={data} snimi={snimi} datum={datum} setDatum={setDatum} />}
        {tab === "nedelja" && <Nedelja data={data} snimi={snimi} />}
        {tab === "kvartal" && <Kvartal data={data} snimi={snimi} />}
        {tab === "godina" && <Godina data={data} snimi={snimi} />}
        {tab === "pravila" && <Pravila data={data} snimi={snimi} />}
      </main>
    </div>
  );
}

/* ============================ ZAGLAVLJE ============================ */

function Zaglavlje() {
  const q = tekuciKvartal();
  return (
    <header className="tb-head">
      <div className="tb-head-row">
        <div>
          <div className="tb-kicker">{q.ime} — {q.tema}</div>
          <h1 className="tb-naslov">Tabla</h1>
        </div>
        <div className="tb-brojaci">
          <div><b>{danaDo(q.do)}</b><span>dana do kraja kvartala</span></div>
          <div><b>{danaDo(KRAJ)}</b><span>dana do 30.09.2027</span></div>
        </div>
      </div>
    </header>
  );
}

/* ============================ DANAS ============================ */

function Danas({ data, snimi, datum, setDatum }) {
  const d = data.dani[datum] || {};
  const lista = data.dnevno;
  const set = (k, v) => snimi({ ...data, dani: { ...data.dani, [datum]: { ...d, [k]: v } } });
  const pogodjeno = lista.filter((x) => (x.tip === "check" ? d[x.k] : (d[x.k] || 0) >= x.cilj)).length;

  const pomeri = (n) => {
    const x = new Date(datum + "T00:00:00");
    x.setDate(x.getDate() + n);
    if (x > new Date()) return;
    setDatum(iso(x));
  };

  return (
    <>
      <div className="tb-datum">
        <button onClick={() => pomeri(-1)} aria-label="Prethodni dan">‹</button>
        <span>{datum === danas() ? "Danas" : new Date(datum).toLocaleDateString("sr-RS", { weekday: "long", day: "numeric", month: "long" })}</span>
        <button onClick={() => pomeri(1)} disabled={datum === danas()} aria-label="Sledeći dan">›</button>
      </div>

      <div className="tb-plocica">
        <span className="tb-plocica-broj">{pogodjeno}</span>
        <span className="tb-plocica-od">/{lista.length}</span>
      </div>

      <ul className="tb-lista">
        {lista.map((x) => {
          const v = d[x.k];
          const ok = x.tip === "check" ? !!v : (v || 0) >= x.cilj;
          return (
            <li key={x.k} className={ok ? "tb-red tb-red-ok" : "tb-red"}>
              <div className="tb-red-tekst">
                <span className="tb-red-ime">{x.ime}</span>
                <span className="tb-red-pod">{x.pod}{x.tip === "broj" ? ` — cilj ${x.cilj}${x.jed || ""}` : ""}</span>
              </div>
              {x.tip === "check" ? (
                <button className={ok ? "tb-kvad tb-kvad-on" : "tb-kvad"} onClick={() => set(x.k, !v)}>{ok ? "✓" : ""}</button>
              ) : (
                <div className="tb-unos">
                  <input type="number" inputMode="decimal" value={v ?? ""} placeholder="0"
                    onChange={(e) => set(x.k, e.target.value === "" ? "" : Number(e.target.value))} />
                  <span>{x.jed}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="tb-fus">Ništa na ovoj listi nije teško. Sve na ovoj listi je teško 250 puta zaredom.</p>
    </>
  );
}

/* ============================ NEDELJA ============================ */

function autoVrednost(izraz, dani, data) {
  const [polje, prag] = izraz.split(">=");
  const p = Number(prag);
  const def = data.dnevno.find((x) => x.k === polje);
  let zbir = 0;
  dani.forEach((dd) => {
    const v = data.dani[dd] || {};
    if (def && def.tip === "check") zbir += v[polje] ? 1 : 0;
    else zbir += Number(v[polje] || 0);
  });
  const jed = def?.tip === "check" ? "x" : def?.jed || "";
  const prikaz = polje === "faks" ? `${Math.round((zbir / 60) * 10) / 10}h` : `${fmt(zbir)}${jed}`;
  return { ok: zbir >= p, txt: prikaz };
}

function oceniNedelju(w, data, mon) {
  const status = data.stanje.status;
  const dani = nedeljaDani(mon);
  const o = {};
  data.oblasti.forEach((ob) => {
    const rel = ob.stavke.filter((s) => !s.samo || s.samo === status);
    const max = rel.reduce((a, s) => a + Number(s.b), 0);
    let zbir = 0;
    rel.forEach((s) => {
      const ok = s.auto ? autoVrednost(s.auto, dani, data).ok : !!(w.stavke || {})[s.k];
      if (ok) zbir += Number(s.b);
    });
    o[ob.k] = max ? Math.round((zbir / max) * 10) : 0;
  });
  return o;
}

/* ============================ IZVEŠTAJ ZA PETAK ============================ */

const DANI_KRATKO = ["pon", "uto", "sre", "čet", "pet", "sub", "ned"];
/* Kratka imena za red "dan po dan". Ključ iz config.js kad nema unosa ovde. */
const KRATKO = { naplaceno: "naplaćeno" };
/* Nazivi iz config.js su napisani za dnevni red ("Naplaćeno danas"), pa u
   nedeljnim zbirovima zvuče pogrešno. Ovde samo ta odstupanja. */
const ZBIR_IME = { naplaceno: "Naplaćeno", trening: "Treninzi", poziv: "Prodajni pozivi", san: "Noći pre 00:30" };
const dm = (d) => `${d.slice(8)}.${d.slice(5, 7)}`;

const kvartalZa = (d) => KVARTALI.find((q) => d >= q.od && d <= q.do) || null;

/* Pravilo kapija na jednom mestu — koristi ga i tab Kvartal i izveštaj. */
function kapijaPala(kap, vrednost) {
  const v = Number(vrednost || 0);
  return kap.manje ? v > 0 && v <= kap.cilj : v >= kap.cilj;
}

function sastaviIzvestaj(data, mon) {
  const dani = nedeljaDani(mon);
  const petak = dani[4];
  const w = data.nedelje[mon] || {};
  const status = data.stanje.status;
  const R = [];

  /* 1 — zaglavlje */
  const q = kvartalZa(petak) || tekuciKvartal();
  R.push(`IZVEŠTAJ ZA PETAK — ${dm(petak)}.${petak.slice(0, 4)}.`);
  R.push(`${q.ime} — ${q.tema}`);
  R.push(`${danaDo(q.do)} dana do kraja kvartala · ${danaDo(KRAJ)} dana do 30.09.2027.`);
  R.push("");

  /* 2 i 3 — ocene po oblastima, promašene stavke u zagradi */
  const ocene = oceniNedelju(w, data, mon);
  let ukupno = 0;
  data.oblasti.forEach((ob) => {
    const rel = ob.stavke.filter((s) => !s.samo || s.samo === status);
    const promaseno = rel
      .filter((s) => !(s.auto ? autoVrednost(s.auto, dani, data).ok : !!(w.stavke || {})[s.k]))
      .map((s) => s.t);
    ukupno += ocene[ob.k];
    R.push(`${ob.ime.toUpperCase()}  ${ocene[ob.k]}/10  (${promaseno.length ? promaseno.join(", ") : "sve pogođeno"})`);
  });
  R.push(`UKUPNO  ${ukupno}/${data.oblasti.length * 10}`);
  R.push("");

  /* 4 — dan po dan */
  R.push("DAN PO DAN");
  dani.forEach((dd, i) => {
    const v = data.dani[dd];
    /* "nema unosa" znači da dan nije ni otvoren. Namerno 0 i false računamo
       kao unos — to je odgovor "ne", a ne odsustvo odgovora. */
    const ima = v && Object.keys(v).some((k) => v[k] !== "" && v[k] !== undefined && v[k] !== null);
    const glava = `${DANI_KRATKO[i]} ${dm(dd)}`;
    if (!ima) return R.push(`${glava} — nema unosa`);
    const delovi = data.dnevno.map((x) => {
      const ime = KRATKO[x.k] || x.k;
      return x.tip === "check"
        ? `${ime} ${v[x.k] ? "✓" : "✗"}`
        : `${ime} ${Number(v[x.k] || 0)}${x.jed || ""}`;
    });
    R.push(`${glava} — ${delovi.join(" · ")}`);
  });
  R.push("");

  /* 5 — nedeljni zbirovi */
  R.push("NEDELJNI ZBIROVI");
  data.dnevno.forEach((x) => {
    const ime = ZBIR_IME[x.k] || x.ime;
    if (x.tip === "check") {
      const n = dani.reduce((a, dd) => a + ((data.dani[dd] || {})[x.k] ? 1 : 0), 0);
      R.push(`${ime}: ${n} od 7`);
    } else {
      const s = dani.reduce((a, dd) => a + Number((data.dani[dd] || {})[x.k] || 0), 0);
      const uSatima = x.jed === "min" ? ` (${Math.round((s / 60) * 10) / 10}h)` : "";
      R.push(`${ime}: ${fmt(s)}${x.jed || ""}${uSatima}`);
    }
  });
  R.push("");

  /* 6 — poređenje sa prethodnom nedeljom */
  const p = new Date(mon + "T00:00:00");
  p.setDate(p.getDate() - 7);
  const prosla = iso(p);
  const prosliDani = nedeljaDani(prosla);
  const imaProslu =
    !!data.nedelje[prosla] || prosliDani.some((dd) => data.dani[dd] && Object.keys(data.dani[dd]).length);
  if (imaProslu) {
    const staro = oceniNedelju(data.nedelje[prosla] || {}, data, prosla);
    R.push(`POREĐENJE SA NEDELJOM OD ${dm(prosla)}.`);
    data.oblasti.forEach((ob) => {
      const r = ocene[ob.k] - staro[ob.k];
      R.push(`${ob.ime} ${ocene[ob.k]}/10 (${r > 0 ? "+" : ""}${r})`);
    });
    R.push("");
  }

  /* 7 — stanje kvartala */
  const kv = data.kvartali[q.id] || {};
  const pale = q.kapije.filter((kap) => kapijaPala(kap, kv[kap.k])).length;
  R.push(`KAPIJE ${q.ime} — palo ${pale}/${q.kapije.length}`);
  q.kapije.forEach((kap) => {
    const cilj = `${kap.manje ? "max " : ""}${fmt(kap.cilj)}${kap.jed || ""}`;
    R.push(`${kap.ime}: ${fmt(kv[kap.k] || 0)}${kap.jed || ""} / ${cilj}`);
  });
  R.push("");

  /* 8 — dva pitanja */
  const laz = (w.laz || "").trim();
  const izb = (w.izbegavao || "").trim();
  if (laz || izb) {
    R.push("DVA PITANJA");
    if (laz) R.push(`Najveća laž: ${laz}`);
    if (izb) R.push(`Izbegavao: ${izb}`);
  }

  return R.join("\n").trimEnd() + "\n";
}

function Nedelja({ data, snimi }) {
  const mon = ponedeljak(new Date());
  const [izabrana, setIzabrana] = useState(mon);
  const [uredi, setUredi] = useState(false);
  const [kopirano, setKopirano] = useState(false);
  const [rucno, setRucno] = useState("");
  const rucnoRef = useRef(null);
  const dani = nedeljaDani(izabrana);
  const w = data.nedelje[izabrana] || { stavke: {}, laz: "", izbegavao: "" };
  const status = data.stanje.status;

  const set = (k, v) => snimi({ ...data, nedelje: { ...data.nedelje, [izabrana]: { ...w, [k]: v } } });
  const setStavka = (k, v) => set("stavke", { ...(w.stavke || {}), [k]: v });

  const ocene = useMemo(() => oceniNedelju(w, data, izabrana), [w, data, izabrana]);
  const ukupno = Object.values(ocene).reduce((a, b) => a + b, 0);
  const maxUkupno = data.oblasti.length * 10;
  const najnize = Object.entries(ocene).sort((a, b) => a[1] - b[1]).slice(0, 2);

  const istorija = Object.keys(data.nedelje).sort().slice(-12).map((k) => ({
    n: k.slice(8) + "." + k.slice(5, 7),
    skor: Object.values(oceniNedelju(data.nedelje[k], data, k)).reduce((a, b) => a + b, 0),
  }));

  const pomeriN = (n) => {
    const x = new Date(izabrana + "T00:00:00");
    x.setDate(x.getDate() + n * 7);
    if (iso(x) > mon) return;
    setIzabrana(iso(x));
  };

  /* --- izveštaj za petak (za nedelju koja je izabrana, ne samo tekuću) --- */
  const kopirajIzvestaj = async () => {
    const tekst = sastaviIzvestaj(data, izabrana);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("nema clipboard");
      await navigator.clipboard.writeText(tekst);
      setRucno("");
      setKopirano(true);
      setTimeout(() => setKopirano(false), 2000);
    } catch {
      setRucno(tekst);
    }
  };

  /* Promena nedelje poništava zastareo izveštaj. */
  useEffect(() => {
    setRucno("");
    setKopirano(false);
  }, [izabrana]);

  useEffect(() => {
    if (rucno && rucnoRef.current) {
      rucnoRef.current.focus();
      rucnoRef.current.select();
    }
  }, [rucno]);

  /* --- izmene kriterijuma --- */
  const izmeniStavku = (obK, sK, polje, v) => {
    const oblasti = data.oblasti.map((ob) =>
      ob.k !== obK ? ob : { ...ob, stavke: ob.stavke.map((s) => (s.k === sK ? { ...s, [polje]: v } : s)) }
    );
    snimi({ ...data, oblasti });
  };
  const obrisiStavku = (obK, sK) => {
    const oblasti = data.oblasti.map((ob) =>
      ob.k !== obK ? ob : { ...ob, stavke: ob.stavke.filter((s) => s.k !== sK) }
    );
    snimi({ ...data, oblasti });
  };
  const dodajStavku = (obK) => {
    const oblasti = data.oblasti.map((ob) =>
      ob.k !== obK ? ob : { ...ob, stavke: [...ob.stavke, { k: obK + "_" + Date.now(), t: "Nova stavka", b: 2 }] }
    );
    snimi({ ...data, oblasti });
  };

  return (
    <>
      <div className="tb-datum">
        <button onClick={() => pomeriN(-1)} aria-label="Prethodna nedelja">‹</button>
        <span>{izabrana === mon ? "Ova nedelja" : `Nedelja od ${izabrana.slice(8)}.${izabrana.slice(5, 7)}.`}</span>
        <button onClick={() => pomeriN(1)} disabled={izabrana === mon} aria-label="Sledeća nedelja">›</button>
      </div>

      <div className="tb-plocica">
        <span className="tb-plocica-broj">{ukupno}</span>
        <span className="tb-plocica-od">/{maxUkupno}</span>
      </div>

      <div className="tb-najnize">
        <div className="tb-najnize-nas">Dve najniže</div>
        {najnize.map(([k, v]) => (
          <div key={k} className="tb-najnize-red">
            <span>{data.oblasti.find((o) => o.k === k)?.ime}</span>
            <b>{v}/10</b>
          </div>
        ))}
      </div>

      <div className="tb-status">
        <span>Ljubav se boduje kao:</span>
        {["sam", "veza"].map((s) => (
          <button key={s} className={status === s ? "tb-pilula tb-pilula-on" : "tb-pilula"}
            onClick={() => snimi({ ...data, stanje: { ...data.stanje, status: s } })}>
            {s === "sam" ? "Sam" : "U vezi"}
          </button>
        ))}
        <button className={uredi ? "tb-pilula tb-pilula-on" : "tb-pilula"} onClick={() => setUredi(!uredi)}>
          {uredi ? "Gotovo" : "Uredi kriterijume"}
        </button>
      </div>

      {uredi && (
        <p className="tb-upozorenje">
          Stavku smeš da izbaciš samo ako možeš da kažeš koji cilj iz 2027. ona ne služi.
          „Neprijatno mi je“ nije razlog — to je obično znak da stavka radi.
        </p>
      )}

      {data.oblasti.map((ob) => (
        <section key={ob.k} className="tb-oblast">
          <header className="tb-oblast-head">
            <h2>{ob.ime}</h2>
            <b className={ocene[ob.k] >= 7 ? "tb-oc tb-oc-ok" : ocene[ob.k] >= 4 ? "tb-oc" : "tb-oc tb-oc-los"}>{ocene[ob.k]}/10</b>
          </header>
          {uredi && <p className="tb-zasto">{ob.zasto}</p>}
          <ul className="tb-lista">
            {ob.stavke.filter((s) => !s.samo || s.samo === status).map((s) => {
              const a = s.auto ? autoVrednost(s.auto, dani, data) : null;
              const ok = a ? a.ok : !!(w.stavke || {})[s.k];
              if (uredi) {
                return (
                  <li key={s.k} className="tb-red tb-red-uredi">
                    <input className="tb-edit-tekst" value={s.t} onChange={(e) => izmeniStavku(ob.k, s.k, "t", e.target.value)} />
                    <input className="tb-edit-bod" type="number" min="0" max="10" value={s.b}
                      onChange={(e) => izmeniStavku(ob.k, s.k, "b", Number(e.target.value))} />
                    <button className="tb-brisi" onClick={() => obrisiStavku(ob.k, s.k)} aria-label="Obriši">×</button>
                  </li>
                );
              }
              return (
                <li key={s.k} className={ok ? "tb-red tb-red-ok" : "tb-red"}>
                  <div className="tb-red-tekst">
                    <span className="tb-red-ime">{s.t}</span>
                    <span className="tb-red-pod">{a ? `iz dnevnih: ${a.txt}` : `${s.b} bodova`}</span>
                  </div>
                  {a ? (
                    <span className={ok ? "tb-kvad tb-kvad-on tb-kvad-auto" : "tb-kvad tb-kvad-auto"}>{ok ? "✓" : ""}</span>
                  ) : (
                    <button className={ok ? "tb-kvad tb-kvad-on" : "tb-kvad"} onClick={() => setStavka(s.k, !(w.stavke || {})[s.k])}>
                      {ok ? "✓" : ""}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {uredi && <button className="tb-dodaj" onClick={() => dodajStavku(ob.k)}>+ dodaj stavku</button>}
        </section>
      ))}

      <section className="tb-oblast">
        <header className="tb-oblast-head"><h2>Dva pitanja</h2></header>
        <label className="tb-polje">
          <span>Najveća laž koju sam sebi rekao ove nedelje</span>
          <textarea value={w.laz || ""} onChange={(e) => set("laz", e.target.value)} rows={2} />
        </label>
        <label className="tb-polje">
          <span>Šta sam izbegavao</span>
          <textarea value={w.izbegavao || ""} onChange={(e) => set("izbegavao", e.target.value)} rows={2} />
        </label>

        <div className="tb-dugmad">
          <button className="tb-pilula" onClick={kopirajIzvestaj}>
            {kopirano ? "Kopirano" : "Kopiraj izveštaj za petak"}
          </button>
          <button className="tb-pilula" onClick={() => izvezi(data)}>Preuzmi JSON</button>
        </div>

        {rucno && (
          <label className="tb-polje">
            <span>Clipboard nije prošao — kopiraj rukom</span>
            <textarea ref={rucnoRef} value={rucno} readOnly rows={14} onFocus={(e) => e.target.select()} />
          </label>
        )}
      </section>

      {istorija.length > 1 && (
        <section className="tb-oblast">
          <header className="tb-oblast-head"><h2>Poslednjih {istorija.length} nedelja</h2></header>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={istorija} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#2b2f1f" vertical={false} />
                <XAxis dataKey="n" stroke="#7d8168" fontSize={11} tickLine={false} />
                <YAxis domain={[0, maxUkupno]} stroke="#7d8168" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#15170e", border: "1px solid #2b2f1f", color: "#ece7d9" }} />
                <Line type="monotone" dataKey="skor" stroke="#f5c518" strokeWidth={2} dot={{ r: 3, fill: "#f5c518" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <p className="tb-fus">Prvih mesec dana očekuj 30–45. Ako prve nedelje dobiješ 60, lagao si u popunjavanju.</p>
    </>
  );
}

/* ============================ KVARTAL ============================ */

function Kvartal({ data, snimi }) {
  const [id, setId] = useState(tekuciKvartal().id);
  const q = KVARTALI.find((x) => x.id === id);
  const v = data.kvartali[id] || {};
  const set = (k, n) => snimi({ ...data, kvartali: { ...data.kvartali, [id]: { ...v, [k]: n } } });

  const pala = (kap) => kapijaPala(kap, v[kap.k]);
  const svePale = q.kapije.every(pala);

  return (
    <>
      <div className="tb-kvartal-izbor">
        {KVARTALI.map((x) => (
          <button key={x.id} className={x.id === id ? "tb-pilula tb-pilula-on" : "tb-pilula"} onClick={() => setId(x.id)}>
            {x.ime}
          </button>
        ))}
      </div>

      <div className="tb-tema">{q.tema} — do {q.do.slice(8)}.{q.do.slice(5, 7)}.{q.do.slice(0, 4)}.</div>

      <div className={svePale ? "tb-nagrada tb-nagrada-on" : "tb-nagrada"}>
        <span>Nagrada</span>
        <b>{q.nagrada}</b>
        <small>{svePale ? "Sve tri kapije pale. Uzmi je." : "Sve tri kapije moraju da padnu."}</small>
      </div>

      <section className="tb-oblast">
        <header className="tb-oblast-head"><h2>Kapije</h2><b className="tb-oc">{q.kapije.filter(pala).length}/3</b></header>
        {q.kapije.map((kap) => {
          const val = Number(v[kap.k] || 0);
          const pct = kap.manje ? (val > 0 ? Math.min(100, (kap.cilj / val) * 100) : 0) : Math.min(100, (val / kap.cilj) * 100);
          return (
            <div key={kap.k} className={pala(kap) ? "tb-kapija tb-kapija-ok" : "tb-kapija"}>
              <div className="tb-kapija-head">
                <span>{kap.ime}</span>
                <span className="tb-kapija-cilj">{kap.manje ? "max " : ""}{fmt(kap.cilj)}{kap.jed}</span>
              </div>
              <div className="tb-traka"><i style={{ width: pct + "%" }} /></div>
              <div className="tb-unos tb-unos-wide">
                <input type="number" inputMode="decimal" value={v[kap.k] ?? ""} placeholder="0"
                  onChange={(e) => set(kap.k, e.target.value === "" ? "" : Number(e.target.value))} />
                <span>{kap.jed || "kom"}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="tb-oblast">
        <header className="tb-oblast-head"><h2>Ostalo u kvartalu</h2></header>
        {q.ostalo.map((o) => (
          <div key={o.k} className="tb-kapija">
            <div className="tb-kapija-head">
              <span>{o.ime}</span>
              <span className="tb-kapija-cilj">{fmt(o.cilj)}</span>
            </div>
            <div className="tb-traka"><i style={{ width: Math.min(100, ((Number(v["x_" + o.k]) || 0) / o.cilj) * 100) + "%" }} /></div>
            <div className="tb-unos tb-unos-wide">
              <input type="number" inputMode="decimal" value={v["x_" + o.k] ?? ""} placeholder="0"
                onChange={(e) => set("x_" + o.k, e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>
        ))}
      </section>

      <p className="tb-fus">Propuštena kvartalna nagrada se ne nadoknađuje.</p>
    </>
  );
}

/* ============================ GODINA ============================ */

function Godina({ data, snimi }) {
  const proslo = Math.min(100, Math.max(0, Math.round(((new Date() - new Date(POCETAK)) / (new Date(KRAJ) - new Date(POCETAK))) * 100)));
  const setS = (k, v) => snimi({ ...data, stanje: { ...data.stanje, [k]: v } });

  const q3 = data.kvartali["Q3-2027"] || {};
  const kapijePale = KVARTALI[3].kapije.every((kap) => kapijaPala(kap, q3[kap.k]));

  const mere = [
    { k: "netto", ime: "Moja neto imovina", od: BAZA.netto, cilj: GODINA_CILJ.netto, jed: "€" },
    { k: "mrr", ime: "MRR firme", od: BAZA.mrr, cilj: GODINA_CILJ.mrr, jed: "€" },
  ];

  return (
    <>
      <div className="tb-plocica">
        <span className="tb-plocica-broj">{danaDo(KRAJ)}</span>
        <span className="tb-plocica-od">dana</span>
      </div>
      <div className="tb-traka tb-traka-big"><i style={{ width: proslo + "%" }} /></div>
      <div className="tb-tema">{proslo}% godine prošlo — do 30.09.2027</div>

      {mere.map((m) => {
        const v = Number(data.stanje[m.k] || 0);
        return (
          <div key={m.k} className="tb-kapija">
            <div className="tb-kapija-head">
              <span>{m.ime}</span>
              <span className="tb-kapija-cilj">{fmt(m.od)} → {fmt(m.cilj)}{m.jed}</span>
            </div>
            <div className="tb-traka">
              <i style={{ width: Math.min(100, Math.max(0, ((v - m.od) / (m.cilj - m.od)) * 100)) + "%" }} />
            </div>
            <div className="tb-unos tb-unos-wide">
              <input type="number" inputMode="decimal" value={data.stanje[m.k] ?? ""}
                onChange={(e) => setS(m.k, e.target.value === "" ? "" : Number(e.target.value))} />
              <span>{m.jed}</span>
            </div>
          </div>
        );
      })}

      <div className={kapijePale ? "tb-ulog tb-ulog-ok" : "tb-ulog"}>
        <h3>Ako sve tri kapije Q3 padnu</h3>
        <p>{ULOG.nagrada}</p>
      </div>

      <div className="tb-ulog tb-ulog-kazna">
        <h3>Ako ne padnu — 01.10.2027</h3>
        {ULOG.kazna.map((r, i) => <p key={i}>{r}</p>)}
        <small>Izvršilac: {ULOG.izvrsilac}. Ne postoji „ako treba“.</small>
      </div>
    </>
  );
}

/* ============================ PRAVILA ============================ */

function Pravila({ data, snimi }) {
  return (
    <>
      {PRAVILA.map((p) => (
        <section key={p.naslov} className="tb-oblast">
          <header className="tb-oblast-head"><h2>{p.naslov}</h2></header>
          <ul className="tb-pravila">
            {p.tacke.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </section>
      ))}

      <section className="tb-oblast">
        <header className="tb-oblast-head"><h2>Podaci</h2></header>
        <p className="tb-zasto">Čuvanje: {rezimCuvanja}</p>
        <div className="tb-dugmad">
          <button className="tb-pilula" onClick={() => izvezi(data)}>Izvezi kao JSON</button>
          <button className="tb-pilula tb-pilula-opasno"
            onClick={() => { if (confirm("Vraća kriterijume na podrazumevane. Uneti podaci ostaju. Nastavi?")) snimi({ ...data, dnevno: prazno().dnevno, oblasti: prazno().oblasti }); }}>
            Vrati kriterijume
          </button>
          <button className="tb-pilula tb-pilula-opasno"
            onClick={() => { if (confirm("Sve se briše. Sigurno?")) snimi(prazno()); }}>
            Obriši sve
          </button>
        </div>
      </section>

      <p className="tb-fus">
        Cilj se ne spušta u poslednjoj nedelji kvartala. Spušta se na početku ili nikad.
      </p>
    </>
  );
}
