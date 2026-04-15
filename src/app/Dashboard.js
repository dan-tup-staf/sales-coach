'use client';
import { useState, useEffect, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// KONFIGURACJA
// ═══════════════════════════════════════════════════════════════════════════
const SHEET_CSV_URL = null;

const DEMO_DATA = { reps: [] };

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS PARSER
// ═══════════════════════════════════════════════════════════════════════════
function parseCSVtoData(csvText) {
  const rows = parseCSVFull(csvText);
  if (rows.length < 2) return null;
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const repsMap = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const get = (col) => { let idx = headers.indexOf(col); if (idx < 0 && col === 'rel_strengths') idx = headers.indexOf('rel_strenghts'); return idx >= 0 ? (row[idx] || '').trim() : ''; };
    const repName = get('handlowiec');
    if (!repName) continue;
    const repId = repName.toLowerCase().replace(/\s+/g, '_');
    if (!repsMap[repId]) {
      repsMap[repId] = {
        id: repId, name: repName,
        avatar: repName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        role: get('rola') || 'Account Executive', meetings: [],
      };
    }
    const tryParseJSON = (val) => { try { return JSON.parse(val); } catch { return [val || '']; } };
    repsMap[repId].meetings.push({
      id: `m_${i}`, date: get('data'), type: get('typ_spotkania') || 'Rozmowa',
      client: get('klient'), dealHealth: get('deal_health') || 'yellow',
      qualification: parseInt(get('ocena_kwalifikacji')) || 0,
      sales: { strengths: tryParseJSON(get('sales_strengths')), weaknesses: tryParseJSON(get('sales_weaknesses')), actions: tryParseJSON(get('sales_actions')) },
      relationship: { strengths: tryParseJSON(get('rel_strengths')), weaknesses: tryParseJSON(get('rel_weaknesses')), actions: tryParseJSON(get('rel_actions')) },
    });
  }
  const reps = Object.values(repsMap);
  reps.forEach(r => r.meetings.sort((a, b) => b.date.localeCompare(a.date)));
  return reps.length > 0 ? { reps } : null;
}

// Full CSV parser that correctly handles multiline quoted fields
function parseCSVFull(text) {
  const rows = []; let row = []; let field = ''; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        if (ch === '\r') i++;
        row.push(field); field = '';
        if (row.some(f => f.trim())) rows.push(row);
        row = [];
      } else if (ch === '\r') {
        row.push(field); field = '';
        if (row.some(f => f.trim())) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  row.push(field);
  if (row.some(f => f.trim())) rows.push(row);
  return rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
const HEALTH = {
  red:    { label: 'Zagrożony',        bg: '#2D1215', border: '#DC2626', text: '#FCA5A5', dot: '#EF4444' },
  yellow: { label: 'Wymaga uwagi',     bg: '#2D2305', border: '#CA8A04', text: '#FDE68A', dot: '#EAB308' },
  green:  { label: 'Na dobrej drodze', bg: '#052E16', border: '#16A34A', text: '#86EFAC', dot: '#22C55E' },
};

const MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];

function getMonthKey(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length < 2) return null;
  return `${parts[0]}-${parts[1]}`;
}

