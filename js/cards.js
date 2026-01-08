/**
 * Cards Page Logic
 */

(function () {
    const getEl = (id) => document.getElementById(id);
    const container = getEl('cardsContainer');

    function init() {
        setupEventListeners();
        renderCards();
    }

    // Using local storage for cards demo
    function getCards() {
        return StorageUtil.get('cards') || [];
    }

    function saveCard(card) {
        const cards = getCards();
        cards.push(card);
        StorageUtil.set('cards', cards);
    }

    function renderCards() {
        if (!container) return;
        const cards = getCards();

        container.innerHTML = cards.map(createCardHTML).join('') + `
            <div class="add-card-btn" id="addCardBtnInternal">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color: #667eea;">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span style="font-weight: 600; color: #667eea;">Add New Card</span>
            </div>
        `;

        // Re-attach listener to the button inside grid
        const internalBtn = getEl('addCardBtnInternal');
        if (internalBtn) internalBtn.addEventListener('click', openModal);
    }

    function createCardHTML(card) {
        // Mask number
        const masked = card.number.slice(0, 4) + ' **** **** ' + card.number.slice(-4);
        return `
            <div class="credit-card">
                <div class="card-brand">${card.brand}</div>
                <div class="card-chip"></div>
                <div class="card-number">${masked}</div>
                <div class="card-details">
                    <div class="card-holder">
                        <span>Card Holder</span>
                        <span class="detail-value">${card.holder}</span>
                    </div>
                    <div class="card-expiry">
                        <span>Expires</span>
                        <span class="detail-value">${card.expiry}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Modal
    const modal = getEl('cardModal');
    const openModal = () => modal.classList.add('active');
    const closeModal = () => modal.classList.remove('active');

    function setupEventListeners() {
        const addBtn = getEl('addCardBtn');
        if (addBtn) addBtn.addEventListener('click', openModal);

        const closeBtn = getEl('closeCardModal');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        const cancelBtn = getEl('cancelCardBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        const form = getEl('cardForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const card = {
                    holder: getEl('cardHolder').value,
                    number: getEl('cardNumber').value,
                    expiry: getEl('cardExpiry').value,
                    brand: getEl('cardBrand').value
                };
                saveCard(card);
                closeModal();
                form.reset();
                renderCards();
            });
        }
    }

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
