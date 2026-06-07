import { useState, useEffect } from 'react';
import SSPCalculator from './SSPCalculator';
import SurgeryCalculator from './SurgeryCalculator';
import AutoclaveCalculator from './AutoclaveCalculator';
import CrimeCalculator from './CrimeCalculator';
import StartopiaCalculator from './StartopiaCalculator';
import ChemicalCalculator from './ChemicalCalculator';
import './App.css'; // ensure App.css or index.css has navigation styles

export default function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeCalculator') || 'ssp');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeCalculator', tab);
  };

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="nav-tabs">
          <button 
            className={`nav-btn ${activeTab === 'ssp' ? 'active' : ''}`}
            onClick={() => handleTabChange('ssp')}
          >
            <img src="/images/ssp.png" alt="SSP" className="nav-icon" />
            SSP
          </button>
          <button 
            className={`nav-btn ${activeTab === 'surgery' ? 'active' : ''}`}
            onClick={() => handleTabChange('surgery')}
          >
            <span className="nav-icon">🩺</span>
            Surgery
          </button>
          <button 
            className={`nav-btn ${activeTab === 'autoclave' ? 'active' : ''}`}
            onClick={() => handleTabChange('autoclave')}
          >
            <span className="nav-icon">🔬</span>
            Autoclave
          </button>
          <button 
            className={`nav-btn ${activeTab === 'crime' ? 'active' : ''}`}
            onClick={() => handleTabChange('crime')}
          >
            <span className="nav-icon">🦹‍♂️</span>
            Crime
          </button>
          <button 
            className={`nav-btn ${activeTab === 'startopia' ? 'active' : ''}`}
            onClick={() => handleTabChange('startopia')}
          >
            <span className="nav-icon">🚀</span>
            Startopia
          </button>
          <button 
            className={`nav-btn ${activeTab === 'chemical' ? 'active' : ''}`}
            onClick={() => handleTabChange('chemical')}
          >
            <span className="nav-icon">🧪</span>
            Chemical
          </button>
        </div>
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme" title="Toggle Light/Dark Mode">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'ssp' && <SSPCalculator />}
        {activeTab === 'surgery' && <SurgeryCalculator />}
        {activeTab === 'autoclave' && <AutoclaveCalculator />}
        {activeTab === 'crime' && <CrimeCalculator />}
        {activeTab === 'startopia' && <StartopiaCalculator />}
        {activeTab === 'chemical' && <ChemicalCalculator />}
      </main>
    </div>
  );
}
