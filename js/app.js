/**
 * Vardiya Programı - Main Application
 * Employee Shift & Overtime Tracking PWA
 * 
 * @author Zeki Akgül
 * @version 1.0.0
 * @license MIT
 * 
 * Architecture:
 * - IndexedDB for persistent storage
 * - Service Worker for offline support
 * - Modular functions for maintainability
 */

// ===========================================
// CONFIGURATION & STATE
// ===========================================

const CONFIG = {
    DB_NAME: 'VardiyaDB2',
    DB_VERSION: 1,
    DEFAULT_SHIFT: { start: '07:00', end: '18:00' },
    MAX_MESAI_HOURS: 12,
    SAVE_TOAST_DURATION: 1500
};

// Application State
const state = {
    employees: [],      // [{id: number, name: string}]
    records: {},        // {"YYYY-MM-DD": {empId: {start, end, mesai, off}}}
    currentDate: new Date(),
    currentPage: 'puantaj',
    saveTimeout: null,
    dirtyEmployees: new Set(),
    savedFlash: new Set(),
    deferredPrompt: null
};

const DEFAULT_RECORD = { start: '', end: '', mesai: 0, off: false };

// ===========================================
// DATABASE OPERATIONS
// ===========================================

/**
 * Open IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('data')) {
                db.createObjectStore('data', { keyPath: 'id' });
            }
        };
    });
}

/**
 * Save all data to IndexedDB
 */
async function saveData() {
    try {
        const db = await openDB();
        const tx = db.transaction('data', 'readwrite');
        const store = tx.objectStore('data');
        
        store.put({ id: 'employees', data: state.employees });
        store.put({ id: 'records', data: state.records });

        showSaveToast();
    } catch (error) {
        console.error('Save error:', error);
    }
}

/**
 * Load data from IndexedDB
 */
async function loadData() {
    try {
        const db = await openDB();
        const tx = db.transaction('data', 'readonly');
        const store = tx.objectStore('data');

        const empReq = store.get('employees');
        const recReq = store.get('records');

        return new Promise(resolve => {
            tx.oncomplete = () => {
                state.employees = empReq.result?.data || [];
                state.records = recReq.result?.data || {};
                resolve();
            };
            tx.onerror = () => resolve();
        });
    } catch (error) {
        console.error('Load error:', error);
    }
}

// ===========================================
// DATE UTILITIES
// ===========================================

/**
 * Format date as ISO string (YYYY-MM-DD)
 * @param {Date} date 
 * @returns {string}
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Format date in Turkish locale
 * @param {Date} date 
 * @returns {string}
 */
function formatDateTR(date) {
    return date.toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}

/**
 * Calculate hours between two time strings
 * @param {string} start - HH:MM format
 * @param {string} end - HH:MM format
 * @returns {number} Hours worked
 */
function calcHours(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}

// ===========================================
// UI UTILITIES
// ===========================================

/**
 * Show save status toast notification
 */
function showSaveToast() {
    const status = document.getElementById('saveStatus');
    status.classList.add('show');
    
    clearTimeout(state.saveTimeout);
    state.saveTimeout = setTimeout(() => {
        status.classList.remove('show');
    }, CONFIG.SAVE_TOAST_DURATION);
}

/**
 * Change current date by delta days
 * @param {number} delta - Days to add/subtract
 */
function changeDate(delta) {
    state.currentDate.setDate(state.currentDate.getDate() + delta);
    renderPuantaj(true);
}

/**
 * Switch between pages
 * @param {string} page - Page identifier (puantaj|employees|report)
 */
function showPage(page) {
    state.currentPage = page;
    
    // Update page visibility
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(page + 'Page').classList.add('active');
    document.querySelector(`.tab[onclick="showPage('${page}')"]`).classList.add('active');
    
    // Hide floating button on non-employee pages
    document.getElementById('addBtn').style.display = 'none';
    
    // Render appropriate page
    if (page === 'puantaj') renderPuantaj();
    else if (page === 'employees') renderEmployees();
    else if (page === 'report') renderReport();
}

// ===========================================
// EMPLOYEE MANAGEMENT
// ===========================================

/**
 * Add a new employee
 */
function addEmployee() {
    const id = Date.now();
    state.employees.push({ id, name: '' });
    state.dirtyEmployees.add(id);

    // Initialize with default shift for today
    const dateKey = formatDate(state.currentDate);
    if (!state.records[dateKey]) state.records[dateKey] = {};
    state.records[dateKey][id] = { 
        start: CONFIG.DEFAULT_SHIFT.start, 
        end: CONFIG.DEFAULT_SHIFT.end, 
        mesai: 0, 
        off: false 
    };

    renderEmployees();
    saveData();

    // Focus on the new input
    setTimeout(() => {
        const input = document.querySelector(`[data-emp-id="${id}"] .employee-input`);
        if (input) input.focus();
    }, 100);
}

