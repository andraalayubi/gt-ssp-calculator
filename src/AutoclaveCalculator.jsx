import { useState, useMemo, useEffect } from 'react';
import { exportAutoclaveData } from './exportToExcel';
import ExportButton from './ExportButton';

const surgeryTools = [
  { id: 'SurgicalAnesthetic', name: 'Anesthetic', img: 'surgicalanesthetic' },
  { id: 'SurgicalAntibiotics', name: 'Antibiotics', img: 'surgicalantibiotics' },
  { id: 'SurgicalAntiseptic', name: 'Antiseptic', img: 'surgicalantiseptic' },
  { id: 'SurgicalClamp', name: 'Clamp', img: 'surgicalclamp' },
  { id: 'SurgicalDefibrillator', name: 'Defib', img: 'surgicaldefibrillator' },
  { id: 'SurgicalLabKit', name: 'Lab Kit', img: 'urgicallabkit' }, // wait, previous code was /images/${tool.id.toLowerCase().replace(/[^a-z0-9]/g, '')}.png
  { id: 'SurgicalPins', name: 'Pins', img: 'surgicalpins' },
  { id: 'SurgicalScalpel', name: 'Scalpel', img: 'surgicalscalpel' },
  { id: 'SurgicalSplint', name: 'Splint', img: 'surgicalsplint' },
  { id: 'SurgicalSponge', name: 'Sponge', img: 'surgicalsponge' },
  { id: 'SurgicalStitches', name: 'Stitches', img: 'surgicalstitches' },
  { id: 'SurgicalTransfusion', name: 'Transfusion', img: 'surgicaltransfusion' },
  { id: 'SurgicalUltrasound', name: 'Ultrasound', img: 'surgicalultrasound' },
];

// Helper to match the previous image path logic
const getToolImg = (id) => `/images/${id.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`;

const getCostPerItem = (price, mode) => {
  const p = parseFloat(price) || 0;
  if (p <= 0) return 0;
  if (mode === 'per_wl') return 1 / p;
  return p;
};

