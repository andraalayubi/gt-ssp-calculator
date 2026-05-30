import { useState, useEffect } from 'react';
import { seedsData } from './seedsData';

function App() {
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

  const [results, setResults] = useState({ totalSSP: 0, totalWorldLock: 0, cleanProfit: 0 });
  const [noPriceSeeds, setNoPriceSeeds] = useState([]);

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
  };

  const toggleSeedSelection = (id) => {
    setSelectedSeeds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const calculate = () => {
    let tSSP = 0;
    let tWL = 0;
    const noPrice = [];

    seedsData.forEach(seed => {
      const amtStr = seedValues[seed.id].amt;
      const priceStr = seedValues[seed.id].price;
      const amt = parseFloat(amtStr) || 0;
      const price = parseFloat(priceStr) || 0;

      if (price > 0 && amt > 0) {
        tWL += (amt / price);
      } else if (price <= 0 && amt > 0) {
        noPrice.push(seed.id);
      }
      tSSP += (amt / 5);
    });

    const parsedCost = parseFloat(sspCost) || 0;
    const cost = (tSSP / 200) * parsedCost;
    const profit = tWL - cost;

    setResults({ totalSSP: tSSP, totalWorldLock: tWL, cleanProfit: profit });
    setNoPriceSeeds(noPrice);
  };

  // Optional: calculate on mount
  useEffect(() => {
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
    <section className="container">
      <h2>PigFish's SSP calculator <a href="https://youtu.be/yXHZ-oC-2cE" className="tutorialLink" target="_blank" rel="noreferrer">Tutorial</a></h2>
      
      <h4 id="noPrice">
        No price set: {noPriceSeeds.join(', ')}
      </h4>

      <div className="sspPriceDiv">
        <label htmlFor="sspCost">Buy SSP Price (per 200): </label>
        <input 
          type="number" 
          id="sspCost" 
          value={sspCost} 
          onChange={(e) => handleSspCostChange(e.target.value)} 
          placeholder="15" 
        />
        <img src="/images/worldlock.png" alt="WL" />
        <button className="bulkBtn" onClick={() => setIsModalOpen(true)}>Bulk Set Price</button>
      </div>

      <div className="resultDiv">
        <div className="topDiv">
          <img src="/images/ssp.png" alt="SSP" />
          <a id="sspAmount">= {results.totalSSP.toFixed(2)}</a>
        </div>
        <button id="calculateBtn" onClick={calculate}>Calculate</button>
        <div className="topDiv">
          <img src="/images/worldlock.png" alt="WL" />
          <a id="wlAmount">= {results.totalWorldLock.toFixed(2)}</a>
        </div>
      </div>
      
      <div className="profitDiv">
        <div className="topDiv profitBox">
          <span>Clean Profit: </span>
          <img src="/images/worldlock.png" style={{ marginLeft: '15px' }} alt="WL" />
          <a id="profitAmount" style={{ color: results.cleanProfit >= 0 ? '#10b981' : '#ef4444' }}>
            = {results.cleanProfit.toFixed(2)}
          </a>
        </div>
      </div>

      <section className="seeds" id="seedsContainer">
        {seedsData.map((seed, index) => {
          const amt = seedValues[seed.id].amt;
          const price = seedValues[seed.id].price;
          const amtNum = parseFloat(amt) || 0;
          const priceNum = parseFloat(price) || 0;

          const isMissingPrice = amtNum > 0 && priceNum <= 0;
          const bgStyle = isMissingPrice ? 'rgba(220, 38, 38, 0.5)' : 'rgba(0, 0, 0, 0.25)';

          return (
            <div className="seed" key={seed.id} style={{ animationDelay: `${index * 0.01}s` }}>
              <div>
                <img src={seed.img} alt={seed.id} />
                <input 
                  type="number" 
                  value={amt} 
                  onChange={(e) => handleSeedChange(seed.id, 'amt', e.target.value)}
                  placeholder="0" 
                />
              </div>
              <div>
                <label>Price: </label>
                <input 
                  type="number" 
                  style={{ backgroundColor: bgStyle }}
                  value={price} 
                  onChange={(e) => handleSeedChange(seed.id, 'price', e.target.value)}
                  placeholder="0" 
                />
                <p>/</p>
                <img src="/images/worldlock.png" alt="WL" />
              </div>
            </div>
          );
        })}
      </section>
    </section>

    {isModalOpen && (
      <div className="modalOverlay" onClick={() => setIsModalOpen(false)}>
        <div className="modalContent" onClick={e => e.stopPropagation()}>
          <h3>Bulk Set Price</h3>
          <div className="modalInputDiv">
            <label>Price to Apply: </label>
            <input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} />
          </div>
          <h4>Select Seeds:</h4>
          <div className="modalSeedsGrid">
            {seedsData.map(seed => (
              <div 
                key={seed.id} 
                className={`modalSeedItem ${selectedSeeds.includes(seed.id) ? 'selected' : ''}`}
                onClick={() => toggleSeedSelection(seed.id)}
              >
                <img src={seed.img} alt={seed.id} />
              </div>
            ))}
          </div>
          <div className="modalActions">
            <button onClick={() => setSelectedSeeds(seedsData.map(s => s.id))}>Select All</button>
            <button onClick={() => setSelectedSeeds([])}>Deselect All</button>
            <button className="applyBtn" onClick={applyBulkPrice}>Apply Price</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default App;
