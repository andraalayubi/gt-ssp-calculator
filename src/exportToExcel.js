import * as XLSX from 'xlsx';

/**
 * Shared Export to Excel utility for all calculators.
 * Creates a styled Excel file and triggers browser download.
 */

/**
 * Export data to an Excel file and download it.
 * @param {Object} options
 * @param {string} options.fileName - The file name (without .xlsx)
 * @param {Array<Object>} options.sheets - Array of sheet definitions
 *   Each sheet: { name: string, headers: string[], rows: any[][], summary?: { label: string, value: string|number }[] }
 */
export function exportToExcel({ fileName, sheets }) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const wsData = [];

    // Add summary rows at the top if provided
    if (sheet.summary && sheet.summary.length > 0) {
      sheet.summary.forEach(item => {
        wsData.push([item.label, item.value]);
      });
      wsData.push([]); // blank row separator
    }

    // Add headers
    wsData.push(sheet.headers);

    // Add data rows
    sheet.rows.forEach(row => {
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-size columns based on content
    const colWidths = sheet.headers.map((header, colIdx) => {
      let maxLen = header.length;
      sheet.rows.forEach(row => {
        const cellVal = row[colIdx];
        if (cellVal !== undefined && cellVal !== null) {
          maxLen = Math.max(maxLen, String(cellVal).length);
        }
      });
      if (sheet.summary) {
        sheet.summary.forEach(item => {
          if (colIdx === 0) maxLen = Math.max(maxLen, String(item.label).length);
          if (colIdx === 1) maxLen = Math.max(maxLen, String(item.value).length);
        });
      }
      return { wch: Math.min(maxLen + 4, 40) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  // Generate and download
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// Calculator-specific export functions
// ==========================================

/**
 * Export SSP Calculator data
 */
export function exportSSPData({ seedsData, seedValues, sspCost, results, trashSeeds, formatSeedName }) {
  const headers = ['Seed Name', 'Amount', 'Seeds/WL', 'Revenue (WL)', 'Is Trash'];
  const rows = seedsData.map(seed => {
    const amt = parseFloat(seedValues[seed.id].amt) || 0;
    const price = parseFloat(seedValues[seed.id].price) || 0;
    const revenue = price > 0 && amt > 0 ? (amt / price) : 0;
    const isTrash = trashSeeds.includes(seed.id);
    return [
      formatSeedName(seed.id),
      amt,
      price,
      parseFloat(revenue.toFixed(4)),
      isTrash ? 'Yes' : 'No'
    ];
  });

  const summary = [
    { label: 'SSP Cost (per 200 packs)', value: parseFloat(sspCost) || 0 },
    { label: 'Total SSP Packs', value: parseFloat(results.totalSSP.toFixed(0)) },
    { label: 'Total Cost (WL)', value: parseFloat(results.cost.toFixed(2)) },
    { label: 'Total Revenue (WL)', value: parseFloat(results.totalWorldLock.toFixed(2)) },
    { label: 'Net Profit (WL)', value: parseFloat(results.cleanProfit.toFixed(2)) },
    { label: 'Trash Seeds Count', value: trashSeeds.length },
    { label: 'Worst Case Revenue (WL)', value: parseFloat(results.worstRevenue.toFixed(2)) },
    { label: 'Worst Case Profit (WL)', value: parseFloat(results.worstProfit.toFixed(2)) },
  ];

  exportToExcel({
    fileName: `SSP_Calculator_${getDateStr()}`,
    sheets: [{ name: 'SSP Data', headers, rows, summary }]
  });
}

/**
 * Export Surgery Calculator data
 */
export function exportSurgeryData({ surgeryTools, packsCount, packCost, toolPrices, results }) {
  const packs = parseFloat(packsCount) || 0;
  const headers = ['Tool Name', 'Qty/Pack', 'Total Qty', 'Price', 'Mode', 'Revenue (WL)'];
  const rows = surgeryTools.map(tool => {
    const qty = packs * tool.qtyPerPack;
    const price = parseFloat(toolPrices[tool.id].price) || 0;
    const mode = toolPrices[tool.id].mode;
    let revenue = 0;
    if (price > 0 && qty > 0) {
      revenue = mode === 'per_wl' ? qty / price : qty * price;
    }
    return [
      tool.name,
      tool.qtyPerPack,
      qty,
      price,
      mode === 'per_wl' ? 'per WL' : 'WL each',
      parseFloat(revenue.toFixed(4))
    ];
  });

  const summary = [
    { label: 'Number of Packs', value: packs },
    { label: 'Cost per Pack (WL)', value: parseFloat(packCost) || 0 },
    { label: 'Total Cost (WL)', value: parseFloat(results.totalCost.toFixed(2)) },
    { label: 'Total Revenue (WL)', value: parseFloat(results.totalRevenue.toFixed(2)) },
    { label: 'Net Profit (WL)', value: parseFloat(results.netProfit.toFixed(2)) },
    { label: 'Profit %', value: parseFloat(results.profitPercentage.toFixed(1)) + '%' },
  ];

  exportToExcel({
    fileName: `Surgery_Calculator_${getDateStr()}`,
    sheets: [{ name: 'Surgery Data', headers, rows, summary }]
  });
}

/**
 * Export Autoclave Calculator data
 */
export function exportAutoclaveData({ surgeryTools, toolData, results }) {
  // Sheet 1: Input & Results
  const headers1 = ['Tool Name', 'Qty (Before)', 'Qty (After)', 'Change', 'Price', 'Mode', 'Min Sisa', 'Auto Repeat'];
  const rows1 = surgeryTools.map(tool => {
    const data = toolData[tool.id];
    const before = parseFloat(data.qty) || 0;
    const after = results.finalInventory[tool.id] || 0;
    const diff = after - before;
    return [
      tool.name,
      before,
      after,
      diff,
      parseFloat(data.price) || 0,
      data.mode === 'per_wl' ? 'per WL' : 'WL each',
      parseFloat(data.minSisa) || 0,
      data.autoRepeat ? 'Yes' : 'No'
    ];
  });

  const summary1 = [
    { label: 'Nilai Sebelum (WL)', value: parseFloat(results.nilaiSebelum.toFixed(2)) },
    { label: 'Nilai Sesudah (WL)', value: parseFloat(results.nilaiSesudah.toFixed(2)) },
    { label: 'Selisih (WL)', value: parseFloat(results.selisih.toFixed(2)) },
    { label: 'Selisih %', value: parseFloat(results.selisihPercent.toFixed(1)) + '%' },
    { label: 'Total Autoclave Ops', value: results.totalOps },
    { label: 'Total Iterations', value: results.iterationLogs.length },
  ];

  // Sheet 2: Iteration Log
  const headers2 = ['Iteration', 'Total Ops', 'Tools Used', 'Details'];
  const rows2 = results.iterationLogs.map(log => {
    const details = Object.entries(log.details).map(([tId, ops]) => {
      const tool = surgeryTools.find(t => t.id === tId);
      return `${tool?.name || tId}: ${ops}x`;
    }).join(', ');
    return [log.iter, log.totalOps, log.numTools, details];
  });

  exportToExcel({
    fileName: `Autoclave_Calculator_${getDateStr()}`,
    sheets: [
      { name: 'Autoclave Results', headers: headers1, rows: rows1, summary: summary1 },
      { name: 'Iteration Log', headers: headers2, rows: rows2 }
    ]
  });
}

/**
 * Export Crime Calculator data
 */
export function exportCrimeData({ crimeCards, cardData, totalRevenue }) {
  const headers = ['Card Name', 'Category', 'Quantity', 'Items per WL', 'Revenue (WL)'];
  const rows = crimeCards.map(card => {
    const qty = parseFloat(cardData[card.id].qty) || 0;
    const price = parseFloat(cardData[card.id].price) || 0;
    const revenue = price > 0 && qty > 0 ? qty / price : 0;
    return [
      card.name,
      card.category,
      qty,
      price,
      parseFloat(revenue.toFixed(4))
    ];
  });

  const summary = [
    { label: 'Total Revenue (WL)', value: parseFloat(totalRevenue.toFixed(2)) },
  ];

  exportToExcel({
    fileName: `Crime_Cards_${getDateStr()}`,
    sheets: [{ name: 'Crime Cards', headers, rows, summary }]
  });
}

/**
 * Export Startopia Calculator data
 */
export function exportStartopiaData({ startopiaTools, packsCount, packCost, toolPrices, results }) {
  const packs = parseFloat(packsCount) || 0;
  const headers = ['Tool Name', 'Qty/Pack', 'Total Qty', 'Price', 'Mode', 'Revenue (WL)'];
  const rows = startopiaTools.map(tool => {
    const qty = packs * tool.qtyPerPack;
    const price = parseFloat(toolPrices[tool.id].price) || 0;
    const mode = toolPrices[tool.id].mode;
    let revenue = 0;
    if (price > 0 && qty > 0) {
      revenue = mode === 'per_wl' ? qty / price : qty * price;
    }
    return [
      tool.name,
      tool.qtyPerPack,
      qty,
      price,
      mode === 'per_wl' ? 'per WL' : 'WL each',
      parseFloat(revenue.toFixed(4))
    ];
  });

  const summary = [
    { label: 'Number of Packs', value: packs },
    { label: 'Cost per Pack (WL)', value: parseFloat(packCost) || 0 },
    { label: 'Total Cost (WL)', value: parseFloat(results.totalCost.toFixed(2)) },
    { label: 'Total Revenue (WL)', value: parseFloat(results.totalRevenue.toFixed(2)) },
    { label: 'Net Profit (WL)', value: parseFloat(results.netProfit.toFixed(2)) },
    { label: 'Profit %', value: parseFloat(results.profitPercentage.toFixed(1)) + '%' },
  ];

  exportToExcel({
    fileName: `Startopia_Calculator_${getDateStr()}`,
    sheets: [{ name: 'Startopia Data', headers, rows, summary }]
  });
}

/**
 * Export Chemical Calculator data
 */
export function exportChemicalData({ chemicalItems, prices, results }) {
  // Sheet 1: Market Prices
  const headers1 = ['Item Name', 'Category', 'Price', 'Mode', 'WL Value per Unit'];
  const rows1 = chemicalItems.map(item => {
    const p = parseFloat(prices[item.id]?.price) || 0;
    const mode = prices[item.id]?.mode || 'per_wl';
    const valPerUnit = p <= 0 ? 0 : (mode === 'per_wl' ? 1 / p : p);
    return [
      item.name,
      item.category,
      p,
      mode === 'per_wl' ? 'per WL' : 'WL each',
      parseFloat(valPerUnit.toFixed(6))
    ];
  });

  // Sheet 2: Crafting Analysis
  const headers2 = ['Craft Route', 'Raw Materials', 'Raw Value (WL)', 'Crafted Value (WL)', 'Profit (WL)', 'Margin %', 'Recommendation'];
  const rows2 = results.map(route => [
    route.name,
    route.rawDesc,
    parseFloat(route.rawValue.toFixed(4)),
    parseFloat(route.craftedValue.toFixed(4)),
    parseFloat(route.profit.toFixed(4)),
    parseFloat(route.margin.toFixed(1)) + '%',
    route.isCraftBetter ? 'CRAFT & SELL' : 'SELL RAW'
  ]);

  exportToExcel({
    fileName: `Chemical_Calculator_${getDateStr()}`,
    sheets: [
      { name: 'Market Prices', headers: headers1, rows: rows1 },
      { name: 'Crafting Analysis', headers: headers2, rows: rows2 }
    ]
  });
}

// Helper to get date string for filename
function getDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
