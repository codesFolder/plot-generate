import { processData } from './api.js';
import { STATE } from './state.js';
import { renderDashboard } from './ui.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Insight: Initializing...");

    const modal = document.getElementById('modal');
    const btnSidebar = document.getElementById('btn-new-project');
    const btnCenter = document.getElementById('btn-create-project-center');
    const closeBtn = document.getElementById('close-modal');
    const fileInput = document.getElementById('file-input');
    const pasteArea = document.getElementById('paste');
    const loadBtn = document.getElementById('load');

    // Helper to open modal
    const openModal = () => {
        if (modal) {
            modal.classList.remove('hidden');
            console.log("Insight: Modal Opened");
        } else {
            console.error("Insight: Modal element not found!");
        }
    };

    // Helper to close modal
    const closeModal = () => {
        if (modal) {
            modal.classList.add('hidden');
            console.log("Insight: Modal Closed");
        }
    };

    // Attach Listeners
    if (btnSidebar) {
        btnSidebar.addEventListener('click', openModal);
    } else {
        console.warn("Insight: Sidebar button not found (might be mobile view)");
    }

    if (btnCenter) {
        btnCenter.addEventListener('click', openModal);
        console.log("Insight: Center button listener attached");
    } else {
        // Only warn if we expect it to be there (it is removed after data load)
        const emptyState = document.getElementById('btn-create-project-center');
        if (emptyState) console.warn("Insight: Center button found but listener failed?");
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // File Input Logic
    if (fileInput) {
        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;

            const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

            if (isExcel) {
                console.log("Insight: Excel file detected", file.name);
                const reader = new FileReader();
                reader.onload = (event) => {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetNames = workbook.SheetNames;

                    if (sheetNames.length === 0) {
                        alert("No sheets found in Excel file.");
                        return;
                    }

                    if (sheetNames.length === 1) {
                        // Single sheet: Auto-load
                        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetNames[0]]);
                        if (pasteArea) pasteArea.value = csv;
                    } else {
                        // Multiple sheets: Show Modal
                        showSheetModal(sheetNames, (selectedSheet) => {
                            const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[selectedSheet]);
                            if (pasteArea) pasteArea.value = csv;
                        });
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                // CSV Fallback
                console.log("Insight: CSV selected", file.name);
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (pasteArea) pasteArea.value = event.target.result;
                };
                reader.readAsText(file);
            }
        });
    }

    // Sheet Selection Helper
    function showSheetModal(sheets, callback) {
        const modal = document.getElementById('sheet-modal');
        const list = document.getElementById('sheet-list');
        const cancel = document.getElementById('cancel-sheet-btn');

        if (!modal || !list) return;

        list.innerHTML = '';
        sheets.forEach(sheet => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left px-4 py-3 bg-[#1c2530] border border-[#282f39] rounded-lg text-white hover:border-primary hover:bg-[#282f39] transition-all text-sm font-medium flex justify-between items-center group';
            btn.innerHTML = `<span>${sheet}</span> <span class="material-symbols-outlined text-gray-500 group-hover:text-primary text-[18px]">arrow_forward</span>`;

            btn.onclick = () => {
                modal.classList.add('hidden');
                callback(sheet);
            };
            list.appendChild(btn);
        });

        modal.classList.remove('hidden');

        if (cancel) {
            cancel.onclick = () => {
                modal.classList.add('hidden');
                document.getElementById('file-input').value = ''; // Reset input
            }
        }
    }

    // Load Data Logic
    if (loadBtn) {
        loadBtn.addEventListener('click', async () => {
            const text = pasteArea ? pasteArea.value : '';
            if (!text || !text.trim()) {
                alert("Please paste data or upload a file first.");
                return;
            }

            loadBtn.innerText = "Processing...";

            try {
                const res = await processData(text);

                STATE.data = res.preview;
                STATE.columns = res.columns;
                STATE.summary = res.summary;

                closeModal();
                renderDashboard();
                loadBtn.innerText = "Load Dataset";
            } catch (err) {
                console.error("Insight: Process Error", err);
                alert("Error processing data. Check console.");
                loadBtn.innerText = "Load Dataset";
            }
        });
    }
});
