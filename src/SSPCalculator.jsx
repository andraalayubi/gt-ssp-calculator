import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { seedsData } from './seedsData';
import { exportSSPData } from './exportToExcel';
import ExportButton from './ExportButton';

const AdBanner = ({ slot }) => {
  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className="ad-container">
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot={slot}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

function SSPCalculator() {
  const [sspCost, setSspCost] = useState(() => {
    return localStorage.getItem('sspCost') || '15';
  });

  const [seedValues, setSeedValues] = useState(() => {
    const initial = {};
    seedsData.forEach(seed => {
      initial[seed.id] = {
        amt: localStorage.getItem('amt' + seed.id) || '200',
        price: localStorage.getItem('price' + seed.id) || '1'
      };
    });
    return initial;
  });

  // SSP Sub-Tab & Pack Simulator State
  const [sspSubTab, setSspSubTab] = useState('calculator'); // 'calculator' | 'simulator'
  const [simPacksInput, setSimPacksInput] = useState('200');
  const [simInventory, setSimInventory] = useState({});
  const [totalPacksOpened, setTotalPacksOpened] = useState(0);
  const [lastOpenedPack, setLastOpenedPack] = useState([]);
  const [simSearch, setSimSearch] = useState('');
  const [simFilterGroup, setSimFilterGroup] = useState('all'); // 'all' | 'common' | 'rare' | 'obtained'
  const [simSort, setSimSort] = useState('qty-desc'); // 'qty-desc' | 'qty-asc' | 'name' | 'rarity'

  const [bulkPrice, setBulkPrice] = useState('1');
  const [selectedSeeds, setSelectedSeeds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [trashModalSelected, setTrashModalSelected] = useState([]);
  const [trashModalSearch, setTrashModalSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [showGuide, setShowGuide] = useState(() => {
    return !localStorage.getItem('guideShown');
  });
  const [gridLayout, setGridLayout] = useState(() => {
    return localStorage.getItem('gridLayout') || 'auto';
  });
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'priced', 'unpriced', 'hasAmount', 'trash'
  const seedsSectionRef = useRef(null);

  // Trash seeds — persisted to localStorage
  const [trashSeeds, setTrashSeeds] = useState(() => {
    try {
      const saved = localStorage.getItem('trashSeeds');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Roll 1 seed logic:
  // Group 1 (Common seeds: L2-L85, index 0..83) weight = 3.0
  // Group 2 (Rare seeds: L86-L150, index 84..148) weight = 1.0
  const rollOneSeed = useCallback(() => {
    const commonCount = 84;
    const commonWeight = 3.0;
    const rareWeight = 1.0;
    const rareCount = seedsData.length - commonCount; // 65
    const totalWeight = (commonCount * commonWeight) + (rareCount * rareWeight); // 317

    let rand = Math.random() * totalWeight;
    for (let i = 0; i < seedsData.length; i++) {
      const weight = i < commonCount ? commonWeight : rareWeight;
      if (rand < weight) {
        return {
          ...seedsData[i],
          group: i < commonCount ? 'common' : 'rare',
          idx: i
        };
      }
      rand -= weight;
    }
    return { ...seedsData[0], group: 'common', idx: 0 };
  }, []);

  const simulateOpenPacks = useCallback((count) => {
    const numPacks = parseInt(count, 10);
    if (isNaN(numPacks) || numPacks <= 0) return;

    setSimInventory(prev => {
      const next = { ...prev };
      let lastPack = [];
      for (let p = 0; p < numPacks; p++) {
        const currentPack = [];
        for (let s = 0; s < 5; s++) {
          const rolled = rollOneSeed();
          next[rolled.id] = (next[rolled.id] || 0) + 1;
          currentPack.push(rolled);
        }
        if (p === numPacks - 1) {
          lastPack = currentPack;
        }
      }
      setLastOpenedPack(lastPack);
      return next;
    });
    setTotalPacksOpened(prev => prev + numPacks);
  }, [rollOneSeed]);

  const resetSimulator = () => {
    setSimInventory({});
    setTotalPacksOpened(0);
    setLastOpenedPack([]);
  };

  const applySimToCalculator = () => {
    setSeedValues(prev => {
      const next = { ...prev };
      seedsData.forEach(seed => {
        const amt = simInventory[seed.id] || 0;
        next[seed.id] = { ...next[seed.id], amt: amt.toString() };
        localStorage.setItem('amt' + seed.id, amt.toString());
      });
      return next;
    });
    setSspSubTab('calculator');
    setTimeout(() => {
      seedsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const filteredSimSeeds = useMemo(() => {
    let list = seedsData.map((seed, idx) => {
      const qty = simInventory[seed.id] || 0;
      const group = idx < 84 ? 'common' : 'rare';
      const price = parseFloat(seedValues[seed.id]?.price) || 0;
      const revenue = price > 0 && qty > 0 ? (qty / price) : 0;
      return {
        ...seed,
        qty,
        group,
        price,
        revenue,
        idx
      };
    });

    if (simFilterGroup === 'common') list = list.filter(s => s.group === 'common');
    if (simFilterGroup === 'rare') list = list.filter(s => s.group === 'rare');
    if (simFilterGroup === 'obtained') list = list.filter(s => s.qty > 0);

    if (simSearch.trim()) {
      const query = simSearch.toLowerCase();
      list = list.filter(s => s.id.replace(/([A-Z])/g, ' $1').toLowerCase().includes(query));
    }

    list.sort((a, b) => {
      if (simSort === 'qty-desc') return b.qty - a.qty || a.idx - b.idx;
      if (simSort === 'qty-asc') return a.qty - b.qty || a.idx - b.idx;
      if (simSort === 'name') return a.id.localeCompare(b.id);
      if (simSort === 'rarity') return a.idx - b.idx;
      return 0;
    });

    return list;
  }, [simInventory, simFilterGroup, simSearch, simSort, seedValues]);

  const simStats = useMemo(() => {
    const totalSeeds = totalPacksOpened * 5;
    let commonCount = 0;
    let rareCount = 0;
    let totalEstRevenue = 0;

    seedsData.forEach((seed, idx) => {
      const qty = simInventory[seed.id] || 0;
      if (idx < 84) {
        commonCount += qty;
      } else {
        rareCount += qty;
      }
      const price = parseFloat(seedValues[seed.id]?.price) || 0;
      if (price > 0 && qty > 0) {
        totalEstRevenue += (qty / price);
      }
    });

    return {
      totalSeeds,
      commonCount,
      rareCount,
      commonPercent: totalSeeds > 0 ? ((commonCount / totalSeeds) * 100).toFixed(1) : '0.0',
      rarePercent: totalSeeds > 0 ? ((rareCount / totalSeeds) * 100).toFixed(1) : '0.0',
      totalEstRevenue
    };
  }, [simInventory, totalPacksOpened, seedValues]);

  // Save SSP Cost to cache when changed
  const handleSspCostChange = (val) => {
    setSspCost(val);
    localStorage.setItem('sspCost', val);
  };

  const handleSeedChange = (id, field, val) => {
    setSeedValues(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }));
    localStorage.setItem(field + id, val);
  };

  const applyBulkPrice = () => {
    setSeedValues(prev => {
      const next = { ...prev };
      selectedSeeds.forEach(id => {
        next[id] = { ...next[id], price: bulkPrice };
        localStorage.setItem('price' + id, bulkPrice);
      });
      return next;
    });
    setIsModalOpen(false);
    setSelectedSeeds([]);
    setModalSearch('');
  };

  const toggleSeedSelection = (id) => {
    setSelectedSeeds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Toggle trash seed
  const toggleTrash = (id) => {
    setTrashSeeds(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      localStorage.setItem('trashSeeds', JSON.stringify(next));
      return next;
    });
  };

  const clearAllTrash = () => {
    setTrashSeeds([]);
    localStorage.setItem('trashSeeds', '[]');
  };

  const openTrashModal = () => {
    setTrashModalSelected([...trashSeeds]);
    setTrashModalSearch('');
    setIsTrashModalOpen(true);
  };

  const toggleTrashModalSelection = (id) => {
    setTrashModalSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const applyBulkTrash = () => {
    setTrashSeeds(trashModalSelected);
    localStorage.setItem('trashSeeds', JSON.stringify(trashModalSelected));
    setIsTrashModalOpen(false);
  };

  // Format seed ID into a readable name
  const formatSeedName = useCallback((id) => {
    return id.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }, []);

  // Auto-calculate results (includes trash-aware "worst case" scenario)
  const results = useMemo(() => {
    let tSSP = 0;
    let tWL = 0;
    let trashWL = 0; // revenue lost from trash seeds
    const noPrice = [];

    seedsData.forEach(seed => {
      const amtStr = seedValues[seed.id].amt;
      const priceStr = seedValues[seed.id].price;
      const amt = parseFloat(amtStr) || 0;
      const price = parseFloat(priceStr) || 0;
      const isTrash = trashSeeds.includes(seed.id);

      if (price > 0 && amt > 0) {
        const rev = amt / price;
        tWL += rev;
        if (isTrash) trashWL += rev;
      } else if (price <= 0 && amt > 0) {
        noPrice.push(seed.id);
      }
      tSSP += (amt / 5);
    });

    const parsedCost = parseFloat(sspCost) || 0;
    const cost = (tSSP / 200) * parsedCost;
    const bestProfit = tWL - cost;
    const worstRevenue = tWL - trashWL;
    const worstProfit = worstRevenue - cost;

    return {
      totalSSP: tSSP,
      totalWorldLock: tWL,
      cleanProfit: bestProfit,
      cost,
      noPriceSeeds: noPrice,
      trashRevenueLost: trashWL,
      worstRevenue,
      worstProfit,
    };
  }, [seedValues, sspCost, trashSeeds]);

  // Filtered + searched seeds
  const filteredSeeds = useMemo(() => {
    return seedsData.filter(seed => {
      const name = formatSeedName(seed.id).toLowerCase();
      const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const amt = parseFloat(seedValues[seed.id]?.amt) || 0;
      const price = parseFloat(seedValues[seed.id]?.price) || 0;

      switch (filterMode) {
        case 'priced': return price > 0;
        case 'unpriced': return price <= 0 && amt > 0;
        case 'hasAmount': return amt > 0;
        case 'trash': return trashSeeds.includes(seed.id);
        default: return true;
      }
    });
  }, [searchQuery, filterMode, seedValues, formatSeedName, trashSeeds]);

  // Modal filtered seeds
  const modalFilteredSeeds = useMemo(() => {
    if (!modalSearch) return seedsData;
    return seedsData.filter(seed =>
      formatSeedName(seed.id).toLowerCase().includes(modalSearch.toLowerCase())
    );
  }, [modalSearch, formatSeedName]);

  // Trash modal filtered seeds
  const trashModalFilteredSeeds = useMemo(() => {
    if (!trashModalSearch) return seedsData;
    return seedsData.filter(seed =>
      formatSeedName(seed.id).toLowerCase().includes(trashModalSearch.toLowerCase())
    );
  }, [trashModalSearch, formatSeedName]);

  const handleLayoutChange = (layout) => {
    setGridLayout(layout);
    localStorage.setItem('gridLayout', layout);
  };

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem('guideShown', 'true');
  };

  const resetAllPrices = () => {
    setSeedValues(prev => {
      const next = { ...prev };
      seedsData.forEach(seed => {
        next[seed.id] = { ...next[seed.id], price: '0' };
        localStorage.setItem('price' + seed.id, '0');
      });
      return next;
    });
  };

  const resetAllAmounts = () => {
    setSeedValues(prev => {
      const next = { ...prev };
      seedsData.forEach(seed => {
        next[seed.id] = { ...next[seed.id], amt: '0' };
        localStorage.setItem('amt' + seed.id, '0');
      });
      return next;
    });
  };

  // Keyboard shortcut: Escape to close modal
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (isTrashModalOpen) setIsTrashModalOpen(false);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isModalOpen, isTrashModalOpen]);

  return (
    <>
      {/* Onboarding Guide */}
      {showGuide && (
        <div className="guideOverlay" onClick={dismissGuide}>
          <div className="guideCard" onClick={e => e.stopPropagation()}>
            <div className="guideHeader">
              <span className="guideIcon">🎮</span>
              <h3>Welcome to SSP Profit Calculator!</h3>
            </div>
            <div className="guideSteps">
              <div className="guideStep">
                <span className="stepNum">1</span>
                <div>
                  <strong>Set SSP buy price</strong>
                  <p>Enter how much you pay per 200 SSP packs (default: 15 WL)</p>
                </div>
              </div>
              <div className="guideStep">
                <span className="stepNum">2</span>
                <div>
                  <strong>Enter seed amounts</strong>
                  <p>Type how many of each seed you got from opening packs</p>
                </div>
              </div>
              <div className="guideStep">
                <span className="stepNum">3</span>
                <div>
                  <strong>Set seed prices</strong>
                  <p>Enter how many seeds per 1 World Lock (e.g., "20" means 20 seeds = 1 WL)</p>
                </div>
              </div>
              <div className="guideStep">
                <span className="stepNum">4</span>
                <div>
                  <strong>See your profit instantly</strong>
                  <p>Results update automatically — no button needed!</p>
                </div>
              </div>
            </div>
            <button className="guideDismiss" onClick={dismissGuide}>Got it, let's go!</button>
          </div>
        </div>
      )}

      {/* Sticky Results Dashboard */}
      <div className="stickyDashboard">
        <div className="dashboardInner">
          <div className="dashStat">
            <span className="dashLabel">SSP Packs</span>
            <div className="dashValue">
              <img src="/images/ssp.png" alt="SSP" />
              <span>{results.totalSSP.toFixed(0)}</span>
            </div>
          </div>
          <div className="dashDivider" />
          <div className="dashStat">
            <span className="dashLabel">Cost</span>
            <div className="dashValue cost">
              <img src="/images/worldlock.png" alt="WL" />
              <span>{results.cost.toFixed(2)}</span>
            </div>
          </div>
          <div className="dashDivider" />
          <div className="dashStat">
            <span className="dashLabel">Revenue</span>
            <div className="dashValue revenue">
              <img src="/images/worldlock.png" alt="WL" />
              <span>{results.totalWorldLock.toFixed(2)}</span>
            </div>
          </div>
          <div className="dashDivider" />
          <div className={`dashStat dashProfit ${results.cleanProfit >= 0 ? 'positive' : 'negative'}`}>
            <span className="dashLabel">Profit</span>
            <div className="dashValue">
              <img src="/images/worldlock.png" alt="WL" />
              <span>{results.cleanProfit >= 0 ? '+' : ''}{results.cleanProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="container">
        {/* Header */}
        <div className="headerSection">
          <h1>
            <img src="/images/ssp.png" alt="SSP" className="headerLogo" />
            SSP Profit Calculator
          </h1>
          <p className="subtitle">Calculate your Growtopia SSP pack profits instantly</p>
          <div className="headerActions">
            <ExportButton onClick={() => exportSSPData({ seedsData, seedValues, sspCost, results, trashSeeds, formatSeedName })} />
            <a href="https://youtu.be/yXHZ-oC-2cE" className="tutorialLink" target="_blank" rel="noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Watch Tutorial
            </a>
            <button className="helpBtn" onClick={() => setShowGuide(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              How to Use
            </button>
          </div>
        </div>

        {/* Top Ad Banner */}
        <AdBanner slot="1234567890" />

        {/* Sub-tab Navigation */}
        <div style={{ width: '100%', marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            background: 'var(--surface)',
            padding: '6px',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            maxWidth: '560px',
            margin: '0 auto'
          }}>
            <button
              className={`ssp-subtab-btn ${sspSubTab === 'calculator' ? 'active' : ''}`}
              onClick={() => setSspSubTab('calculator')}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: sspSubTab === 'calculator' ? '1px solid var(--accent)' : '1px solid transparent',
                background: sspSubTab === 'calculator' ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: sspSubTab === 'calculator' ? '#818cf8' : 'var(--text-muted)',
                transition: 'all 0.25s ease'
              }}
            >
              <span>🧮</span> Kalkulator Manual
            </button>
            <button
              className={`ssp-subtab-btn ${sspSubTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setSspSubTab('simulator')}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: sspSubTab === 'simulator' ? '1px solid var(--accent)' : '1px solid transparent',
                background: sspSubTab === 'simulator' ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: sspSubTab === 'simulator' ? '#818cf8' : 'var(--text-muted)',
                transition: 'all 0.25s ease'
              }}
            >
              <span>🎁</span> Simulator Buka Pack (Randomize)
            </button>
          </div>
        </div>

        {sspSubTab === 'simulator' ? (
          /* ========================================================= */
          /* ================= PACK SIMULATOR TAB ==================== */
          /* ========================================================= */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Control Panel Card */}
            <div className="surg-card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.8rem' }}>🎁</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: 'var(--text)' }}>
                    Simulator Buka Pack (Randomize Stock)
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Setiap 1 SSP Pack menghasilkan <strong>5 seed</strong>. Seed Common (L2-L85) berpeluang <strong>3×</strong> lebih sering dibandingkan Seed Rare (L86-L150).
                  </p>
                </div>
              </div>

              {/* Action Inputs & Buttons */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button className="bulkBtn" onClick={() => simulateOpenPacks(1)} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  📦 Buka 1 Pack (+5 Seeds)
                </button>
                <button className="bulkBtn" onClick={() => simulateOpenPacks(10)}>
                  📦 Buka 10 Pack (+50 Seeds)
                </button>
                <button className="bulkBtn" onClick={() => simulateOpenPacks(200)} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  🎁 Buka 200 Pack (+1000 Seeds)
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    value={simPacksInput}
                    onChange={(e) => setSimPacksInput(e.target.value)}
                    placeholder="200"
                    style={{
                      width: '90px',
                      padding: '8px 12px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      fontWeight: '700',
                      textAlign: 'center'
                    }}
                  />
                  <button className="bulkBtn" onClick={() => simulateOpenPacks(simPacksInput)}>
                    🎲 Simulasi Custom Pack
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button
                  className="resetBtn"
                  onClick={resetSimulator}
                  style={{ color: 'var(--red)', borderColor: 'var(--red-border)', background: 'var(--red-bg)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"/></svg>
                  Reset Simulator
                </button>
                
                <button
                  className="bulkBtn"
                  onClick={applySimToCalculator}
                  disabled={totalPacksOpened === 0}
                  style={{
                    marginLeft: 'auto',
                    background: totalPacksOpened > 0 ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--surface)',
                    opacity: totalPacksOpened > 0 ? 1 : 0.5,
                    cursor: totalPacksOpened > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  📥 Terapkan Hasil Stock ke Kalkulator Manual
                </button>
              </div>
            </div>

            {/* Last Pack Showcase */}
            {lastOpenedPack.length > 0 && (
              <div style={{
                background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#818cf8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✨</span> Hasil Buka 1 Pack Terakhir (5 Seeds):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {lastOpenedPack.map((rolledSeed, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--modal-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '12px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        textAlign: 'center'
                      }}
                    >
                      <img src={rolledSeed.img} alt={rolledSeed.id} style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {formatSeedName(rolledSeed.id)}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: rolledSeed.group === 'common' ? 'rgba(16,185,129,0.15)' : 'rgba(168,85,247,0.15)',
                        color: rolledSeed.group === 'common' ? 'var(--green)' : '#c084fc',
                        border: rolledSeed.group === 'common' ? '1px solid var(--green-border)' : '1px solid rgba(168,85,247,0.3)'
                      }}>
                        {rolledSeed.group === 'common' ? '🟢 Common (3x)' : '💜 Rare (1.0x)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulator Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="surg-stat-box" style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span className="dashLabel">Total Pack Dibuka</span>
                <div className="dashValue" style={{ fontSize: '1.4rem' }}>
                  <img src="/images/ssp.png" alt="SSP" />
                  <span>{totalPacksOpened}</span>
                </div>
              </div>

              <div className="surg-stat-box" style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span className="dashLabel">Total Seed Didapat</span>
                <div className="dashValue" style={{ fontSize: '1.4rem', color: '#60a5fa' }}>
                  <span>🌱 {simStats.totalSeeds}</span>
                </div>
              </div>

              <div className="surg-stat-box" style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--green-border)', borderRadius: '12px' }}>
                <span className="dashLabel" style={{ color: 'var(--green)' }}>Common Seeds (3x)</span>
                <div className="dashValue" style={{ fontSize: '1.2rem', color: 'var(--green)' }}>
                  <span>{simStats.commonCount} ({simStats.commonPercent}%)</span>
                </div>
              </div>

              <div className="surg-stat-box" style={{ padding: '16px', background: 'var(--surface)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '12px' }}>
                <span className="dashLabel" style={{ color: '#c084fc' }}>Rare Seeds (1.0x)</span>
                <div className="dashValue" style={{ fontSize: '1.2rem', color: '#c084fc' }}>
                  <span>{simStats.rareCount} ({simStats.rarePercent}%)</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar for Simulator Inventory */}
            <div className="searchSection" style={{ marginBottom: 0 }}>
              <div className="searchBar">
                <svg className="searchIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  placeholder="Cari seed hasil simulasi..."
                  value={simSearch}
                  onChange={(e) => setSimSearch(e.target.value)}
                />
                {simSearch && (
                  <button className="clearSearch" onClick={() => setSimSearch('')}>✕</button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div className="filterTabs">
                  {[
                    { key: 'all', label: 'Semua Seed', count: seedsData.length },
                    { key: 'obtained', label: 'Sudah Didapat (>0)', count: Object.keys(simInventory).filter(k => simInventory[k] > 0).length },
                    { key: 'common', label: '🟢 Common (3x)', count: 84 },
                    { key: 'rare', label: '💜 Rare (1.0x)', count: 65 },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      className={`filterTab ${simFilterGroup === tab.key ? 'active' : ''}`}
                      onClick={() => setSimFilterGroup(tab.key)}
                    >
                      {tab.label}
                      <span className="tabCount">{tab.count}</span>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600' }}>Urutkan:</label>
                  <select
                    value={simSort}
                    onChange={(e) => setSimSort(e.target.value)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  >
                    <option value="qty-desc">Jumlah Banyak ➔ Sedikit</option>
                    <option value="qty-asc">Jumlah Sedikit ➔ Banyak</option>
                    <option value="name">Nama Seed (A-Z)</option>
                    <option value="rarity">Tingkat Kelangkaan (Group)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory Seeds Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {filteredSimSeeds.map(seed => {
                const dropPercent = simStats.totalSeeds > 0 ? ((seed.qty / simStats.totalSeeds) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={seed.id}
                    style={{
                      background: seed.qty > 0 ? 'var(--surface)' : 'rgba(255,255,255,0.01)',
                      border: seed.qty > 0 ? '1px solid var(--border)' : '1px dashed var(--border)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      opacity: seed.qty > 0 ? 1 : 0.45
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={seed.img} alt={seed.id} style={{ height: '28px', width: '28px', objectFit: 'contain' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatSeedName(seed.id)}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: seed.group === 'common' ? 'var(--green)' : '#c084fc', fontWeight: '700' }}>
                          {seed.group === 'common' ? '🟢 Common (3x)' : '💜 Rare (1.0x)'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input-bg)', padding: '6px 10px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Stock Didapat:</span>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: seed.qty > 0 ? '#818cf8' : 'var(--text-dim)' }}>
                        {seed.qty} <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)' }}>({dropPercent}%)</span>
                      </span>
                    </div>

                    {seed.revenue > 0 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: '700', textAlign: 'right' }}>
                        Est. Revenue: +{seed.revenue.toFixed(2)} WL
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* ================= MANUAL CALCULATOR TAB ================= */
          /* ========================================================= */
          <>
            {/* Warning banner for unpriced seeds */}
            {results.noPriceSeeds.length > 0 && (
              <div className="warningBanner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>
                  <strong>{results.noPriceSeeds.length} seed{results.noPriceSeeds.length > 1 ? 's' : ''}</strong> missing price — revenue may be inaccurate
                </span>
                <button onClick={() => { setFilterMode('unpriced'); seedsSectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Show them
                </button>
              </div>
            )}

            {/* SSP Price Configuration */}
            <div className="configSection">
              <div className="configCard">
                <div className="configRow">
                  <div className="configField">
                    <label htmlFor="sspCost">Buy SSP Price</label>
                    <div className="configInputGroup">
                      <input
                        type="number"
                        id="sspCost"
                        value={sspCost}
                        onChange={(e) => handleSspCostChange(e.target.value)}
                        placeholder="15"
                      />
                      <span className="configUnit">
                        <img src="/images/worldlock.png" alt="WL" />
                        per 200 packs
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="actionButtons">
                <button className="bulkBtn" onClick={() => setIsModalOpen(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Bulk Set Price
                </button>
                <button className="resetBtn" onClick={resetAllPrices}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"/></svg>
                  Reset Prices
                </button>
                <button className="resetBtn" onClick={resetAllAmounts}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"/></svg>
                  Reset Amounts
                </button>
                <button className="trashBulkBtn" onClick={openTrashModal}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Bulk Mark Trash
                </button>
              </div>
            </div>

            {/* Trash Analysis Section */}
            {trashSeeds.length > 0 && (
              <div className="trashAnalysis">
                <div className="trashHeader">
                  <div className="trashTitle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <h3>Trash Seed Analysis</h3>
                    <span className="trashCount">{trashSeeds.length} seed{trashSeeds.length > 1 ? 's' : ''} marked</span>
                  </div>
                  <button className="clearTrashBtn" onClick={clearAllTrash}>Clear All Trash</button>
                </div>
                <div className="trashGrid">
                  <div className="trashCard best">
                    <span className="trashCardLabel">Best Case (all sell)</span>
                    <div className="trashCardRow">
                      <span>Revenue</span>
                      <span className="trashCardValue">
                        <img src="/images/worldlock.png" alt="WL" />
                        {results.totalWorldLock.toFixed(2)}
                      </span>
                    </div>
                    <div className="trashCardRow">
                      <span>Profit</span>
                      <span className={`trashCardValue ${results.cleanProfit >= 0 ? 'pos' : 'neg'}`}>
                        <img src="/images/worldlock.png" alt="WL" />
                        {results.cleanProfit >= 0 ? '+' : ''}{results.cleanProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="trashVs">VS</div>
                  <div className="trashCard worst">
                    <span className="trashCardLabel">Worst Case (trash unsold)</span>
                    <div className="trashCardRow">
                      <span>Revenue</span>
                      <span className="trashCardValue">
                        <img src="/images/worldlock.png" alt="WL" />
                        {results.worstRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="trashCardRow">
                      <span>Profit</span>
                      <span className={`trashCardValue ${results.worstProfit >= 0 ? 'pos' : 'neg'}`}>
                        <img src="/images/worldlock.png" alt="WL" />
                        {results.worstProfit >= 0 ? '+' : ''}{results.worstProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="trashLost">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Revenue at risk from trash seeds: <strong>{results.trashRevenueLost.toFixed(2)} WL</strong>
                </div>
              </div>
            )}

            {/* Search & Filter */}
            <div className="searchSection" ref={seedsSectionRef}>
              <div className="searchBar">
                <svg className="searchIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  placeholder="Search seeds... (e.g. Grass, Door, Brick)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="seedSearch"
                />
                {searchQuery && (
                  <button className="clearSearch" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
              <div className="filterTabs">
                {[
                  { key: 'all', label: 'All Seeds', count: seedsData.length },
                  { key: 'hasAmount', label: 'Has Amount', count: seedsData.filter(s => (parseFloat(seedValues[s.id]?.amt) || 0) > 0).length },
                  { key: 'unpriced', label: 'No Price', count: results.noPriceSeeds.length },
                  { key: 'priced', label: 'Priced', count: seedsData.filter(s => (parseFloat(seedValues[s.id]?.price) || 0) > 0).length },
                  { key: 'trash', label: '🗑 Trash', count: trashSeeds.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`filterTab ${filterMode === tab.key ? 'active' : ''}`}
                    onClick={() => setFilterMode(tab.key)}
                  >
                    {tab.label}
                    <span className="tabCount">{tab.count}</span>
                  </button>
                ))}
              </div>
              <div className="searchFooter">
                <div className="seedCounter">
                  Showing <strong>{filteredSeeds.length}</strong> of {seedsData.length} seeds
                </div>
                <div className="layoutControls">
                  <span className="layoutLabel">Columns:</span>
                  {['auto', '1', '2', '3', '5'].map(lyt => (
                    <button
                      key={lyt}
                      className={`layoutBtn ${gridLayout === lyt ? 'active' : ''}`}
                      onClick={() => handleLayoutChange(lyt)}
                      title={`Set layout to ${lyt === 'auto' ? 'Auto' : lyt + ' columns'}`}
                    >
                      {lyt === 'auto' ? 'Auto' : lyt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seeds Grid */}
            <section className={`seeds layout-${gridLayout}`} id="seedsContainer">
              {filteredSeeds.length === 0 && (
                <div className="emptyState">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  <p>No seeds match your search or filter</p>
                  <button onClick={() => { setSearchQuery(''); setFilterMode('all'); }}>Clear filters</button>
                </div>
              )}
              {filteredSeeds.map((seed, index) => {
                const amt = seedValues[seed.id].amt;
                const price = seedValues[seed.id].price;
                const amtNum = parseFloat(amt) || 0;
                const priceNum = parseFloat(price) || 0;
                const isMissingPrice = amtNum > 0 && priceNum <= 0;
                const seedRevenue = priceNum > 0 && amtNum > 0 ? (amtNum / priceNum) : 0;

                const isTrash = trashSeeds.includes(seed.id);

                return (
                  <div
                    className={`seed ${isMissingPrice ? 'seed--warning' : ''} ${isTrash ? 'seed--trash' : ''}`}
                    key={seed.id}
                    style={{ animationDelay: `${Math.min(index * 0.02, 0.5)}s` }}
                  >
                    <div className="seedHeader">
                      <img src={seed.img} alt={seed.id} className="seedIcon" />
                      <span className="seedName">{formatSeedName(seed.id)}</span>
                      {isTrash && <span className="seedBadge trash">Trash</span>}
                      {isMissingPrice && !isTrash && <span className="seedBadge warning">No price</span>}
                      {seedRevenue > 0 && <span className="seedBadge value">{seedRevenue.toFixed(1)} WL</span>}
                      <button
                        className={`trashToggle ${isTrash ? 'active' : ''}`}
                        onClick={() => toggleTrash(seed.id)}
                        title={isTrash ? 'Remove from trash' : 'Mark as trash'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                    <div className="seedFields">
                      <div className="seedField">
                        <label>Amount</label>
                        <input
                          type="number"
                          value={amt}
                          onChange={(e) => handleSeedChange(seed.id, 'amt', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="seedField">
                        <label>Seeds / WL</label>
                        <div className="priceInputGroup">
                          <input
                            type="number"
                            className={isMissingPrice ? 'input--warning' : ''}
                            value={price}
                            onChange={(e) => handleSeedChange(seed.id, 'price', e.target.value)}
                            placeholder="0"
                          />
                          <img src="/images/worldlock.png" alt="WL" className="wlMini" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </section>

      {/* Bulk Set Price Modal */}
      {isModalOpen && (
        <div className="modalOverlay" onClick={() => setIsModalOpen(false)}>
          <div className="modalContent" onClick={e => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>Bulk Set Price</h3>
              <button className="modalClose" onClick={() => setIsModalOpen(false)} aria-label="Close modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="modalDescription">Select seeds and set a price for all of them at once.</p>

            <div className="modalInputDiv">
              <label>Price (seeds per WL):</label>
              <div className="modalPriceInput">
                <input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} />
                <img src="/images/worldlock.png" alt="WL" />
              </div>
            </div>

            <div className="modalSearchBar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search seeds..."
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
              />
            </div>

            <div className="modalSeedsGrid">
              {modalFilteredSeeds.map(seed => (
                <div
                  key={seed.id}
                  className={`modalSeedItem ${selectedSeeds.includes(seed.id) ? 'selected' : ''}`}
                  onClick={() => toggleSeedSelection(seed.id)}
                  title={formatSeedName(seed.id)}
                >
                  <img src={seed.img} alt={seed.id} />
                  <span className="modalSeedName">{formatSeedName(seed.id)}</span>
                </div>
              ))}
            </div>
            <div className="modalActions">
              <span className="selectedCount">{selectedSeeds.length} selected</span>
              <button className="modalBtn secondary" onClick={() => setSelectedSeeds(seedsData.map(s => s.id))}>Select All</button>
              <button className="modalBtn secondary" onClick={() => setSelectedSeeds([])}>Deselect All</button>
              <button className="modalBtn primary" onClick={applyBulkPrice} disabled={selectedSeeds.length === 0}>
                Apply Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Mark Trash Modal */}
      {isTrashModalOpen && (
        <div className="modalOverlay" onClick={() => setIsTrashModalOpen(false)}>
          <div className="modalContent trashModal" onClick={e => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>Bulk Mark Trash Seeds</h3>
              <button className="modalClose" onClick={() => setIsTrashModalOpen(false)} aria-label="Close modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="modalDescription">Select seeds that are trash (hard to sell or no buyers). They'll be excluded from the worst-case profit calculation.</p>

            <div className="modalSearchBar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search seeds..."
                value={trashModalSearch}
                onChange={e => setTrashModalSearch(e.target.value)}
              />
            </div>

            <div className="modalSeedsGrid">
              {trashModalFilteredSeeds.map(seed => (
                <div
                  key={seed.id}
                  className={`modalSeedItem trashSelect ${trashModalSelected.includes(seed.id) ? 'selected' : ''}`}
                  onClick={() => toggleTrashModalSelection(seed.id)}
                  title={formatSeedName(seed.id)}
                >
                  <img src={seed.img} alt={seed.id} />
                  <span className="modalSeedName">{formatSeedName(seed.id)}</span>
                </div>
              ))}
            </div>
            <div className="modalActions">
              <span className="selectedCount">{trashModalSelected.length} marked as trash</span>
              <button className="modalBtn secondary" onClick={() => setTrashModalSelected(seedsData.map(s => s.id))}>Select All</button>
              <button className="modalBtn secondary" onClick={() => setTrashModalSelected([])}>Deselect All</button>
              <button className="modalBtn danger" onClick={applyBulkTrash}>
                Apply Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SSPCalculator;
