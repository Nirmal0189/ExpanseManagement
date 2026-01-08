// ===================================
// HISTORY PAGE LOGIC
// ===================================

(function () {
    // State
    let currentFilter = '';
    let currentSort = 'date-desc';
    let currentMonth = new Date().toISOString().slice(0, 7); // Default to current month YYYY-MM
    let transactions = []; // Local cache

    // Categories
    const categories = [
        'Food', 'Groceries', 'Dining', 'Transport', 'Fuel', 'Travel',
        'Shopping', 'Clothes', 'Gadgets', 'Movies',
        'Bills', 'Rent', 'Utilities', 'Health', 'Fitness',
        'Education', 'Insurance', 'Other'
    ];

    // DOM Elements - Using getters to ensure element exists when accessed
    const getEl = (id) => document.getElementById(id);

    // Initialize
    async function init() {
        checkAuth();
        populateCategoryFilter();
        populateMonthFilter();

        // Set default month in selector
        const filterMonth = getEl('filterMonth');
        if (filterMonth) {
            filterMonth.value = currentMonth;
        }

        setupEventListeners();
        setupDeleteModal();
        await renderHistory();
    }

    // Check authentication
    function checkAuth() {
        if (typeof StorageUtil === 'undefined') return; // Safety check
        const currentUser = StorageUtil.get('currentUser');
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        const userNameElement = getEl('sidebarUserName');
        const userInitialsElement = getEl('userInitials');
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
        if (userInitialsElement) {
            const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            userInitialsElement.textContent = initials;
        }
    }

    // Populate category filter
    function populateCategoryFilter() {
        const filterCategory = getEl('filterCategory');
        if (!filterCategory) return;

        filterCategory.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    // Populate month filter (simple last 12 months)
    function populateMonthFilter() {
        const filterMonth = getEl('filterMonth');
        if (!filterMonth) return;

        const months = [];
        const date = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
            const value = d.toISOString().slice(0, 7);
            const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
            months.push(`<option value="${value}">${label}</option>`);
        }
        filterMonth.innerHTML = '<option value="">All Months</option>' + months.join('');
        filterMonth.value = currentMonth;
    }

    // Setup event listeners
    function setupEventListeners() {
        const filterMonth = getEl('filterMonth');
        const filterCategory = getEl('filterCategory');
        const sortBy = getEl('sortBy');
        const downloadReportBtn = getEl('downloadReportBtn');
        const logoutBtn = getEl('logoutBtn');

        if (filterMonth) {
            filterMonth.addEventListener('change', (e) => {
                currentMonth = e.target.value;
                renderHistory();
            });
        }

        if (filterCategory) {
            filterCategory.addEventListener('change', (e) => {
                currentFilter = e.target.value;
                renderHistory();
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                currentSort = e.target.value;
                renderHistory();
            });
        }

        if (downloadReportBtn) {
            downloadReportBtn.addEventListener('click', generatePDFReport);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                StorageUtil.remove('currentUser');
                window.location.href = 'login.html';
            });
        }
    }

    // Generate PDF Report
    async function generatePDFReport() {
        if (!window.jspdf) {
            alert('PDF Generator not loaded');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Primary color
        doc.text('Expense Report', 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);

        const displayDate = currentMonth ? new Date(currentMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : 'All Time';
        doc.text(`Period: ${displayDate}`, 14, 30);

        // Get sorted and filtered expenses
        let expenses = await getFilteredExpenses();

        // Calculate Total
        const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.price), 0);
        doc.text(`Total Spending: ${ExpenseManager.formatCurrency(totalAmount)}`, 14, 38);

        // Table Data
        const tableData = expenses.map(exp => [
            ExpenseManager.formatDate(exp.date),
            exp.title,
            exp.category,
            ExpenseManager.formatCurrency(exp.price)
        ]);

        // AutoTable
        doc.autoTable({
            startY: 45,
            head: [['Date', 'Title', 'Category', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] },
            alternateRowStyles: { fillColor: [245, 247, 255] },
            margin: { top: 45 },
        });

        // Save
        doc.save(`Expense_Report_${currentMonth || 'All'}.pdf`);
    }

    // Get Filtered Expenses
    async function getFilteredExpenses() {
        if (!ExpenseManager) return [];
        let expenses = await ExpenseManager.getExpenses();

        // Filter by month
        if (currentMonth) {
            expenses = expenses.filter(exp => exp.date.startsWith(currentMonth));
        }

        // Filter by category
        if (currentFilter) {
            expenses = expenses.filter(exp => exp.category === currentFilter);
        }

        // Sort
        return ExpenseManager.sortExpenses(expenses, currentSort);
    }

    // Render history
    async function renderHistory() {
        const historyTableBody = getEl('historyTableBody');
        if (!historyTableBody) return;

        const expenses = await getFilteredExpenses();

        if (expenses.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="6" class="empty-state-table">No transactions found</td></tr>';
            return;
        }

        historyTableBody.innerHTML = expenses.map(expense => `
            <tr>
                <td>${ExpenseManager.formatDate(expense.date)}</td>
                <td style="font-weight: 600;">${expense.title}</td>
                <td>
                    <span class="category-pill">
                        ${ExpenseManager.getCategoryIcon(expense.category)} ${expense.category}
                    </span>
                </td>
                <td style="color: #6b7280; font-size: 13px;">${expense.description || '-'}</td>
                <td style="font-weight: 700; color: #dc2626;">${ExpenseManager.formatCurrency(expense.price)}</td>
                <td>
                    <button class="delete-expense-btn" data-expense-id="${expense.id}" style="padding: 8px 16px; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');

        // Attach delete button listeners
        attachDeleteListeners();
    }

    // Attach delete button listeners
    function attachDeleteListeners() {
        const deleteButtons = document.querySelectorAll('.delete-expense-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const expenseId = this.getAttribute('data-expense-id');
                if (expenseId) {
                    confirmDeleteExpense(expenseId);
                }
            });
        });
    }

    // Setup delete confirmation modal
    let expenseToDelete = null;

    function setupDeleteModal() {
        const deleteModal = getEl('deleteConfirmModal');
        const closeDeleteModal = getEl('closeDeleteModal');
        const cancelDelete = getEl('cancelDelete');
        const confirmDelete = getEl('confirmDelete');

        const closeModal = () => {
            if (deleteModal) deleteModal.classList.remove('active');
            expenseToDelete = null;
        };

        if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeModal);
        if (cancelDelete) cancelDelete.addEventListener('click', closeModal);

        if (confirmDelete) {
            confirmDelete.addEventListener('click', async () => {
                if (expenseToDelete) {
                    const success = await ExpenseManager.deleteExpense(expenseToDelete);
                    if (success) {
                        closeModal();
                        await renderHistory();
                    } else {
                        alert('Failed to delete transaction');
                    }
                }
            });
        }

        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) closeModal();
            });
        }
    }

    function confirmDeleteExpense(id) {
        expenseToDelete = id;
        const deleteModal = getEl('deleteConfirmModal');
        if (deleteModal) {
            deleteModal.classList.add('active');
        } else {
            // Fallback if modal missing
            if (confirm("Delete this transaction?")) {
                ExpenseManager.deleteExpense(id).then(renderHistory);
            }
        }
    }

    // Mobile menu
    function setupMobileMenu() {
        const sidebar = getEl('sidebar');
        const sidebarOverlay = getEl('sidebarOverlay');
        const openSidebarBtn = getEl('openSidebar');

        if (openSidebarBtn) {
            openSidebarBtn.addEventListener('click', () => {
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
    }

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            setupMobileMenu();
        });
    } else {
        init();
        setupMobileMenu();
    }
})();