/**
 * Delete an employee
 * @param {number} id - Employee ID
 */
function deleteEmployee(id) {
    if (confirm('Bu çalışanı silmek istediğinize emin misiniz?')) {
        state.employees = state.employees.filter(e => e.id !== id);
        renderEmployees();
        saveData();
    }
}

/**
 * Update employee name
 * @param {number} id - Employee ID
 * @param {string} name - New name
 */
function updateEmployeeName(id, name) {
    const emp = state.employees.find(e => e.id === id);
    if (emp) {
        emp.name = name;
        state.dirtyEmployees.delete(id);
        state.savedFlash.add(id);
        saveData();
        renderEmployees();
        
        setTimeout(() => {
            state.savedFlash.delete(id);
            renderEmployees();
        }, 1800);
    }
}

/**
 * Save employee name from input
 * @param {number} id - Employee ID
 */
function saveEmployeeName(id) {
    const input = document.querySelector(`[data-emp-id="${id}"] .employee-input`);
    if (!input) return;
    updateEmployeeName(id, input.value.trim());
    input.blur();
}

/**
 * Mark employee as having unsaved changes
 * @param {number} id - Employee ID
 */
function markDirty(id) {
    state.dirtyEmployees.add(id);
}

/**
 * Start editing an employee
 * @param {number} id - Employee ID
 */
function startEdit(id) {
    state.dirtyEmployees.add(id);
    renderEmployees();
    setTimeout(() => {
        const input = document.querySelector(`[data-emp-id="${id}"] .employee-input`);
        if (input) input.focus();
    }, 30);
}

// ===========================================
// RECORD MANAGEMENT (Puantaj)
// ===========================================

/**
 * Ensure a record exists for a given date and employee
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @param {number} empId - Employee ID
 */
function ensureDayRecord(dateKey, empId) {
    if (!state.records[dateKey]) state.records[dateKey] = {};
    if (!state.records[dateKey][empId]) {
        state.records[dateKey][empId] = { ...DEFAULT_RECORD };
    }
}

/**
 * Update a specific field in an employee's record
 * @param {number} empId - Employee ID
 * @param {string} field - Field name (start|end|mesai|off)
 * @param {*} value - New value
 */
function updateRecord(empId, field, value) {
    const dateKey = formatDate(state.currentDate);
    ensureDayRecord(dateKey, empId);

    if (field === 'off') {
        state.records[dateKey][empId].off = value;
    } else if (field === 'mesai') {
        state.records[dateKey][empId].mesai = Math.max(0, Math.min(CONFIG.MAX_MESAI_HOURS, parseInt(value) || 0));
    } else {
        state.records[dateKey][empId][field] = value;
    }

    renderPuantaj();
    saveData();
}

// ===========================================
// BULK OPERATIONS
// ===========================================

/**
 * Set default shift for all employees
 */
function setAllDefaultShift() {
    const dateKey = formatDate(state.currentDate);
    const namedEmployees = state.employees.filter(e => e.name.trim());
    
    if (!state.records[dateKey]) state.records[dateKey] = {};
    
    namedEmployees.forEach(emp => {
        state.records[dateKey][emp.id] = { 
            start: CONFIG.DEFAULT_SHIFT.start, 
            end: CONFIG.DEFAULT_SHIFT.end, 
            mesai: 0, 
            off: false 
        };
    });
    
    renderPuantaj();
    saveData();
}

/**
 * Add overtime hours to all employees
 * @param {number} hours - Overtime hours to add
 */
function setAllMesai(hours = 2) {
    const dateKey = formatDate(state.currentDate);
    const namedEmployees = state.employees.filter(e => e.name.trim());
    
    if (!state.records[dateKey]) state.records[dateKey] = {};
    
    namedEmployees.forEach(emp => {
        const existing = state.records[dateKey][emp.id] || { ...DEFAULT_RECORD };
        state.records[dateKey][emp.id] = {
            start: existing.start || CONFIG.DEFAULT_SHIFT.start,
            end: existing.end || CONFIG.DEFAULT_SHIFT.end,
            mesai: Math.max(0, hours),
            off: false
        };
    });
    
    renderPuantaj();
    saveData();
}

/**
 * Mark all employees as off for the day
 */
