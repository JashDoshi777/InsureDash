// ==========================================
// INSURANCE DASHBOARD - MAIN JAVASCRIPT
// ==========================================

// Load SheetJS library dynamically
const sheetJsScript = document.createElement('script');
sheetJsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
document.head.appendChild(sheetJsScript);

// ==========================================
// GLOBAL STATE
// ==========================================
let dashboardData = [];
let selectedFile = null;

const scrollers = {
    1: { interval: null, speed: 1, direction: 1, pixelsPerFrame: 1, pauseTimeout: null, accumulator: 0 },
    2: { interval: null, speed: 1, direction: 1, pixelsPerFrame: 1, pauseTimeout: null, accumulator: 0 },
    3: { interval: null, speed: 1, direction: 1, pixelsPerFrame: 1, pauseTimeout: null, accumulator: 0 }
};

const speedConfigs = [
    { multiplier: 0.5, label: '0.5x', pixels: 0.5 },
    { multiplier: 1, label: '1x', pixels: 1 },
    { multiplier: 1.5, label: '1.5x', pixels: 1.5 },
    { multiplier: 2, label: '2x', pixels: 2 }
];

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initUploadModal();
    initScrollReveal();
});

// ==========================================
// NAVIGATION
// ==========================================
function initNavigation() {
    const nav = document.querySelector('.nav');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==========================================
// UPLOAD MODAL
// ==========================================
function initUploadModal() {
    const uploadZone = document.getElementById('uploadZone');

    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }
}

function openModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.add('active');
    resetModal();
}

function closeModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.remove('active');
}

function resetModal() {
    selectedFile = null;
    const fileInput = document.getElementById('fileInput');
    const fileSelected = document.getElementById('fileSelected');
    const uploadBtn = document.getElementById('uploadBtn');
    const statusMsg = document.getElementById('statusMsg');

    if (fileInput) fileInput.value = '';
    if (fileSelected) fileSelected.classList.remove('active');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = '🚀 Load Dashboard';
    }
    if (statusMsg) statusMsg.className = 'status-msg';
}

function handleFileSelect(event) {
    if (event.target.files[0]) {
        handleFile(event.target.files[0]);
    }
}

function handleFile(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const validExts = ['.csv', '.xlsx', '.xls'];

    if (!validExts.includes(ext)) {
        showStatus('Please select a CSV or Excel file (.csv, .xlsx, .xls)', 'error');
        return;
    }

    selectedFile = file;

    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileSelected').classList.add('active');
    document.getElementById('uploadBtn').disabled = false;
    document.getElementById('statusMsg').className = 'status-msg';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showStatus(message, type) {
    const statusMsg = document.getElementById('statusMsg');
    statusMsg.textContent = message;
    statusMsg.className = 'status-msg ' + type;
}

// ==========================================
// INDEXEDDB FOR LARGE DATA STORAGE
// ==========================================
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('InsureAnalyticsDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('data')) {
                db.createObjectStore('data');
            }
        };
    });
}

async function saveToIndexedDB(data) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('data', 'readwrite');
        const store = tx.objectStore('data');
        store.put(data, 'dashboardData');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ==========================================
// FILE PROCESSING
// ==========================================
function processFile() {
    if (!selectedFile) return;

    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = '⏳ Processing...';

    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const workbook = XLSX.read(e.target.result, {
                type: selectedFile.name.endsWith('.csv') ? 'string' : 'array'
            });

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            // Filter valid rows
            dashboardData = jsonData.filter(record =>
                record['Client Name'] || record['Net Premium'] || record['Policy No']
            );

            showStatus(`✓ ${dashboardData.length} records loaded!`, 'success');
            uploadBtn.textContent = '✓ Success!';

            // Store data in IndexedDB and redirect to dashboard.html
            await saveToIndexedDB(dashboardData);

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);

        } catch (error) {
            console.error('Error:', error);
            showStatus('Error: ' + error.message, 'error');
            uploadBtn.textContent = '🚀 Load Dashboard';
            uploadBtn.disabled = false;
        }
    };

    reader.onerror = () => {
        showStatus('Error reading file', 'error');
        uploadBtn.textContent = '🚀 Load Dashboard';
        uploadBtn.disabled = false;
    };

    if (selectedFile.name.endsWith('.csv')) {
        reader.readAsText(selectedFile);
    } else {
        reader.readAsArrayBuffer(selectedFile);
    }
}

