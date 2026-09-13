/* =========================================================
   SVA PRAVILA SU OVDE. Menjaj samo ovaj fajl.

   Pravilo za menjanje:
   Stavku smeš da izbaciš samo ako možeš da odgovoriš
   KOJI CILJ IZ 2027. ona ne služi.
   "Ne da mi se" nije odgovor. "Neprijatno mi je" nije odgovor.
   ========================================================= */

export const POCETAK = "2026-09-13";
export const KRAJ = "2027-09-30";

/* Gde sam bio na startu — koristi se za trake napretka */
export const BAZA = {
  netto: 9000,
  mrr: 1000,
};

/* Gde moram da budem 30.09.2027 */
export const GODINA_CILJ = {
  netto: 90000,
  mrr: 15000,
};

export const ULOG = {
  nagrada: "Mercedes CLA, 25.000€. Plaćen keš, ne na kredit.",
  kazna: [
    "5% udela u firmi ide Strahinji. Papir potpisan unapred, uzajamno.",
    "Motor prodat, novac u firmu kao njegov udeo. 12 meseci bez dva točka.",
  ],
  izvrsilac: "Strahinja",
};

/* ---------------------------------------------------------
   DNEVNE STAVKE
   tip: "check" (da/ne) ili "broj" (unos brojke)
   cilj: koliko treba da bi se računalo kao pogođeno
   --------------------------------------------------------- */
export const DNEVNO = [
  { k: "poziv", ime: "Prodajni poziv", tip: "check", cilj: 1, pod: "razgovor, ne mejl" },
  { k: "proizvod", ime: "Sati na proizvodu", tip: "broj", cilj: 2, jed: "h", pod: "ne na usluzi" },
  { k: "naplaceno", ime: "Naplaćeno danas", tip: "broj", cilj: 600, jed: "€", pod: "na računu" },
  { k: "trening", ime: "Trening", tip: "check", cilj: 1, pod: "5 od 7 dana" },
  { k: "san", ime: "Zaspao pre 00:30", tip: "check", cilj: 1, pod: "telefon van sobe" },
  { k: "faks", ime: "Fakultet", tip: "broj", cilj: 30, jed: "min", pod: "radnim danom" },
];

/* ---------------------------------------------------------
   NEDELJNE OBLASTI
   b     = bodovi za tu stavku
   auto  = računa se iz dnevnih unosa, ne može ručno da se čekira
           format: "polje>=broj", zbir kroz nedelju
   samo  = "sam" ili "veza" — prikazuje se samo u tom režimu
   Ocena = (osvojeni bodovi / mogući bodovi) * 10
   --------------------------------------------------------- */