export default function AutoclaveCalculator() {
  const [activeTab, setActiveTab] = useState('input'); // 'input', 'hasil'
  const [expandedTool, setExpandedTool] = useState(null);
  const [showDetailOperasi, setShowDetailOperasi] = useState(false);

  // State initialization sharing keys with SurgeryCalculator where possible
  const [toolData, setToolData] = useState(() => {
    const initial = {};
    surgeryTools.forEach(tool => {
      initial[tool.id] = {
        qty: localStorage.getItem('auto_qty_' + tool.id) || '0',
        price: localStorage.getItem('surgPrice_' + tool.id) || '0',
        mode: localStorage.getItem('surgMode_' + tool.id) || 'per_wl',
        minSisa: localStorage.getItem('auto_min_' + tool.id) || '0',
        autoRepeat: localStorage.getItem('auto_rep_' + tool.id) === 'true'
      };
    });
    return initial;
  });

  const handleToolChange = (id, field, value) => {
    setToolData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
    
    // Save to local storage
    if (field === 'qty') localStorage.setItem('auto_qty_' + id, value);
    if (field === 'price') localStorage.setItem('surgPrice_' + id, value);
    if (field === 'mode') localStorage.setItem('surgMode_' + id, value);
    if (field === 'minSisa') localStorage.setItem('auto_min_' + id, value);
    if (field === 'autoRepeat') localStorage.setItem('auto_rep_' + id, value);
  };

  const toggleAutoRepeat = (id) => {
    const current = toolData[id].autoRepeat;
    handleToolChange(id, 'autoRepeat', !current);
  };

  // Simulation Logic
  const results = useMemo(() => {
    let inventory = {};
    let totalToolsCount = 0;
    
    Object.keys(toolData).forEach(k => {
      const q = parseFloat(toolData[k].qty) || 0;
      inventory[k] = q;
      totalToolsCount += q;
    });

    let iterationLogs = [];
    let totalOps = 0;
    let iter = 1;

    // To prevent infinite loops or unreasonable numbers
    const MAX_ITERATIONS = 1000;

    while(true) {
      let timesToAutoclave = {};
      let totalOpsThisIter = 0;
      
      surgeryTools.forEach(t => {
        const data = toolData[t.id];
        const available = inventory[t.id] - (parseFloat(data.minSisa) || 0);
        if (data.autoRepeat && available >= 20) {
          let ops = Math.floor(available / 20);
          timesToAutoclave[t.id] = ops;
          totalOpsThisIter += ops;
        }
      });

      if (totalOpsThisIter === 0) break;

      let numTools = Object.keys(timesToAutoclave).length;
      iterationLogs.push({
        iter,
        totalOps: totalOpsThisIter,
        numTools,
        details: timesToAutoclave
      });
      totalOps += totalOpsThisIter;

      Object.entries(timesToAutoclave).forEach(([tId, ops]) => {
        inventory[tId] -= 20 * ops;
        surgeryTools.forEach(other => {
          if (other.id !== tId) {
            inventory[other.id] += 1 * ops;
          }
        });
      });

      iter++;
      if (iter > MAX_ITERATIONS) break; 
    }

    let nilaiSebelum = 0;
    let nilaiSesudah = 0;

    surgeryTools.forEach(t => {
      const cpi = getCostPerItem(toolData[t.id].price, toolData[t.id].mode);
      nilaiSebelum += (parseFloat(toolData[t.id].qty) || 0) * cpi;
      nilaiSesudah += inventory[t.id] * cpi;
    });

    const selisih = nilaiSesudah - nilaiSebelum;
    const selisihPercent = nilaiSebelum > 0 ? (selisih / nilaiSebelum) * 100 : 0;

    return {
      finalInventory: inventory,
      iterationLogs,
      totalOps,
      totalToolsCount,
      nilaiSebelum,
      nilaiSesudah,
      selisih,
      selisihPercent
    };
  }, [toolData]);

  // UI Styles directly inside component
  const styles = {
    accordionItem: {
      marginBottom: '8px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.2s'
    },
    accordionHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      cursor: 'pointer'
    },
    inputSmall: {
      background: 'var(--input-bg)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      color: 'white',
      padding: '6px 10px',
      width: '100%',
      fontFamily: 'inherit',
      fontSize: '0.9rem'
    },
    labelSmall: {
      display: 'block',
      fontSize: '0.7rem',
      color: 'var(--text-muted)',
      marginBottom: '4px',
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    activeTabBtn: {
      background: 'var(--amber)',
      color: '#000',
      borderColor: 'var(--amber)',
      fontWeight: '700'
    },
    badge: {
      fontSize: '0.7rem',
      padding: '2px 8px',
      borderRadius: '6px',
      fontWeight: '700'
    }
  };

  return (
    <>
      <div className="stickyDashboard">
        <div className="dashboardInner" style={{maxWidth: '800px'}}>
          <div className="dashStat" style={{flex: 1.5}}>
            <span className="dashLabel">TOTAL NILAI</span>
            <div className="dashValue" style={{flexWrap: 'wrap'}}>
              <img src="/images/worldlock.png" alt="WL" />
              <span>{results.nilaiSebelum.toFixed(1)} WL</span>
              {results.selisih !== 0 && (
                <span style={{
                  color: results.selisih > 0 ? 'var(--green)' : 'var(--red)',
                  fontSize: '0.75rem',
                  background: results.selisih > 0 ? 'var(--green-bg)' : 'var(--red-bg)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  marginLeft: '4px'
                }}>
                  {results.selisih > 0 ? '+' : ''}{results.selisih.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="dashDivider" />
          <div className="dashStat">
            <span className="dashLabel">Tools</span>
            <div className="dashValue">{results.totalToolsCount}</div>
          </div>
          <div className="dashDivider" />
          <div className="dashStat">
            <span className="dashLabel">Autoclave</span>
            <div className="dashValue" style={{color: 'var(--amber)'}}>{results.totalOps}x</div>
          </div>
          <div className="dashDivider" />
          <div className="dashStat">
            <span className="dashLabel">Iterasi</span>
            <div className="dashValue">{results.iterationLogs.length}</div>
          </div>
        </div>
      </div>

      <section className="container" style={{maxWidth: '600px', margin: '32px auto'}}>
        <div className="headerSection">
          <h1>
            <span style={{fontSize: '1.8rem'}}>🧮</span> Autoclave Calculator
          </h1>
          <p className="subtitle">Masukkan jumlah tools dan harga per tool. Data akan tersimpan otomatis di browser.</p>
          <div className="export-actions">
            <ExportButton onClick={() => exportAutoclaveData({ surgeryTools, toolData, results })} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--surface)', padding: '6px', borderRadius: '12px'}}>
          <button 
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s',
              background: activeTab === 'input' ? 'var(--amber)' : 'transparent',
              color: activeTab === 'input' ? '#000' : 'var(--text-muted)'
            }}
            onClick={() => setActiveTab('input')}
          >
            📝 Input
          </button>
          <button 
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s',
              background: activeTab === 'hasil' ? 'var(--amber)' : 'transparent',
              color: activeTab === 'hasil' ? '#000' : 'var(--text-muted)'
            }}
            onClick={() => setActiveTab('hasil')}
          >
            📊 Hasil 
            <span style={{
              background: activeTab === 'hasil' ? 'rgba(0,0,0,0.2)' : 'var(--surface-hover)', 
              padding: '2px 8px', borderRadius: '99px', fontSize: '0.8rem'
            }}>
              {results.totalOps}
            </span>
          </button>
        </div>

        {activeTab === 'input' && (
          <div>
            <div style={{marginBottom: '16px'}}>
               <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                  💡 Tap untuk expand • {Object.values(toolData).filter(d => parseFloat(d.qty) > 0).length}/13 diisi
               </div>
            </div>

            <div className="tools-list">
              {surgeryTools.map(tool => {
                const isExpanded = expandedTool === tool.id;
                const data = toolData[tool.id];
                const cpi = getCostPerItem(data.price, data.mode);
                const hasValue = parseFloat(data.qty) > 0;
                
                // Get Autoclave Op Count for this tool (if any)
                // Just to show a badge like "Clamp 28x" as in the image
                let toolOps = 0;
                results.iterationLogs.forEach(log => {
                   if (log.details[tool.id]) toolOps += log.details[tool.id];
                });

                return (
                  <div key={tool.id} style={{
                    ...styles.accordionItem,
                    borderColor: isExpanded ? 'var(--amber)' : 'var(--border)'
                  }}>
                    <div 
                      style={styles.accordionHeader} 
                      onClick={() => setExpandedTool(isExpanded ? null : tool.id)}
                    >
                      <img src={getToolImg(tool.id)} alt={tool.name} style={{height: '28px', width: '28px', objectFit: 'contain', marginRight: '16px'}} onError={(e) => { e.target.onerror = null; e.target.src = '/images/worldlock.png'; }} />
                      <span style={{flex: 1, fontWeight: '700', fontSize: '0.95rem', color: hasValue ? 'var(--text)' : 'var(--text-muted)'}}>
                         {tool.name}
                      </span>
                      
                      {toolOps > 0 && (
                         <span style={{...styles.badge, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-border)', marginRight: '12px'}}>
                            {toolOps}x
                         </span>
                      )}

                      <div style={{position: 'relative'}} onClick={e => e.stopPropagation()}>
                         <input 
                           type="number" 
                           value={data.qty}
                           onChange={e => handleToolChange(tool.id, 'qty', e.target.value)}
                           style={{
                              ...styles.inputSmall, 
                              width: '70px', 
                              textAlign: 'center',
                              marginRight: '12px',
                              background: hasValue ? 'rgba(255,255,255,0.08)' : 'var(--input-bg)'
                           }}
                         />
                      </div>
                      
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--text-dim)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none'}}>
                         <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>

                    {isExpanded && (
                      <div style={{padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)'}}>
                        <div style={{display: 'flex', gap: '20px'}}>
                          <div style={{flex: 1.5}}>
                            <label style={styles.labelSmall}>Harga</label>
                            <div style={{display: 'flex', gap: '8px', marginBottom: '6px'}}>
                               <div style={{position: 'relative', flex: 1}}>
                                  <span style={{position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5}}>WL</span>
                                  <input 
                                    type="number" 
                                    value={data.price}
                                    onChange={e => handleToolChange(tool.id, 'price', e.target.value)}
                                    style={{...styles.inputSmall, paddingLeft: '32px'}} 
                                  />
                               </div>
                               <select 
                                 value={data.mode}
                                 onChange={e => handleToolChange(tool.id, 'mode', e.target.value)}
                                 style={{...styles.inputSmall, width: 'auto'}}
                               >
                                  <option value="per_wl">/WL</option>
                                  <option value="wl_each">WL/</option>
                               </select>
                            </div>
                            <div style={{fontSize: '0.65rem', color: 'var(--text-dim)'}}>
                               = {cpi.toFixed(4)} WL/item
                            </div>
                          </div>
                          
                          <div style={{flex: 1}}>
                             <label style={styles.labelSmall}>Min. Sisa</label>
                             <input 
                               type="number" 
                               value={data.minSisa}
                               onChange={e => handleToolChange(tool.id, 'minSisa', e.target.value)}
                               style={styles.inputSmall} 
                             />
                          </div>

                          <div style={{flex: 1}}>
                             <label style={styles.labelSmall}>Auto Repeat</label>
                             <button 
                               onClick={() => toggleAutoRepeat(tool.id)}
                               style={{
                                  width: '100%', padding: '7px', 
                                  background: data.autoRepeat ? 'var(--amber-bg)' : 'var(--surface-hover)', 
                                  color: data.autoRepeat ? 'var(--amber)' : 'var(--text-muted)', 
                                  border: `1px solid ${data.autoRepeat ? 'var(--amber-border)' : 'var(--border)'}`, 
                                  borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
                                  fontSize: '0.85rem'
                               }}
                             >
                                {data.autoRepeat ? '🔄 Aktif' : 'Non-aktif'}
                             </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div style={{textAlign: 'center', marginTop: '24px'}}>
               <button className="resetBtn" style={{fontSize: '0.75rem', padding: '6px 16px', borderRadius: '99px'}}>
                  ⚙️ Tampilkan Setting
               </button>
            </div>
          </div>
        )}

        {activeTab === 'hasil' && (
          <div>
            <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
              <div style={{flex: 1, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px'}}>
                 <span style={{display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px'}}>Nilai Sebelum</span>
                 <div style={{fontSize: '1.4rem', fontWeight: '800'}}>{results.nilaiSebelum.toFixed(1)} WL</div>
              </div>
              <div style={{flex: 1, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px'}}>
                 <span style={{display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px'}}>Nilai Sesudah</span>
                 <div style={{fontSize: '1.4rem', fontWeight: '800', color: 'var(--amber)'}}>{results.nilaiSesudah.toFixed(1)} WL</div>
              </div>
            </div>

            <div style={{
               padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', 
               borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <span style={{display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px'}}>Selisih Nilai</span>
                <div style={{fontSize: '1.8rem', fontWeight: '800', color: results.selisih >= 0 ? 'var(--green)' : 'var(--red)'}}>
                   {results.selisih >= 0 ? '+' : ''}{results.selisih.toFixed(2)} WL
                </div>
              </div>
              <div style={{
                 background: results.selisih >= 0 ? 'var(--green-bg)' : 'var(--red-bg)', 
                 color: results.selisih >= 0 ? 'var(--green)' : 'var(--red)', 
                 padding: '8px 16px', borderRadius: '99px', fontWeight: '700', fontSize: '0.9rem'
              }}>
                 {results.selisih >= 0 ? '+' : ''}{results.selisihPercent.toFixed(1)}%
              </div>
            </div>

            <div style={{background: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--amber-border)', borderRadius: '16px', padding: '20px', marginBottom: '24px'}}>
               <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber)', fontWeight: '800', marginBottom: '16px'}}>
                  <span style={{fontSize: '1.2rem'}}>🔄</span> {results.iterationLogs.length} Iterasi
               </div>
               {results.iterationLogs.map(log => (
                  <div key={log.iter} style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text)'}}>
                     <span style={{
                        background: 'var(--amber)', color: '#000', width: '24px', height: '24px', 
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem'
                     }}>{log.iter}</span>
                     <span><strong>{log.totalOps}x</strong> dari {log.numTools} tool</span>
                  </div>
               ))}
               {results.iterationLogs.length === 0 && (
                  <div style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Tidak ada operasi autoclave yang dapat dilakukan. Pastikan Auto Repeat aktif dan jumlah tools mencukupi.</div>
               )}
            </div>

            <h3 style={{fontSize: '1rem', marginBottom: '16px'}}>Perubahan per Tool</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px'}}>
               {surgeryTools.map(tool => {
                  const before = parseFloat(toolData[tool.id].qty) || 0;
                  const after = results.finalInventory[tool.id] || 0;
                  const diff = after - before;
                  
                  if (diff === 0 && before === 0) return null; 

                  return (
                     <div key={tool.id} style={{
                        display: 'flex', alignItems: 'center', padding: '14px 16px', 
                        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px'
                     }}>
                        <img src={getToolImg(tool.id)} alt={tool.name} style={{height: '28px', width: '28px', objectFit: 'contain', marginRight: '16px'}} onError={(e) => { e.target.onerror = null; e.target.src = '/images/worldlock.png'; }} />
                        <div style={{flex: 1}}>
                           <div style={{fontWeight: '700', fontSize: '0.95rem', marginBottom: '2px'}}>{tool.name}</div>
                           <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace'}}>
                              {before} <span style={{color: 'var(--text-dim)'}}>→</span> {after}
                           </div>
                        </div>
                        {diff !== 0 && (
                           <div style={{
                              fontWeight: '700', fontSize: '0.85rem',
                              color: diff > 0 ? 'var(--green)' : 'var(--red)',
                              background: diff > 0 ? 'var(--green-bg)' : 'var(--red-bg)',
                              padding: '4px 10px', borderRadius: '6px'
                           }}>
                              {diff > 0 ? '+' : ''}{diff}
                           </div>
                        )}
                     </div>
                  )
               })}
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
               <input 
                 type="checkbox" 
                 id="detailOperasi" 
                 checked={showDetailOperasi}
                 onChange={e => setShowDetailOperasi(e.target.checked)}
               />
               <label htmlFor="detailOperasi" style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Detail Operasi</label>
            </div>
            
            {showDetailOperasi && (
              <div style={{marginTop: '16px', background: 'var(--surface)', padding: '16px', borderRadius: '12px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-dim)'}}>
                {results.iterationLogs.map(log => (
                  <div key={log.iter} style={{marginBottom: '12px'}}>
                    <div style={{color: 'var(--amber)', marginBottom: '4px'}}>Iterasi {log.iter}:</div>
                    {Object.entries(log.details).map(([tId, ops]) => {
                      const tool = surgeryTools.find(t => t.id === tId);
                      return <div key={tId}>- {tool.name}: {ops}x Autoclave</div>
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
