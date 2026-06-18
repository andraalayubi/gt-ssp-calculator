import { useState, useMemo } from 'react';
import { exportStartopiaData } from './exportToExcel';
import ExportButton from './ExportButton';

const startopiaTools = [
  { id: 'AIBrain', name: 'AI Brain', qtyPerPack: 5 },
  { id: 'CyborgDiplomat', name: 'Cyborg Diplomat', qtyPerPack: 5 },
  { id: 'Galactibolt', name: 'Galactibolt', qtyPerPack: 5 },
  { id: 'Gigablaster', name: 'Gigablaster', qtyPerPack: 5 },
  { id: 'GrowtonTorpedo', name: 'Growton Torpedo', qtyPerPack: 5 },
  { id: 'HyperShields', name: 'HyperShields', qtyPerPack: 5 },
  { id: 'Quadriscanner', name: 'Quadriscanner', qtyPerPack: 5 },
  { id: 'SpaceMeds', name: 'Space Meds', qtyPerPack: 5 },
  { id: 'StarFuel', name: 'Star Fuel', qtyPerPack: 25 },
  { id: 'StarSupplies', name: 'Star Supplies', qtyPerPack: 5 },
  { id: 'StellarDocuments', name: 'Stellar Documents', qtyPerPack: 5 },
  { id: 'TacticalDrone', name: 'Tactical Drone', qtyPerPack: 5 },
  { id: 'TeleporterCharge', name: 'Teleporter Charge', qtyPerPack: 5 },
];