export const OBLASTI = [
  {
    k: "zdravlje", ime: "Zdravlje",
    zasto: "85kg i telo koje izdrži deset godina ovog tempa.",
    stavke: [
      { k: "z1", t: "5 treninga", b: 2, auto: "trening>=5" },
      { k: "z2", t: "6 od 7 noći pre 00:30", b: 2, auto: "san>=6" },
      { k: "z3", t: "7/7 doručak u prvih sat", b: 2 },
      { k: "z4", t: "5+ dana sa 150g proteina", b: 2 },
      { k: "z5", t: "Telefon van sobe 7/7", b: 2 },
    ],
  },
  {
    k: "odnosi", ime: "Odnosi",
    zasto: "Mreža koja donosi poslove bez hladnog zvanja.",
    stavke: [
      { k: "o1", t: "1 nova osoba uživo", b: 3 },
      { k: "o2", t: "Kafa sa nekim ko je ispred mene", b: 3 },
      { k: "o3", t: "Pozvao roditelje", b: 2 },
      { k: "o4", t: "Javio se nekom bez potrebe", b: 2 },
    ],
  },
  {
    k: "ljubav", ime: "Ljubav",
    zasto: "Oženjen 2031, prvo dete 2034. Partner mora da postoji do 2029.",
    stavke: [
      { k: "l1", t: "Nova osoba upoznata sa namerom", b: 4, samo: "sam" },
      { k: "l2", t: "Pitao direktno umesto da pogađam", b: 3, samo: "sam" },
      { k: "l3", t: "Nisam čekao nečiju poruku", b: 3, samo: "sam" },
      { k: "l4", t: "Izlazak bez telefona, 2h+", b: 3, samo: "veza" },
      { k: "l5", t: "Težak razgovor koji sam izbegavao", b: 3, samo: "veza" },
      { k: "l6", t: "Rekao šta mi smeta istog dana", b: 2, samo: "veza" },
      { k: "l7", t: "Ona zna moje brojeve za ovu godinu", b: 2, samo: "veza" },
    ],
  },
  {
    k: "posao", ime: "Posao",
    zasto: "150k MRR se ne gradi isporukom, nego prodajom i proizvodom.",
    stavke: [
      { k: "p1", t: "4 prodajna poziva", b: 3, auto: "poziv>=4" },
      { k: "p2", t: "10h na proizvodu", b: 3, auto: "proizvod>=10" },
      { k: "p3", t: "Nedeljni pregled sa Strahinjom", b: 2 },
      { k: "p4", t: "Svi follow-up pozivi odrađeni", b: 1 },
      { k: "p5", t: "Nijedan nov projekat bez da je jedan izbačen", b: 1 },
    ],
  },
  {
    k: "novac", ime: "Novac",
    zasto: "9.000€ → 90.000€ za godinu dana.",
    stavke: [
      { k: "n1", t: "3.000€+ naplaćeno", b: 4, auto: "naplaceno>=3000" },
      { k: "n2", t: "MRR veći nego prošle nedelje", b: 2 },
      { k: "n3", t: "0 kupovina van plana", b: 2 },
      { k: "n4", t: "Znam tačno stanje firme i svoje", b: 2 },
    ],
  },
  {
    k: "zabava", ime: "Zabava",
    zasto: "Scroll nije odmor. Bez ovoga padaju san, trening i rok.",
    stavke: [
      { k: "f1", t: "3h potpuno van posla, bez ekrana", b: 4 },
      { k: "f2", t: "Pola dana bez rada", b: 3 },
      { k: "f3", t: "Ispod 2h scrolla dnevno, 5 od 7", b: 3 },
    ],
  },
  {
    k: "rast", ime: "Rast",
    zasto: "Čovek koji vodi 150k MRR se ne postaje slučajno.",
    stavke: [
      { k: "r1", t: "4h fakultet", b: 3, auto: "faks>=240" },
      { k: "r2", t: "Snimio i preslušao svoj prodajni poziv", b: 3 },
      { k: "r3", t: "30 strana pročitano", b: 2 },
      { k: "r4", t: "Naučio 1 stvar i odmah primenio", b: 2 },
    ],
  },
];

/* ---------------------------------------------------------
   KVARTALI
   kapije: sve tri moraju da padnu da bi nagrada bila tvoja
   manje:  true znači da je cilj "ne više od" (npr. ostali ispiti)
   --------------------------------------------------------- */
export const KVARTALI = [
  {
    id: "Q4-2026", ime: "Q4 2026", tema: "Naplata i prvi proizvod",
    od: "2026-09-13", do: "2026-12-31", nagrada: "Sat, ~400€",
    kapije: [
      { k: "naplaceno", ime: "Naplaćeno u kvartalu", cilj: 40000, jed: "€" },
      { k: "mrr", ime: "MRR na kraju kvartala", cilj: 3000, jed: "€" },
      { k: "mvp", ime: "Market MVP radi kod klijenta", cilj: 1, jed: "" },
    ],
    ostalo: [
      { k: "knjigovodje", ime: "Knjigovođe sa kojima sam pričao", cilj: 8 },
      { k: "honorarac", ime: "Prvi honorarac zaposlen (do 30.11)", cilj: 1 },
      { k: "tezina", ime: "Težina (kg)", cilj: 80 },
      { k: "netto", ime: "Moja neto imovina", cilj: 35000 },
    ],
  },
  {
    id: "Q1-2027", ime: "Q1 2027", tema: "Ispiti i prva pretplata",
    od: "2027-01-01", do: "2027-03-31", nagrada: "Sako i cipele kod krojača, ~500€",
    kapije: [
      { k: "ispiti", ime: "Ispiti u jan/feb roku", cilj: 5, jed: "" },
      { k: "market1", ime: "Prvi plaćeni market", cilj: 1, jed: "" },
      { k: "mrr", ime: "MRR", cilj: 6000, jed: "€" },
    ],
    ostalo: [
      { k: "naplaceno", ime: "Naplaćeno u kvartalu", cilj: 45000 },
      { k: "marketi", ime: "Marketi na pretplati", cilj: 5 },
      { k: "tezina", ime: "Težina (kg)", cilj: 83 },
      { k: "netto", ime: "Moja neto imovina", cilj: 55000 },
    ],
  },
  {
    id: "Q2-2027", ime: "Q2 2027", tema: "EXPO i strano tržište",
    od: "2027-04-01", do: "2027-06-30", nagrada: "4 dana van Srbije, ~500€",
    kapije: [
      { k: "tezina", ime: "Težina 85kg", cilj: 85, jed: "kg" },
      { k: "leadovi", ime: "EXPO kvalifikovani leadovi", cilj: 15, jed: "" },
      { k: "mrr", ime: "MRR", cilj: 10000, jed: "€" },
    ],
    ostalo: [
      { k: "knjigobeta", ime: "Knjigovođe u beti, plaćeni", cilj: 10 },
      { k: "marketi", ime: "Marketi na pretplati", cilj: 12 },
      { k: "ispiti", ime: "Ispiti u junskom roku", cilj: 3 },
      { k: "netto", ime: "Moja neto imovina", cilj: 72000 },
    ],
  },
  {
    id: "Q3-2027", ime: "Q3 2027", tema: "Konverzija i zatvaranje faksa",
    od: "2027-07-01", do: "2027-09-30", nagrada: "Biram 01.07.2027, ~500€",
    kapije: [
      { k: "faks", ime: "Ostalo ispita (max 3 + diplomski)", cilj: 3, jed: "", manje: true },
      { k: "pretplatnici", ime: "Pretplatnici ukupno", cilj: 25, jed: "" },
      { k: "mrr", ime: "MRR", cilj: 15000, jed: "€" },
    ],
    ostalo: [
      { k: "ugovori", ime: "Inostrani leadovi → ugovori", cilj: 3 },
      { k: "ljudi", ime: "Ljudi u firmi osim nas dvojice", cilj: 3 },
      { k: "naplaceno", ime: "Naplaćeno u kvartalu", cilj: 65000 },
      { k: "netto", ime: "Moja neto imovina", cilj: 90000 },
    ],
  },
];