function setAllOff() {
    const dateKey = formatDate(state.currentDate);
    const namedEmployees = state.employees.filter(e => e.name.trim());
    
    if (!state.records[dateKey]) state.records[dateKey] = {};
    
    namedEmployees.forEach(emp => {
        state.records[dateKey][emp.id] = { start: '', end: '', mesai: 0, off: true };
    });
    
    renderPuantaj();
    saveData();
}

/**
 * Copy yesterday's records to today
 */
function copyYesterday() {
    const prev = new Date(state.currentDate);
    prev.setDate(prev.getDate() - 1);
    const prevKey = formatDate(prev);
    const todayKey = formatDate(state.currentDate);
    const namedEmployees = state.employees.filter(e => e.name.trim());

    if (!state.records[prevKey]) {
        alert('Dün için kayıt yok.');
        return;
    }

    if (!state.records[todayKey]) state.records[todayKey] = {};

    namedEmployees.forEach(emp => {
        const rec = state.records[prevKey][emp.id];
        if (rec) {
            state.records[todayKey][emp.id] = { ...rec };
        }
    });

    renderPuantaj();
    saveData();
}

// ===========================================
// RENDERING FUNCTIONS
// ===========================================

/**
 * Render the Puantaj (timesheet) page
 */
function renderPuantaj() {
    const dateKey = formatDate(state.currentDate);
    const today = formatDate(new Date());

    // Update date display
    const isToday = dateKey === today;
    document.getElementById('currentDay').textContent = isToday ? 'Bugün' : '';
    document.getElementById('currentDate').textContent = formatDateTR(state.currentDate);

    const container = document.getElementById('puantajList');
    const namedEmployees = state.employees.filter(e => e.name.trim());

    // Show empty state if no employees
    if (namedEmployees.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">👥</div>
                <p>Önce "Çalışanlar" sekmesinden<br>çalışan ekleyin</p>
            </div>`;
        updateSummary([]);
        return;
    }

    const dayRecords = state.records[dateKey] || {};

    // Render employee cards
    container.innerHTML = namedEmployees.map(emp => {
        const rec = dayRecords[emp.id] || { ...DEFAULT_RECORD };
        const isOff = rec.off;
        const hasMesai = rec.mesai > 0;

        let cardClass = 'puantaj-card';
        if (isOff) cardClass += ' off';
        else if (hasMesai) cardClass += ' mesai';
        else cardClass += ' worked';

        const baseHours = (rec.start && rec.end) ? calcHours(rec.start, rec.end) : 0;
        const hours = isOff ? 0 : baseHours + (rec.mesai || 0);

        return `
            <div class="${cardClass}">
                <div class="emp-info">
                    <div class="emp-name">${emp.name}</div>
                    <div class="emp-hours">
                        ${isOff ? 'İzinli' : hours.toFixed(1) + ' saat'} 
                        ${hasMesai ? `<span class="mesai-badge">+${rec.mesai} mesai</span>` : ''}
                    </div>
                </div>
                <div class="puantaj-inputs">
                    <input type="time" class="time-input" value="${rec.start}" 
                        placeholder="Giriş" ${isOff ? 'disabled' : ''}
                        onchange="updateRecord(${emp.id}, 'start', this.value)">
                    <input type="time" class="time-input" value="${rec.end}" 
                        placeholder="Çıkış" ${isOff ? 'disabled' : ''}
                        onchange="updateRecord(${emp.id}, 'end', this.value)">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="mesai-chip">Mesai</span>
                        <input type="number" class="mesai-input" value="${rec.mesai}" 
                            min="0" max="${CONFIG.MAX_MESAI_HOURS}"
                            placeholder="Saat" ${isOff ? 'disabled' : ''}
                            onchange="updateRecord(${emp.id}, 'mesai', this.value)">
                    </div>
                    <button class="off-btn ${isOff ? 'active' : ''}" 
                        onclick="updateRecord(${emp.id}, 'off', ${!isOff})">
                        ${isOff ? '✓ İzin' : 'İzin'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Update summary with current data
    updateSummary(namedEmployees.map(emp => ({
        ...emp,
        ...(dayRecords[emp.id] || { ...DEFAULT_RECORD })
    })));
}

/**
 * Update the summary statistics display
 * @param {Array} data - Array of employee records for the day
 */
function updateSummary(data) {
    const working = data.filter(d => !d.off);
    const mesaiOnes = working.filter(d => d.mesai > 0);

    let totalHours = 0;
    working.forEach(d => {
        const base = (d.start && d.end) ? calcHours(d.start, d.end) : 0;
        totalHours += base + (d.mesai || 0);
    });

    document.getElementById('workingCount').textContent = working.length;
    document.getElementById('mesaiCount').textContent = mesaiOnes.length;
    document.getElementById('totalHours').textContent = totalHours.toFixed(1);

    // Render overtime summary
    const mesaiSummary = document.getElementById('mesaiSummary');
    const mesaiList = document.getElementById('mesaiList');

    if (mesaiOnes.length > 0) {
        mesaiSummary.style.display = 'block';
        mesaiList.innerHTML = mesaiOnes.map(d => `
            <div class="mesai-person">
                <span>${d.name}</span>
                <span class="hours">${d.mesai} saat</span>
            </div>
        `).join('');
    } else {
        mesaiSummary.style.display = 'none';
    }
}

/**
 * Render the Employees management page
 */
function renderEmployees() {
    const container = document.getElementById('employeeSection');

    if (state.employees.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">👥</div>
                <p>Henüz çalışan yok<br><small>+ ile ekleyin</small></p>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="section-title">Toplam ${state.employees.length} çalışan</div>
        ${state.employees.map((emp, i) => `
            <div class="employee-item" data-emp-id="${emp.id}">
                <div class="employee-num">${i + 1}</div>
                <input type="text" class="employee-input" value="${emp.name}" 
                    placeholder="İsim girin..." oninput="markDirty(${emp.id})">
                ${state.dirtyEmployees.has(emp.id) ? `
                    <button class="save-btn" onclick="saveEmployeeName(${emp.id})">Kaydet</button>
                ` : state.savedFlash.has(emp.id) ? `
                    <span class="status-badge">Kaydedildi</span>
                    <button class="edit-btn" onclick="startEdit(${emp.id})">Düzenle</button>
                ` : `
                    <button class="edit-btn" onclick="startEdit(${emp.id})">Düzenle</button>
                `}
                <button class="delete-btn" onclick="deleteEmployee(${emp.id})">🗑️</button>
            </div>
        `).join('')}
    `;
}

/**
 * Render the Report page
 */
function renderReport() {
    const container = document.getElementById('reportSection');
    const namedEmployees = state.employees.filter(e => e.name.trim());

    if (namedEmployees.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📊</div>
                <p>Henüz veri yok</p>
            </div>`;
        return;
    }

    // Collect this month's data
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const monthlyData = namedEmployees.map(emp => {
        let totalHours = 0;
        let totalMesai = 0;
        let workDays = 0;
        const daily = [];

        Object.keys(state.records).forEach(dateKey => {
            const date = new Date(dateKey);
            if (date.getFullYear() === year && date.getMonth() === month) {
                const rec = state.records[dateKey]?.[emp.id];
                if (rec) {
                    const base = (rec.start && rec.end && !rec.off) ? calcHours(rec.start, rec.end) : 0;
                    const mesai = rec.off ? 0 : (rec.mesai || 0);
                    const dayHours = rec.off ? 0 : base + mesai;
                    if (!rec.off && (rec.start || rec.end || mesai > 0)) workDays++;
                    totalHours += dayHours;
                    totalMesai += mesai;
                    daily.push({
                        dateKey,
                        dateText: date.toLocaleDateString('tr-TR', { 
                            day: 'numeric', 
                            month: 'long', 
                            weekday: 'short' 
                        }),
                        off: rec.off,
                        base: base,
                        mesai: mesai,
                        total: dayHours
                    });
                }
            }
        });

        daily.sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));

        return { name: emp.name, workDays, totalHours, totalMesai, daily };
    });

    const monthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    container.innerHTML = `
        <div class="section-title">${monthName}</div>
        ${monthlyData.map((d, idx) => `
            <div class="report-item" onclick="toggleReportDetail(${idx})">
                <div class="report-header">
                    <div>
                        <div class="emp-name">${d.name}</div>
                        <div class="emp-hours">${d.workDays} gün çalıştı</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:700;color:#2563eb">${d.totalHours.toFixed(1)} saat</div>
                        ${d.totalMesai > 0 ? `<div style="font-size:0.75rem;color:#10b981">+${d.totalMesai} mesai</div>` : ''}
                    </div>
                </div>
                <div class="report-detail" id="reportDetail-${idx}">
                    ${d.daily.length === 0 ? '<div class="report-row">Kayıt yok</div>' : d.daily.map(r => `
                        <div class="report-row">
                            <span>${r.dateText}</span>
                            <span>${r.off ? 'İzinli' : `${r.total.toFixed(1)} saat${r.mesai > 0 ? ' (+' + r.mesai + ' mesai)' : ''}`}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    `;

    // Store for PDF export
    window.__monthlyData = monthlyData;
}

/**
 * Toggle report detail visibility
 * @param {number} idx - Report index
 */
function toggleReportDetail(idx) {
    const el = document.getElementById('reportDetail-' + idx);
    if (el) el.classList.toggle('show');
}

// ===========================================
// PDF EXPORT
// ===========================================

/**
 * Get report data for export
 * @returns {Array} Monthly data
 */
function ensureReportData() {
    if (!window.__monthlyData) renderReport();
    return window.__monthlyData || [];
}

/**
 * Export monthly report as printable PDF
 */
function exportReportPDF() {
    const data = ensureReportData();
    const now = new Date();
    const monthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    const popup = window.open('', '_blank');
    if (!popup) {
        alert('Açılır pencere engellendi. Lütfen bu site için açılır pencere izni verin.');
        return;
    }

    const style = `
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 10px; }
            .meta { color: #475569; margin-bottom: 12px; }
            .emp-block { margin-bottom: 18px; }
            .emp-summary { font-weight: 700; margin-bottom: 6px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 12px; text-align: left; }
            th { background: #f8fafc; }
            tr:nth-child(even) { background: #f8fafc; }
            .no-data { color: #94a3b8; font-size: 12px; margin-top: 4px; }
        </style>
    `;

    const content = [
        `<h1>${monthName} Detaylı Rapor</h1>`,
        `<div class="meta">İndirilen tarih: ${new Date().toLocaleString('tr-TR')}</div>`
    ];

    if (data.length === 0) {
        content.push('<div>Bu ay için kayıt yok.</div>');
    } else {
        data.forEach(d => {
            content.push(`
                <div class="emp-block">
                    <div class="emp-summary">
                        ${d.name} — ${d.totalHours.toFixed(1)} saat 
                        ${d.totalMesai > 0 ? '(+' + d.totalMesai + ' mesai)' : ''} — ${d.workDays} gün
                    </div>
                    ${d.daily.length === 0 ? '<div class="no-data">Kayıt yok</div>' : `
                        <table>
                            <thead>
                                <tr><th>Tarih</th><th>Durum</th><th>Saat</th></tr>
                            </thead>
                            <tbody>
                                ${d.daily.map(r => `
                                    <tr>
                                        <td>${r.dateText}</td>
                                        <td>${r.off ? 'İzinli' : 'Çalıştı'}</td>
                                        <td>${r.off ? '-' : `${r.total.toFixed(1)} saat${r.mesai > 0 ? ' (+' + r.mesai + ')' : ''}`}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            `);
        });
    }

    popup.document.write(`
        <html>
            <head><title>${monthName} Rapor</title>${style}</head>
            <body>${content.join('')}</body>
        </html>
    `);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 300);
}

// ===========================================
// PWA INSTALLATION
// ===========================================

/**
 * Check if app is running in standalone mode
 * @returns {boolean}
 */
function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone;
}

/**
 * Show PWA install prompt
 */
function showInstallCTA() {
    if (isStandalone()) return;
    const cta = document.getElementById('installCta');
    if (cta) cta.style.display = 'flex';
}

/**
 * Hide PWA install prompt
 */
function hideInstallCTA() {
    const cta = document.getElementById('installCta');
    if (cta) cta.style.display = 'none';
}

/**
 * Trigger PWA installation
 */
async function installApp() {
    if (state.deferredPrompt) {
        state.deferredPrompt.prompt();
        const choice = await state.deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') hideInstallCTA();
        state.deferredPrompt = null;
    } else {
        alert('Eğer "Ana ekrana ekle" uyarısı çıkmazsa:\n\n- iPhone: Paylaş → Ana Ekrana Ekle\n- Android: Sağ üst ⋮ → Ana ekrana ekle');
    }
}

// ===========================================
// EVENT LISTENERS
// ===========================================

// PWA install prompt handler
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    showInstallCTA();
});

// Show install CTA after load
window.addEventListener('load', () => {
    if (!isStandalone()) {
        setTimeout(showInstallCTA, 1200);
    }
});

// ===========================================
// INITIALIZATION
// ===========================================

/**
 * Initialize the application
 */
async function init() {
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    }

    // Load persisted data
    await loadData();
    
    // Render initial view
    renderPuantaj();
    
    // Hide add button initially
    document.getElementById('addBtn').style.display = 'none';
}

// Start the app
init();