export default function StartopiaCalculator() {
  const [packsCount, setPacksCount] = useState(() => localStorage.getItem('starPacksCount') || '1');
  const [packCost, setPackCost] = useState(() => localStorage.getItem('starPackCost') || '0');
  const [gridLayout, setGridLayout] = useState(() => localStorage.getItem('starGridLayout') || 'auto');

  const [toolPrices, setToolPrices] = useState(() => {
    const initial = {};
    startopiaTools.forEach(tool => {
      initial[tool.id] = {
        price: localStorage.getItem('starPrice_' + tool.id) || '0',
        mode: localStorage.getItem('starMode_' + tool.id) || 'per_wl'
      };
    });
    return initial;
  });

  const handlePackCountChange = (val) => {
    setPacksCount(val);
    localStorage.setItem('starPacksCount', val);
  };

  const handlePackCostChange = (val) => {
    setPackCost(val);
    localStorage.setItem('starPackCost', val);
  };

  const handleLayoutChange = (lyt) => {
    setGridLayout(lyt);
    localStorage.setItem('starGridLayout', lyt);
  };

  const handlePriceChange = (id, val) => {
    setToolPrices(prev => ({
      ...prev,
      [id]: { ...prev[id], price: val }
    }));
    localStorage.setItem('starPrice_' + id, val);
  };

  const handleModeChange = (id, mode) => {
    setToolPrices(prev => ({
      ...prev,
      [id]: { ...prev[id], mode }
    }));
    localStorage.setItem('starMode_' + id, mode);
  };

  const results = useMemo(() => {
    const packs = parseFloat(packsCount) || 0;
    const costPerPack = parseFloat(packCost) || 0;
    const totalCost = packs * costPerPack;

    let totalRevenue = 0;

    startopiaTools.forEach(tool => {
      const qty = packs * tool.qtyPerPack;
      const priceStr = toolPrices[tool.id].price;
      const mode = toolPrices[tool.id].mode;
      const price = parseFloat(priceStr) || 0;

      if (price > 0 && qty > 0) {
        if (mode === 'per_wl') {
          totalRevenue += (qty / price);
        } else {
          totalRevenue += (qty * price);
        }
      }
    });

    const netProfit = totalRevenue - totalCost;
    const profitPercentage = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalRevenue,
      netProfit,
      profitPercentage
    };
  }, [packsCount, packCost, toolPrices]);

  return (
    <>
      {/* Sticky Summary Bar */}
      <div className="surg-sticky-bar">
        <div className="surg-sticky-inner">
          <div className="surg-sticky-stat">
            <span className="surg-sticky-label">Packs</span>
            <div className="surg-sticky-value">
              🚀 {parseFloat(packsCount) || 0}
            </div>
          </div>
          <div className="surg-sticky-divider" />
          <div className="surg-sticky-stat">
            <span className="surg-sticky-label">Cost</span>
            <div className="surg-sticky-value cost">
              <img src="/images/worldlock.png" alt="WL" />
              {results.totalCost.toFixed(2)}
            </div>
          </div>
          <div className="surg-sticky-divider" />
          <div className="surg-sticky-stat">
            <span className="surg-sticky-label">Revenue</span>
            <div className="surg-sticky-value revenue">
              <img src="/images/worldlock.png" alt="WL" />
              {results.totalRevenue.toFixed(2)}
            </div>
          </div>
          <div className="surg-sticky-divider" />
          <div className={`surg-sticky-profit ${results.netProfit >= 0 ? 'positive' : 'negative'}`}>
            <span className="surg-sticky-label">Profit</span>
            <div className="surg-sticky-value">
              <img src="/images/worldlock.png" alt="WL" />
              {results.netProfit > 0 ? '+' : ''}{results.netProfit.toFixed(2)} ({results.profitPercentage > 0 ? '+' : ''}{results.profitPercentage.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      <section className="container surg-container">
        {/* Page Header */}
        <div className="surg-page-header">
          <h1 style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🚀 Startopia Pack Calculator
          </h1>
          <p>Calculate your Startopia pack profits — track every space item's resale value</p>
          <div className="export-actions">
            <ExportButton onClick={() => exportStartopiaData({ startopiaTools, packsCount, packCost, toolPrices, results })} />
          </div>
        </div>
        <div className="surg-dashboard-grid">
        {/* Pack Purchase Info */}
        <div className="surg-card">
          <div className="surg-card-header">
            <span className="surg-icon">📦</span>
            <h2>Pack Purchase Info</h2>
          </div>
          <div className="surg-field">
            <label>NUMBER OF STARTOPIA PACKS</label>
            <input 
              type="number" 
              value={packsCount} 
              onChange={(e) => handlePackCountChange(e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="surg-field">
            <label>WL COST PER PACK</label>
            <input 
              type="number" 
              value={packCost} 
              onChange={(e) => handlePackCostChange(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="surg-card surg-card-highlight" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'linear-gradient(180deg, rgba(245,158,11,0.03) 0%, rgba(245,158,11,0) 100%), var(--surface)' }}>
          <div className="surg-card-header">
            <span className="surg-icon">📈</span>
            <h2>Profit Analysis</h2>
          </div>
          <div className="surg-stats-grid">
            <div className="surg-stat-box">
              <span className="surg-stat-label">TOTAL COST</span>
              <div className="surg-stat-value">
                <span>{results.totalCost.toFixed(2)}</span>
                <img src="/images/worldlock.png" alt="WL" className="wl-icon-small" />
              </div>
            </div>
            <div className="surg-stat-box">
              <span className="surg-stat-label">TOTAL REVENUE</span>
              <div className="surg-stat-value">
                <span>{results.totalRevenue.toFixed(2)}</span>
                <img src="/images/worldlock.png" alt="WL" className="wl-icon-small" />
              </div>
            </div>
            <div className="surg-stat-box">
              <span className="surg-stat-label">NET PROFIT/LOSS</span>
              <div className={`surg-stat-value ${results.netProfit >= 0 ? 'positive' : 'negative'}`}>
                <span>{results.netProfit > 0 ? '+' : ''}{results.netProfit.toFixed(2)}</span>
              </div>
            </div>
            <div className="surg-stat-box">
              <span className="surg-stat-label">PROFIT PERCENTAGE</span>
              <div className={`surg-stat-value ${results.profitPercentage >= 0 ? 'positive' : 'negative'}`}>
                <span>{results.profitPercentage > 0 ? '+' : ''}{results.profitPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="surg-resale-section">
        <div className="surg-resale-header">
          <div>
            <h2><span className="surg-icon">⚙️</span> Resale Prices</h2>
            <p>Set your selling prices for each item from the Startopia pack</p>
          </div>
          <div className="layoutControls">
            <span className="layoutLabel">Columns:</span>
            {['auto', '1', '2', '3'].map(lyt => (
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

        <div className={`surg-tools-grid layout-${gridLayout}`}>
          {startopiaTools.map(tool => {
            const qty = (parseFloat(packsCount) || 0) * tool.qtyPerPack;
            return (
              <div className="surg-tool-card" key={tool.id}>
                <div className="surg-tool-header">
                  <div className="surg-tool-icon-wrapper">
                    <img 
                      src={`/images/${tool.id.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`} 
                      alt="" 
                      className="surg-tool-icon" 
                      onError={(e) => { e.target.onerror = null; e.target.src = '/images/worldlock.png'; e.target.classList.add('fallback-icon'); }}
                    />
                  </div>
                  <div className="surg-tool-info">
                    <span className="surg-tool-name">{tool.name}</span>
                    <span className="surg-tool-qty">{qty} total</span>
                  </div>
                </div>
                <div className="surg-tool-price-input">
                  <label>PRICE</label>
                  <div className="surg-input-wrapper">
                    <input 
                      type="number" 
                      value={toolPrices[tool.id].price}
                      onChange={(e) => handlePriceChange(tool.id, e.target.value)}
                      placeholder="0"
                    />
                    <select 
                      value={toolPrices[tool.id].mode}
                      onChange={(e) => handleModeChange(tool.id, e.target.value)}
                      className="surg-mode-select"
                    >
                      <option value="per_wl">per WL</option>
                      <option value="wl_each">WL each</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </>
  );
}