/* ---------------------------------------------------------
   PRAVILA — prikazuju se u aplikaciji, u tabu "Pravila"
   --------------------------------------------------------- */
export const PRAVILA = [
  {
    naslov: "Bodovanje",
    tacke: [
      "Bodovi su binarni. 4 treninga od 5 je 0 bodova za taj red.",
      "Ne ocenjuje se trud. Ocenjuje se učinjeno.",
      "Sivo polje znači da se stavka računa iz dnevnih unosa i ne može ručno da se čekira.",
      "Ocena oblasti = osvojeni bodovi / mogući bodovi, skalirano na 10.",
    ],
  },
  {
    naslov: "Nedelja",
    tacke: [
      "Popunjava se petkom uveče, 15 minuta.",
      "Nedelja se ne nadoknađuje. Prošla je.",
      "Ako preskočiš petak, upiši nulu. Sistem koji se puni samo kad je dobra nedelja je ogledalo, ne merač.",
      "Dve najniže oblasti dve nedelje zaredom → sledeće nedelje one imaju prioritet nad svim ostalim.",
      "Ista oblast među dve najniže tri nedelje zaredom → problem nije disciplina. Tada se radi dubinski razgovor, ne još jedan zadatak.",
    ],
  },
  {
    naslov: "Kvartal",
    tacke: [
      "Svaki kvartal ima tri kapije. Sve tri moraju da padnu. Ostalo je bonus.",
      "Nema praga od 80%. Prag od 80% znači da u poslednjoj nedelji sam biraš koje ćeš ciljeve proglasiti nebitnim.",
      "Propuštena kvartalna nagrada se ne nadoknađuje.",
    ],
  },
  {
    naslov: "Ulog",
    tacke: [
      "Nagrada 30.09.2027: Mercedes CLA, 25.000€, plaćen keš.",
      "Kazna 01.10.2027: 5% udela Strahinji, papir potpisan unapred, uzajamno.",
      "Kazna 01.10.2027: motor prodat, novac u firmu kao njegov udeo, 12 meseci bez dva točka.",
      "Ne postoji „ako treba“. Ili su tri kapije pale ili nisu.",
    ],
  },
  {
    naslov: "Menjanje pravila",
    tacke: [
      "Stavku smeš da izbaciš samo ako možeš da kažeš koji cilj iz 2027. ona ne služi.",
      "„Neprijatno mi je“ nije razlog. To je obično znak da stavka radi.",
      "Cilj se ne spušta u poslednjoj nedelji kvartala. Spušta se na početku ili nikad.",
      "Jedan nov projekat unutra znači jedan napolje. Vas ste dvojica.",
    ],
  },
];