function getMonthLabel(key) {
  if (!key) return 'Wszystkie';
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

function dedup(arr, n) {
  const seen = new Set(); const res = [];
  for (const item of arr) { const k = item.slice(0, 40); if (!seen.has(k)) { seen.add(k); res.push(item); } if (res.length >= n) break; }
  return res;
}

function calcStats(meetings) {
  if (!meetings.length) return { avg: 0, count: 0, red: 0, yellow: 0, green: 0 };
  const avg = Math.round(meetings.reduce((s, m) => s + m.qualification, 0) / meetings.length);
  const health = meetings.reduce((a, m) => { a[m.dealHealth]++; return a; }, { red: 0, yellow: 0, green: 0 });
  return { avg, count: meetings.length, ...health };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [data, setData] = useState(DEMO_DATA);
  const [loading, setLoading] = useState(true);
  const [selectedRep, setSelectedRep] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    fetch('/api/sheets')
      .then(r => r.text())
      .then(csv => { const parsed = parseCSVtoData(csv); if (parsed) setData(parsed); })
      .catch(console.error)
      .finally(() => setLoading(false));
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => {
    if (data.reps.length > 0 && !selectedRep) setSelectedRep(data.reps[0]);
  }, [data, selectedRep]);

  // Available months for selected rep
  const availableMonths = useMemo(() => {
    if (!selectedRep) return [];
    const months = new Set();
    selectedRep.meetings.forEach(m => { const k = getMonthKey(m.date); if (k) months.add(k); });
    return [...months].sort().reverse();
  }, [selectedRep]);

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    if (!selectedRep) return [];
    if (selectedMonth === 'all') return selectedRep.meetings;
    return selectedRep.meetings.filter(m => getMonthKey(m.date) === selectedMonth);
  }, [selectedRep, selectedMonth]);

  if (loading || !selectedRep) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0A0A', color: '#666', fontSize: 14 }}>
        Ładowanie danych z Google Sheets...
      </div>
    );
  }

  const rep = selectedRep;
  const meetings = filteredMeetings;
  const current = selectedMeeting && meetings.find(m => m.id === selectedMeeting.id) ? selectedMeeting : meetings[0];
  const avgQ = meetings.length ? Math.round(meetings.reduce((s, m) => s + m.qualification, 0) / meetings.length) : 0;
  const healthCounts = meetings.reduce((a, m) => { a[m.dealHealth]++; return a; }, { red: 0, yellow: 0, green: 0 });

  const getPatterns = (cat) => ({
    strengths: meetings.flatMap(m => m[cat].strengths),
    weaknesses: meetings.flatMap(m => m[cat].weaknesses),
    actions: meetings.flatMap(m => m[cat].actions),
  });

  const selectRep = (r) => { setSelectedRep(r); setSelectedMeeting(null); setActiveTab('overview'); setSidebarOpen(false); setSelectedMonth('all'); };
  const selectMeeting = (m) => { setSelectedMeeting(m); setActiveTab('sales'); setSidebarOpen(false); };

  return (
    <div style={S.root}>
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={S.hamburger}>
        <span style={{ ...S.hamburgerLine, transform: sidebarOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
        <span style={{ ...S.hamburgerLine, opacity: sidebarOpen ? 0 : 1 }} />
        <span style={{ ...S.hamburgerLine, transform: sidebarOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
      </button>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={S.overlay} />}

      <aside style={{ ...S.sidebar, ...(sidebarOpen ? S.sidebarOpen : {}), opacity: loaded ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
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
            <button key={r.id} onClick={() => selectRep(r)} style={{ ...S.repBtn, background: rep.id === r.id ? '#1A1706' : 'transparent' }}>
              <div style={{ ...S.avatar, background: rep.id === r.id ? '#2D2305' : '#1E1E1E', color: rep.id === r.id ? '#E8B931' : '#888', borderColor: rep.id === r.id ? '#E8B93144' : '#2A2A2A' }}>{r.avatar}</div>
              <div>
                <div style={S.repName}>{r.name}</div>
                <div style={S.repMeta}>{r.meetings.length} {r.meetings.length === 1 ? 'spotkanie' : r.meetings.length < 5 ? 'spotkania' : 'spotkań'}</div>
              </div>
            </button>
          ))}
        </div>

        {/* MONTH FILTER */}
        <div style={S.section}>
          <div style={S.sectionLabel}>MIESIĄC</div>
          <div style={{ padding: '0 4px' }}>
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setSelectedMeeting(null); }}
              style={S.monthSelect}
            >
              <option value="all">Wszystkie miesiące</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{getMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionLabel}>SPOTKANIA {selectedMonth !== 'all' ? `(${getMonthLabel(selectedMonth)})` : ''}</div>
          {meetings.length === 0 && (
            <div style={{ padding: '12px 10px', fontSize: 12, color: '#555' }}>Brak spotkań w wybranym miesiącu</div>
          )}
          {meetings.map(m => {
            const h = HEALTH[m.dealHealth];
            return (
              <button key={m.id} onClick={() => selectMeeting(m)} style={{ ...S.meetBtn, background: current?.id === m.id ? '#141414' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.dot, flexShrink: 0 }}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={S.meetClient}>{m.client}</div>
                    <div style={S.meetMeta}>{m.date} · {m.type}</div>
                  </div>
                </div>
                <div style={{ ...S.badge, background: h.bg, color: h.text, border: `1px solid ${h.border}33` }}>{m.qualification}%</div>
              </button>
            );
          })}
        </div>
      </aside>

      <main style={S.main}>
        <header style={{ ...S.header, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s' }}>
          <div>
            <h1 style={S.h1}>{rep.name}</h1>
            <p style={S.subtitle}>
              {rep.role} · Średnia kwalifikacja: {avgQ}%
              {selectedMonth !== 'all' && <span style={{ color: '#E8B931' }}> · {getMonthLabel(selectedMonth)}</span>}
            </p>
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

        <nav style={S.tabs}>
          {[
            { id: 'overview', label: 'Przegląd' },
            { id: 'sales', label: 'Technika sprzedaży' },
            { id: 'relationship', label: 'Budowanie relacji' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ ...S.tab, color: activeTab === t.id ? '#E8B931' : '#666', borderBottomColor: activeTab === t.id ? '#E8B931' : 'transparent' }}>{t.label}</button>
          ))}
        </nav>

        <div>
          {activeTab === 'overview' && <Overview meetings={meetings} allMeetings={rep.meetings} getPatterns={getPatterns} loaded={loaded} selectedMonth={selectedMonth} availableMonths={availableMonths} />}
          {activeTab === 'sales' && current && <Detail meeting={current} cat="sales" title="Technika sprzedaży" loaded={loaded} />}
          {activeTab === 'relationship' && current && <Detail meeting={current} cat="relationship" title="Budowanie relacji" loaded={loaded} />}
          {(activeTab === 'sales' || activeTab === 'relationship') && !current && (
            <div style={{ padding: 40, textAlign: 'center', color: '#555', fontSize: 14 }}>Wybierz spotkanie z listy po lewej</div>
          )}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB — with month-over-month progress
// ═══════════════════════════════════════════════════════════════════════════
function Overview({ meetings, allMeetings, getPatterns, loaded, selectedMonth, availableMonths }) {
  const sp = getPatterns('sales');
  const rp = getPatterns('relationship');

  // Calculate month-over-month stats for progress section
  const monthStats = useMemo(() => {
    const byMonth = {};
    allMeetings.forEach(m => {
      const k = getMonthKey(m.date);
      if (!k) return;
      if (!byMonth[k]) byMonth[k] = [];
      byMonth[k].push(m);
    });
    const sorted = Object.keys(byMonth).sort();
    return sorted.map(k => ({ key: k, label: getMonthLabel(k), ...calcStats(byMonth[k]) }));
  }, [allMeetings]);

  const getDelta = (curr, prev) => {
    if (prev === undefined || prev === null) return null;
    return curr - prev;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* MONTH-OVER-MONTH PROGRESS */}
      {monthStats.length > 1 && (
        <Card delay={0.2} loaded={loaded}>
          <h3 style={S.cardTitle}>📊 Progres — zmiana między miesiącami</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={S.th}>Miesiąc</th>
                  <th style={S.th}>Spotkania</th>
                  <th style={S.th}>Śr. kwalifikacja</th>
                  <th style={S.th}>Zmiana</th>
                  <th style={{ ...S.th, width: 120 }}>Deal health</th>
                </tr>
              </thead>
              <tbody>
                {monthStats.map((ms, idx) => {
                  const prev = idx > 0 ? monthStats[idx - 1] : null;
                  const delta = prev ? getDelta(ms.avg, prev.avg) : null;
                  const isSelected = selectedMonth === ms.key;
                  return (
                    <tr key={ms.key} style={{ background: isSelected ? '#1A170611' : 'transparent' }}>
                      <td style={{ ...S.td, fontWeight: isSelected ? 700 : 500, color: isSelected ? '#E8B931' : '#CCC' }}>{ms.label}</td>
                      <td style={{ ...S.td, color: '#999' }}>{ms.count}</td>
                      <td style={S.td}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: ms.avg >= 40 ? '#22C55E' : ms.avg >= 25 ? '#EAB308' : '#EF4444' }}>{ms.avg}%</span>
                      </td>
                      <td style={S.td}>
                        {delta !== null ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                            background: delta > 0 ? '#052E16' : delta < 0 ? '#2D1215' : '#1E1E1E',
                            color: delta > 0 ? '#86EFAC' : delta < 0 ? '#FCA5A5' : '#888',
                            border: `1px solid ${delta > 0 ? '#16A34A33' : delta < 0 ? '#DC262633' : '#2A2A2A'}`,
                          }}>
                            {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {delta > 0 ? '+' : ''}{delta}pp
                          </span>
                        ) : (
                          <span style={{ color: '#555', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {ms.green > 0 && <MiniPill color="#22C55E" bg="#052E16" count={ms.green} />}
                          {ms.yellow > 0 && <MiniPill color="#EAB308" bg="#2D2305" count={ms.yellow} />}
                          {ms.red > 0 && <MiniPill color="#EF4444" bg="#2D1215" count={ms.red} />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TREND CHART */}
      {meetings.length > 0 && (
        <Card delay={0.3} loaded={loaded}>
          <h3 style={S.cardTitle}>Trend kwalifikacji {selectedMonth !== 'all' ? `— ${getMonthLabel(selectedMonth)}` : ''}</h3>
          <div style={S.trendRow}>
            {[...meetings].reverse().map((m) => {
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
                  <div style={{ fontSize: 10, color: '#444', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.client.split('/')[0].trim()}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* PATTERNS */}
      {meetings.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Card delay={0.4} loaded={loaded} style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ ...S.cardTitle, color: '#22C55E' }}>✦ Powtarzające się mocne strony</h3>
              {dedup(sp.strengths, 3).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22C55E88', marginBottom: 8 }}>Kwalifikacja MEDDIC</div>
                  <Items items={dedup(sp.strengths, 3)} color="#22C55E"/>
                </div>
              )}
              {dedup(rp.strengths, 3).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22C55E88', marginBottom: 8 }}>Budowanie relacji</div>
                  <Items items={dedup(rp.strengths, 3)} color="#22C55E"/>
                </div>
              )}
            </Card>
            <Card delay={0.5} loaded={loaded} style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ ...S.cardTitle, color: '#EAB308' }}>△ Powtarzające się do poprawy</h3>
              {dedup(sp.weaknesses, 3).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#EAB30888', marginBottom: 8 }}>Kwalifikacja MEDDIC</div>
                  <Items items={dedup(sp.weaknesses, 3)} color="#EAB308"/>
                </div>
              )}
              {dedup(rp.weaknesses, 3).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#EAB30888', marginBottom: 8 }}>Budowanie relacji</div>
                  <Items items={dedup(rp.weaknesses, 3)} color="#EAB308"/>
                </div>
              )}
            </Card>
          </div>
          <Card delay={0.6} loaded={loaded}>
            <h3 style={S.cardTitle}><span style={{ color: '#E8B931' }}>⚡</span> Priorytetowe action points</h3>
            <Actions items={dedup(sp.actions.concat(rp.actions), 5)}/>
          </Card>
        </>
      )}

      {meetings.length === 0 && (
        <Card delay={0.3} loaded={loaded}>
          <div style={{ padding: 20, textAlign: 'center', color: '#555' }}>Brak spotkań w wybranym okresie</div>
        </Card>
      )}
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
      ...S.card, ...style,
      opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(15px)',
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
  const r = 22; const c = Math.PI * 2 * r;
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

function MiniPill({ color, bg, count }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: bg, color, border: `1px solid ${color}33`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {count}
    </span>
  );
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
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9, display: 'none' },
  hamburger: {
    display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 20,
    background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8,
    width: 40, height: 40, flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 4, padding: 0,
  },
  hamburgerLine: { width: 18, height: 2, background: '#999', borderRadius: 1, transition: 'all 0.2s ease' },
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
  monthSelect: {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    background: '#141414', border: '1px solid #2A2A2A', color: '#CCC',
    fontSize: 12, fontWeight: 500, cursor: 'pointer', outline: 'none',
    appearance: 'none', WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M1.5 5.5l6.5 6.5 6.5-6.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: 10,
  },
  meetBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
    width: '100%', textAlign: 'left', transition: 'all 0.15s ease', gap: 8,
  },
  meetClient: { fontSize: 12, fontWeight: 500, color: '#BBB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meetMeta: { fontSize: 10, color: '#555', marginTop: 2 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, flexShrink: 0 },
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
  card: { background: '#111', border: '1px solid #1E1E1E', borderRadius: 12, padding: '20px 22px' },
  cardTitle: {
    fontSize: 14, fontWeight: 600, color: '#999', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em',
  },
  trendRow: { display: 'flex', alignItems: 'flex-end', gap: 16, justifyContent: 'center', paddingTop: 8, overflowX: 'auto' },
  trendCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#555', borderBottom: '1px solid #1E1E1E', letterSpacing: '0.05em' },
  td: { padding: '10px 12px', borderBottom: '1px solid #1A1A1A', verticalAlign: 'middle' },
};
