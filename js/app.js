// Main application logic
import { db } from './firebase-config.js';
import { currentUser, userRole } from './auth.js';
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    getDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Navigation elements
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
const actionButtons = document.querySelectorAll('.action-btn');

// Dashboard elements
const todaySalesEl = document.getElementById('today-sales');
const todayTransactionsEl = document.getElementById('today-transactions');
const totalCreditsEl = document.getElementById('total-credits');
const creditCustomersEl = document.getElementById('credit-customers');
const totalItemsEl = document.getElementById('total-items');
const dashboardDateEl = document.getElementById('dashboard-date');

// Sale form elements
const saleForm = document.getElementById('sale-form');
const itemSearchInput = document.getElementById('item-search');
const itemSuggestions = document.getElementById('item-suggestions');
const quantityInput = document.getElementById('quantity');
const unitPriceInput = document.getElementById('unit-price');
const totalAmountSpan = document.getElementById('total-amount');
const paymentButtons = document.querySelectorAll('.payment-btn');
const customerNameGroup = document.getElementById('customer-name-group');
const customerNameInput = document.getElementById('customer-name');
const remarksInput = document.getElementById('remarks');

// Price check elements
const priceSearchInput = document.getElementById('price-search');
const priceSuggestions = document.getElementById('price-suggestions');
const priceResult = document.getElementById('price-result');
const resultItemName = document.getElementById('result-item-name');
const resultPrice = document.getElementById('result-price');
const resultDetails = document.getElementById('result-details');

// Data storage
let items = [];
let sales = [];
let credits = [];
let selectedPaymentMethod = 'cash';

// Initialize app (called from auth.js when user is authenticated)
window.initializeApp = function() {
    setupNavigation();
    setupEventListeners();
    loadDashboardData();
    updateDashboardDate();
    
    // Start listening for real-time updates
    startRealtimeListeners();
};

// Setup navigation
function setupNavigation() {
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.dataset.page;
            showPage(targetPage);
            
            // Update active nav button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Action buttons navigation
    actionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.dataset.page;
            if (targetPage) {
                showPage(targetPage);
                
                // Update active nav button
                navButtons.forEach(b => b.classList.remove('active'));
                document.querySelector(`[data-page="${targetPage}"]`).classList.add('active');
            }
        });
    });
}

// Show specific page
function showPage(pageName) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Load page-specific data
        switch (pageName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'credits':
                loadCreditsData();
                break;
            case 'inventory':
                loadInventoryData();
                break;
            case 'users':
                loadUsersData();
                break;
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Sale form
    saleForm.addEventListener('submit', handleSaleSubmit);
    
    // Item search with suggestions
    itemSearchInput.addEventListener('input', handleItemSearch);
    itemSearchInput.addEventListener('blur', () => {
        setTimeout(() => itemSuggestions.classList.add('hidden'), 200);
    });
    
    // Price search
    priceSearchInput.addEventListener('input', handlePriceSearch);
    priceSearchInput.addEventListener('blur', () => {
        setTimeout(() => priceSuggestions.classList.add('hidden'), 200);
    });
    
    // Quantity and price changes
    quantityInput.addEventListener('input', updateTotal);
    unitPriceInput.addEventListener('input', updateTotal);
    
    // Payment method buttons
    paymentButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            paymentButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPaymentMethod = btn.dataset.method;
            
            // Show/hide customer name field for credit
            if (selectedPaymentMethod === 'credit') {
                customerNameGroup.classList.remove('hidden');
                customerNameInput.required = true;
            } else {
                customerNameGroup.classList.add('hidden');
                customerNameInput.required = false;
                customerNameInput.value = '';
            }
        });
    });
}

// Handle item search
async function handleItemSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length < 1) {
        itemSuggestions.classList.add('hidden');
        return;
    }
    
    const suggestions = items.filter(item => 
        item.name.toLowerCase().includes(query) && item.isActive
    );
    
    displayItemSuggestions(suggestions, itemSuggestions, (item) => {
        itemSearchInput.value = item.name;
        unitPriceInput.value = item.currentPrice;
        itemSuggestions.classList.add('hidden');
        updateTotal();
        quantityInput.focus();
    });
}

// Handle price search
async function handlePriceSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length < 1) {
        priceSuggestions.classList.add('hidden');
        priceResult.classList.add('hidden');
        return;
    }
    
    const suggestions = items.filter(item => 
        item.name.toLowerCase().includes(query) && item.isActive
    );
    
    displayItemSuggestions(suggestions, priceSuggestions, (item) => {
        priceSearchInput.value = item.name;
        showPriceResult(item);
        priceSuggestions.classList.add('hidden');
    });
    
    // Show exact match immediately if found
    const exactMatch = items.find(item => 
        item.name.toLowerCase() === query && item.isActive
    );
    
    if (exactMatch) {
        showPriceResult(exactMatch);
    }
}

// Display item suggestions
function displayItemSuggestions(suggestions, container, onSelect) {
    if (suggestions.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.innerHTML = suggestions.map(item => `
        <div class="suggestion-item" data-item-id="${item.id}">
            <span>${item.name}</span>
            <span class="suggestion-price">₦${item.currentPrice}</span>
        </div>
    `).join('');
    
    container.classList.remove('hidden');
    
    // Add click handlers
    container.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
            const itemId = el.dataset.itemId;
            const item = suggestions.find(i => i.id === itemId);
            if (item) {
                onSelect(item);
            }
        });
    });
}

// Show price result
function showPriceResult(item) {
    resultItemName.textContent = item.name;
    resultPrice.textContent = item.currentPrice;
    resultDetails.textContent = `Last updated: ${formatDate(item.updatedAt)}`;
    priceResult.classList.remove('hidden');
}

