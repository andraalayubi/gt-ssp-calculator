import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { seedsData } from './seedsData';

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
