import { STATE } from './state.js';
import { addToReport, openReportModal, downloadReport, getTimestamp } from './report.js';

/* ---------- COLUMN TYPE DETECTION ---------- */
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

/* ============================================================
   STATS UTILITIES
============================================================ */
function cleanNumeric(arr) {
    return arr
        .map(v => {
            if (v === null || v === undefined || v === '') return NaN;
            return Number(String(v).replace(/,/g, ''));
        })
        .filter(v => !isNaN(v));
}

function mean(arr) {
    const x = cleanNumeric(arr);
    return x.length ? x.reduce((a, b) => a + b, 0) / x.length : 0;
}

function median(arr) {
    const x = cleanNumeric(arr).sort((a, b) => a - b);
    const n = x.length;
    if (n === 0) return 0;
    const mid = Math.floor(n / 2);
    return n % 2 !== 0 ? x[mid] : (x[mid - 1] + x[mid]) / 2;
}

function min(arr) {
    const x = cleanNumeric(arr);
    return x.length ? Math.min(...x) : 0;
}

function max(arr) {
    const x = cleanNumeric(arr);
    return x.length ? Math.max(...x) : 0;
}

/* ---------- MAIN RENDER ---------- */
export function renderDashboard() {
    const contentEl = document.getElementById('content');

    // Safety check
    if (!contentEl) return;
    if (!STATE.data || STATE.columns.length === 0) return;

    // Detect Types
    STATE.types = detectColumnTypes(STATE.data, STATE.columns);
    const numericCols = STATE.columns.filter(c => STATE.types[c] === 'Number');
    const categoryCols = STATE.columns.filter(c => STATE.types[c] === 'Category');
    const dateCols = STATE.columns.filter(c => STATE.types[c] === 'Date');

    // Default Selections
    const activeNum = document.getElementById('num-col')?.value || numericCols[0];
    const activeCat = document.getElementById('cat-col')?.value || categoryCols[0] || dateCols[0];
    const activeType = document.getElementById('chart-type')?.value || 'histogram';

    // Show Controls & Hide Empty State
    const controlsBar = document.getElementById('dashboard-controls-bar');
    const emptyState = document.getElementById('empty-state');

    if (emptyState) emptyState.classList.add('hidden');
    if (controlsBar) controlsBar.classList.remove('hidden');

    // Ensure we only render the controls ONCE (if not already there) 
    // BUT we need to update selections if state changed... 
    // For simplicity, we re-render stats/chart but leave controls structure if possible?
    // Actually, re-rendering controls is safer to sync with Columns. 
    // Let's inject into controls bar.
    if (controlsBar) {
        controlsBar.innerHTML = `
            <div class="flex flex-wrap items-end gap-6">
                <!-- Chart Type -->
                <div class="flex flex-col gap-1.5 w-48">
                    <label class="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Visualization</label>
                    <div class="relative">
                        <select id="chart-type" class="w-full bg-[#1c2530] border border-[#282f39] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 shadow-sm">
                            <option value="histogram" ${activeType === 'histogram' ? 'selected' : ''}>Distribution (Histogram)</option>
                            <option value="bar" ${activeType === 'bar' ? 'selected' : ''}>Bar Chart (Category)</option>
                            <option value="line" ${activeType === 'line' ? 'selected' : ''}>Trend (Line)</option>
                            <option value="scatter" ${activeType === 'scatter' ? 'selected' : ''}>Scatter Plot</option>
                            <option value="correlation" ${activeType === 'correlation' ? 'selected' : ''}>Correlation Heatmap</option>
                        </select>
                    </div>
                </div>

                <!-- Y-Axis -->
                <div class="flex flex-col gap-1.5 w-48">
                    <label class="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Metric (Numeric)</label>
                     <select id="num-col" class="w-full bg-[#1c2530] border border-[#282f39] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 shadow-sm">
                        ${numericCols.map(c => `<option value="${c}" ${c === activeNum ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>

                <!-- X-Axis -->
                <div class="flex flex-col gap-1.5 w-48">
                    <label class="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Dimension (Group By)</label>
                    <select id="cat-col" class="w-full bg-[#1c2530] border border-[#282f39] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 shadow-sm">
                        ${[...categoryCols, ...dateCols, ...numericCols].map(c => `<option value="${c}" ${c === activeCat ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>

                 <!-- Bins Control -->
                 <div id="bin-control" class="flex flex-col gap-1.5 w-48 ${activeType === 'histogram' ? '' : 'hidden'}">
                    <label class="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Detail Level: <span id="bin-value" class="text-primary">${10}</span></label>
                    <input type="range" id="bin-slider" min="5" max="50" value="10" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary">
                </div>

                <!-- Add to Report Action -->
                 <div class="flex flex-col gap-1.5 w-auto ml-auto">
                    <label class="text-[10px] font-bold uppercase text-gray-400 tracking-wider invisible">Action</label>
                    <button id="add-to-report-btn" class="flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all font-semibold text-sm">
                        <span class="material-symbols-outlined text-[20px]">add_chart</span>
                        Add View
                    </button>
                </div>
            </div>
        `;
    }

    // Stats Calculations
    const rawValues = STATE.data.map(r => r[activeNum]);
    const cleanValues = cleanNumeric(rawValues);
    const stats = {
        min: min(cleanValues),
        max: max(cleanValues),
        mean: mean(cleanValues),
        med: median(cleanValues)
    };

    // Render Main Stats & Placeholders (Only the dynamic parts)
    // We assume the rest of the structure is static or we just replace innerHTML of containers to avoid flicker?
    // For now, simpler to replace the inner content of 'stats-row' if we had one.
    // But since we are generating the whole dashboard content structure in one go in previous steps, 
    // let's stick to generating the stats + charts area only to keep controls intact?
    // Actually, let's keep it simple: Render the Content Area BELOW controls.

    // We need to target specific containers if we want to avoid re-rendering controls. 
    // But for this prototype, full render is fine as long as we re-attach listeners.

    // Wait, we just rendered controls. Now render the rest into a 'dashboard-stage' div?
    // Or just append?

    // Clean solution: The `content` div in index.html is the container. 
    // We already have `dashboard-controls-bar` separate.
    // So we just clear the rest?

    // Let's create a 'dashboard-body' if not exists.
    let bodyEl = document.getElementById('dashboard-body');
    if (!bodyEl) {
        bodyEl = document.createElement('div');
        bodyEl.id = 'dashboard-body';
        bodyEl.className = 'flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-[#0f1115]';
        contentEl.appendChild(bodyEl);
    }

    bodyEl.innerHTML = `
        <!-- Page Heading -->
        <div class="flex flex-col border-b border-border-dark bg-[#111418] z-30 shadow-md">
            <div class="flex items-center gap-2 px-6 pt-4 pb-1">
                <span class="text-[#9da8b9] text-xs font-medium">Workspace</span>
                <span class="text-[#9da8b9] text-xs font-medium">/</span>
                <span class="text-primary text-xs font-medium">Analysis</span>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-4 px-6 pb-4">
                <div class="flex items-center gap-3">
                    <h1 class="text-white text-2xl md:text-3xl font-bold tracking-tight">Project Dashboard</h1>
                    <span class="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">LIVE</span>
                </div>
            </div>
        </div>

            <!-- Stats Row -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                <!-- Min -->
                <div class="bg-[#111418] border border-[#282f39] p-5 rounded-2xl shadow-sm">
                    <span class="text-gray-500 text-xs font-bold uppercase tracking-wider">Minimum</span>
                    <div class="mt-2 text-2xl font-bold text-white font-mono tracking-tight">${stats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
                <!-- Max -->
                <div class="bg-[#111418] border border-[#282f39] p-5 rounded-2xl shadow-sm">
                    <span class="text-gray-500 text-xs font-bold uppercase tracking-wider">Maximum</span>
                    <div class="mt-2 text-2xl font-bold text-white font-mono tracking-tight">${stats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
                <!-- Mean -->
                <div class="bg-[#111418] border border-[#282f39] p-5 rounded-2xl shadow-sm">
                    <span class="text-gray-500 text-xs font-bold uppercase tracking-wider">Average</span>
                    <div class="mt-2 text-2xl font-bold text-white font-mono tracking-tight flex items-baseline gap-2">
                        ${stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        <span class="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">MEAN</span>
                    </div>
                </div>
                <!-- Median -->
                <div class="bg-[#111418] border border-[#282f39] p-5 rounded-2xl shadow-sm">
                    <span class="text-gray-500 text-xs font-bold uppercase tracking-wider">Median</span>
                    <div class="mt-2 text-2xl font-bold text-white font-mono tracking-tight flex items-baseline gap-2">
                        ${stats.med.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        <span class="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">MID</span>
                    </div>
                </div>
            </div>

            <!-- Chart Section -->
            <div class="px-6 pb-6 min-h-[500px] flex flex-col">
                 <div class="flex-1 relative border border-[#282f39] rounded-2xl bg-[#111418] p-1 shadow-lg">
                    <div class="absolute inset-0 chart-grid pointer-events-none rounded-2xl"></div>
                    <div id="chart" class="w-full h-full relative z-10 rounded-xl overflow-hidden"></div>
                 </div>
            </div>

            <!-- Data Table Section -->
            <div class="px-6 pb-8">
                <div class="rounded-2xl border border-[#282f39] bg-[#111418] overflow-hidden shadow-lg">
                    <div class="px-4 py-3 border-b border-[#282f39] bg-[#15191f] flex items-center justify-between">
                         <div class="flex items-center gap-2">
                             <span class="material-symbols-outlined text-gray-500 text-[18px]">table_view</span>
                             <span class="text-xs font-bold text-gray-300 uppercase tracking-wider">Data View</span>
                         </div>
                         <span class="text-[10px] px-2 py-1 rounded bg-[#1c2530] text-gray-400 font-mono">${STATE.data.length} Rows</span>
                    </div>
                    <div class="overflow-x-auto max-h-[400px]">
                        <table class="w-full text-left border-collapse">
                            <thead class="sticky top-0 bg-[#1c2530] z-10 text-xs font-bold text-gray-400 font-display">
                                <tr>
                                    ${STATE.columns.map(c => `<th class="p-3 border-b border-[#282f39] whitespace-nowrap min-w-[120px]">${c}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody class="text-xs font-mono text-gray-300 divide-y divide-[#1e252f]">
                                 ${STATE.data.slice(0, 50).map(row => `
                                    <tr class="hover:bg-[#1e252f] transition-colors odd:bg-[#111418] even:bg-[#13161c]">
                                         ${STATE.columns.map(c => `<td class="p-3 whitespace-nowrap border-b border-[#1e252f] opacity-90">${row[c]}</td>`).join('')}
                                    </tr>
                                 `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
    `;

    renderPlotlyChart();
    attachListeners();
}

/* ============================================================
   EVENTS & LOGIC
============================================================ */
function attachListeners() {
    // Controls
    ['chart-type', 'num-col', 'cat-col', 'bin-slider'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.oninput = () => {
                // Update dependent UI visibility
                const type = document.getElementById('chart-type').value;
                const binControl = document.getElementById('bin-control');
                if (binControl) {
                    binControl.classList.toggle('hidden', type !== 'histogram');
                    if (id === 'bin-slider') {
                        document.getElementById('bin-value').innerText = el.value;
                    }
                }
                renderDashboard();
            };
        }
    });

    // 1. Export Image (Specific Format Fix)
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            const chartTitle = getChartTitle(); // Get title for filename
            const ts = getTimestamp();
            Plotly.downloadImage('chart', {
                format: 'png',
                filename: `${chartTitle.replace(/\s+/g, '_')}_${ts}`, // chart_title_date_time.png
                height: 800,
                width: 1200,
                bg: '#111418'
            });
        };
    }

    // 2. Add To Report
    const addBtn = document.getElementById('add-to-report-btn');
    if (addBtn) {
        // Remove old listeners? onclick assignment handles it.
        addBtn.onclick = () => addToReport();
    }

    // 3. View Report
    const viewReportBtn = document.getElementById('view-report-btn');
    if (viewReportBtn) {
        viewReportBtn.onclick = () => openReportModal();
    }

    // 4. Download Report (Inside Modal)
    const dlHtmlBtn = document.getElementById('download-html-btn');
    if (dlHtmlBtn) {
        dlHtmlBtn.onclick = () => downloadReport();
    }
}

function getChartTitle() {
    const type = document.getElementById('chart-type')?.value;
    const num = document.getElementById('num-col')?.value;
    const cat = document.getElementById('cat-col')?.value;

    if (type === 'histogram') return `${num} Distribution`;
    if (type === 'scatter') return `${num} vs ${cat}`;
    if (type === 'line') return `${num} Trend`;
    if (type === 'bar') return `Total ${num} by ${cat}`;
    if (type === 'correlation') return `Correlation Heatmap`;
    return 'Chart';
}

function renderPlotlyChart() {
    const type = document.getElementById('chart-type')?.value;
    const numCol = document.getElementById('num-col')?.value;
    const catCol = document.getElementById('cat-col')?.value;
    if (!type || !numCol) return;

    const slider = document.getElementById('bin-slider');
    const bins = slider ? Number(slider.value) : 10;

    let data = [];
    const layout = {
        paper_bgcolor: '#111418',
        plot_bgcolor: '#111418',
        font: { color: '#9da8b9', family: 'Inter, sans-serif' },
        margin: { t: 40, l: 60, r: 20, b: 60 },
        title: { text: getChartTitle(), font: { color: 'white', size: 18 } },
        xaxis: { gridcolor: '#282f39', tickcolor: '#282f39' },
        yaxis: { gridcolor: '#282f39', tickcolor: '#282f39' },
        showlegend: false
    };

    if (type === 'histogram') {
        const raw = STATE.data.map(r => r[numCol]);
        const values = cleanNumeric(raw);
        data = [{
            x: values,
            type: 'histogram',
            nbinsx: bins,
            marker: { color: '#136dec', line: { color: 'rgba(255,255,255,0.1)', width: 1 } }
        }];
    }
    else if (type === 'scatter') {
        data = [{
            x: STATE.data.map(r => r[catCol]),
            y: STATE.data.map(r => r[numCol]),
            mode: 'markers',
            type: 'scatter',
            marker: { color: '#136dec', size: 8, opacity: 0.7, line: { color: 'white', width: 0.5 } }
        }];
    }
    else if (type === 'line') {
        data = [{
            x: STATE.data.map(r => r[catCol]),
            y: STATE.data.map(r => r[numCol]),
            mode: 'lines+markers',
            type: 'scatter',
            line: { color: '#136dec', width: 3 },
            marker: { color: '#111418', line: { color: '#136dec', width: 2 }, size: 6 }
        }];
    }
    else if (type === 'bar') {
        const map = {};
        STATE.data.forEach(r => {
            const key = r[catCol];
            const val = Number(String(r[numCol]).replace(/,/g, '')) || 0;
            map[key] = (map[key] || 0) + val;
        });
        data = [{
            x: Object.keys(map),
            y: Object.values(map),
            type: 'bar',
            marker: { color: '#136dec' }
        }];
    }
    else if (type === 'correlation') {
        const numerics = STATE.columns.filter(c => STATE.types[c] === 'Number');
        const z = [];
        numerics.forEach(y => {
            const row = [];
            numerics.forEach(x => {
                const yVals = cleanNumeric(STATE.data.map(r => r[y]));
                const xVals = cleanNumeric(STATE.data.map(r => r[x]));
                row.push(calculateCorrelation(xVals, yVals));
            });
            z.push(row);
        });

        data = [{
            z: z,
            x: numerics,
            y: numerics,
            type: 'heatmap',
            colorscale: 'Viridis'
        }];
    }

    Plotly.newPlot('chart', data, layout, { responsive: true });

    if (type === 'correlation') {
        document.getElementById('chart').on('plotly_click', data => {
            const xVar = data.points[0].x;
            const yVar = data.points[0].y;
            document.getElementById('chart-type').value = 'scatter';
            document.getElementById('num-col').value = yVar;
            document.getElementById('cat-col').value = xVar;
            renderDashboard();
        });
    }
}

function calculateCorrelation(x, y) {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return denominator === 0 ? 0 : numerator / denominator;
}