// Update total amount
function updateTotal() {
    const quantity = parseInt(quantityInput.value) || 0;
    const unitPrice = parseFloat(unitPriceInput.value) || 0;
    const total = quantity * unitPrice;
    
    totalAmountSpan.textContent = total.toFixed(0);
}

// Handle sale submission
async function handleSaleSubmit(e) {
    e.preventDefault();
    
    const itemName = itemSearchInput.value.trim();
    const quantity = parseInt(quantityInput.value);
    const unitPrice = parseFloat(unitPriceInput.value);
    const totalAmount = quantity * unitPrice;
    const customerName = customerNameInput.value.trim();
    const remarks = remarksInput.value.trim();
    
    // Validation
    if (!itemName) {
        alert('Please enter an item name');
        return;
    }
    
    if (!quantity || quantity < 1) {
        alert('Please enter a valid quantity');
        return;
    }
    
    if (!unitPrice || unitPrice < 0) {
        alert('Please enter a valid price');
        return;
    }
    
    if (selectedPaymentMethod === 'credit' && !customerName) {
        alert('Please enter customer name for credit sales');
        return;
    }
    
    try {
        // Check if item exists, if not create it (admin/manager only)
        let itemId = null;
        let itemAction = '';
        const existingItem = items.find(item => 
            item.name.toLowerCase() === itemName.toLowerCase()
        );
        
        if (existingItem) {
            itemId = existingItem.id;
            
            // Update price if different (admin/manager only)
            if (existingItem.currentPrice !== unitPrice && 
                (userRole === 'admin' || userRole === 'manager')) {
                
                const confirmUpdate = confirm(
                    `Price difference detected!\n\n` +
                    `Current price: ₦${existingItem.currentPrice}\n` +
                    `New price: ₦${unitPrice}\n\n` +
                    `Update the item price?`
                );
                
                if (confirmUpdate) {
                    await updateDoc(doc(db, 'items', itemId), {
                        currentPrice: unitPrice,
                        updatedAt: serverTimestamp(),
                        lastUpdatedBy: currentUser.uid
                    });
                    itemAction = ' (price updated)';
                }
            }
        } else if (userRole === 'admin' || userRole === 'manager') {
            // Item doesn't exist - confirm creation
            const confirmCreate = confirm(
                `"${itemName}" is not in inventory yet.\n\n` +
                `Add it to inventory with price ₦${unitPrice}?`
            );
            
            if (confirmCreate) {
                // Create new item
                const newItem = {
                    name: itemName,
                    currentPrice: unitPrice,
                    category: '',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    createdBy: currentUser.uid,
                    lastUpdatedBy: currentUser.uid,
                    isActive: true
                };
                
                const itemRef = await addDoc(collection(db, 'items'), newItem);
                itemId = itemRef.id;
                itemAction = ' (new item added to inventory)';
            } else {
                return; // User cancelled - don't record the sale
            }
        } else {
            alert('Item not found in inventory. Please ask an admin or manager to add new items.');
            return;
        }
        
        // Create sale record
        const saleData = {
            itemId: itemId,
            itemName: itemName,
            quantity: quantity,
            unitPrice: unitPrice,
            totalAmount: totalAmount,
            paymentMethod: selectedPaymentMethod,
            customerName: selectedPaymentMethod === 'credit' ? customerName : '',
            remarks: remarks,
            saleDate: serverTimestamp(),
            createdAt: serverTimestamp(),
            recordedBy: currentUser.uid,
            isPaid: selectedPaymentMethod !== 'credit'
        };
        
        await addDoc(collection(db, 'sales'), saleData);
        
        // If credit sale, update credits collection
        if (selectedPaymentMethod === 'credit') {
            await updateCreditsForCustomer(customerName, totalAmount);
        }
        
        // Log user activity
        await logActivity('sale_recorded', 
            `Recorded sale: ${quantity}x ${itemName} for ₦${totalAmount}`);
        
        // Reset form
        saleForm.reset();
        selectedPaymentMethod = 'cash';
        paymentButtons.forEach(btn => btn.classList.remove('active'));
        paymentButtons[0].classList.add('active'); // Cash button
        customerNameGroup.classList.add('hidden');
        customerNameInput.required = false;
        totalAmountSpan.textContent = '0';
        
        // Show success message
        alert('Sale recorded successfully!');
        
        // Refresh dashboard if on dashboard page
        const dashboardPage = document.getElementById('page-dashboard');
        if (dashboardPage.classList.contains('active')) {
            loadDashboardData();
        }
        
    } catch (error) {
        console.error('Error recording sale:', error);
        alert('Error recording sale. Please try again.');
    }
}

