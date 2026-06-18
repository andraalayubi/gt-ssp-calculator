import ExcelJS from 'exceljs';

const tools = [
  'Clamp', 'Ultrasound', 'Splint', 'Anesthetic', 
  'Lab Kit', 'Transfusion', 'Pins', 'Defibrillator', 
  'Antiseptic', 'Antibiotics', 'Scalpel', 'Sponge', 'Stitches'
];

async function createSpreadsheet() {
  const wb = new ExcelJS.Workbook();
  
  // Style Definitions
  const styleHeader = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
  };
  
  const styleFormula = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }, // Light Gray
    border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} },
    font: { color: { argb: 'FF595959' } }
  };
  
  const styleInputKuning = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }, // Light Yellow
    border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
  };
  
  const styleInputBiru = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }, // Light Blue
    border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
  };
  
  const styleNormal = {
    border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
  };

  function setupSheet(sheetName, prevSheetName, packCount, packPrice) {
    const ws = wb.addWorksheet(sheetName);
    
    // Columns Widths
    ws.columns = [
      { width: 14 }, // A: Item
      { width: 14 }, // B: Sisa Sebelumn.
      { width: 13 }, // C: Restock Pack
      { width: 13 }, // D: Beli Eceran
      { width: 13 }, // E: Autoclave (-)
      { width: 13 }, // F: Autoclave (+)
      { width: 13 }, // G: Total Stock
      { width: 10 }, // H: Terjual 1
      { width: 14 }, // I: Rate 1
      { width: 14 }, // J: Harga 1
      { width: 12 }, // K: Rev 1
      { width: 10 }, // L: Terjual 2
      { width: 14 }, // M: Rate 2
      { width: 14 }, // N: Harga 2
      { width: 12 }, // O: Rev 2
      { width: 12 }, // P: Total Terjual
      { width: 14 }, // Q: Total Revenue
      { width: 14 }  // R: Sisa Akhir
    ];

    // Petunjuk Warna
    ws.mergeCells('A1:C1');
    ws.getCell('A1').value = 'PETUNJUK WARNA:';
    ws.getCell('A1').font = { bold: true };
    
    ws.getCell('A2').value = 'Kuning';
    ws.getCell('A2').style = styleInputKuning;
    ws.getCell('B2').value = ' = Input Utama (Paling sering diisi)';
    
    ws.getCell('A3').value = 'Biru';
    ws.getCell('A3').style = styleInputBiru;
    ws.getCell('B3').value = ' = Input Opsional (Isi hanya jika ada)';
    
    ws.getCell('A4').value = 'Abu-abu';
    ws.getCell('A4').style = styleFormula;
    ws.getCell('B4').value = ' = Rumus Otomatis (JANGAN DIUBAH)';
    
    // Capital & Profit Info
    ws.getCell('G1').value = 'Informasi Capital & Profit:';
    ws.getCell('G1').font = { bold: true };
    
    ws.getCell('G2').value = 'Jumlah Pack Dibeli:';
    ws.getCell('H2').value = packCount || 0;
    ws.getCell('H2').style = styleInputKuning;
    
    ws.getCell('G3').value = 'Harga per Pack (WL):';
    ws.getCell('H3').value = packPrice || 0;
    ws.getCell('H3').style = styleInputKuning;
    
    ws.getCell('G4').value = 'Total Modal (Capital):';
    ws.getCell('H4').value = { formula: 'H2*H3' };
    ws.getCell('H4').style = styleFormula;
    
    ws.getCell('G5').value = 'Total Revenue (Profit Kotor):';
    ws.getCell('H5').value = { formula: 'SUM(Q10:Q23)' }; // Q is Total Revenue
    ws.getCell('H5').style = styleFormula;
    
    ws.getCell('G6').value = 'Profit Bersih (Net Profit):';
    ws.getCell('H6').value = { formula: 'H5-H4' };
    ws.getCell('H6').style = styleFormula;
    
    // Super Headers for Batches
    ws.mergeCells('H8:K8');
    ws.getCell('H8').value = '=== PENJUALAN BATCH 1 ===';
    ws.getCell('H8').style = styleHeader;
    
    ws.mergeCells('L8:O8');
    ws.getCell('L8').value = '=== PENJUALAN BATCH 2 ===';
    ws.getCell('L8').style = styleHeader;
    
    // Headers
    const headers = [
      'Item', 'Sisa Sebelum', 'Restock Pack', 'Beli Ecer (+)', 'Autoclav (-)', 'Autoclav (+)', 
      'Total Stock', 
      'Terjual 1', 'Rate 1', 'Harga 1', 'Rev 1',
      'Terjual 2', 'Rate 2', 'Harga 2', 'Rev 2',
      'Total Jual', 'Total Rev', 'Sisa Akhir'
    ];
    const headerRow = ws.getRow(9);
    headerRow.values = headers;
    headerRow.eachCell(cell => { cell.style = styleHeader; });
    headerRow.height = 30;
    
    // Data Rows
    const startIndex = 10;
    tools.forEach((tool, i) => {
      const r = startIndex + i;
      const row = ws.getRow(r);
      row.getCell(1).value = tool;
      row.getCell(1).style = styleNormal;
      
      row.getCell(2).value = prevSheetName ? { formula: `'${prevSheetName}'!R${r}` } : 0;
      row.getCell(2).style = styleFormula;
      
      row.getCell(3).value = { formula: 'H2*20' };
      row.getCell(3).style = styleFormula;
      
      row.getCell(4).value = 0;
      row.getCell(4).style = styleInputBiru;
      row.getCell(5).value = 0;
      row.getCell(5).style = styleInputBiru;
      row.getCell(6).value = 0;
      row.getCell(6).style = styleInputBiru;
      
      row.getCell(7).value = { formula: `B${r}+C${r}+D${r}-E${r}+F${r}` };
      row.getCell(7).style = styleFormula;
      
      // Batch 1
      row.getCell(8).value = 0; row.getCell(8).style = styleInputKuning;
      row.getCell(9).value = 0; row.getCell(9).style = styleInputKuning;
      row.getCell(10).value = 0; row.getCell(10).style = styleInputKuning;
      row.getCell(11).value = { formula: `IF(I${r}>0, H${r}/I${r}, IF(J${r}>0, H${r}*J${r}, 0))` };
      row.getCell(11).style = styleFormula;
      
      // Batch 2
      row.getCell(12).value = 0; row.getCell(12).style = styleInputBiru; // Make Batch 2 blue since it's optional
      row.getCell(13).value = 0; row.getCell(13).style = styleInputBiru;
      row.getCell(14).value = 0; row.getCell(14).style = styleInputBiru;
      row.getCell(15).value = { formula: `IF(M${r}>0, L${r}/M${r}, IF(N${r}>0, L${r}*N${r}, 0))` };
      row.getCell(15).style = styleFormula;
      
      // Totals
      row.getCell(16).value = { formula: `H${r}+L${r}` }; // Total Terjual
      row.getCell(16).style = styleFormula;
      
      row.getCell(17).value = { formula: `K${r}+O${r}` }; // Total Rev
      row.getCell(17).style = styleFormula;
      
      row.getCell(18).value = { formula: `G${r}-P${r}` }; // Sisa Akhir
      row.getCell(18).style = styleFormula;
    });

    // Surg-E
    const r = startIndex + tools.length;
    const row = ws.getRow(r);
    row.getCell(1).value = 'Surg-E';
    row.getCell(1).style = styleNormal;
    
    row.getCell(2).value = prevSheetName ? { formula: `'${prevSheetName}'!R${r}` } : 0;
    row.getCell(2).style = styleFormula;
    
    row.getCell(3).value = { formula: 'H2*5' };
    row.getCell(3).style = styleFormula;
    
    row.getCell(4).value = 0; row.getCell(4).style = styleInputBiru;
    row.getCell(5).value = 0; row.getCell(5).style = styleInputBiru;
    row.getCell(6).value = 0; row.getCell(6).style = styleInputBiru;
    
    row.getCell(7).value = { formula: `B${r}+C${r}+D${r}-E${r}+F${r}` };
    row.getCell(7).style = styleFormula;
    
    // Batch 1
    row.getCell(8).value = 0; row.getCell(8).style = styleInputKuning;
    row.getCell(9).value = 0; row.getCell(9).style = styleInputKuning;
    row.getCell(10).value = 0; row.getCell(10).style = styleInputKuning;
    row.getCell(11).value = { formula: `IF(I${r}>0, H${r}/I${r}, IF(J${r}>0, H${r}*J${r}, 0))` };
    row.getCell(11).style = styleFormula;
    
    // Batch 2
    row.getCell(12).value = 0; row.getCell(12).style = styleInputBiru;
    row.getCell(13).value = 0; row.getCell(13).style = styleInputBiru;
    row.getCell(14).value = 0; row.getCell(14).style = styleInputBiru;
    row.getCell(15).value = { formula: `IF(M${r}>0, L${r}/M${r}, IF(N${r}>0, L${r}*N${r}, 0))` };
    row.getCell(15).style = styleFormula;
    
    // Totals
    row.getCell(16).value = { formula: `H${r}+L${r}` };
    row.getCell(16).style = styleFormula;
    row.getCell(17).value = { formula: `K${r}+O${r}` };
    row.getCell(17).style = styleFormula;
    row.getCell(18).value = { formula: `G${r}-P${r}` };
    row.getCell(18).style = styleFormula;

    // Total Row
    const tr = r + 1;
    ws.getCell(`A${tr}`).value = 'TOTAL';
    ws.getCell(`A${tr}`).style = styleHeader;
    ws.getCell(`Q${tr}`).value = { formula: `SUM(Q10:Q${r})` };
    ws.getCell(`Q${tr}`).style = styleHeader;

    return ws;
  }

  // --- TEMPLATE ---
  setupSheet('Template', null, 0, 0);

  // --- STAGE 1 ---
  const ws1 = setupSheet('Stage 1', null, 100, 0.7);
  const salesStage1 = {
    'Ultrasound': { sold: 1995, rate: 7 },
    'Splint': { sold: 1995, rate: 7 },
    'Anesthetic': { sold: 1995, rate: 7 },
    'Lab Kit': { sold: 1995, rate: 7 },
    'Transfusion': { sold: 1995, rate: 7 },
    'Pins': { sold: 1981, rate: 7 },
    'Defibrillator': { sold: 1939, rate: 7 },
    'Antiseptic': { sold: 1938, rate: 1938/247 }, 
    'Antibiotics': { sold: 1998, rate: 6 },
    'Scalpel': { sold: 1998, rate: 6 },
    'Sponge': { sold: 1998, rate: 6 },
    'Stitches': { sold: 2000, rate: 1.6 },
    'Surg-E': { sold: 500, price: 3 }
  };
  for (let i = 10; i <= 23; i++) {
    const toolName = ws1.getCell(`A${i}`).value;
    if (salesStage1[toolName]) {
      ws1.getCell(`H${i}`).value = salesStage1[toolName].sold;
      if (salesStage1[toolName].rate) {
         ws1.getCell(`I${i}`).value = salesStage1[toolName].rate;
      } else if (salesStage1[toolName].price) {
         ws1.getCell(`J${i}`).value = salesStage1[toolName].price;
      }
    }
  }

  // --- STAGE 2 ---
  const ws2 = setupSheet('Stage 2', 'Stage 1', 0, 0);
  ws2.getCell('H4').value = { formula: 'H2*H3 + 108' }; // Add 108 WL modal for Antiseptic
  const actionsStage2 = {
    'Clamp': { autoOut: 1400 },
    'Antiseptic': { beli: 972, autoOut: 972 },
    'Scalpel': { autoIn: 468 },
    'Antibiotics': { autoIn: 468 },
    'Anesthetic': { autoIn: 193 },
    'Ultrasound': { autoIn: 193 },
    'Stitches': { 
       batch1: { sold: 200, price: 1.65 }, 
       batch2: { sold: 400, price: 1.5 } 
    }
  };
  for (let i = 10; i <= 23; i++) {
    const toolName = ws2.getCell(`A${i}`).value;
    if (actionsStage2[toolName]) {
      if (actionsStage2[toolName].beli) ws2.getCell(`D${i}`).value = actionsStage2[toolName].beli;
      if (actionsStage2[toolName].autoOut) ws2.getCell(`E${i}`).value = actionsStage2[toolName].autoOut;
      if (actionsStage2[toolName].autoIn) ws2.getCell(`F${i}`).value = actionsStage2[toolName].autoIn;
      
      if (actionsStage2[toolName].batch1) {
         // Batch 1 example
         ws2.getCell(`H${i}`).value = actionsStage2[toolName].batch1.sold;
         ws2.getCell(`J${i}`).value = actionsStage2[toolName].batch1.price;
      }
      if (actionsStage2[toolName].batch2) {
         // Batch 2 example
         ws2.getCell(`L${i}`).value = actionsStage2[toolName].batch2.sold;
         ws2.getCell(`N${i}`).value = actionsStage2[toolName].batch2.price;
      }
    }
  }

  await wb.xlsx.writeFile('Surgery_Shop_Tracker_V5.xlsx');
  console.log('Successfully created Surgery_Shop_Tracker_V5.xlsx');
}

createSpreadsheet();
