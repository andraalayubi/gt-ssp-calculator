import { useState, useMemo } from 'react';

const crimeCards = [
  { id: 'CrimeWave', name: 'Crime Wave', category: 'Villain' },
  { id: 'HeatVision', name: 'Heat Vision', category: 'Fire' },
  { id: 'Incinerate', name: 'Incinerate', category: 'Fire' },
  { id: 'FlameOn', name: 'Flame On!', category: 'Fire' },
  { id: 'Liquify', name: 'Liquify', category: 'Fire' },
  { id: 'Overheat', name: 'Overheat', category: 'Fire' },
  { id: 'IceShards', name: 'Ice Shards', category: 'Ice' },
  { id: 'FrostBreath', name: 'Frost Breath', category: 'Ice' },
  { id: 'IceBarrier', name: 'Ice Barrier', category: 'Ice' },
  { id: 'Puddle', name: 'Puddle', category: 'Ice' },
  { id: 'FrozenMirror', name: 'Frozen Mirror', category: 'Ice' },
  { id: 'SuperStrength', name: 'Super Strength', category: 'Muscle' },
  { id: 'SuperSpeed', name: 'Super Speed', category: 'Muscle' },
  { id: 'Enrage', name: 'Enrage', category: 'Muscle' },
  { id: 'Crash', name: 'Crash', category: 'Muscle' },
  { id: 'Regeneration', name: 'Regeneration', category: 'Muscle' },
  { id: 'ShockingFist', name: 'Shocking Fist', category: 'Lightning' },
  { id: 'Thunderstorm', name: 'Thunderstorm', category: 'Lightning' },
  { id: 'Overcharge', name: 'Overcharge', category: 'Lightning' },
  { id: 'MegawattPulse', name: 'Megawatt Pulse', category: 'Lightning' },
  { id: 'Resuscitate', name: 'Resuscitate', category: 'Lightning' },
];

export default function CrimeCalculator() {
  const [cardData, setCardData] = useState(() => {
    const initial = {};
    crimeCards.forEach(card => {
      initial[card.id] = {
        qty: localStorage.getItem('crimeQty_' + card.id) || '',
        price: localStorage.getItem('crimePrice_' + card.id) || ''
      };
    });
    return initial;
  });

  const handleDataChange = (id, field, val) => {
    setCardData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }));
    if (field === 'qty') {
      localStorage.setItem('crimeQty_' + id, val);
    } else {
      localStorage.setItem('crimePrice_' + id, val);
    }
  };

  const totalRevenue = useMemo(() => {
    let total = 0;
    crimeCards.forEach(card => {
      const qtyStr = cardData[card.id].qty;
      const priceStr = cardData[card.id].price;
      const qty = parseFloat(qtyStr) || 0;
      const price = parseFloat(priceStr) || 0;

      if (price > 0 && qty > 0) {
        total += (qty / price);
      }
    });
    return total;
  }, [cardData]);

  const categories = ['Villain', 'Fire', 'Ice', 'Muscle', 'Lightning'];

  return (
    <section className="container surg-container" style={{ maxWidth: '1100px', margin: '32px auto', width: '92%' }}>
      {/* Page Header aligned left exactly like reference */}
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
          <img src="/images/crimewave.png" alt="" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} onError={(e) => { e.target.style.display = 'none'; }} />
          Crime Cards
          <span style={{ 
            fontSize: '0.75rem', 
            background: 'var(--amber-bg)', 
            color: 'var(--amber)', 
            border: '1px solid var(--amber-border)', 
            padding: '4px 10px', 
            borderRadius: '999px', 
            fontWeight: '700', 
            letterSpacing: '0.5px' 
          }}>
            Vending Tools
          </span>
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Enter your card inventory and how many you sell per 1 WL. We'll calculate the total WL you'd earn if you sold everything.
        </p>
      </div>

      {/* Profit Analysis single bar */}
      <div className="surg-card" style={{ marginBottom: '24px', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔥</span>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text)' }}>Profit Analysis</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Revenue</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: '800', color: 'var(--green)' }}>
            <img src="/images/worldlock.png" alt="WL" style={{ height: '20px' }} />
            {totalRevenue.toFixed(2)} WL
          </div>
        </div>
      </div>

      {/* Inventory Section wrapping everything */}
      <div className="surg-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text)' }}>
              <span style={{ fontSize: '1.4rem' }}>📦</span> Inventory & Prices
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>For each card, enter how many you have and how many you sell for 1 WL.</p>
          </div>
        </div>

        {categories.map((category, idx) => (
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
            <div className={`surg-tools-grid layout-3`}>
              {crimeCards.filter(c => c.category === category).map(card => {
                return (
                  <div className="surg-tool-card" key={card.id} style={{ padding: '16px' }}>
                    <div className="surg-tool-header" style={{ marginBottom: '16px' }}>
                      <div className="surg-tool-icon-wrapper" style={{ width: '32px', height: '32px' }}>
                        <img 
                          src={`/images/${card.id.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`} 
                          alt="" 
                          className="surg-tool-icon" 
                          style={{ width: '20px', height: '20px' }}
                          onError={(e) => { e.target.onerror = null; e.target.src = '/images/worldlock.png'; e.target.classList.add('fallback-icon'); }}
                        />
                      </div>
                      <div className="surg-tool-info">
                        <span className="surg-tool-name" style={{ fontSize: '0.95rem' }}>{card.name}</span>
                      </div>
                    </div>
                    <div className="surg-tool-price-input" style={{ flexDirection: 'row', gap: '12px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.65rem' }}>QUANTITY</label>
                        <div className="surg-input-wrapper">
                          <input 
                            type="number" 
                            value={cardData[card.id].qty}
                            onChange={(e) => handleDataChange(card.id, 'qty', e.target.value)}
                            placeholder="How many you have"
                            style={{ fontSize: '0.8rem', padding: '8px 10px', width: '100%' }}
                          />
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.65rem' }}>ITEMS PER 1 WL</label>
                        <div className="surg-input-wrapper">
                          <input 
                            type="number" 
                            value={cardData[card.id].price}
                            onChange={(e) => handleDataChange(card.id, 'price', e.target.value)}
                            placeholder="Items per 1 WL"
                            style={{ fontSize: '0.8rem', padding: '8px 10px', width: '100%' }}
                          />
                        </div>
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