// ==========================================
// DASHBOARD
// ==========================================
function showDashboard() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('dashboard').classList.add('active');

    const analytics = getAnalytics();
    updateMetrics(analytics.metrics);
    renderRenewals(analytics.renewals);
    renderSalesTargets(analytics.salesTargets);
    startAllScrollers();
}

function getAnalytics() {
    const data = dashboardData;

    const totalPremium = data.reduce((sum, r) => sum + (parseFloat(r['Net Premium']) || 0), 0);
    const grossPremium = data.reduce((sum, r) => sum + (parseFloat(r['Gross Premium']) || 0), 0);
    const totalPolicies = data.length;
    const avgPremium = totalPolicies > 0 ? totalPremium / totalPolicies : 0;

    return {
        metrics: { totalPremium, grossPremium, totalPolicies, avgPremium },
        renewals: getUpcomingRenewals(data),
        salesTargets: getSalesTargets(data)
    };
}

function getUpcomingRenewals(data) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const months = [
        { month: currentMonth, year: currentYear, name: getMonthName(currentMonth) },
        {
            month: (currentMonth + 1) % 12,
            year: currentMonth + 1 > 11 ? currentYear + 1 : currentYear,
            name: getMonthName(currentMonth + 1)
        }
    ];

    return months.map(m => {
        const monthStart = new Date(m.year, m.month, 1);
        const monthEnd = new Date(m.year, m.month + 1, 0);

        const items = data
            .filter(r => {
                const date = parseDate(r['Policy End Date']) || parseDate(r['Next Premium Date']);
                return date && date >= monthStart && date <= monthEnd;
            })
            .map(r => ({
                client: r['Client Name'] || 'Unknown',
                date: formatDate(parseDate(r['Policy End Date']) || parseDate(r['Next Premium Date'])),
                premium: parseFloat(r['Net Premium']) || 0,
                policy: r['Policy Name'] || r['Policy No'] || 'N/A'
            }))
            .sort((a, b) => b.premium - a.premium);

        return { month: m.name, items };
    });
}

function getSalesTargets(data) {
    const targets = new Set();
    data.forEach(r => {
        if (r['Sales Target']?.toString().trim()) {
            targets.add(r['Sales Target'].toString().trim());
        }
    });
    return Array.from(targets).sort();
}

function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;

    // Handle Excel serial date numbers
    if (typeof value === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + value * 86400000);
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date) {
    if (!date) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getMonthName(index) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[index % 12];
}

// ==========================================
// UI UPDATES
// ==========================================
function updateMetrics(metrics) {
    animateCounter('metricPremium', metrics.totalPremium, '₹');
    animateCounter('metricPolicies', metrics.totalPolicies);
    animateCounter('metricGross', metrics.grossPremium, '₹');
    animateCounter('metricAvg', metrics.avgPremium, '₹');
}

function animateCounter(id, value, prefix = '') {
    const element = document.getElementById(id);
    if (!element) return;

    const duration = 1500;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

        const current = start + (value - start) * easeProgress;
        element.textContent = prefix + current.toLocaleString('en-IN', { maximumFractionDigits: 0 });

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function renderRenewals(renewals) {
    if (!renewals) return;

    const containers = ['renewals1', 'renewals2'];
    const titles = ['title1', 'title2'];
    const badges = ['badge1', 'badge2'];

    containers.forEach((containerId, idx) => {
        const container = document.getElementById(containerId);
        const monthData = renewals[idx] || {};
        const items = monthData.items || [];

        document.getElementById(titles[idx]).textContent = `${monthData.month || 'Month'} Renewals`;
        document.getElementById(badges[idx]).textContent = items.length;

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state">No renewals this month</div>';
        } else {
            container.innerHTML = items.map(item => `
        <div class="dc-item">
          <div class="dc-client">${item.client}</div>
          <div class="dc-row">
            <div class="dc-date">📅 ${item.date}</div>
            <div class="dc-amount">₹${(item.premium || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
          <div class="dc-policy">Policy: ${item.policy}</div>
        </div>
      `).join('');
        }
    });
}

