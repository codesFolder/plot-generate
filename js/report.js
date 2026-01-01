import { STATE } from './state.js';

/* 
   REPORT MANAGER
   Handles state capture, modal rendering, and HTML generation.
*/

const reportItems = [];

// Helper: Format Date for Filenames (YYYY-MM-DD_HH-mm-ss)
export function getTimestamp() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

// 1. Capture State
export function addToReport() {
    // Current Dashboard State
    const type = document.getElementById('chart-type').value;
    const num = document.getElementById('num-col').value;
    const cat = document.getElementById('cat-col').value;
    const bins = document.getElementById('bin-slider')?.value || 10;

    // Config Object (Snapshot)
    const config = {
        id: Date.now(), // unique ID
        type,
        num,
        cat,
        bins,
        title: getChartTitle(type, num, cat)
    };

    reportItems.push(config);
    renderBadge();

    // Quick Feedback
    const btn = document.getElementById('add-to-report-btn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined text-[20px]">check</span> Added`;
    btn.classList.add('text-green-500', 'border-green-500/50', 'bg-green-500/10');
    setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.classList.remove('text-green-500', 'border-green-500/50', 'bg-green-500/10');
    }, 1500);
}

function getChartTitle(type, num, cat) {
    if (type === 'histogram') return `${num} Distribution`;
    if (type === 'scatter') return `${num} vs ${cat}`;
    if (type === 'line') return `${num} Trend`;
    if (type === 'bar') return `Total ${num} by ${cat}`;
    if (type === 'correlation') return `Correlation Heatmap`;
    return 'Chart';
}

function renderBadge() {
    const el = document.getElementById('report-count');
    if (el) el.innerText = `${reportItems.length} Items`;
}

