/**
 * Expense Manager Logic
 * Handles CRUD operations for expenses using Firestore (if available) or LocalStorage
 */

const ExpenseManager = {
    collectionName: 'expenses',

    // Get all expenses
    getExpenses: async function () {
        const user = StorageUtil.get('currentUser');
        if (!user) return [];

        try {
            // Try Firestore first
            if (typeof db !== 'undefined') {
                const snapshot = await db.collection(this.collectionName)
                    .where('userId', '==', user.id)
                    .orderBy('date', 'desc') // Ensure index exists or this might fail
                    .get();

                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        } catch (e) {
            console.warn('Firestore fetch failed, falling back to local storage', e);
        }

        // Fallback or Local Only
        const expenses = StorageUtil.get('expenses') || [];
        return expenses.filter(e => e.userId === user.id);
    },

    // Add expense
    addExpense: async function (expense) {
        const user = StorageUtil.get('currentUser');
        if (!user) return false;

        expense.userId = user.id;
        expense.createdAt = new Date().toISOString();

        try {
            if (typeof db !== 'undefined') {
                await db.collection(this.collectionName).add(expense);
                return true;
            }
        } catch (e) {
            console.error('Firestore add failed', e);
        }

        // Local Storage Fallback
        const expenses = StorageUtil.get('expenses') || [];
        expense.id = Date.now().toString(); // Generate ID for local
        expenses.unshift(expense);
        StorageUtil.set('expenses', expenses);
        return true;
    },

    // Delete expense
    deleteExpense: async function (id) {
        try {
            if (typeof db !== 'undefined') {
                await db.collection(this.collectionName).doc(id).delete();
                return true;
            }
        } catch (e) {
            console.error('Firestore delete failed', e);
        }

        const expenses = StorageUtil.get('expenses') || [];
        const newExpenses = expenses.filter(e => e.id !== id);
        StorageUtil.set('expenses', newExpenses);
        return true;
    },

    // Get Budget
    getBudget: async function () {
        const user = StorageUtil.get('currentUser');
        if (!user) return 0;

        // Return 0 if not found, rely on UI to set default
        return parseFloat(localStorage.getItem('monthly_budget_' + user.id)) || 0;
    },

    // Set Budget
    setBudget: function (amount) {
        const user = StorageUtil.get('currentUser');
        if (!user) return;
        localStorage.setItem('monthly_budget_' + user.id, amount);
    },

    // Utilities
    formatCurrency: function (amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },

    formatDate: function (dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    sortExpenses: function (expenses, sortType) {
        return [...expenses].sort((a, b) => {
            if (sortType === 'date-desc') return new Date(b.date) - new Date(a.date);
            if (sortType === 'date-asc') return new Date(a.date) - new Date(b.date);
            if (sortType === 'amount-desc') return parseFloat(b.price) - parseFloat(a.price);
            if (sortType === 'amount-asc') return parseFloat(a.price) - parseFloat(b.price);
            return 0;
        });
    },

    getCategoryIcon: function (category) {
        const icons = {
            'Food': '🍔', 'Groceries': '🛒', 'Dining': '🍽️', 'Transport': '🚌',
            'Fuel': '⛽', 'Travel': '✈️', 'Shopping': '🛍️', 'Clothes': '👕',
            'Gadgets': '📱', 'Movies': '🎬', 'Bills': '📄', 'Rent': '🏠',
            'Utilities': '💡', 'Health': '💊', 'Fitness': '💪', 'Education': '📚',
            'Insurance': '🛡️', 'Other': '📝'
        };
        return icons[category] || '💰';
    }
};