// Update credits for customer
async function updateCreditsForCustomer(customerName, amount) {
    try {
        // Check if customer already has credits
        const creditsQuery = query(
            collection(db, 'credits'),
            where('customerName', '==', customerName),
            where('isActive', '==', true)
        );
        
        const creditsSnapshot = await getDocs(creditsQuery);
        
        if (creditsSnapshot.empty) {
            // Create new credit record
            await addDoc(collection(db, 'credits'), {
                customerName: customerName,
                totalOwed: amount,
                transactions: [{
                    amount: amount,
                    date: serverTimestamp(),
                    recordedBy: currentUser.uid,
                    type: 'sale'
                }],
                payments: [],
                lastUpdated: serverTimestamp(),
                isActive: true
            });
        } else {
            // Update existing credit record
            const creditDoc = creditsSnapshot.docs[0];
            const creditData = creditDoc.data();
            
            await updateDoc(doc(db, 'credits', creditDoc.id), {
                totalOwed: creditData.totalOwed + amount,
                transactions: [
                    ...creditData.transactions,
                    {
                        amount: amount,
                        date: serverTimestamp(),
                        recordedBy: currentUser.uid,
                        type: 'sale'
                    }
                ],
                lastUpdated: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error updating credits:', error);
        throw error;
    }
}

// Log user activity
async function logActivity(action, details) {
    try {
        await addDoc(collection(db, 'user_activity'), {
            userId: currentUser.uid,
            action: action,
            details: details,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.warn('Could not log activity:', error);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Get today's date
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        // Load today's sales
        const salesQuery = query(
            collection(db, 'sales'),
            where('saleDate', '>=', startOfDay),
            where('saleDate', '<', endOfDay)
        );
        
        const salesSnapshot = await getDocs(salesQuery);
        const todaySales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Calculate totals
        const totalSales = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalTransactions = todaySales.length;
        
        // Update dashboard
        todaySalesEl.textContent = `₦${totalSales.toLocaleString()}`;
        todayTransactionsEl.textContent = `${totalTransactions} transactions`;
        
        // Load credits summary (admin/manager only)
        if (userRole === 'admin' || userRole === 'manager') {
            await loadCreditsSummary();
            await loadItemsCount();
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load credits summary
async function loadCreditsSummary() {
    try {
        const creditsQuery = query(
            collection(db, 'credits'),
            where('isActive', '==', true),
            where('totalOwed', '>', 0)
        );
        
        const creditsSnapshot = await getDocs(creditsQuery);
        const activeCredits = creditsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const totalCredits = activeCredits.reduce((sum, credit) => sum + credit.totalOwed, 0);
        const creditCustomers = activeCredits.length;
        
        totalCreditsEl.textContent = `₦${totalCredits.toLocaleString()}`;
        creditCustomersEl.textContent = `${creditCustomers} customers`;
        
    } catch (error) {
        console.error('Error loading credits summary:', error);
    }
}

// Load items count
async function loadItemsCount() {
    try {
        const itemsQuery = query(
            collection(db, 'items'),
            where('isActive', '==', true)
        );
        
        const itemsSnapshot = await getDocs(itemsQuery);
        totalItemsEl.textContent = itemsSnapshot.size;
        
    } catch (error) {
        console.error('Error loading items count:', error);
    }
}

// Update dashboard date
function updateDashboardDate() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dashboardDateEl.textContent = today.toLocaleDateString('en-GB', options);
}

// Start real-time listeners
function startRealtimeListeners() {
    // Listen for items changes
    const itemsQuery = query(
        collection(db, 'items'),
        where('isActive', '==', true),
        orderBy('name')
    );
    
    onSnapshot(itemsQuery, (snapshot) => {
        items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    
    // Listen for sales changes (for dashboard updates)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const salesQuery = query(
        collection(db, 'sales'),
        where('saleDate', '>=', startOfDay),
        orderBy('saleDate', 'desc')
    );
    
    onSnapshot(salesQuery, (snapshot) => {
        const dashboardPage = document.getElementById('page-dashboard');
        if (dashboardPage.classList.contains('active')) {
            loadDashboardData();
        }
    });
}

// Utility function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ==================== CREDITS MANAGEMENT ====================

// Load credits data with enhanced functionality
async function loadCreditsData() {
    try {
        const creditsContainer = document.getElementById('credits-list');
        creditsContainer.innerHTML = '<p class="loading-message">Loading credits...</p>';
        
        // Query for active credits with outstanding balances
        const creditsQuery = query(
            collection(db, 'credits'),
            where('isActive', '==', true),
            where('totalOwed', '>', 0),
            orderBy('totalOwed', 'desc')
        );
        
        const creditsSnapshot = await getDocs(creditsQuery);
        
        if (creditsSnapshot.empty) {
            creditsContainer.innerHTML = '<p class="empty-state">No outstanding credits</p>';
            return;
        }
        
        // Build the credits list HTML
        let creditsHTML = `
            <div class="credits-summary">
                <div class="summary-card">
                    <strong>Total Outstanding:</strong> 
                    <span class="total-amount">₦${calculateTotalCredits(creditsSnapshot.docs).toLocaleString()}</span>
                </div>
                <div class="credits-search">
                    <input type="text" id="credits-search-input" placeholder="Search customer name..." class="search-input">
                </div>
            </div>
            <div class="credits-items" id="credits-items">
        `;
        
        creditsSnapshot.docs.forEach(doc => {
            const credit = { id: doc.id, ...doc.data() };
            creditsHTML += generateCreditItemHTML(credit);
        });
        
        creditsHTML += '</div>';
        creditsContainer.innerHTML = creditsHTML;
        
        // Add search functionality
        setupCreditsSearch(creditsSnapshot.docs);
        
        // Add event listeners to credit items
        setupCreditItemListeners();
        
    } catch (error) {
        console.error('Error loading credits:', error);
        document.getElementById('credits-list').innerHTML = 
            '<p class="error-message">Error loading credits. Please try again.</p>';
    }
}

// Generate HTML for a single credit item
function generateCreditItemHTML(credit) {
    const lastTransaction = credit.transactions && credit.transactions.length > 0 
        ? credit.transactions[credit.transactions.length - 1] 
        : null;
    
    const lastPayment = credit.payments && credit.payments.length > 0
        ? credit.payments[credit.payments.length - 1]
        : null;
    
    return `
        <div class="credit-item" data-credit-id="${credit.id}" data-customer-name="${credit.customerName.toLowerCase()}">
            <div class="credit-header">
                <div class="credit-customer">
                    <h4>${credit.customerName}</h4>
                    <p class="credit-amount">₦${credit.totalOwed.toLocaleString()}</p>
                </div>
                <div class="credit-actions">
                    <button class="btn-small btn-view-details" data-credit-id="${credit.id}">
                        View Details
                    </button>
                    <button class="btn-small btn-primary btn-record-payment" data-credit-id="${credit.id}" data-customer-name="${credit.customerName}">
                        Record Payment
                    </button>
                </div>
            </div>
            <div class="credit-meta">
                ${lastTransaction ? `<small>Last purchase: ${formatDateTime(lastTransaction.date)}</small>` : ''}
                ${lastPayment ? `<small>Last payment: ${formatDateTime(lastPayment.date)}</small>` : '<small>No payments yet</small>'}
            </div>
        </div>
    `;
}

// Calculate total credits
function calculateTotalCredits(creditDocs) {
    return creditDocs.reduce((total, doc) => {
        const credit = doc.data();
        return total + (credit.totalOwed || 0);
    }, 0);
}

// Setup credits search
function setupCreditsSearch(creditDocs) {
    const searchInput = document.getElementById('credits-search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const creditItems = document.querySelectorAll('.credit-item');
        
        creditItems.forEach(item => {
            const customerName = item.dataset.customerName;
            if (customerName.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show message if no results
        const visibleItems = document.querySelectorAll('.credit-item:not([style*="display: none"])');
        const creditsItemsContainer = document.getElementById('credits-items');
        
        if (visibleItems.length === 0 && searchTerm) {
            if (!document.getElementById('no-search-results')) {
                const noResultsMsg = document.createElement('p');
                noResultsMsg.id = 'no-search-results';
                noResultsMsg.className = 'empty-state';
                noResultsMsg.textContent = 'No customers found matching your search';
                creditsItemsContainer.appendChild(noResultsMsg);
            }
        } else {
            const noResultsMsg = document.getElementById('no-search-results');
            if (noResultsMsg) {
                noResultsMsg.remove();
            }
        }
    });
}

// Setup credit item listeners
function setupCreditItemListeners() {
    // View details buttons
    document.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const creditId = e.target.dataset.creditId;
            await showCreditDetails(creditId);
        });
    });
    
    // Record payment buttons
    document.querySelectorAll('.btn-record-payment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const creditId = e.target.dataset.creditId;
            const customerName = e.target.dataset.customerName;
            showRecordPaymentModal(creditId, customerName);
        });
    });
}

// Show credit details modal
async function showCreditDetails(creditId) {
    try {
        const creditDoc = await getDoc(doc(db, 'credits', creditId));
        if (!creditDoc.exists()) {
            alert('Credit record not found');
            return;
        }
        
        const credit = { id: creditDoc.id, ...creditDoc.data() };
        
        // Build transactions history
        let transactionsHTML = '<h4>Purchase History</h4><div class="transactions-list">';
        if (credit.transactions && credit.transactions.length > 0) {
            credit.transactions.forEach(transaction => {
                transactionsHTML += `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <span class="transaction-date">${formatDateTime(transaction.date)}</span>
                            <span class="transaction-type">${transaction.type === 'sale' ? 'Purchase' : 'Added'}</span>
                        </div>
                        <span class="transaction-amount">+₦${transaction.amount.toLocaleString()}</span>
                    </div>
                `;
            });
        } else {
            transactionsHTML += '<p class="empty-state">No transactions</p>';
        }
        transactionsHTML += '</div>';
        
        // Build payments history
        let paymentsHTML = '<h4>Payment History</h4><div class="payments-list">';
        if (credit.payments && credit.payments.length > 0) {
            credit.payments.forEach(payment => {
                paymentsHTML += `
                    <div class="payment-item">
                        <div class="payment-info">
                            <span class="payment-date">${formatDateTime(payment.date)}</span>
                            <span class="payment-method">${payment.method || 'Cash'}</span>
                        </div>
                        <span class="payment-amount">-₦${payment.amount.toLocaleString()}</span>
                    </div>
                `;
            });
        } else {
            paymentsHTML += '<p class="empty-state">No payments recorded</p>';
        }
        paymentsHTML += '</div>';
        
        // Show modal
        showModal({
            title: `Credit Details: ${credit.customerName}`,
            content: `
                <div class="credit-details-modal">
                    <div class="credit-summary-modal">
                        <div class="summary-row">
                            <span>Total Purchases:</span>
                            <strong>₦${calculateTotalTransactions(credit.transactions).toLocaleString()}</strong>
                        </div>
                        <div class="summary-row">
                            <span>Total Payments:</span>
                            <strong>₦${calculateTotalPayments(credit.payments).toLocaleString()}</strong>
                        </div>
                        <div class="summary-row highlight">
                            <span>Outstanding Balance:</span>
                            <strong>₦${credit.totalOwed.toLocaleString()}</strong>
                        </div>
                    </div>
                    ${transactionsHTML}
                    ${paymentsHTML}
                </div>
            `,
            actions: [
                {
                    text: 'Record Payment',
                    class: 'btn-primary',
                    onClick: () => {
                        hideModal();
                        showRecordPaymentModal(creditId, credit.customerName);
                    }
                },
                {
                    text: 'Close',
                    class: 'btn-secondary',
                    onClick: hideModal
                }
            ]
        });
        
    } catch (error) {
        console.error('Error showing credit details:', error);
        alert('Error loading credit details');
    }
}

// Show record payment modal
function showRecordPaymentModal(creditId, customerName) {
    showModal({
        title: `Record Payment: ${customerName}`,
        content: `
            <form id="payment-form">
                <div class="form-group">
                    <label for="payment-amount">Payment Amount (₦)</label>
                    <input type="number" id="payment-amount" min="1" step="1" required>
                </div>
                <div class="form-group">
                    <label>Payment Method</label>
                    <div class="payment-methods">
                        <button type="button" class="payment-method-btn active" data-method="cash">Cash</button>
                        <button type="button" class="payment-method-btn" data-method="transfer">Transfer</button>
                        <button type="button" class="payment-method-btn" data-method="pos">POS</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="payment-remarks">Remarks (Optional)</label>
                    <input type="text" id="payment-remarks" placeholder="Any notes about this payment">
                </div>
            </form>
        `,
        actions: [
            {
                text: 'Record Payment',
                class: 'btn-primary',
                onClick: () => recordPayment(creditId)
            },
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onClick: hideModal
            }
        ]
    });
    
    // Setup payment method buttons in modal
    setupModalPaymentButtons();
}

// Setup payment method buttons in modal
function setupModalPaymentButtons() {
    const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
    paymentMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paymentMethodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Record payment
async function recordPayment(creditId) {
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const remarks = document.getElementById('payment-remarks').value.trim();
    const activeMethodBtn = document.querySelector('.payment-method-btn.active');
    const method = activeMethodBtn ? activeMethodBtn.dataset.method : 'cash';
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid payment amount');
        return;
    }
    
    try {
        // Get current credit data
        const creditDoc = await getDoc(doc(db, 'credits', creditId));
        if (!creditDoc.exists()) {
            alert('Credit record not found');
            return;
        }
        
        const creditData = creditDoc.data();
        const newTotalOwed = Math.max(0, creditData.totalOwed - amount);
        
        // Prepare payment record
        const paymentRecord = {
            amount: amount,
            method: method,
            date: serverTimestamp(),
            recordedBy: currentUser.uid,
            remarks: remarks
        };
        
        // Update credit document
        await updateDoc(doc(db, 'credits', creditId), {
            totalOwed: newTotalOwed,
            payments: [...(creditData.payments || []), paymentRecord],
            lastUpdated: serverTimestamp(),
            isActive: newTotalOwed > 0 // Mark as inactive if fully paid
        });
        
        // Log activity
        await logActivity('payment_recorded', 
            `Recorded payment of ₦${amount} from ${creditData.customerName}`);
        
        hideModal();
        alert(`Payment of ₦${amount.toLocaleString()} recorded successfully!`);
        
        // Reload credits data
        loadCreditsData();
        
        // Update dashboard if visible
        const dashboardPage = document.getElementById('page-dashboard');
        if (dashboardPage.classList.contains('active')) {
            loadCreditsSummary();
        }
        
    } catch (error) {
        console.error('Error recording payment:', error);
        alert('Error recording payment. Please try again.');
    }
}

// Calculate total transactions
function calculateTotalTransactions(transactions) {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.reduce((total, t) => total + (t.amount || 0), 0);
}

// Calculate total payments
function calculateTotalPayments(payments) {
    if (!payments || payments.length === 0) return 0;
    return payments.reduce((total, p) => total + (p.amount || 0), 0);
}

// Format date and time
function formatDateTime(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== INVENTORY MANAGEMENT ====================

// Load inventory data
async function loadInventoryData() {
    try {
        const inventoryContainer = document.getElementById('inventory-list');
        inventoryContainer.innerHTML = '<p class="loading-message">Loading inventory...</p>';
        
        // Setup add item button listener
        const addItemBtn = document.getElementById('add-item-btn');
        if (addItemBtn && !addItemBtn.hasListener) {
            addItemBtn.addEventListener('click', showAddItemModal);
            addItemBtn.hasListener = true;
        }
        
        // Query for active items
        const itemsQuery = query(
            collection(db, 'items'),
            where('isActive', '==', true),
            orderBy('name')
        );
        
        const itemsSnapshot = await getDocs(itemsQuery);
        
        if (itemsSnapshot.empty) {
            inventoryContainer.innerHTML = '<p class="empty-state">No items in inventory. Click "Add New Item" to get started.</p>';
            return;
        }
        
        // Build inventory list HTML
        let inventoryHTML = `
            <div class="inventory-controls">
                <div class="inventory-search">
                    <input type="text" id="inventory-search-input" placeholder="Search items..." class="search-input">
                </div>
                <div class="inventory-stats">
                    <span class="stat-badge">Total Items: ${itemsSnapshot.size}</span>
                </div>
            </div>
            <div class="inventory-items" id="inventory-items">
        `;
        
        // Group items by category (if categories exist)
        const itemsByCategory = {};
        const uncategorized = [];
        
        itemsSnapshot.docs.forEach(doc => {
            const item = { id: doc.id, ...doc.data() };
            if (item.category && item.category.trim() !== '') {
                if (!itemsByCategory[item.category]) {
                    itemsByCategory[item.category] = [];
                }
                itemsByCategory[item.category].push(item);
            } else {
                uncategorized.push(item);
            }
        });
        
        // Display categorized items
        Object.keys(itemsByCategory).sort().forEach(category => {
            inventoryHTML += `
                <div class="category-section">
                    <h4 class="category-header">${category}</h4>
                    <div class="category-items">
            `;
            
            itemsByCategory[category].forEach(item => {
                inventoryHTML += generateInventoryItemHTML(item);
            });
            
            inventoryHTML += '</div></div>';
        });
        
        // Display uncategorized items
        if (uncategorized.length > 0) {
            inventoryHTML += `
                <div class="category-section">
                    <h4 class="category-header">Uncategorized</h4>
                    <div class="category-items">
            `;
            
            uncategorized.forEach(item => {
                inventoryHTML += generateInventoryItemHTML(item);
            });
            
            inventoryHTML += '</div></div>';
        }
        
        inventoryHTML += '</div>';
        inventoryContainer.innerHTML = inventoryHTML;
        
        // Setup search functionality
        setupInventorySearch();
        
        // Setup item action listeners
        setupInventoryItemListeners();
        
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventory-list').innerHTML = 
            '<p class="error-message">Error loading inventory. Please try again.</p>';
    }
}

// Generate HTML for inventory item
function generateInventoryItemHTML(item) {
    const lastUpdated = item.updatedAt ? formatDate(item.updatedAt) : 'Never';
    
    return `
        <div class="inventory-item" data-item-id="${item.id}" data-item-name="${item.name.toLowerCase()}">
            <div class="item-main-info">
                <h5>${item.name}</h5>
                <div class="item-price">₦${item.currentPrice.toLocaleString()}</div>
            </div>
            <div class="item-meta">
                <span class="meta-item">Last updated: ${lastUpdated}</span>
                ${item.category ? `<span class="category-badge">${item.category}</span>` : ''}
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-edit" data-item-id="${item.id}" title="Edit item">
                    ✏️
                </button>
                <button class="btn-icon btn-delete" data-item-id="${item.id}" title="Delete item">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// Setup inventory search
function setupInventorySearch() {
    const searchInput = document.getElementById('inventory-search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const inventoryItems = document.querySelectorAll('.inventory-item');
        const categorySections = document.querySelectorAll('.category-section');
        
        categorySections.forEach(section => {
            let hasVisibleItems = false;
            const categoryItems = section.querySelectorAll('.inventory-item');
            
            categoryItems.forEach(item => {
                const itemName = item.dataset.itemName;
                if (itemName.includes(searchTerm)) {
                    item.style.display = 'flex';
                    hasVisibleItems = true;
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Hide category section if no visible items
            section.style.display = hasVisibleItems ? 'block' : 'none';
        });
        
        // Show message if no results
        const visibleItems = document.querySelectorAll('.inventory-item:not([style*="display: none"])');
        const inventoryItemsContainer = document.getElementById('inventory-items');
        
        if (visibleItems.length === 0 && searchTerm) {
            if (!document.getElementById('no-inventory-results')) {
                const noResultsMsg = document.createElement('p');
                noResultsMsg.id = 'no-inventory-results';
                noResultsMsg.className = 'empty-state';
                noResultsMsg.textContent = 'No items found matching your search';
                inventoryItemsContainer.appendChild(noResultsMsg);
            }
        } else {
            const noResultsMsg = document.getElementById('no-inventory-results');
            if (noResultsMsg) {
                noResultsMsg.remove();
            }
        }
    });
}

// Setup inventory item listeners
function setupInventoryItemListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = e.target.dataset.itemId;
            await showEditItemModal(itemId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = e.target.dataset.itemId;
            await handleDeleteItem(itemId);
        });
    });
}

// Show add item modal
function showAddItemModal() {
    showModal({
        title: 'Add New Item',
        content: `
            <form id="add-item-form">
                <div class="form-group">
                    <label for="new-item-name">Item Name *</label>
                    <input type="text" id="new-item-name" required placeholder="e.g., Coca Cola 50cl">
                </div>
                <div class="form-group">
                    <label for="new-item-price">Price (₦) *</label>
                    <input type="number" id="new-item-price" min="0" step="1" required placeholder="e.g., 200">
                </div>
                <div class="form-group">
                    <label for="new-item-category">Category (Optional)</label>
                    <input type="text" id="new-item-category" placeholder="e.g., Beverages" list="category-suggestions">
                    <datalist id="category-suggestions">
                        <option value="Beverages">
                        <option value="Snacks">
                        <option value="Toiletries">
                        <option value="Stationery">
                        <option value="Household">
                        <option value="Electronics">
                        <option value="Food">
                        <option value="Cosmetics">
                    </datalist>
                </div>
            </form>
        `,
        actions: [
            {
                text: 'Add Item',
                class: 'btn-primary',
                onClick: handleAddItem
            },
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onClick: hideModal
            }
        ]
    });
}

// Handle add item
async function handleAddItem() {
    const name = document.getElementById('new-item-name').value.trim();
    const price = parseFloat(document.getElementById('new-item-price').value);
    const category = document.getElementById('new-item-category').value.trim();
    
    if (!name) {
        alert('Please enter an item name');
        return;
    }
    
    if (!price || price < 0) {
        alert('Please enter a valid price');
        return;
    }
    
    try {
        // Check if item already exists
        const itemsQuery = query(
            collection(db, 'items'),
            where('name', '==', name),
            where('isActive', '==', true)
        );
        
        const existingItems = await getDocs(itemsQuery);
        
        if (!existingItems.empty) {
            alert('An item with this name already exists');
            return;
        }
        
        // Add new item
        const newItem = {
            name: name,
            currentPrice: price,
            category: category,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: currentUser.uid,
            lastUpdatedBy: currentUser.uid,
            isActive: true
        };
        
        await addDoc(collection(db, 'items'), newItem);
        
        // Log activity
        await logActivity('item_added', `Added new item: ${name} at ₦${price}`);
        
        hideModal();
        alert('Item added successfully!');
        
        // Reload inventory
        loadInventoryData();
        
    } catch (error) {
        console.error('Error adding item:', error);
        alert('Error adding item. Please try again.');
    }
}

// Show edit item modal
async function showEditItemModal(itemId) {
    try {
        const itemDoc = await getDoc(doc(db, 'items', itemId));
        if (!itemDoc.exists()) {
            alert('Item not found');
            return;
        }
        
        const item = itemDoc.data();
        
        showModal({
            title: `Edit Item: ${item.name}`,
            content: `
                <form id="edit-item-form">
                    <div class="form-group">
                        <label for="edit-item-name">Item Name *</label>
                        <input type="text" id="edit-item-name" value="${item.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-item-price">Price (₦) *</label>
                        <input type="number" id="edit-item-price" value="${item.currentPrice}" min="0" step="1" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-item-category">Category</label>
                        <input type="text" id="edit-item-category" value="${item.category || ''}" list="category-suggestions">
                        <datalist id="category-suggestions">
                            <option value="Beverages">
                            <option value="Snacks">
                            <option value="Toiletries">
                            <option value="Stationery">
                            <option value="Household">
                            <option value="Electronics">
                            <option value="Food">
                            <option value="Cosmetics">
                        </datalist>
                    </div>
                </form>
            `,
            actions: [
                {
                    text: 'Save Changes',
                    class: 'btn-primary',
                    onClick: () => handleEditItem(itemId)
                },
                {
                    text: 'Cancel',
                    class: 'btn-secondary',
                    onClick: hideModal
                }
            ]
        });
        
    } catch (error) {
        console.error('Error loading item:', error);
        alert('Error loading item details');
    }
}

// Handle edit item
async function handleEditItem(itemId) {
    const name = document.getElementById('edit-item-name').value.trim();
    const price = parseFloat(document.getElementById('edit-item-price').value);
    const category = document.getElementById('edit-item-category').value.trim();
    
    if (!name) {
        alert('Please enter an item name');
        return;
    }
    
    if (!price || price < 0) {
        alert('Please enter a valid price');
        return;
    }
    
    try {
        // Update item
        await updateDoc(doc(db, 'items', itemId), {
            name: name,
            currentPrice: price,
            category: category,
            updatedAt: serverTimestamp(),
            lastUpdatedBy: currentUser.uid
        });
        
        // Log activity
        await logActivity('item_updated', `Updated item: ${name}`);
        
        hideModal();
        alert('Item updated successfully!');
        
        // Reload inventory
        loadInventoryData();
        
    } catch (error) {
        console.error('Error updating item:', error);
        alert('Error updating item. Please try again.');
    }
}

// Handle delete item
async function handleDeleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Soft delete - mark as inactive
        await updateDoc(doc(db, 'items', itemId), {
            isActive: false,
            updatedAt: serverTimestamp(),
            lastUpdatedBy: currentUser.uid
        });
        
        // Log activity
        await logActivity('item_deleted', `Deleted item with ID: ${itemId}`);
        
        alert('Item deleted successfully!');
        
        // Reload inventory
        loadInventoryData();
        
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
    }
}

// ==================== USER MANAGEMENT ====================

// Load users data (Admin only)
async function loadUsersData() {
    if (userRole !== 'admin') {
        document.getElementById('users-list').innerHTML = 
            '<p class="error-message">You do not have permission to view this page.</p>';
        return;
    }
    
    try {
        const usersContainer = document.getElementById('users-list');
        usersContainer.innerHTML = '<p class="loading-message">Loading users...</p>';
        
        // Setup add user button listener
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn && !addUserBtn.hasListener) {
            addUserBtn.addEventListener('click', showAddUserModal);
            addUserBtn.hasListener = true;
        }
        
        // Query all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        if (usersSnapshot.empty) {
            usersContainer.innerHTML = '<p class="empty-state">No users found.</p>';
            return;
        }
        
        // Build users list HTML
        let usersHTML = `
            <div class="users-table">
                <div class="table-header">
                    <div class="th-name">Name</div>
                    <div class="th-email">Email</div>
                    <div class="th-role">Role</div>
                    <div class="th-status">Status</div>
                    <div class="th-last-login">Last Login</div>
                    <div class="th-actions">Actions</div>
                </div>
                <div class="table-body">
        `;
        
        usersSnapshot.docs.forEach(doc => {
            const user = { id: doc.id, ...doc.data() };
            usersHTML += generateUserRowHTML(user);
        });
        
        usersHTML += '</div></div>';
        usersContainer.innerHTML = usersHTML;
        
        // Setup user action listeners
        setupUserActionListeners();
        
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-list').innerHTML = 
            '<p class="error-message">Error loading users. Please try again.</p>';
    }
}

// Generate HTML for user row
function generateUserRowHTML(user) {
    const lastLogin = user.lastLogin ? formatDateTime(user.lastLogin) : 'Never';
    const statusClass = user.isActive ? 'active' : 'inactive';
    const statusText = user.isActive ? 'Active' : 'Inactive';
    
    return `
        <div class="table-row user-row" data-user-id="${user.id}">
            <div class="td-name">${user.displayName || 'No name'}</div>
            <div class="td-email">${user.email}</div>
            <div class="td-role">
                <span class="role-badge ${user.role}">${user.role}</span>
            </div>
            <div class="td-status">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="td-last-login">${lastLogin}</div>
            <div class="td-actions">
                <button class="btn-icon btn-edit-user" data-user-id="${user.id}" title="Edit user">
                    ✏️
                </button>
                ${user.id !== currentUser.uid ? `
                    <button class="btn-icon btn-toggle-user" data-user-id="${user.id}" data-is-active="${user.isActive}" title="${user.isActive ? 'Deactivate' : 'Activate'} user">
                        ${user.isActive ? '🔒' : '🔓'}
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Setup user action listeners
function setupUserActionListeners() {
    // Edit user buttons
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.dataset.userId;
            await showEditUserModal(userId);
        });
    });
    
    // Toggle user status buttons
    document.querySelectorAll('.btn-toggle-user').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.dataset.userId;
            const isActive = e.target.dataset.isActive === 'true';
            await toggleUserStatus(userId, !isActive);
        });
    });
}

// Show add user modal
function showAddUserModal() {
    showModal({
        title: 'Add New User',
        content: `
            <form id="add-user-form">
                <div class="form-group">
                    <label for="new-user-email">Email *</label>
                    <input type="email" id="new-user-email" required placeholder="user@example.com">
                </div>
                <div class="form-group">
                    <label for="new-user-name">Display Name *</label>
                    <input type="text" id="new-user-name" required placeholder="John Doe">
                </div>
                <div class="form-group">
                    <label for="new-user-password">Temporary Password *</label>
                    <input type="password" id="new-user-password" required placeholder="At least 6 characters">
                    <small>User will need to change this on first login</small>
                </div>
                <div class="form-group">
                    <label for="new-user-role">Role *</label>
                    <select id="new-user-role" required>
                        <option value="entry-only">Entry Only (Record sales only)</option>
                        <option value="manager">Manager (Sales, inventory, credits)</option>
                        <option value="admin">Admin (Full access)</option>
                    </select>
                </div>
            </form>
        `,
        actions: [
            {
                text: 'Create User',
                class: 'btn-primary',
                onClick: handleAddUser
            },
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onClick: hideModal
            }
        ]
    });
}

// Handle add user
async function handleAddUser() {
    const email = document.getElementById('new-user-email').value.trim();
    const displayName = document.getElementById('new-user-name').value.trim();
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;
    
    if (!email || !displayName || !password || !role) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    try {
        // Note: In a real implementation, you would need to create the user through
        // Firebase Admin SDK on the server side. For now, we'll just show the process
        alert('Note: User creation requires server-side implementation with Firebase Admin SDK.\n\nFor now, you can manually create users in Firebase Console and then add their details here.');
        
        // This is what you would do after the user is created in Firebase Auth:
        /*
        const newUser = {
            email: email,
            displayName: displayName,
            role: role,
            isActive: true,
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid
        };
        
        await setDoc(doc(db, 'users', newUserId), newUser);
        */
        
        hideModal();
        
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating user. Please try again.');
    }
}

// Show edit user modal
async function showEditUserModal(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            alert('User not found');
            return;
        }
        
        const user = userDoc.data();
        const isCurrentUser = userId === currentUser.uid;
        
        showModal({
            title: `Edit User: ${user.displayName || user.email}`,
            content: `
                <form id="edit-user-form">
                    <div class="form-group">
                        <label for="edit-user-name">Display Name *</label>
                        <input type="text" id="edit-user-name" value="${user.displayName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-email">Email</label>
                        <input type="email" id="edit-user-email" value="${user.email}" disabled>
                        <small>Email cannot be changed</small>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-role">Role *</label>
                        <select id="edit-user-role" required ${isCurrentUser ? 'disabled' : ''}>
                            <option value="entry-only" ${user.role === 'entry-only' ? 'selected' : ''}>Entry Only</option>
                            <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        ${isCurrentUser ? '<small>You cannot change your own role</small>' : ''}
                    </div>
                </form>
            `,
            actions: [
                {
                    text: 'Save Changes',
                    class: 'btn-primary',
                    onClick: () => handleEditUser(userId)
                },
                {
                    text: 'Cancel',
                    class: 'btn-secondary',
                    onClick: hideModal
                }
            ]
        });
        
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Error loading user details');
    }
}

// Handle edit user
async function handleEditUser(userId) {
    const displayName = document.getElementById('edit-user-name').value.trim();
    const role = document.getElementById('edit-user-role').value;
    
    if (!displayName) {
        alert('Please enter a display name');
        return;
    }
    
    try {
        const updateData = {
            displayName: displayName
        };
        
        // Only update role if not editing self
        if (userId !== currentUser.uid) {
            updateData.role = role;
        }
        
        await updateDoc(doc(db, 'users', userId), updateData);
        
        // Log activity
        await logActivity('user_updated', `Updated user: ${displayName}`);
        
        hideModal();
        alert('User updated successfully!');
        
        // Reload users
        loadUsersData();
        
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Error updating user. Please try again.');
    }
}

// Toggle user status
async function toggleUserStatus(userId, newStatus) {
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        await updateDoc(doc(db, 'users', userId), {
            isActive: newStatus
        });
        
        // Log activity
        await logActivity('user_status_changed', 
            `${newStatus ? 'Activated' : 'Deactivated'} user ID: ${userId}`);
        
        alert(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        
        // Reload users
        loadUsersData();
        
    } catch (error) {
        console.error('Error updating user status:', error);
        alert('Error updating user status. Please try again.');
    }
}

// ==================== MODAL FUNCTIONS ====================

// Show modal
function showModal({ title, content, actions = [] }) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    let actionsHTML = '';
    if (actions.length > 0) {
        actionsHTML = '<div class="modal-footer">';
        actions.forEach(action => {
            actionsHTML += `<button class="${action.class} modal-action-btn">${action.text}</button>`;
        });
        actionsHTML += '</div>';
    }
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" onclick="hideModal()">×</button>
        </div>
        <div class="modal-body">
            ${content}
        </div>
        ${actionsHTML}
    `;
    
    // Add action listeners
    if (actions.length > 0) {
        const actionBtns = modalContent.querySelectorAll('.modal-action-btn');
        actionBtns.forEach((btn, index) => {
            btn.addEventListener('click', actions[index].onClick);
        });
    }
    
    modalOverlay.classList.remove('hidden');
}

// Hide modal
function hideModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.add('hidden');
}

// Make hideModal globally available
window.hideModal = hideModal;