// 2. Render Modal List
export function openReportModal() {
    const listEl = document.getElementById('report-items-list');
    const modal = document.getElementById('report-modal');
    modal.classList.remove('hidden');

    if (reportItems.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-8 border-2 border-dashed border-[#282f39] rounded-lg text-gray-500 text-sm">
                <span class="material-symbols-outlined block text-[24px] mb-2 opacity-50">add_chart</span>
                No charts added. Click "Add View" on the dashboard.
            </div>`;
        return;
    }

    listEl.innerHTML = reportItems.map((item, index) => `
        <div class="flex items-center justify-between p-3 bg-[#111418] border border-[#282f39] rounded-lg group hover:border-border-dark transition-colors">
            <div class="flex items-center gap-3">
                <span class="text-gray-500 font-mono text-xs w-6 text-center">${index + 1}</span>
                <div>
                     <p class="text-white text-sm font-medium">${item.title}</p>
                     <p class="text-gray-500 text-xs">${item.type} • ${item.num}</p>
                </div>
            </div>
            <button onclick="window.removeReportItem(${item.id})" class="text-gray-600 hover:text-red-500 transition-colors p-2">
                <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
        </div>
    `).join('');
}

// Global scope for inline onclick (dirty but effective here without complex delegation logic)
window.removeReportItem = (id) => {
    const idx = reportItems.findIndex(i => i.id === id);
    if (idx > -1) {
        reportItems.splice(idx, 1);
        renderBadge();
        openReportModal(); // re-render
    }
};

// 3. Generate HTML
export function downloadReport() {
    const title = document.getElementById('report-title').value || 'Report';
    const includeSummary = document.getElementById('include-summary').checked;
    const includeHeatmap = document.getElementById('include-heatmap').checked;

    const timestamp = getTimestamp();
    const filename = `${title.replace(/\s+/g, '_')}_${timestamp}.html`;

    // Construct Data Payload
    const reportData = {
        title,
        timestamp,
        items: reportItems,
        data: STATE.data,
        columns: STATE.columns,
        summary: STATE.summary,
        includeSummary,
        includeHeatmap
    };

    const htmlContent = generateHTML(reportData);

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* 
    HTML TEMPLATE ENGINE 
    Embeds provided data and re-uses Plotly for rendering on load.
*/
function generateHTML(payload) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${payload.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.plot.ly/plotly-2.24.1.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #0f1115; color: #e2e8f0; }
        .card { background: #111418; border: 1px solid #282f39; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 2rem; }
        .stat-box { background: #1c2530; border-radius: 0.5rem; padding: 1rem; border: 1px solid #282f39; }
    </style>
</head>
<body class="p-8 max-w-5xl mx-auto">
    
    <!-- HEADER -->
    <header class="mb-12 border-b border-[#282f39] pb-8">
        <h1 class="text-4xl font-bold text-white mb-2">${payload.title}</h1>
        <p class="text-gray-400 text-sm">Generated: ${payload.timestamp.replace(/_/g, ' ')}</p>
    </header>

    <!-- DATA OVERVIEW -->
    <section class="mb-12">
        <h2 class="text-xl font-bold text-white mb-4 uppercase tracking-wider text-sm text-gray-400">Dataset Overview</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div class="card bg-[#1c2530] border-transparent flex flex-col justify-center text-center p-4">
                <span class="block text-gray-500 text-xs font-bold mb-1">Total Rows</span>
                <span class="text-2xl font-mono text-white">${payload.data.length}</span>
             </div>
             <div class="card bg-[#1c2530] border-transparent flex flex-col justify-center text-center p-4">
                <span class="block text-gray-500 text-xs font-bold mb-1">Total Columns</span>
                <span class="text-2xl font-mono text-white">${payload.columns.length}</span>
             </div>
        </div>
    </section>

    <!-- CHARTS GRID -->
    <section class="space-y-12">
        ${payload.includeHeatmap ? `
        <div class="card">
            <h3 class="text-lg font-bold text-white mb-4">Correlation Matrix</h3>
            <div id="heatmap-container" style="height: 600px;"></div>
        </div>` : ''}

        <!-- Dynamic Items -->
        <div id="report-charts" class="space-y-12"></div>
    </section>

    <!-- SCRIPT TO RENDER -->
    <script>
        const DATA = ${JSON.stringify(payload.data)};
        const CONST_COLUMNS = ${JSON.stringify(payload.columns)};
        const ITEMS = ${JSON.stringify(payload.items)};
        const INCLUDE_SUMMARY = ${payload.includeSummary};
        
        // UTILS
        const cleanNumeric = arr => arr.map(v => Number(String(v).replace(/,/g, ''))).filter(n => !isNaN(n));

        function getStats(arr) {
            const clean = cleanNumeric(arr);
            if(!clean.length) return { min:0, max:0, mean:0, med:0 };
            
            clean.sort((a,b) => a-b);
            const sum = clean.reduce((a,b)=>a+b, 0);
            const mid = Math.floor(clean.length/2);
            
            return {
                min: clean[0],
                max: clean[clean.length-1],
                mean: sum / clean.length,
                med: clean.length % 2 !== 0 ? clean[mid] : (clean[mid-1] + clean[mid])/2
            };
        }
        
        // ... (Keep existing detectColumnTypes and calculateCorrelation functions) ...
        function detectColumnTypes(data, columns) {
            const types = {};
            columns.forEach(col => {
                let num = 0, date = 0, total = 0;
                data.forEach(row => {
                    const v = row[col];
                    if (v === null || v === undefined || v === '') return;
                    total++;
                    const cleanV = String(v).replace(/,/g, '');
                    if (!isNaN(cleanV) && cleanV.trim() !== '') num++;
                    else if (!isNaN(Date.parse(v))) date++;
                });
                if (num / total > 0.8) types[col] = 'Number';
                else if (date / total > 0.8) types[col] = 'Date';
                else types[col] = 'Category';
            });
            return types;
        }

        function calculateCorrelation(x, y) {
            const n = x.length;
            if(n !== y.length || n === 0) return 0;
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
            const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
            const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            return denominator === 0 ? 0 : numerator / denominator;
        }

        // RENDER HEATMAP
        if(document.getElementById('heatmap-container')) {
            const types = detectColumnTypes(DATA, CONST_COLUMNS);
            const numerics = CONST_COLUMNS.filter(c => types[c] === 'Number');
            
            if(numerics.length > 1) {
                const z = [];
                numerics.forEach(y => {
                    const row = [];
                    numerics.forEach(x => {
                        const yVals = cleanNumeric(DATA.map(r => r[y]));
                        const xVals = cleanNumeric(DATA.map(r => r[x]));
                        row.push(calculateCorrelation(xVals, yVals));
                    });
                    z.push(row);
                });

                const data = [{
                    z: z,
                    x: numerics,
                    y: numerics,
                    type: 'heatmap',
                    colorscale: 'Viridis'
                }];
                
                const layout = {
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { color: '#9da8b9', family: 'Inter, sans-serif' },
                    margin: { t: 20, l: 150, r: 50, b: 100 },
                    xaxis: { gridcolor: '#282f39', tickcolor:'#282f39' },
                    yaxis: { gridcolor: '#282f39', tickcolor:'#282f39' }
                };

                Plotly.newPlot('heatmap-container', data, layout, {responsive: true});
            } else {
                 document.getElementById('heatmap-container').innerHTML = '<p class="text-gray-500 text-center py-12">Not enough numeric columns for correlation.</p>';
            }
        }

        // RENDER ITEMS
        ITEMS.forEach((item, i) => {
            const container = document.createElement('div');
            container.className = 'card';
            
            // Header
            let html = '<h3 class="text-lg font-bold text-white mb-4">' + item.title + '</h3>';
            
            // Chart Div
            html += '<div id="plot-' + i + '" style="height: 400px; margin-bottom: 1.5rem;"></div>';
            
            // Stats Panel
            if (INCLUDE_SUMMARY && item.num) {
                const vals = DATA.map(r => r[item.num]);
                const s = getStats(vals);
                
                html += \`
                    <div class="border-t border-[#282f39] pt-4 mt-4">
                        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Statistics: \${item.num}</h4>
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="stat-box">
                                <span class="block text-gray-500 text-[10px] uppercase font-bold">Minimum</span>
                                <span class="text-lg font-mono text-white">\${s.min.toLocaleString()}</span>
                            </div>
                            <div class="stat-box">
                                <span class="block text-gray-500 text-[10px] uppercase font-bold">Maximum</span>
                                <span class="text-lg font-mono text-white">\${s.max.toLocaleString()}</span>
                            </div>
                            <div class="stat-box">
                                <span class="block text-gray-500 text-[10px] uppercase font-bold">Average</span>
                                <span class="text-lg font-mono text-white">\${s.mean.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                            </div>
                            <div class="stat-box">
                                <span class="block text-gray-500 text-[10px] uppercase font-bold">Median</span>
                                <span class="text-lg font-mono text-white">\${s.med.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                            </div>
                        </div>
                    </div>
                \`;
            }
            
            container.innerHTML = html;
            document.getElementById('report-charts').appendChild(container);

            generatePlot('plot-' + i, item, DATA);
        });

        function generatePlot(divId, config, data) {
            let trace = {};
            const layout = {
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: '#9da8b9', family: 'Inter, sans-serif' },
                margin: { t: 20, l: 60, r: 20, b: 60 },
                xaxis: { gridcolor: '#282f39', tickcolor:'#282f39', title: { text: config.cat || '' } },
                yaxis: { gridcolor: '#282f39', tickcolor:'#282f39', title: { text: config.num || '' } }
            };

            // ... (Keep existing plot logic same as previous step, just condensed for tool use limit if needed) ...
             if(config.type === 'histogram') {
                const raw = data.map(r => r[config.num]);
                const values = cleanNumeric(raw);
                trace = {
                    x: values,
                    type: 'histogram',
                    nbinsx: parseInt(config.bins),
                    marker: { color: '#136dec', line: { color: 'rgba(255,255,255,0.1)', width: 1 } }
                };
            }
            else if(config.type === 'scatter') {
                trace = {
                    x: data.map(r => r[config.cat]),
                    y: data.map(r => r[config.num]),
                    mode: 'markers',
                    type: 'scatter',
                    marker: { color: '#136dec', size: 8, opacity: 0.7, line: {color:'white', width:0.5} }
                };
            }
             else if (config.type === 'line') {
                 trace = {
                    x: data.map(r => r[config.cat]),
                    y: data.map(r => r[config.num]),
                    mode: 'lines+markers',
                    type: 'scatter',
                    line: { color: '#136dec', width: 3 },
                    marker: { color: '#111418', line:{color:'#136dec', width:2}, size:6 }
                };
            }
            else if (config.type === 'bar') {
                 const map = {};
                 data.forEach(r => {
                     const key = r[config.cat];
                     const val = Number(String(r[config.num]).replace(/,/g,'')) || 0;
                     map[key] = (map[key] || 0) + val;
                 });
                 trace = {
                     x: Object.keys(map),
                     y: Object.values(map),
                     type: 'bar',
                     marker: { color: '#136dec' }
                 };
            }

            Plotly.newPlot(divId, [trace], layout, {responsive: true});
        }
    </script>
</body>
</html>
    `;
}
