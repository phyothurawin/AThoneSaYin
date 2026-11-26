(function () {
  const STORAGE_KEY = 'athone_sayin_v1';

  const CATEGORIES = [
    { id: 'food', mm: 'အစားအသောက်/ဈေးဖိုး', en: 'Food & Groceries', icon: '🛒', color: '#10b981', essential: true, defaultCap: 250000 },
    { id: 'it', mm: 'အင်တာနက်/IT', en: 'Internet & IT', icon: '💻', color: '#3b82f6', essential: false, defaultCap: 80000 },
    { id: 'snacks', mm: 'မုန့်/အဆာပြေ', en: 'Snacks & Treats', icon: '🍩', color: '#f59e0b', essential: false, defaultCap: 60000 },
    { id: 'home', mm: 'အိမ်သုံး/ပြုပြင်ခ', en: 'Home & Maintenance', icon: '🏠', color: '#6366f1', essential: true, defaultCap: 100000 },
    { id: 'social', mm: 'လူမှုရေး/ကျန်းမာရေး', en: 'Social, Charity & Health', icon: '❤️', color: '#f43f5e', essential: true, defaultCap: 90000 },
    { id: 'clothing', mm: 'အဝတ်အထည်/အခြား', en: 'Clothing & Misc', icon: '👕', color: '#a855f7', essential: false, defaultCap: 70000 },
    { id: 'drinks', mm: 'ဘီယာ/အဖျော်ယမကာ', en: 'Beer & Drinks', icon: '🍺', color: '#f97316', essential: false, defaultCap: 50000 },
    { id: 'personal', mm: 'တစ်ကိုယ်ရေ/အလှကုန်', en: 'Personal Care', icon: '✨', color: '#ec4899', essential: false, defaultCap: 60000 },
    { id: 'transport', mm: 'ဆိုင်ကယ်ဆီ/ပြုပြင်ခ', en: 'Transport & Bike', icon: '🏍️', color: '#14b8a6', essential: true, defaultCap: 70000 }
  ];

  function getSampleData() {
    return {
      currency: 'Ks',
      monthlyBudget: 800000,
      categoryBudgets: Object.fromEntries(CATEGORIES.map(c => [c.id, c.defaultCap])),
      incomes: [
        { id: 'inc1', date: '2026-11-01', amount: 1000000, source: 'Monthly Salary (လစာ)' },
        { id: 'inc2', date: '2026-10-01', amount: 950000, source: 'Monthly Salary (လစာ)' },
        { id: 'inc3', date: '2026-09-01', amount: 950000, source: 'Monthly Salary (လစာ)' }
      ],
      expenses: [
        // Current month (2026-11)
        { id: 'e1', date: '2026-11-25', category: 'food', amount: 42000, note: 'Weekly groceries & rice' },
        { id: 'e2', date: '2026-11-24', category: 'drinks', amount: 38000, note: 'Weekend beer & hangout' },
        { id: 'e3', date: '2026-11-23', category: 'snacks', amount: 18500, note: 'Coffee & pastries' },
        { id: 'e4', date: '2026-11-21', category: 'it', amount: 95000, note: 'Fiber internet + USB-C hub' },
        { id: 'e5', date: '2026-11-19', category: 'transport', amount: 24000, note: 'Bike fuel & oil change' },
        { id: 'e6', date: '2026-11-18', category: 'food', amount: 65000, note: 'Market & meat' },
        { id: 'e7', date: '2026-11-15', category: 'clothing', amount: 85000, note: 'Casual shirts & shoes' },
        { id: 'e8', date: '2026-11-14', category: 'drinks', amount: 42000, note: 'Drinks with friends' },
        { id: 'e9', date: '2026-11-12', category: 'snacks', amount: 26000, note: 'Late night snacks' },
        { id: 'e10', date: '2026-11-10', category: 'personal', amount: 48000, note: 'Skincare & haircut' },
        { id: 'e11', date: '2026-11-08', category: 'home', amount: 55000, note: 'Water filter & bulbs' },
        { id: 'e12', date: '2026-11-05', category: 'social', amount: 50000, note: 'Donation & vitamins' },
        { id: 'e13', date: '2026-11-02', category: 'food', amount: 78000, note: 'Monthly staples' },
        // Previous month (2026-10)
        { id: 'p1', date: '2026-10-27', category: 'food', amount: 175000, note: 'October groceries' },
        { id: 'p2', date: '2026-10-22', category: 'drinks', amount: 45000, note: 'Beer & beverages' },
        { id: 'p3', date: '2026-10-18', category: 'snacks', amount: 30000, note: 'Snacks & tea' },
        { id: 'p4', date: '2026-10-15', category: 'it', amount: 45000, note: 'Internet bill' },
        { id: 'p5', date: '2026-10-12', category: 'home', amount: 40000, note: 'Home supplies' },
        { id: 'p6', date: '2026-10-10', category: 'social', amount: 60000, note: 'Charity & health' },
        { id: 'p7', date: '2026-10-08', category: 'clothing', amount: 45000, note: 'Misc items' },
        { id: 'p8', date: '2026-10-05', category: 'personal', amount: 35000, note: 'Toiletries' },
        { id: 'p9', date: '2026-10-03', category: 'transport', amount: 38000, note: 'Bike fuel' },
        // Earlier month (2026-09)
        { id: 's1', date: '2026-09-20', category: 'food', amount: 190000, note: 'September food' },
        { id: 's2', date: '2026-09-15', category: 'drinks', amount: 55000, note: 'Drinks' },
        { id: 's3', date: '2026-09-10', category: 'home', amount: 70000, note: 'Repairs' },
        { id: 's4', date: '2026-09-05', category: 'transport', amount: 42000, note: 'Bike maintenance' }
      ]
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.expenses)) {
          if (!Array.isArray(parsed.incomes)) parsed.incomes = [];
          return parsed;
        }
      }
    } catch (e) { /* ignore storage errors */ }
    return getSampleData();
  }

  function saveState() {
    if (ledgerSync.save(state)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore storage errors */ }
  }

  let state = loadState();
  let currentTab = 'log';
  let selectedMonth = '2026-11';
  let selectedCategory = 'food';
  let filterCategory = 'all';
  let isAddExpanded = true;
  let categoryChart = null;
  let trendChart = null;
  let pendingConfirmAction = null;

  // Helpers
  function newEntryId(prefix) {
    return prefix + '_' + (window.crypto?.randomUUID?.() || Date.now() + '_' + Math.random().toString(36).slice(2));
  }

  function escapeHtml(value) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
  }

  function formatMoney(val) {
    const num = Math.round(Number(val) || 0);
    const formatted = num.toLocaleString('en-US');
    if (state.currency === 'Ks') return `${formatted} Ks`;
    return `${state.currency}${formatted}`;
  }

  function formatMonthLabel(ym) {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function shiftMonth(ym, delta) {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    return `${ny}-${nm}`;
  }

  function getMonthExpenses(ym) {
    return state.expenses
      .filter(e => e.date && e.date.startsWith(ym))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function getMonthIncomes(ym) {
    return (state.incomes || [])
      .filter(i => i.date && i.date.startsWith(ym))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function getCategoryTotals(expenses) {
    const totals = Object.fromEntries(CATEGORIES.map(c => [c.id, 0]));
    for (const e of expenses) {
      if (Object.hasOwn(totals, e.category)) {
        totals[e.category] += Number(e.amount) || 0;
      }
    }
    return totals;
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  function openConfirm(title, message, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    pendingConfirmAction = onConfirm;
    document.getElementById('confirm-modal').classList.remove('hidden');
  }

  function closeConfirm() {
    pendingConfirmAction = null;
    document.getElementById('confirm-modal').classList.add('hidden');
  }

  // Render Functions
  function renderCategoryPicker() {
    const container = document.getElementById('category-picker');
    container.innerHTML = CATEGORIES.map(cat => {
      const active = cat.id === selectedCategory;
      return `
        <button type="button" data-cat-pick="${cat.id}"
          class="flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
            active
              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
              : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
          }">
          <span class="text-lg leading-none mb-1">${cat.icon}</span>
          <span class="text-[10px] font-semibold leading-tight line-clamp-2">${cat.mm}</span>
        </button>
      `;
    }).join('');
  }

  function renderSummary() {
    const monthExpenses = getMonthExpenses(selectedMonth);
    const monthIncomes = getMonthIncomes(selectedMonth);
    const total = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalIncome = monthIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const balance = totalIncome - total;
    const budget = Number(state.monthlyBudget) || 0;
    const pct = budget > 0 ? Math.round((total / budget) * 100) : 0;

    document.getElementById('current-month-label').textContent = formatMonthLabel(selectedMonth);
    document.getElementById('summary-total').textContent = formatMoney(total);
    document.getElementById('summary-income').textContent = formatMoney(totalIncome);
    const balEl = document.getElementById('summary-balance');
    balEl.textContent = (balance < 0 ? '-' : '') + formatMoney(Math.abs(balance));
    balEl.className = `font-semibold truncate block ${balance < 0 ? 'text-rose-200' : 'text-white'}`;
    document.getElementById('summary-budget-label').textContent = `Budget: ${formatMoney(budget)}`;
    document.getElementById('summary-percent-label').textContent = `${pct}%`;

    const bar = document.getElementById('summary-progress-bar');
    bar.style.width = `${Math.min(pct, 100)}%`;
    bar.className = `h-full rounded-full transition-all duration-300 ${
      pct > 100 ? 'bg-rose-300' : pct > 85 ? 'bg-amber-300' : 'bg-white'
    }`;

    const badge = document.getElementById('summary-status-badge');
    if (budget === 0) {
      badge.textContent = 'No Cap';
      badge.className = 'text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white';
    } else if (pct > 100) {
      badge.textContent = 'Over Budget';
      badge.className = 'text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500 text-white';
    } else if (pct > 85) {
      badge.textContent = 'Near Limit';
      badge.className = 'text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-400 text-slate-900';
    } else {
      badge.textContent = 'On Track';
      badge.className = 'text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white';
    }

    const [y, m] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    document.getElementById('summary-daily-avg').textContent = formatMoney(total / daysInMonth);

    const totals = getCategoryTotals(monthExpenses);
    let topCat = null;
    let topVal = 0;
    for (const c of CATEGORIES) {
      if (totals[c.id] > topVal) {
        topVal = totals[c.id];
        topCat = c;
      }
    }
    document.getElementById('summary-top-cat').textContent = topCat
      ? `${topCat.icon} ${topCat.mm}`
      : '—';
  }

  function renderFilterChips() {
    const container = document.getElementById('filter-chips');
    const chips = [{ id: 'all', label: 'All (အားလုံး)' }, { id: 'income', label: '💰 ဝင်ငွေ (Income)' }, ...CATEGORIES.map(c => ({ id: c.id, label: `${c.icon} ${c.mm}` }))];
    container.innerHTML = chips.map(ch => {
      const active = filterCategory === ch.id;
      return `
        <button type="button" data-filter="${ch.id}"
          class="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
            active
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }">
          ${ch.label}
        </button>
      `;
    }).join('');
  }

  function renderExpenseList() {
    const allMonthExp = getMonthExpenses(selectedMonth).map(e => ({ ...e, entryType: 'expense' }));
    const allMonthInc = getMonthIncomes(selectedMonth).map(i => ({ ...i, entryType: 'income' }));
    let filtered = [];
    if (filterCategory === 'all') {
      filtered = [...allMonthExp, ...allMonthInc].sort((a, b) => b.date.localeCompare(a.date));
    } else if (filterCategory === 'income') {
      filtered = allMonthInc;
    } else {
      filtered = allMonthExp.filter(e => e.category === filterCategory);
    }
    document.getElementById('entries-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`;

    const listEl = document.getElementById('expense-list');
    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
          <p class="text-sm font-medium">ယခုလအတွက် စာရင်းမရှိသေးပါ</p>
          <p class="text-xs mt-1">Add an expense or income above to start tracking.</p>
        </div>
      `;
      return;
    }

    const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
    listEl.innerHTML = filtered.map(item => {
      if (item.entryType === 'income') {
        return `
          <div class="bg-emerald-50/60 rounded-xl border border-emerald-200 px-3.5 py-3 flex items-center justify-between gap-3 shadow-2xs">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-emerald-100">
                💰
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-emerald-900 truncate">ဝင်ငွေ (Income)</p>
                <p class="text-[11px] text-emerald-700 truncate">${escapeHtml(item.source || 'Income')} • ${escapeHtml(item.date)}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-sm font-bold text-emerald-700">+${formatMoney(item.amount)}</span>
              <button type="button" data-delete-income-id="${escapeHtml(item.id)}" aria-label="Delete income" class="p-1.5 text-emerald-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        `;
      }
      const cat = Object.hasOwn(catMap, item.category) ? catMap[item.category] : CATEGORIES[0];
      return `
        <div class="bg-white rounded-xl border border-slate-200 px-3.5 py-3 flex items-center justify-between gap-3 shadow-2xs">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style="background-color: ${cat.color}18">
              ${cat.icon}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-slate-800 truncate">${cat.mm}</p>
              <p class="text-[11px] text-slate-500 truncate">${escapeHtml(item.note || cat.en)} • ${escapeHtml(item.date)}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-sm font-bold text-slate-900">${formatMoney(item.amount)}</span>
            <button type="button" data-delete-id="${escapeHtml(item.id)}" aria-label="Delete entry" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderAnalytics() {
    document.getElementById('analytics-month-name').textContent = formatMonthLabel(selectedMonth);
    const monthExpenses = getMonthExpenses(selectedMonth);
    const totals = getCategoryTotals(monthExpenses);
    const totalSum = Object.values(totals).reduce((a, b) => a + b, 0);

    // Category Doughnut Chart
    const nonZeroCats = CATEGORIES.filter(c => totals[c.id] > 0);
    const ctxCat = document.getElementById('chart-category').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: nonZeroCats.length ? nonZeroCats.map(c => c.mm) : ['No Data'],
        datasets: [{
          data: nonZeroCats.length ? nonZeroCats.map(c => totals[c.id]) : [1],
          backgroundColor: nonZeroCats.length ? nonZeroCats.map(c => c.color) : ['#e2e8f0'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => nonZeroCats.length ? `${ctx.label}: ${formatMoney(ctx.raw)}` : 'No expenses logged'
            }
          }
        }
      }
    });

    // 6-Month Trend Bar Chart
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(shiftMonth(selectedMonth, -i));
    }
    const monthTotals = months.map(ym =>
      getMonthExpenses(ym).reduce((s, e) => s + (Number(e.amount) || 0), 0)
    );
    const ctxTrend = document.getElementById('chart-trend').getContext('2d');
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(ctxTrend, {
      type: 'bar',
      data: {
        labels: months.map(formatMonthLabel),
        datasets: [{
          label: 'Total Spent',
          data: monthTotals,
          backgroundColor: months.map(m => m === selectedMonth ? '#059669' : '#94a3b8'),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => formatMoney(ctx.raw)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 10 } }
          },
          x: {
            ticks: { font: { size: 10 } }
          }
        }
      }
    });

    // Breakdown list
    const sortedCats = [...CATEGORIES].sort((a, b) => totals[b.id] - totals[a.id]);
    document.getElementById('category-breakdown-list').innerHTML = sortedCats.map(cat => {
      const spent = totals[cat.id];
      const cap = Number(state.categoryBudgets[cat.id]) || cat.defaultCap;
      const share = totalSum > 0 ? Math.round((spent / totalSum) * 100) : 0;
      const capPct = cap > 0 ? Math.round((spent / cap) * 100) : 0;
      const over = cap > 0 && spent > cap;
      return `
        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-semibold text-slate-800">${cat.icon} ${cat.mm}</span>
            <span class="font-bold ${over ? 'text-rose-600' : 'text-slate-900'}">${formatMoney(spent)} <span class="text-[10px] font-normal text-slate-400">(${share}%)</span></span>
          </div>
          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all" style="width: ${Math.min(capPct, 100)}%; background-color: ${over ? '#e11d48' : cat.color}"></div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>${cat.en}</span>
            <span>Cap: ${formatMoney(cap)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderReductionAdvisor() {
    const monthExpenses = getMonthExpenses(selectedMonth);
    const prevMonth = shiftMonth(selectedMonth, -1);
    const prevExpenses = getMonthExpenses(prevMonth);

    const currTotals = getCategoryTotals(monthExpenses);
    const prevTotals = getCategoryTotals(prevExpenses);
    const totalSpent = Object.values(currTotals).reduce((a, b) => a + b, 0);

    const suggestions = [];
    for (const cat of CATEGORIES) {
      const spent = currTotals[cat.id];
      if (spent <= 0) continue;
      const prev = prevTotals[cat.id];
      const cap = Number(state.categoryBudgets[cat.id]) || cat.defaultCap;
      const overCap = cap > 0 ? spent - cap : 0;
      const momDiff = prev > 0 ? spent - prev : 0;
      const momPct = prev > 0 ? Math.round((momDiff / prev) * 100) : 0;
      const sharePct = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;

      // Priority score: higher for non-essential, over-cap, or sharp MoM spike
      let score = 0;
      const reasons = [];
      if (!cat.essential) {
        score += 35;
        reasons.push('Discretionary spending (လျှော့ချနိုင်သော ကဏ္ဍ)');
      }
      if (overCap > 0) {
        score += 45 + Math.min(30, Math.round((overCap / cap) * 30));
        reasons.push(`Over cap by ${formatMoney(overCap)}`);
      }
      if (prev > 0 && momPct >= 15) {
        score += 25;
        reasons.push(`Up +${momPct}% vs ${formatMonthLabel(prevMonth)}`);
      }
      if (sharePct >= 20 && !cat.essential) {
        score += 15;
        reasons.push(`${sharePct}% of monthly total`);
      }

      if (score >= 30) {
        // Suggested cut: either bring down to cap, or 20%-30% cut on discretionary
        const suggestedCut = overCap > 0
          ? Math.max(overCap, Math.round(spent * 0.2))
          : Math.round(spent * (cat.essential ? 0.1 : 0.25));
        const targetAmount = Math.max(0, spent - suggestedCut);
        suggestions.push({
          cat,
          spent,
          cap,
          prev,
          momPct,
          score,
          reasons,
          suggestedCut,
          targetAmount
        });
      }
    }

    suggestions.sort((a, b) => b.score - a.score);
    const totalPotential = suggestions.reduce((s, item) => s + item.suggestedCut, 0);

    document.getElementById('potential-savings-total').textContent = formatMoney(totalPotential);
    document.getElementById('reduce-count-badge').textContent = `${suggestions.length} ${suggestions.length === 1 ? 'suggestion' : 'suggestions'}`;

    const container = document.getElementById('reduction-cards');
    if (suggestions.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-600">
          <p class="text-2xl mb-2">🎉</p>
          <p class="text-sm font-bold text-slate-800">ကောင်းမွန်ပါတယ်! (Great Control)</p>
          <p class="text-xs text-slate-500 mt-1">No high-priority reductions flagged for ${formatMonthLabel(selectedMonth)}. Add more entries or tighten category caps in Settings.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = suggestions.map((s, idx) => {
      const priorityLabel = idx === 0 ? 'Top Priority' : idx <= 2 ? 'Recommended' : 'Optional';
      const priorityColor = idx === 0 ? 'bg-rose-100 text-rose-700' : idx <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700';
      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style="background-color: ${s.cat.color}18">
                ${s.cat.icon}
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">${s.cat.mm}</h3>
                <p class="text-[11px] text-slate-500">${s.cat.en}</p>
              </div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor}">${priorityLabel}</span>
          </div>

          <div class="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-center">
            <div>
              <span class="text-[10px] text-slate-500 block">Current</span>
              <span class="text-xs font-bold text-slate-900">${formatMoney(s.spent)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block">Target</span>
              <span class="text-xs font-bold text-emerald-700">${formatMoney(s.targetAmount)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block">Save</span>
              <span class="text-xs font-bold text-orange-600">-${formatMoney(s.suggestedCut)}</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-1.5">
            ${s.reasons.map(r => `<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">${r}</span>`).join('')}
          </div>

          <button type="button" data-apply-cap="${s.cat.id}" data-target-cap="${s.targetAmount}"
            class="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition">
            Set Next Month Cap to ${formatMoney(s.targetAmount)}
          </button>
        </div>
      `;
    }).join('');
  }

  function renderSettings() {
    document.getElementById('setting-currency').value = state.currency;
    document.getElementById('setting-monthly-budget').value = state.monthlyBudget;
    const container = document.getElementById('category-budget-inputs');
    container.innerHTML = CATEGORIES.map(cat => {
      const val = state.categoryBudgets[cat.id] ?? cat.defaultCap;
      return `
        <div class="flex items-center justify-between gap-3">
          <label for="cap-${cat.id}" class="text-xs font-medium text-slate-700 flex items-center gap-2 min-w-0">
            <span>${cat.icon}</span>
            <span class="truncate">${cat.mm}</span>
          </label>
          <input id="cap-${cat.id}" data-cap-id="${cat.id}" type="number" min="0" step="any" value="${val}"
            class="w-28 px-2.5 py-1.5 text-xs text-right rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      `;
    }).join('');
  }

  function renderAll() {
    renderSummary();
    renderCategoryPicker();
    renderFilterChips();
    renderExpenseList();
    if (currentTab === 'analytics') renderAnalytics();
    if (currentTab === 'reduce') renderReductionAdvisor();
    if (currentTab === 'settings') renderSettings();
  }

  function switchTab(tab) {
    currentTab = tab;
    ['log', 'analytics', 'reduce', 'settings'].forEach(t => {
      const sec = document.getElementById(`view-${t}`);
      if (t === tab) sec.classList.remove('hidden');
      else sec.classList.add('hidden');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tab;
      btn.classList.toggle('tab-active', isTarget);
      btn.classList.toggle('tab-inactive', !isTarget);
    });
    renderAll();
  }

  // Initialize default date input to selectedMonth-26
  document.getElementById('input-date').value = '2026-11-26';

  // Event Listeners
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  document.getElementById('btn-prev-month').addEventListener('click', () => {
    selectedMonth = shiftMonth(selectedMonth, -1);
    document.getElementById('input-date').value = `${selectedMonth}-15`;
    renderAll();
  });

  document.getElementById('btn-next-month').addEventListener('click', () => {
    selectedMonth = shiftMonth(selectedMonth, 1);
    document.getElementById('input-date').value = `${selectedMonth}-15`;
    renderAll();
  });

  document.getElementById('btn-toggle-add').addEventListener('click', () => {
    isAddExpanded = !isAddExpanded;
    document.getElementById('expense-form').classList.toggle('hidden', !isAddExpanded);
    document.getElementById('btn-toggle-add').textContent = isAddExpanded ? 'Hide' : 'Show';
  });

  document.getElementById('category-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat-pick]');
    if (!btn) return;
    selectedCategory = btn.getAttribute('data-cat-pick');
    renderCategoryPicker();
  });

  document.getElementById('filter-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    filterCategory = btn.getAttribute('data-filter');
    renderFilterChips();
    renderExpenseList();
  });

  document.getElementById('expense-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const amountEl = document.getElementById('input-amount');
    const dateEl = document.getElementById('input-date');
    const noteEl = document.getElementById('input-note');
    const amount = parseFloat(amountEl.value);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    const dateVal = dateEl.value || `${selectedMonth}-01`;
    state.expenses.unshift({
      id: newEntryId('exp'),
      date: dateVal,
      category: selectedCategory,
      amount,
      note: noteEl.value.trim()
    });
    selectedMonth = dateVal.slice(0, 7);
    saveState();
    amountEl.value = '';
    noteEl.value = '';
    renderAll();
    showToast('စာရင်းသွင်းပြီးပါပြီ (Saved)');
  });

  document.getElementById('btn-open-income-modal').addEventListener('click', () => {
    document.getElementById('income-date').value = document.getElementById('input-date').value || `${selectedMonth}-26`;
    document.getElementById('income-modal').classList.remove('hidden');
  });

  function closeIncomeModal() {
    document.getElementById('income-modal').classList.add('hidden');
  }

  document.getElementById('btn-close-income-modal').addEventListener('click', closeIncomeModal);
  document.getElementById('btn-cancel-income').addEventListener('click', closeIncomeModal);

  document.getElementById('income-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const amountEl = document.getElementById('income-amount');
    const dateEl = document.getElementById('income-date');
    const sourceEl = document.getElementById('income-source');
    const amount = parseFloat(amountEl.value);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid income amount');
      return;
    }
    const dateVal = dateEl.value || `${selectedMonth}-01`;
    if (!Array.isArray(state.incomes)) state.incomes = [];
    state.incomes.unshift({
      id: newEntryId('inc'),
      date: dateVal,
      amount,
      source: sourceEl.value.trim() || 'Income (ဝင်ငွေ)'
    });
    selectedMonth = dateVal.slice(0, 7);
    saveState();
    amountEl.value = '';
    sourceEl.value = '';
    closeIncomeModal();
    renderAll();
    showToast('ဝင်ငွေစာရင်းသွင်းပြီးပါပြီ (Income Saved)');
  });

  document.getElementById('expense-list').addEventListener('click', (e) => {
    const incBtn = e.target.closest('[data-delete-income-id]');
    if (incBtn) {
      const id = incBtn.getAttribute('data-delete-income-id');
      openConfirm('Delete Income?', 'Remove this income entry from your monthly record?', () => {
        state.incomes = (state.incomes || []).filter(item => item.id !== id);
        saveState();
        renderAll();
        showToast('Income deleted');
      });
      return;
    }
    const btn = e.target.closest('[data-delete-id]');
    if (!btn) return;
    const id = btn.getAttribute('data-delete-id');
    openConfirm('Delete Entry?', 'Remove this expense from your monthly record?', () => {
      state.expenses = state.expenses.filter(item => item.id !== id);
      saveState();
      renderAll();
      showToast('Entry deleted');
    });
  });

  document.getElementById('reduction-cards').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-apply-cap]');
    if (!btn) return;
    const catId = btn.getAttribute('data-apply-cap');
    const target = Number(btn.getAttribute('data-target-cap')) || 0;
    state.categoryBudgets[catId] = target;
    saveState();
    renderAll();
    showToast(`Updated cap to ${formatMoney(target)}`);
  });

  document.getElementById('btn-save-general-settings').addEventListener('click', () => {
    state.currency = document.getElementById('setting-currency').value;
    const mb = parseFloat(document.getElementById('setting-monthly-budget').value);
    state.monthlyBudget = isNaN(mb) || mb < 0 ? 0 : mb;
    saveState();
    renderAll();
    showToast('Settings saved');
  });

  document.getElementById('btn-save-cat-budgets').addEventListener('click', () => {
    document.querySelectorAll('[data-cap-id]').forEach(inp => {
      const id = inp.getAttribute('data-cap-id');
      const val = parseFloat(inp.value);
      state.categoryBudgets[id] = isNaN(val) || val < 0 ? 0 : val;
    });
    saveState();
    renderAll();
    showToast('Category caps updated');
  });

  document.getElementById('btn-export-csv').addEventListener('click', () => {
    const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
    const rows = [['Date', 'Type', 'Category (MM)', 'Category (EN)', 'Amount', 'Currency', 'Note']];
    for (const i of (state.incomes || [])) {
      rows.push([
        i.date,
        'Income',
        '"ဝင်ငွေ"',
        'Income',
        i.amount,
        state.currency,
        `"${(i.source || '').replace(/"/g, '""')}"`
      ]);
    }
    for (const e of state.expenses) {
      const c = catMap[e.category] || { mm: e.category, en: e.category };
      rows.push([
        e.date,
        'Expense',
        `"${c.mm.replace(/"/g, '""')}"`,
        `"${c.en.replace(/"/g, '""')}"`,
        e.amount,
        state.currency,
        `"${(e.note || '').replace(/"/g, '""')}"`
      ]);
    }
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `athone-sayin-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV exported');
  });

  document.getElementById('btn-load-demo').addEventListener('click', () => {
    openConfirm('Load Sample Data?', 'This will replace current entries with sample data for testing.', () => {
      state = getSampleData();
      selectedMonth = '2026-11';
      saveState();
      renderAll();
      showToast('Sample data loaded');
    });
  });

  document.getElementById('btn-clear-data').addEventListener('click', () => {
    const scope = ledgerSync.isActive() ? ' from your synced account' : ' from this device';
    openConfirm('Clear All Entries?', 'All logged expenses and income will be permanently removed' + scope + '.', () => {
      state.expenses = [];
      state.incomes = [];
      saveState();
      renderAll();
      showToast('All entries cleared');
    });
  });

  document.getElementById('modal-cancel').addEventListener('click', closeConfirm);
  document.getElementById('modal-confirm').addEventListener('click', () => {
    if (pendingConfirmAction) pendingConfirmAction();
    closeConfirm();
  });

  const sampleData = getSampleData();
  const sampleIds = new Set([
    ...sampleData.expenses.map(entry => 'expense:' + entry.id),
    ...sampleData.incomes.map(entry => 'income:' + entry.id)
  ]);
  const ledgerSync = window.createLedgerSync({
    getLocalState: loadState,
    getDefaults: () => ({ ...getSampleData(), expenses: [], incomes: [] }),
    sampleIds,
    applyState(next) {
      const drafts = new Map();
      if (currentTab === 'settings') {
        const trackDraft = (input, saved) => {
          if (input.value !== String(saved)) drafts.set(input.id, input.value);
        };
        trackDraft(document.getElementById('setting-currency'), state.currency);
        trackDraft(document.getElementById('setting-monthly-budget'), state.monthlyBudget);
        document.querySelectorAll('[data-cap-id]').forEach(input => {
          trackDraft(input, state.categoryBudgets[input.dataset.capId]);
        });
      }
      state = next;
      document.getElementById('btn-load-demo').classList.toggle('hidden', ledgerSync.isActive());
      renderAll();
      for (const [id, value] of drafts) document.getElementById(id).value = value;
    }
  });

  renderAll();
})();