function renderSalesTargets(targets) {
    const container = document.getElementById('renewals3');
    document.getElementById('badge3').textContent = targets?.length || 0;

    if (!targets?.length) {
        container.innerHTML = '<div class="empty-state">No sales targets found</div>';
    } else {
        container.innerHTML = targets.map(target => `
      <div class="st-item">
        <div class="st-name">${target}</div>
      </div>
    `).join('');
    }
}

// ==========================================
// AUTO-SCROLL
// ==========================================
function startAllScrollers() {
    for (let i = 1; i <= 3; i++) {
        startScroller(i);
    }
}

function startScroller(num) {
    const container = document.getElementById('renewals' + num);
    if (!container) return;

    stopScroller(num);

    if (container.scrollHeight <= container.clientHeight) return;

    const scroller = scrollers[num];
    scroller.accumulator = 0;

    scroller.interval = setInterval(() => {
        const maxScroll = container.scrollHeight - container.clientHeight;

        if (maxScroll <= 0) {
            stopScroller(num);
            return;
        }

        scroller.accumulator += scroller.pixelsPerFrame;

        if (Math.abs(scroller.accumulator) >= 1) {
            const pixels = Math.floor(scroller.accumulator);
            scroller.accumulator -= pixels;

            if (scroller.direction === 1) {
                container.scrollTop += pixels;
                if (container.scrollTop >= maxScroll - 2) {
                    container.scrollTop = maxScroll;
                    scroller.direction = -1;
                    scroller.accumulator = 0;
                    clearInterval(scroller.interval);
                    scroller.pauseTimeout = setTimeout(() => startScroller(num), 800);
                }
            } else {
                container.scrollTop -= pixels;
                if (container.scrollTop <= 2) {
                    container.scrollTop = 0;
                    scroller.direction = 1;
                    scroller.accumulator = 0;
                    clearInterval(scroller.interval);
                    scroller.pauseTimeout = setTimeout(() => startScroller(num), 800);
                }
            }
        }
    }, 30);
}

function stopScroller(num) {
    const scroller = scrollers[num];
    if (scroller.interval) {
        clearInterval(scroller.interval);
        scroller.interval = null;
    }
    if (scroller.pauseTimeout) {
        clearTimeout(scroller.pauseTimeout);
        scroller.pauseTimeout = null;
    }
}

function cycleSpeed(num) {
    const scroller = scrollers[num];
    const currentIndex = speedConfigs.findIndex(c => c.multiplier === scroller.speed);
    const nextConfig = speedConfigs[(currentIndex + 1) % speedConfigs.length];

    scroller.speed = nextConfig.multiplier;
    scroller.pixelsPerFrame = nextConfig.pixels;
    scroller.accumulator = 0;

    document.getElementById('speedText' + num).textContent = nextConfig.label;
    document.getElementById('speedIcon' + num).textContent =
        nextConfig.multiplier <= 0.5 ? '🐌' :
            nextConfig.multiplier === 1 ? '⚡' :
                nextConfig.multiplier === 1.5 ? '⚡⚡' : '🚀';

    stopScroller(num);
    startScroller(num);
}

// ==========================================
// SCROLL REVEAL ANIMATIONS
// ==========================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll('[data-reveal]');

    if (revealElements.length === 0) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Optionally unobserve after revealing for performance
                // revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Also add smooth parallax effect on scroll
    initParallax();
}

function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    if (parallaxElements.length === 0) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        parallaxElements.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            const offset = scrollY * speed;
            el.style.transform = `translateY(${offset}px)`;
        });
    }, { passive: true });
}

// ==========================================
// CLEANUP
// ==========================================
window.addEventListener('beforeunload', () => {
    for (let i = 1; i <= 3; i++) {
        stopScroller(i);
    }
});
