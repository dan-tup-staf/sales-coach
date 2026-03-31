'use client';
import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// KONFIGURACJA — ZMIEŃ TEN URL NA SWÓJ GOOGLE SHEETS (opublikowany jako CSV)
// ═══════════════════════════════════════════════════════════════════════════
const SHEET_CSV_URL = null;
// Jak uzyskać URL:
// 1. Google Sheets → Plik → Udostępnij → Opublikuj w internecie
// 2. Wybierz arkusz → Format: CSV → Opublikuj
// 3. Wklej URL tutaj, np.:
// const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1YztcU-sOvw3vlW3wxQfh5THjqYUZ7ODc-7ZK8xy3LvI/edit?usp=sharing";

// ═══════════════════════════════════════════════════════════════════════════
// DANE DEMO (używane gdy SHEET_CSV_URL jest null)
// ═══════════════════════════════════════════════════════════════════════════
const DEMO_DATA = {
  reps: [
    {
      id: 'filip', name: 'Filip Sobel', avatar: 'FS', role: 'Account Executive',
      meetings: [
        {
          id: 'm1', date: '2026-03-30', type: 'Discovery + Demo',
          client: 'Firma AML / Ewelina', dealHealth: 'red', qualification: 28,
          sales: {
            strengths: [
              'Uczciwa komunikacja o ograniczeniach produktu — otwarcie przyznał brak integracji z Workday',
              'Sprawne demo produktowe — w krótkim czasie pokazał kluczowe elementy i personalizację',
              'Próba zabezpieczenia next stepu — zapytał o termin follow-upu zamiast zostawić rozmowę otwartą',
            ],
            weaknesses: [
              'Zbyt szybkie przejście do demo — discovery trwało 2 minuty zamiast pogłębić ból klienta',
              'Brak kwalifikacji MEDDIC — nie zidentyfikował decydenta, budżetu, ani timeline\'u',
              'Klient prowadził rozmowę — Ewelina dyktowała tempo, przerywała demo, sama pytała o cenę',
            ],
            actions: [
              'Wyślij email z pytaniami kwalifikacyjnymi w ciągu 48h — skala rekrutacji, motywator projektu, kto ocenia propozycję',
              'Zbadaj proces decyzyjny — kim jest "biznes", z iloma dostawcami rozmawia, dlaczego odeszli od AssessFirst',
              'Przed kolejnym demo: minimum 3 pytania pogłębiające zanim pokażesz produkt',
            ],
          },
          relationship: {
            strengths: [
              'Ciepły ton na początku — natural small talk o poniedziałku i świętach buduje komfort',
              'Dobra reakcja na sceptycyzm — przyznał że test nie jest wyrocznią, co buduje wiarygodność',
              'Próba osobistego połączenia — historia ze stażu w Citibanku jako wspólny grunt',
            ],
            weaknesses: [
              'Nie pogłębił emocji klienta — gdy Ewelina opisała problem z graduates, przeskoczył do demo bez parafrazy',
              'Sceptycyzm championki niezaadresowany — "personalnie sceptycznie się odnoszę" wymagał zbadania, nie ogólnikowej odpowiedzi',
              'Anegdota za późno i za długo — 30s monolog o Citibanku pod koniec spotkania, gdy klient już zamykał',
            ],
            actions: [
              'Zasada "Sparafrazuj → Dopytaj → Dopiero potem rozwiązanie" — przy każdym sygnale bólu klienta',
              'Zaadresuj sceptycyzm Eweliny w follow-upie — wyślij case study z sektora finansowego + dane o predykcyjności',
              'Zaproponuj pilotaż 5 testów — Ewelina sama wspomniała że "kilka osób chciałoby przetestować"',
            ],
          },
        },
        {
          id: 'm2', date: '2026-03-25', type: 'Discovery',
          client: 'TechCorp / Marcin', dealHealth: 'yellow', qualification: 55,
          sales: {
            strengths: [
              'Dobre discovery — poświęcił 15 minut na zrozumienie problemu przed pokazaniem czegokolwiek',
              'Zidentyfikował decision makera — wie że CFO musi zatwierdzić budżet powyżej 10k',
              'Użył social proof — case study z podobnej firmy w branży IT',
            ],
            weaknesses: [
              'Nie ustalił timeline\'u — nie wiadomo czy to Q2 czy Q4 priorytet',
              'Za dużo mówił o features zamiast o wartości biznesowej',
              'Nie zapytał o konkurencję — nie wie z kim jest porównywany',
            ],
            actions: [
              'W follow-upie zapytaj wprost o timeline decyzji i czy jest to priorytet na ten kwartał',
              'Przygotuj ROI calculator — Marcin potrzebuje twardych liczb dla CFO',
              'Ustal kolejne spotkanie z udziałem CFO lub osoby decyzyjnej',
            ],
          },
          relationship: {
            strengths: [
              'Aktywne słuchanie — kilkukrotnie sparafrazował wypowiedzi Marcina',
              'Zadawał pytania otwarte — "Jak to wpływa na Wasz zespół?" zamiast zamkniętych',
              'Okazał empatię wobec frustracji Marcina z obecnym procesem',
            ],
            weaknesses: [
              'Za formalna komunikacja — Marcin był luźny, Filip zbyt sztywny',
              'Nie nawiązał do osobistych wątków — Marcin wspomniał o nowym zespole, Filip zignorował',
              'Brakowało humoru i lekkości — rozmowa była merytoryczna ale sucha',
            ],
            actions: [
              'Dopasuj ton do rozmówcy — Marcin preferuje bezpośrednią, nieformalną komunikację',
              'W follow-upie nawiąż do wątku nowego zespołu — "Jak idzie budowanie ekipy?"',
              'Dodaj element ludzki do maili — nie tylko merytoryka, też relacja',
            ],
          },
        },
        {
          id: 'm3', date: '2026-03-18', type: 'Demo',
          client: 'FinServ / Anna', dealHealth: 'green', qualification: 72,
          sales: {
            strengths: [
              'Świetne powiązanie demo z potrzebami — każdy feature połączony z konkretnym bólem klienta',
              'Proaktywnie zaproponował pilotaż — klientka od razu się zgodziła',
              'Jasno ustalił next steps — kto, co, kiedy',
            ],
            weaknesses: [
              'Demo trochę za długie — 35 minut, klientka zaczęła tracić uwagę',
              'Nie sprawdził czy wszystkie osoby decyzyjne widziały demo',
              'Pominął temat integracji — klientka później wróciła z pytaniami mailowo',
            ],
            actions: [
              'Skróć demo do 20 minut — focus na 3 najważniejsze features dla tego klienta',
              'Zapytaj kto jeszcze powinien zobaczyć demo — zaproponuj krótką sesję dla decydentów',
              'Przygotuj dokument o integracji z ich ATS przed następnym spotkaniem',
            ],
          },
          relationship: {
            strengths: [
              'Naturalny rapport — Anna się śmiała, atmosfera partnerska a nie vendorska',
              'Reagował na sygnały niewerbalne — gdy Anna zmarszczyla brwi, zatrzymał się i dopytał',
              'Budował zaufanie przez transparentność — "to nie jest idealne rozwiązanie dla każdego"',
            ],
            weaknesses: [
              'Za bardzo się zgodził z klientką w jednym punkcie — stracił pozycję eksperta',
              'Nie wykorzystał momentu gdy Anna opowiedziała o swoim awansie — mógł pogratulować i pogłębić',
              'Pod koniec pośpieszył zakończenie — Anna chciała jeszcze porozmawiać',
            ],
            actions: [
              'Pamiętaj o awansie Anny — pogratuluj w follow-upie, to buduje relację',
              'Kiedy klient chce rozmawiać — zostań. Te momenty budują lojalność',
              'Balansuj między zgadzaniem się a challengowaniem — bądź doradcą, nie potakiwaczem',
            ],
          },
        },
      ],
    },
    {
      id: 'kasia', name: 'Kasia Nowak', avatar: 'KN', role: 'Account Executive',
      meetings: [
        {
          id: 'm4', date: '2026-03-28', type: 'Discovery',
          client: 'RetailPro / Tomek', dealHealth: 'yellow', qualification: 45,
          sales: {
            strengths: [
              'Doskonałe pytania discovery — zidentyfikowała 3 konkretne bóle biznesowe',
              'Dobrze zarządzała czasem — 10 min discovery, 15 min demo, 5 min next steps',
              'Przygotowała się do rozmowy — znała branżę klienta i konkurencję',
            ],
            weaknesses: [
              'Nie quantyfikowała bólu — "dużo" i "często" zamiast konkretnych liczb',
              'Nie zbudowała urgency — klient nie czuje presji czasowej',
              'Za mało challenging questions — zbyt grzeczne podejście do trudnych tematów',
            ],
            actions: [
              'Przy każdym bólu pytaj o liczby: "Ile to Was kosztuje miesięcznie?", "Ile osób to dotyka?"',
              'Użyj techniki "cost of inaction" — policz co się stanie jeśli nic nie zmienią',
              'Przećwicz zadawanie trudnych pytań — "Co się stanie jeśli tego nie wdrożycie w Q2?"',
            ],
          },
          relationship: {
            strengths: [
              'Świetny rapport od pierwszej minuty — Tomek szybko się otworzył',
              'Autentyczna ciekawość — pytania wychodziły naturalnie, nie jak z checklisty',
              'Dobra energia — entuzjazm bez nachalności',
            ],
            weaknesses: [
              'Za dużo zgadzania się — "super", "dokładnie", "świetnie" co 30 sekund traci moc',
              'Nie zaadresowała ciszy — gdy Tomek się zastanawiał, od razu wypełniała przestrzeń',
              'Brakowało dzielenia się insightami — relacja była jednostronna',
            ],
            actions: [
              'Ogranicz automatyczne potwierdzenia — używaj ich tylko gdy naprawdę chcesz coś podkreślić',
              'Policz do 3 w głowie zanim wypełnisz ciszę — cisza to narzędzie',
              'Przygotuj 2-3 insighty z branży retail — podziel się wiedzą, nie tylko pytaj',
            ],
          },
        },
      ],
    },
    {
      id: 'marek', name: 'Marek Wiśniewski', avatar: 'MW', role: 'Senior AE',
      meetings: [
        {
          id: 'm5', date: '2026-03-29', type: 'Discovery + Demo',
          client: 'BankSecure / Joanna', dealHealth: 'green', qualification: 68,
          sales: {
            strengths: [
              'Mistrzowskie discovery — 20 minut głębokiego badania potrzeb z MEDDIC frameworkiem',
              'Doskonałe pozycjonowanie cenowe — zakotwiczył wartość przed podaniem ceny',
              'Silny next step — umówił spotkanie z VP HR na za tydzień',
            ],
            weaknesses: [
              'Demo mogło być bardziej interaktywne — za dużo mówienia, za mało pytań w trakcie',
              'Nie pokazał ROI w kontekście ich branży — banking ma specyficzne KPI',
              'Pominął temat compliance — w bankach to often deal-breaker',
            ],
            actions: [
              'Na spotkaniu z VP HR: otwórz od ROI i compliance, nie od features',
              'Przygotuj customowy ROI model dla BankSecure — użyj ich danych z discovery',
              'W demo dodaj checkpointy — co 5 minut pytaj "Jak to się ma do Waszej sytuacji?"',
            ],
          },
          relationship: {
            strengths: [
              'Pozycja eksperta — Joanna traktowała Marka jak doradcę, nie sprzedawcę',
              'Świetne challengowanie — zadał trudne pytanie o rotację i klientka doceniła szczerość',
              'Budował partnership — "razem znajdziemy najlepsze rozwiązanie" zamiast "nasze jest najlepsze"',
            ],
            weaknesses: [
              'Momentami zbyt dominujący — Joanna miała mniej niż 40% czasu wypowiedzi',
              'Nie zapytał o osobiste cele Joanny — awans? Nowy projekt? Co ją motywuje?',
              'Za szybko przeszedł do meritum — brakowało 2 minut small talku na początku',
            ],
            actions: [
              'Przed spotkaniem z VP HR: research osobisty — LinkedIn, artykuły, wspólne kontakty',
              'Daj klientom więcej przestrzeni — cel: 60% klient, 40% Ty',
              'Zacznij następne spotkanie od 2 minut lekkiej rozmowy — to obniża barierę',
            ],
          },
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS PARSER
// ═══════════════════════════════════════════════════════════════════════════
function parseCSVtoData(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const repsMap = {};

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV parse (handles quoted fields with commas)
    const row = parseCSVRow(lines[i]);
    const get = (col) => {
      const idx = headers.indexOf(col);
      return idx >= 0 ? row[idx]?.trim() : '';
    };

    const repName = get('handlowiec');
    if (!repName) continue;

    const repId = repName.toLowerCase().replace(/\s+/g, '_');
    if (!repsMap[repId]) {
      repsMap[repId] = {
        id: repId,
        name: repName,
        avatar: repName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        role: get('rola') || 'Account Executive',
        meetings: [],
      };
    }

    const tryParseJSON = (val) => {
      try { return JSON.parse(val); } catch { return [val || '']; }
    };

    repsMap[repId].meetings.push({
      id: `m_${i}`,
      date: get('data'),
      type: get('typ_spotkania') || 'Rozmowa',
      client: get('klient'),
      dealHealth: get('deal_health') || 'yellow',
      qualification: parseInt(get('ocena_kwalifikacji')) || 0,
      sales: {
        strengths: tryParseJSON(get('sales_strengths')),
        weaknesses: tryParseJSON(get('sales_weaknesses')),
        actions: tryParseJSON(get('sales_actions')),
      },
      relationship: {
        strengths: tryParseJSON(get('rel_strengths')),
        weaknesses: tryParseJSON(get('rel_weaknesses')),
        actions: tryParseJSON(get('rel_actions')),
      },
    });
  }

  const reps = Object.values(repsMap);
  // Sort meetings by date desc
  reps.forEach(r => r.meetings.sort((a, b) => b.date.localeCompare(a.date)));
  return reps.length > 0 ? { reps } : null;
}

function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const HEALTH = {
  red:    { label: 'Zagrożony',        bg: '#2D1215', border: '#DC2626', text: '#FCA5A5', dot: '#EF4444' },
  yellow: { label: 'Wymaga uwagi',     bg: '#2D2305', border: '#CA8A04', text: '#FDE68A', dot: '#EAB308' },
  green:  { label: 'Na dobrej drodze', bg: '#052E16', border: '#16A34A', text: '#86EFAC', dot: '#22C55E' },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [data, setData] = useState(DEMO_DATA);
  const [loading, setLoading] = useState(!!SHEET_CSV_URL);
  const [selectedRep, setSelectedRep] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (SHEET_CSV_URL) {
      fetch(SHEET_CSV_URL)
        .then(r => r.text())
        .then(csv => {
          const parsed = parseCSVtoData(csv);
          if (parsed) setData(parsed);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => {
    if (data.reps.length > 0 && !selectedRep) {
      setSelectedRep(data.reps[0]);
    }
  }, [data, selectedRep]);

  if (loading || !selectedRep) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0A0A', color: '#666', fontSize: 14 }}>
        Ładowanie danych z Google Sheets...
      </div>
    );
  }

  const rep = selectedRep;
  const meetings = rep.meetings;
  const current = selectedMeeting || meetings[0];
  const avgQ = Math.round(meetings.reduce((s, m) => s + m.qualification, 0) / meetings.length);
  const healthCounts = meetings.reduce((a, m) => { a[m.dealHealth]++; return a; }, { red: 0, yellow: 0, green: 0 });

  const getPatterns = (cat) => ({
    strengths: meetings.flatMap(m => m[cat].strengths),
    weaknesses: meetings.flatMap(m => m[cat].weaknesses),
    actions: meetings.flatMap(m => m[cat].actions),
  });

  const selectRep = (r) => {
    setSelectedRep(r);
    setSelectedMeeting(null);
    setActiveTab('overview');
    setSidebarOpen(false);
  };

  const selectMeeting = (m) => {
    setSelectedMeeting(m);
    setActiveTab('sales');
    setSidebarOpen(false);
  };

  return (
    <div style={S.root}>
      {/* MOBILE HAMBURGER */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={S.hamburger}>
        <span style={{ ...S.hamburgerLine, transform: sidebarOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
        <span style={{ ...S.hamburgerLine, opacity: sidebarOpen ? 0 : 1 }} />
        <span style={{ ...S.hamburgerLine, transform: sidebarOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
      </button>

      {/* SIDEBAR OVERLAY (mobile) */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={S.overlay} />}

      {/* SIDEBAR */}
      <aside style={{
        ...S.sidebar,
        ...(sidebarOpen ? S.sidebarOpen : {}),
        opacity: loaded ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={S.logo}>
          <div style={S.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10L8 5L13 10L8 15Z" fill="#E8B931" opacity="0.8"/>
              <path d="M7 10L12 5L17 10L12 15Z" fill="#E8B931" opacity="0.5"/>
            </svg>
          </div>
          <span style={S.logoText}>Sales Coach</span>
        </div>

        <div style={S.section}>
          <div style={S.sectionLabel}>ZESPÓŁ</div>
          {data.reps.map(r => (
            <button key={r.id} onClick={() => selectRep(r)} style={{
              ...S.repBtn,
              background: rep.id === r.id ? '#1A1706' : 'transparent',
            }}>
              <div style={{
                ...S.avatar,
                background: rep.id === r.id ? '#2D2305' : '#1E1E1E',
                color: rep.id === r.id ? '#E8B931' : '#888',
                borderColor: rep.id === r.id ? '#E8B93144' : '#2A2A2A',
              }}>{r.avatar}</div>
              <div>
                <div style={S.repName}>{r.name}</div>
                <div style={S.repMeta}>{r.meetings.length} {r.meetings.length === 1 ? 'spotkanie' : r.meetings.length < 5 ? 'spotkania' : 'spotkań'}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={S.section}>
          <div style={S.sectionLabel}>SPOTKANIA</div>
          {meetings.map(m => {
            const h = HEALTH[m.dealHealth];
            return (
              <button key={m.id} onClick={() => selectMeeting(m)} style={{
                ...S.meetBtn,
                background: current.id === m.id ? '#141414' : 'transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.dot, flexShrink: 0 }}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={S.meetClient}>{m.client}</div>
                    <div style={S.meetMeta}>{m.date} · {m.type}</div>
                  </div>
                </div>
                <div style={{ ...S.badge, background: h.bg, color: h.text, border: `1px solid ${h.border}33` }}>
                  {m.qualification}%
                </div>
              </button>
            );
          })}
        </div>

        {!SHEET_CSV_URL && (
          <div style={S.sheetHint}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="7" cy="7" r="6" stroke="#555" strokeWidth="1.5"/>
              <path d="M7 6.5V10" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="7" cy="4.5" r="0.75" fill="#555"/>
            </svg>
            <span>Dane demo. Podłącz Google Sheets — instrukcja w README.</span>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        <header style={{
          ...S.header,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s',
        }}>
          <div>
            <h1 style={S.h1}>{rep.name}</h1>
            <p style={S.subtitle}>{rep.role} · Średnia kwalifikacja: {avgQ}%</p>
          </div>
          <div style={S.pills}>
            {Object.entries(healthCounts).filter(([,v]) => v > 0).map(([k, v]) => {
              const h = HEALTH[k];
              return (
                <div key={k} style={{ ...S.pill, background: h.bg, border: `1px solid ${h.border}44` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: h.dot }}/>
                  <span style={{ color: h.text, fontSize: 12, fontWeight: 500 }}>{v} {h.label.toLowerCase()}</span>
                </div>
              );
            })}
          </div>
        </header>

        {/* TABS */}
        <nav style={S.tabs}>
          {[
            { id: 'overview', label: 'Przegląd' },
            { id: 'sales', label: 'Technika sprzedaży' },
            { id: 'relationship', label: 'Budowanie relacji' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              ...S.tab,
              color: activeTab === t.id ? '#E8B931' : '#666',
              borderBottomColor: activeTab === t.id ? '#E8B931' : 'transparent',
            }}>{t.label}</button>
          ))}
        </nav>

        {/* CONTENT */}
        <div>
          {activeTab === 'overview' && <Overview meetings={meetings} getPatterns={getPatterns} loaded={loaded} />}
          {activeTab === 'sales' && <Detail meeting={current} cat="sales" title="Technika sprzedaży" loaded={loaded} />}
          {activeTab === 'relationship' && <Detail meeting={current} cat="relationship" title="Budowanie relacji" loaded={loaded} />}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════
function Overview({ meetings, getPatterns, loaded }) {
  const sp = getPatterns('sales');
  const rp = getPatterns('relationship');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* TREND */}
      <Card delay={0.3} loaded={loaded}>
        <h3 style={S.cardTitle}>Trend kwalifikacji</h3>
        <div style={S.trendRow}>
          {[...meetings].reverse().map((m, i) => {
            const h = HEALTH[m.dealHealth];
            return (
              <div key={m.id} style={S.trendCol}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#999' }}>{m.qualification}%</div>
                <div style={{
                  width: 36, height: Math.max(m.qualification * 1.5, 20),
                  borderRadius: '6px 6px 2px 2px',
                  background: `linear-gradient(to top, ${h.dot}44, ${h.dot}bb)`,
                  border: `1px solid ${h.dot}55`,
                }}/>
                <div style={{ fontSize: 10, color: '#555' }}>{m.date.slice(5)}</div>
                <div style={{ fontSize: 10, color: '#444' }}>{m.client.split('/')[0].trim()}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* PATTERNS */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Card delay={0.4} loaded={loaded} style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ ...S.cardTitle, color: '#22C55E' }}>✦ Powtarzające się mocne strony</h3>
          <Items items={dedup(sp.strengths.concat(rp.strengths), 4)} color="#22C55E"/>
        </Card>
        <Card delay={0.5} loaded={loaded} style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ ...S.cardTitle, color: '#EAB308' }}>△ Powtarzające się do poprawy</h3>
          <Items items={dedup(sp.weaknesses.concat(rp.weaknesses), 4)} color="#EAB308"/>
        </Card>
      </div>

      {/* PRIORITY ACTIONS */}
      <Card delay={0.6} loaded={loaded}>
        <h3 style={S.cardTitle}><span style={{ color: '#E8B931' }}>⚡</span> Priorytetowe action points</h3>
        <Actions items={dedup(sp.actions.concat(rp.actions), 5)}/>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL TAB
// ═══════════════════════════════════════════════════════════════════════════
function Detail({ meeting, cat, title, loaded }) {
  const d = meeting[cat];
  const h = HEALTH[meeting.dealHealth];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* MEETING INFO */}
      <Card delay={0.3} loaded={loaded}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.02em' }}>{meeting.client}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{meeting.date} · {meeting.type}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ ...S.pill, background: h.bg, border: `1px solid ${h.border}44` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: h.dot }}/>
              <span style={{ color: h.text, fontSize: 12, fontWeight: 500 }}>{h.label}</span>
            </div>
            <QualCircle value={meeting.qualification} color={h.dot}/>
          </div>
        </div>
      </Card>

      <Card delay={0.4} loaded={loaded}>
        <h3 style={{ ...S.cardTitle, color: '#22C55E' }}>✦ {title} — Mocne strony</h3>
        <Items items={d.strengths} color="#22C55E"/>
      </Card>

      <Card delay={0.5} loaded={loaded}>
        <h3 style={{ ...S.cardTitle, color: '#EAB308' }}>△ {title} — Do poprawy</h3>
        <Items items={d.weaknesses} color="#EAB308"/>
      </Card>

      <Card delay={0.6} loaded={loaded}>
        <h3 style={{ ...S.cardTitle, color: '#E8B931' }}>⚡ {title} — Action points</h3>
        <Actions items={d.actions}/>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function Card({ children, delay = 0, loaded, style = {} }) {
  return (
    <div style={{
      ...S.card,
      ...style,
      opacity: loaded ? 1 : 0,
      transform: loaded ? 'translateY(0)' : 'translateY(15px)',
      transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>{children}</div>
  );
}

function Items({ items, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: `${color}66`, marginTop: 7, flexShrink: 0 }}/>
          <div style={{ fontSize: 13, color: '#BBB', lineHeight: 1.55 }}>{item}</div>
        </div>
      ))}
    </div>
  );
}

function Actions({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: '#1A1706', border: '1px solid #E8B93122',
            color: '#E8B931', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 1,
          }}>{i + 1}</div>
          <div style={{ fontSize: 13, color: '#BBB', lineHeight: 1.55 }}>{item}</div>
        </div>
      ))}
    </div>
  );
}

function QualCircle({ value, color }) {
  const r = 22;
  const c = Math.PI * 2 * r;
  return (
    <div style={{ position: 'relative', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#1E1E1E" strokeWidth="4"/>
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`}
          transform="rotate(-90 26 26)" style={{ transition: 'stroke-dasharray 1s ease' }}/>
      </svg>
      <span style={{ position: 'absolute', fontSize: 13, fontWeight: 700, color: '#DDD' }}>{value}%</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function dedup(arr, n) {
  const seen = new Set();
  const res = [];
  for (const item of arr) {
    const k = item.slice(0, 40);
    if (!seen.has(k)) { seen.add(k); res.push(item); }
    if (res.length >= n) break;
  }
  return res;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const S = {
  root: { display: 'flex', minHeight: '100vh', background: '#0A0A0A', color: '#E5E5E5', position: 'relative' },
  sidebar: {
    width: 280, minWidth: 280, background: '#0F0F0F', borderRight: '1px solid #1A1A1A',
    padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8,
    overflowY: 'auto', zIndex: 10,
  },
  sidebarOpen: {},
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9,
    display: 'none',
  },
  hamburger: {
    display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 20,
    background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8,
    width: 40, height: 40, flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 4, padding: 0,
  },
  hamburgerLine: {
    width: 18, height: 2, background: '#999', borderRadius: 1,
    transition: 'all 0.2s ease',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '4px 8px 16px', borderBottom: '1px solid #1A1A1A', marginBottom: 8,
  },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8, background: '#1A1706',
    border: '1px solid #E8B93133', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontWeight: 700, fontSize: 15, color: '#E8B931', letterSpacing: '-0.02em' },
  section: { display: 'flex', flexDirection: 'column', gap: 4 },
  sectionLabel: { fontSize: 10, fontWeight: 600, color: '#555', letterSpacing: '0.08em', padding: '12px 8px 6px' },
  repBtn: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
    borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  avatar: {
    width: 34, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderWidth: 1, borderStyle: 'solid', transition: 'all 0.15s ease',
  },
  repName: { fontSize: 13, fontWeight: 600, color: '#CCC' },
  repMeta: { fontSize: 11, color: '#666', marginTop: 1 },
  meetBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
    width: '100%', textAlign: 'left', transition: 'all 0.15s ease', gap: 8,
  },
  meetClient: { fontSize: 12, fontWeight: 500, color: '#BBB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meetMeta: { fontSize: 10, color: '#555', marginTop: 2 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, flexShrink: 0 },
  sheetHint: {
    marginTop: 'auto', padding: '12px 8px', display: 'flex', gap: 8,
    borderTop: '1px solid #1A1A1A', fontSize: 11, color: '#555', lineHeight: 1.4,
  },
  main: { flex: 1, padding: '20px 28px 40px', overflowY: 'auto' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: 16, marginBottom: 20,
  },
  h1: { fontSize: 26, fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.03em', margin: 0 },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  pills: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  pill: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20 },
  tabs: { display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid #1A1A1A' },
  tab: {
    padding: '10px 18px', fontSize: 13, fontWeight: 500, background: 'none',
    border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  card: {
    background: '#111', border: '1px solid #1E1E1E', borderRadius: 12, padding: '20px 22px',
  },
  cardTitle: {
    fontSize: 14, fontWeight: 600, color: '#999', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em',
  },
  trendRow: { display: 'flex', alignItems: 'flex-end', gap: 16, justifyContent: 'center', paddingTop: 8 },
  trendCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
};

// ─── RESPONSIVE: media queries via JS ────────────────────────────────────
if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(max-width: 768px)');
  const applyMobile = (matches) => {
    const hamburgers = document.querySelectorAll('[data-hamburger]');
    // We handle this via inline styles based on state instead
  };
  mq.addEventListener('change', (e) => applyMobile(e.matches));
}
