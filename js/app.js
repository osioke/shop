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
        const existingItem = items.find(item => 
            item.name.toLowerCase() === itemName.toLowerCase()
        );
        
        if (existingItem) {
            itemId = existingItem.id;
            
            // Update price if different (admin/manager only)
            if (existingItem.currentPrice !== unitPrice && 
                (userRole === 'admin' || userRole === 'manager')) {
                await updateDoc(doc(db, 'items', itemId), {
                    currentPrice: unitPrice,
                    updatedAt: serverTimestamp(),
                    lastUpdatedBy: currentUser.uid
                });
            }
        } else if (userRole === 'admin' || userRole === 'manager') {
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
        } else {
            alert('Item not found. Please ask an admin or manager to add new items.');
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

// Load credits data (placeholder for now)
function loadCreditsData() {
    // Will be implemented when credits page is built
    console.log('Loading credits data...');
}

// Load inventory data (placeholder for now)
function loadInventoryData() {
    // Will be implemented when inventory page is built
    console.log('Loading inventory data...');
}

// Load users data (placeholder for now)
function loadUsersData() {
    // Will be implemented when users page is built
    console.log('Loading users data...');
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