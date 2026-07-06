import { useState, useMemo } from 'react';
import { exportChemicalData } from './exportToExcel';
import ExportButton from './ExportButton';

const chemicalItems = [
  { id: 'GreenChemical', name: 'Green Chemical', category: 'Chemicals' },
  { id: 'RedChemical', name: 'Red Chemical', category: 'Chemicals' },
  { id: 'BlueChemical', name: 'Blue Chemical', category: 'Chemicals' },
  { id: 'PinkChemical', name: 'Pink Chemical', category: 'Chemicals' },
  { id: 'YellowChemical', name: 'Yellow Chemical', category: 'Chemicals' },
  { id: 'MysteriousChemical', name: 'Mysterious Chemical', category: 'Crafted' },
  { id: 'FuelPack', name: 'Fuel Pack', category: 'Crafted' },
  { id: 'BlockGlue', name: 'Block Glue', category: 'Crafted' },
  { id: 'Forcefield', name: 'Forcefield', category: 'Crafted' },
];

export default function ChemicalCalculator() {
  const [prices, setPrices] = useState(() => {
    const initial = {};
    chemicalItems.forEach(item => {
      initial[item.id] = {
        price: localStorage.getItem('chemPrice_' + item.id) || '',
        mode: localStorage.getItem('chemMode_' + item.id) || 'per_wl'
      };
    });
    return initial;
  });

  const handlePriceChange = (id, field, val) => {
    setPrices(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }));
    if (field === 'price') {
      localStorage.setItem('chemPrice_' + id, val);
    } else {
      localStorage.setItem('chemMode_' + id, val);
    }
  };

  const results = useMemo(() => {
    // Helper to get WL value of 1 unit
    const getValue = (id) => {
      const p = parseFloat(prices[id]?.price) || 0;
      if (p <= 0) return 0;
      return prices[id].mode === 'per_wl' ? (1 / p) : p;
    };

    const valYellow = getValue('YellowChemical');
    const valBlue = getValue('BlueChemical');
    const valPink = getValue('PinkChemical');
    const valGreen = getValue('GreenChemical');
    const valRed = getValue('RedChemical');
    const valMysterious = getValue('MysteriousChemical');
    const valFuel = getValue('FuelPack');
    const valBlockGlue = getValue('BlockGlue');
    const valForcefield = getValue('Forcefield');

    const routes = [];

    // Analisa 1: Mysterious Chemical
    if (valYellow && valBlue && valPink && valMysterious) {
      const rawValue = (20 * valYellow) + (10 * valBlue) + (5 * valPink);
      const craftedValue = valMysterious;
      const profit = craftedValue - rawValue;
      routes.push({
        name: 'Mysterious Chemical (1 pcs)',
        rawDesc: '20 Yellow, 10 Blue, 5 Pink',
        rawValue,
        craftedValue,
        profit,
        isCraftBetter: profit > 0,
        margin: rawValue > 0 ? (profit / rawValue) * 100 : 0
      });
    }

    // Analisa 2: Fuel Pack (from scratch)
    if (valGreen && valBlue && valYellow && valPink && valFuel) {
      const rawValue = (10 * valGreen) + (12 * valBlue) + (20 * valYellow) + (5 * valPink);
      const craftedValue = 5 * valFuel;
      const profit = craftedValue - rawValue;
      routes.push({
        name: 'Fuel Pack (5 pcs)',
        rawDesc: '10 Green, 12 Blue, 20 Yellow, 5 Pink',
        rawValue,
        craftedValue,
        profit,
        isCraftBetter: profit > 0,
        margin: rawValue > 0 ? (profit / rawValue) * 100 : 0
      });
    }

    // Helper for Mysterious Chemical value (market price or raw materials craft cost)
    const mysteriousCost = valMysterious || (valYellow && valBlue && valPink ? ((20 * valYellow) + (10 * valBlue) + (5 * valPink)) : 0);

    // Analisa 3: Block Glue (10 pcs)
    if (mysteriousCost && valRed && valPink && valBlockGlue) {
      const rawValue = (1 * mysteriousCost) + (1 * valRed) + (1 * valPink);
      const craftedValue = 10 * valBlockGlue;
      const profit = craftedValue - rawValue;
      routes.push({
        name: 'Block Glue (10 pcs)',
        rawDesc: valMysterious ? '1 Mysterious, 1 Red, 1 Pink' : '20 Yellow, 10 Blue, 6 Pink, 1 Red',
        rawValue,
        craftedValue,
        profit,
        isCraftBetter: profit > 0,
        margin: rawValue > 0 ? (profit / rawValue) * 100 : 0
      });
    }

    // Analisa 4: Forcefield (1 pcs)
    if (mysteriousCost && valGreen && valRed && valForcefield) {
      const rawValue = (1 * mysteriousCost) + (20 * valGreen) + (10 * valRed);
      const craftedValue = 1 * valForcefield;
      const profit = craftedValue - rawValue;
      routes.push({
        name: 'Forcefield (1 pcs)',
        rawDesc: valMysterious ? '1 Mysterious, 20 Green, 10 Red' : '20 Green, 10 Red, 20 Yellow, 10 Blue, 5 Pink',
        rawValue,
        craftedValue,
        profit,
        isCraftBetter: profit > 0,
        margin: rawValue > 0 ? (profit / rawValue) * 100 : 0
      });
    }

    // Sort by highest profit margin
    routes.sort((a, b) => b.profit - a.profit);

    return routes;
  }, [prices]);

  return (
    <section className="container surg-container" style={{ maxWidth: '1100px', margin: '32px auto', width: '92%' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '1.8rem', 
          fontWeight: '800', 
          margin: '0 0 8px 0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-start', 
          gap: '12px',
          color: 'var(--text)'
        }}>
          <span style={{ fontSize: '1.8rem' }}>🧪</span>
          Chemical Profit Calculator
          <span style={{ 
            fontSize: '0.75rem', 
            background: 'rgba(16,185,129,0.15)', 
            color: 'var(--green)', 
            border: '1px solid var(--green-border)', 
            padding: '4px 10px', 
            borderRadius: '999px', 
            fontWeight: '700', 
            letterSpacing: '0.5px' 
          }}>
            Crafting
          </span>
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Masukkan harga barang-barang di bawah ini. Kalkulator akan otomatis mencari item yang paling menguntungkan untuk di-craft dan dijual.
        </p>
        <div className="export-actions">
          <ExportButton onClick={() => exportChemicalData({ chemicalItems, prices, results })} />
        </div>
      </div>

      {/* Recommendations / Best Routes */}
      <div className="surg-card" style={{ marginBottom: '32px', padding: '24px', border: '1px solid var(--accent)', background: 'linear-gradient(180deg, rgba(99,102,241,0.05) 0%, rgba(99,102,241,0) 100%), var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.4rem' }}>🏆</span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>Peringkat & Analisa Penjualan Terbaik</h2>
        </div>
        
        {results.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '10px 0' }}>
            Silakan masukkan harga barang-barang (Chemical & Fuel) di bawah untuk melihat perbandingan profit dan peringkatnya!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Leaderboard Summary Banner */}
            <div style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '14px',
              padding: '16px 20px'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#818cf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Ringkasan Peringkat Keuntungan Penjualan
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {results.map((route, idx) => {
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️';
                  const bestActionDesc = route.isCraftBetter 
                    ? `Craft & Jual ${route.name}`
                    : `Jual Bahan Mentah`;
                  return (
                    <div key={idx} style={{
                      background: idx === 0 ? 'rgba(16,185,129,0.12)' : 'var(--input-bg)',
                      border: idx === 0 ? '1px solid var(--green-border)' : '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '1.4rem' }}>{medal}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: idx === 0 ? 'var(--green)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Peringkat #{idx + 1} {idx === 0 ? '(Rekomendasi Utama)' : ''}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {bestActionDesc}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: route.profit >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: '700' }}>
                          {route.isCraftBetter ? `Profit Craft: +${route.profit.toFixed(2)} WL` : `Jual Mentah: ${route.rawValue.toFixed(2)} WL`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Route Cards */}
            {results.map((route, index) => (
              <div key={index} style={{ 
                padding: '20px', 
                borderRadius: '14px', 
                background: index === 0 ? 'rgba(16,185,129,0.03)' : 'var(--input-bg)', 
                border: index === 0 ? '1px solid var(--green-border)' : '1px solid var(--border)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '-12px', right: '16px', background: route.isCraftBetter ? 'var(--green)' : 'var(--red)', color: '#fff', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800' }}>
                  {route.isCraftBetter ? '✨ LEBIH UNTUNG DI-CRAFT' : '📦 LEBIH UNTUNG JUAL MENTAH'}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{
                    background: index === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : index === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : index === 2 ? 'linear-gradient(135deg, #b45309, #78350f)' : 'var(--surface-hover)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {index === 0 ? '🥇 Peringkat #1 (Paling Untung)' : index === 1 ? '🥈 Peringkat #2' : index === 2 ? '🥉 Peringkat #3' : `🎖️ Peringkat #${index + 1}`}
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)' }}>
                    Target: {route.name}
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Bahan Mentah: <strong style={{ color: 'var(--text)' }}>{route.rawDesc}</strong> — Opsi Terbaik: <strong style={{ color: route.isCraftBetter ? 'var(--green)' : '#60a5fa' }}>{route.isCraftBetter ? `Craft & Jual ${route.name}` : `Jual Bahan Mentah`}</strong>
                </div>
                
                <div className="surg-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div className="surg-stat-box" style={{ padding: '12px', border: !route.isCraftBetter ? '1px solid var(--red-border)' : '1px solid var(--border)', background: !route.isCraftBetter ? 'var(--red-bg)' : 'var(--input-bg)' }}>
                    <span className="surg-stat-label" style={{ fontSize: '0.65rem', color: !route.isCraftBetter ? 'var(--red)' : 'var(--text-muted)' }}>JUAL BAHAN MENTAH</span>
                    <div className="surg-stat-value" style={{ fontSize: '1.1rem', color: !route.isCraftBetter ? 'var(--red)' : 'var(--text)' }}>
                      {route.rawValue.toFixed(2)} <img src="/images/worldlock.png" alt="WL" style={{ height: '16px' }} />
                    </div>
                  </div>
                  <div className="surg-stat-box" style={{ padding: '12px', border: route.isCraftBetter ? '1px solid var(--green-border)' : '1px solid var(--border)', background: route.isCraftBetter ? 'var(--green-bg)' : 'var(--input-bg)' }}>
                    <span className="surg-stat-label" style={{ fontSize: '0.65rem', color: route.isCraftBetter ? 'var(--green)' : 'var(--text-muted)' }}>JUAL HASIL CRAFT</span>
                    <div className="surg-stat-value" style={{ fontSize: '1.1rem', color: route.isCraftBetter ? 'var(--green)' : '#60a5fa' }}>
                      {route.craftedValue.toFixed(2)} <img src="/images/worldlock.png" alt="WL" style={{ height: '16px' }} />
                    </div>
                  </div>
                  <div className="surg-stat-box" style={{ padding: '12px' }}>
                    <span className="surg-stat-label" style={{ fontSize: '0.65rem' }}>SELISIH (PROFIT CRAFT)</span>
                    <div className={`surg-stat-value ${route.profit >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.1rem' }}>
                      {route.profit > 0 ? '+' : ''}{route.profit.toFixed(2)}
                    </div>
                  </div>
                  <div className="surg-stat-box" style={{ padding: '12px' }}>
                    <span className="surg-stat-label" style={{ fontSize: '0.65rem' }}>MARGIN CRAFT</span>
                    <div className={`surg-stat-value ${route.margin >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.1rem' }}>
                      {route.margin > 0 ? '+' : ''}{route.margin.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Prices Section */}
      <div className="surg-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text)' }}>
            <span style={{ fontSize: '1.4rem' }}>💲</span> Harga Pasar (Market Prices)
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Masukkan harga barang di bawah ini. Anda bisa memilih mode per WL atau WL per barang.</p>
        </div>

        {['Chemicals', 'Crafted'].map((category, idx) => (
          <div key={category} style={{ marginTop: idx === 0 ? '0' : '32px' }}>
            <h3 style={{ 
              fontSize: '0.95rem', 
              fontWeight: '800', 
              color: 'var(--text)', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              margin: '0 0 16px 0' 
            }}>
              {category}
            </h3>
            <div className={`surg-tools-grid`} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {chemicalItems.filter(c => c.category === category).map(item => {
                return (
                  <div className="surg-tool-card" key={item.id} style={{ padding: '16px' }}>
                    <div className="surg-tool-header" style={{ marginBottom: '16px' }}>
                      <div className="surg-tool-icon-wrapper" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)' }}>
                        <img 
                          src={`/images/${item.id.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`} 
                          alt="" 
                          className="surg-tool-icon" 
                          style={{ width: '20px', height: '20px' }}
                          onError={(e) => { e.target.onerror = null; e.target.src = '/images/worldlock.png'; e.target.classList.add('fallback-icon'); }}
                        />
                      </div>
                      <div className="surg-tool-info">
                        <span className="surg-tool-name" style={{ fontSize: '0.95rem' }}>{item.name}</span>
                      </div>
                    </div>
                    <div className="surg-tool-price-input" style={{ flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.65rem' }}>HARGA BARANG</label>
                      <div className="surg-input-wrapper">
                        <input 
                          type="number" 
                          value={prices[item.id].price}
                          onChange={(e) => handlePriceChange(item.id, 'price', e.target.value)}
                          placeholder="0"
                          style={{ fontSize: '1rem', padding: '8px 12px', width: '50%' }}
                        />
                        <select 
                          value={prices[item.id].mode}
                          onChange={(e) => handlePriceChange(item.id, 'mode', e.target.value)}
                          className="surg-mode-select"
                          style={{ width: '50%', background: 'var(--surface-hover)', borderLeft: '1px solid var(--border)' }}
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
        ))}
      </div>
    </section>
  );
}
