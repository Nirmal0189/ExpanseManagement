/**
 * Dashboard Logic
 */

(function () {
    // DOM Elements
    const getEl = (id) => document.getElementById(id);
    const monthSelector = getEl('monthSelector');
    const totalTransactionsEl = getEl('totalTransactions');
    const totalExpensesEl = getEl('totalExpenses');
    const budgetAmountEl = getEl('budgetAmount');
    const spentAmountEl = getEl('spentAmount');
    const remainingAmountEl = getEl('remainingAmount');
    const budgetProgressEl = getEl('budgetProgress');
    const budgetPercentageEl = getEl('budgetPercentage');
    const recentTransactionsList = getEl('recentTransactionsList');

    // Charts
    let spendingChartInstance = null;
    let budgetMiniChartInstance = null;

    // State
    let currentMonth = new Date().toISOString().slice(0, 7);

    // Categories
    const categories = [
        { name: 'Food', icon: '🍔' },
        { name: 'Groceries', icon: '🛒' },
        { name: 'Dining', icon: '🍽️' },
        { name: 'Transport', icon: '🚌' },
        { name: 'Fuel', icon: '⛽' },
        { name: 'Travel', icon: '✈️' },
        { name: 'Shopping', icon: '🛍️' },
        { name: 'Clothes', icon: '👕' },
        { name: 'Gadgets', icon: '📱' },
        { name: 'Movies', icon: '🎬' },
        { name: 'Bills', icon: '📄' },
        { name: 'Rent', icon: '🏠' },
        { name: 'Utilities', icon: '💡' },
        { name: 'Health', icon: '💊' },
        { name: 'Fitness', icon: '💪' },
        { name: 'Education', icon: '📚' },
        { name: 'Insurance', icon: '🛡️' },
        { name: 'Other', icon: '📝' }
    ];

    async function init() {
        checkAuth();
        setupEventListeners();
        populateMonthSelector();
        populateCategoryGrid(); // Added this

        // Initial Data Load
        await loadDashboardData();
    }

    function populateCategoryGrid() {
        const grid = getEl('categoryGrid');
        if (!grid) return;

        grid.innerHTML = categories.map(cat => `
            <div class="category-item" onclick="selectCategory('${cat.name}')">
                <div class="category-icon">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
            </div>
        `).join('');

        // Expose selectCategory globally so onclick works
        window.selectCategory = async function (catName) {
            console.log('Selected category:', catName);

            const expenses = await ExpenseManager.getExpenses();
            const filtered = expenses.filter(e => e.date.startsWith(currentMonth))
                .filter(e => e.category === catName);

            updateRecentTransactions(filtered);
            updateTransactionsTable(filtered);

            // Update header to show filter
            const header = document.querySelector('.transactions-card h3');
            if (header) header.textContent = `Transactions: ${catName}`;

            // Close drawer
            const drawer = getEl('categoryDrawer');
            if (drawer) drawer.classList.remove('active');
        };
    }

    // Populate Month Selector
    function populateMonthSelector() {
        if (!monthSelector) return;
        const months = [];
        const date = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
            const value = d.toISOString().slice(0, 7);
            const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
            months.push(`<option value="${value}">${label}</option>`);
        }
        monthSelector.innerHTML = months.join('');
        monthSelector.value = currentMonth;

        // Update header text
        const currentMonthSpan = getEl('currentMonth');
        if (currentMonthSpan) currentMonthSpan.textContent = monthSelector.options[monthSelector.selectedIndex].text;
    }

    // Load Data
    async function loadDashboardData() {
        const expenses = await ExpenseManager.getExpenses();
        const filteredExpenses = expenses.filter(e => e.date.startsWith(currentMonth));

        // Calculate Totals
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.price), 0);
        const totalCount = filteredExpenses.length;

        // Update Stats
        if (totalExpensesEl) totalExpensesEl.textContent = ExpenseManager.formatCurrency(totalExpenses);
        if (totalTransactionsEl) totalTransactionsEl.textContent = totalCount;
        if (getEl('chartTotal')) getEl('chartTotal').textContent = ExpenseManager.formatCurrency(totalExpenses);

        // Update Budget
        updateBudgetUI(totalExpenses);

        // Update Charts
        updateSpendingChart(filteredExpenses);
        updateBudgetMiniChart(totalExpenses);

        // Update Recent List
        updateRecentTransactions(filteredExpenses);

        // Update Table (if present)
        updateTransactionsTable(filteredExpenses);
    }

    // Budget UI
    async function updateBudgetUI(totalSpent) {
        const budget = await ExpenseManager.getBudget();

        if (budgetAmountEl) budgetAmountEl.textContent = ExpenseManager.formatCurrency(budget);
        if (spentAmountEl) spentAmountEl.textContent = ExpenseManager.formatCurrency(totalSpent);

        const remaining = budget - totalSpent;
        if (remainingAmountEl) remainingAmountEl.textContent = ExpenseManager.formatCurrency(remaining);

        const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
        if (budgetProgressEl) budgetProgressEl.style.width = `${Math.min(percentage, 100)}%`;
        if (budgetPercentageEl) budgetPercentageEl.textContent = `${Math.round(percentage)}% of budget used`;

        // Color coding
        if (remaining < 0) {
            remainingAmountEl.style.color = '#dc2626';
            budgetProgressEl.style.backgroundColor = '#dc2626';
        } else {
            remainingAmountEl.style.color = ''; // Reset
            budgetProgressEl.style.backgroundColor = '';
        }
    }

    // Spending Chart (Doughnut)
    function updateSpendingChart(expenses) {
        const ctx = getEl('spendingChart');
        if (!ctx) return;

        // Group by category
        const categories = {};
        expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + parseFloat(e.price);
        });

        const labels = Object.keys(categories);
        const data = Object.values(categories);
        const backgroundColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ];

        if (spendingChartInstance) {
            spendingChartInstance.destroy();
        }

        spendingChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Mini Chart (Area implementation based on logs)
    function updateBudgetMiniChart(totalSpent) {
        const ctx = getEl('budgetMiniChart');
        if (!ctx) return;

        // Dummy data for visual effect since we just have total
        // In real app, we would aggregate daily spending
        const data = [totalSpent * 0.2, totalSpent * 0.5, totalSpent * 0.8, totalSpent];

        if (budgetMiniChartInstance) {
            budgetMiniChartInstance.destroy();
        }

        budgetMiniChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Spending',
                    data: data,
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }

    // Recent Transactions
    function updateRecentTransactions(expenses) {
        if (!recentTransactionsList) return;

        const recent = expenses.slice(0, 5);
        if (recent.length === 0) {
            recentTransactionsList.innerHTML = '<div class="empty-state-small">No transactions recently</div>';
            return;
        }

        recentTransactionsList.innerHTML = recent.map(e => `
            <div class="transaction-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 20px;">${ExpenseManager.getCategoryIcon(e.category)}</div>
                    <div>
                        <div class="recent-transaction-title" style="font-weight: 600; font-size: 14px;">${e.title}</div>
                        <div class="recent-transaction-category" style="font-size: 12px; color: #6b7280;">${e.category}</div>
                    </div>
                </div>
                <div class="recent-transaction-amount" style="font-weight: 600; color: #dc2626;">
                    ${ExpenseManager.formatCurrency(e.price)}
                </div>
            </div>
        `).join('');
    }

    function updateTransactionsTable(expenses) {
        const tbody = getEl('transactionsTableBody');
        if (!tbody) return;

        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state-table">No transactions found for this month</td></tr>';
            return;
        }

        tbody.innerHTML = expenses.map(e => `
            <tr>
                <td>${ExpenseManager.formatDate(e.date)}</td>
                <td>${e.title}</td>
                <td>${e.category}</td>
                <td style="font-weight: 600; color: #dc2626;">${ExpenseManager.formatCurrency(e.price)}</td>
            </tr>
        `).join('');
    }

    // Event Listeners
    function setupEventListeners() {
        // Month Change
        if (monthSelector) {
            monthSelector.addEventListener('change', (e) => {
                currentMonth = e.target.value;
                const currentMonthSpan = getEl('currentMonth');
                if (currentMonthSpan) currentMonthSpan.textContent = monthSelector.options[monthSelector.selectedIndex].text;
                loadDashboardData();
            });
        }

        // Add Transaction Modal
        const addBtn = getEl('addTransactionBtn');
        const modal = getEl('transactionModal');
        const closeModal = getEl('closeModal');
        const cancelBtn = getEl('cancelBtn');
        const form = getEl('transactionForm');

        if (addBtn) addBtn.addEventListener('click', () => {
            // Populate category select
            const catSelect = getEl('transactionCategory');
            // If only default option exists or empty
            if (catSelect && catSelect.options.length <= 1) {
                // Clear existing except first
                catSelect.innerHTML = '<option value="">Select Category</option>';

                categories.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.name;
                    opt.textContent = `${c.icon} ${c.name}`;
                    catSelect.appendChild(opt);
                });
            }
            if (modal) modal.classList.add('active');
        });

        const closeTransactionModal = () => { if (modal) modal.classList.remove('active'); };
        if (closeModal) closeModal.addEventListener('click', closeTransactionModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeTransactionModal);

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = getEl('transactionTitle').value;
                const amount = getEl('transactionAmount').value;
                const category = getEl('transactionCategory').value;
                const date = getEl('transactionDate').value;
                const desc = getEl('transactionDescription').value;

                if (!title || !amount || !category || !date) {
                    alert('Please fill all required fields');
                    return;
                }

                const expense = {
                    title,
                    price: parseFloat(amount),
                    category,
                    date,
                    description: desc
                };

                await ExpenseManager.addExpense(expense);
                closeTransactionModal();
                form.reset();
                loadDashboardData();
            });
        }

        // Set Budget Modal
        const setBudgetBtn = getEl('setBudgetBtn');
        const budgetModal = getEl('budgetModal');
        const closeBudgetModal = getEl('closeBudgetModal');
        const cancelBudgetBtn = getEl('cancelBudgetBtn');
        const budgetForm = getEl('budgetForm');

        if (setBudgetBtn) setBudgetBtn.addEventListener('click', async () => {
            if (budgetModal) budgetModal.classList.add('active');
            const budget = await ExpenseManager.getBudget();
            if (getEl('budgetInput')) getEl('budgetInput').value = budget;
        });

        const closeBudgetM = () => { if (budgetModal) budgetModal.classList.remove('active'); };
        if (closeBudgetModal) closeBudgetModal.addEventListener('click', closeBudgetM);
        if (cancelBudgetBtn) cancelBudgetBtn.addEventListener('click', closeBudgetM);

        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const val = getEl('budgetInput').value;
                if (val) {
                    ExpenseManager.setBudget(val);
                    closeBudgetM();
                    loadDashboardData();
                }
            });
        }

        // Mobile Menu
        const openSidebar = getEl('openSidebar');
        const sidebar = getEl('sidebar');
        const sidebarOverlay = getEl('sidebarOverlay');
        if (openSidebar) {
            openSidebar.addEventListener('click', () => {
                if (sidebar) sidebar.classList.add('active');
                if (sidebarOverlay) sidebarOverlay.classList.add('active');
            });
        }
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                if (sidebar) sidebar.classList.remove('active');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            });
        }

        // Category Drawer
        const selectCatBtn = getEl('selectCategoryBtn');
        const catDrawer = getEl('categoryDrawer');
        const closeDrawerBtn = getEl('closeDrawer');

        if (selectCatBtn) {
            selectCatBtn.addEventListener('click', () => {
                if (catDrawer) catDrawer.classList.add('active');
            });
        }

        if (closeDrawerBtn) {
            closeDrawerBtn.addEventListener('click', () => {
                if (catDrawer) catDrawer.classList.remove('active');
            });
        }

        // Close drawer when clicking overlay
        if (catDrawer) {
            catDrawer.addEventListener('click', (e) => {
                if (e.target === catDrawer) catDrawer.classList.remove('active');
            });
        }

        // Expanded Graph Modal
        const incomeCard = getEl('incomeStatCard');
        const expandedModal = getEl('expandedGraphModal');
        const closeExpandedBtn = getEl('closeExpandedGraphModal');

        if (incomeCard) {
            incomeCard.addEventListener('click', () => {
                if (expandedModal) {
                    expandedModal.classList.add('active');
                    renderExpandedChart();
                }
            });
        }

        if (closeExpandedBtn) {
            closeExpandedBtn.addEventListener('click', () => {
                if (expandedModal) expandedModal.classList.remove('active');
            });
        }

        if (expandedModal) {
            expandedModal.addEventListener('click', (e) => {
                if (e.target === expandedModal) expandedModal.classList.remove('active');
            });
        }
    }

    // Render Expanded Chart
    async function renderExpandedChart() {
        const ctx = getEl('expandedBudgetChart');
        if (!ctx) return;

        const budget = await ExpenseManager.getBudget();
        const expenses = await ExpenseManager.getExpenses();
        // Filter for current month
        const filtered = expenses.filter(e => e.date.startsWith(currentMonth));
        const totalSpent = filtered.reduce((acc, curr) => acc + parseFloat(curr.price), 0);

        // Update Summary
        if (getEl('expandedBudgetTotal')) getEl('expandedBudgetTotal').textContent = ExpenseManager.formatCurrency(budget);
        if (getEl('expandedBudgetSpent')) getEl('expandedBudgetSpent').textContent = ExpenseManager.formatCurrency(totalSpent);
        const remaining = budget - totalSpent;
        const remainingEl = getEl('expandedBudgetRemaining');
        if (remainingEl) {
            remainingEl.textContent = ExpenseManager.formatCurrency(remaining);
            remainingEl.style.color = remaining < 0 ? '#dc2626' : '#a8edea';
        }

        // Mock Data for "Budget vs My Spending" over time
        // In a real app we would bucket by day
        const dataSpent = [totalSpent * 0.1, totalSpent * 0.3, totalSpent * 0.6, totalSpent * 0.8, totalSpent];
        const dataBudget = [budget, budget, budget, budget, budget]; // Flat line

        if (window.expandedChartInstance) {
            window.expandedChartInstance.destroy();
        }

        window.expandedChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Today'],
                datasets: [
                    {
                        label: 'My Spending',
                        data: dataSpent,
                        borderColor: '#fa709a',
                        backgroundColor: 'rgba(250, 112, 154, 0.2)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Budget Limit',
                        data: dataBudget,
                        borderColor: '#4facfe',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Spending Trend' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Init Logic
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
