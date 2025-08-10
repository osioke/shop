# 📦 TOE's Shop Management System - User Guide

Welcome to TOE's Shop! This guide will help you use our digital shop management system effectively.

---

## 🔐 Getting Started - Logging In

1. **Open the app**: Go to https://osioke.github.io/shop/ on any device (phone, tablet, or computer)
2. **Enter your credentials**:
   - Email: Your registered email address
   - Password: Your password (given by the admin)
3. **Click "Sign In"**

> 💡 **Tip**: Save the website to your home screen on your phone for easy access!

---

## 👥 User Roles Explained

### 🟣 **Admin** (Full Access)
Can do everything including managing users and viewing all reports

### 🟢 **Manager** (Most Features)
Can manage inventory, credits, and reports but cannot manage users

### 🔵 **Entry-Only Staff** (Basic Access)
Can only record sales and check prices

---

## 📊 Dashboard Overview

When you log in, you'll see the dashboard with:
- **Today's Sales**: Total money made today
- **Outstanding Credits**: Money customers owe us
- **Total Items**: Number of products in inventory (Managers/Admins only)
- **Quick Action Buttons**: Shortcuts to common tasks

---

## 💰 Recording a Sale (All Users)

This is the most important daily task!

### Steps to Record a Sale:
1. Click **"Record Sale"** from the navigation or dashboard
2. **Search for the item**:
   - Start typing the product name (e.g., "Coca Cola")
   - Click on the item when it appears
3. **Enter quantity**: How many were sold?
4. **Check the price**: It should auto-fill, but you can change it if needed
5. **Choose payment method**:
   - **Cash** (default)
   - **POS** (card payment)
   - **Transfer** (bank transfer)
   - **Credit** (customer will pay later - enter their name!)
6. **Add remarks** (optional): Any special notes
7. Click **"Record Sale"**

> ⚠️ **Important**: For credit sales, ALWAYS enter the customer's name!

### What Happens After a Sale:
- The inventory automatically reduces ✅
- Credit sales are tracked under the customer's name ✅
- Dashboard updates with new totals ✅

---

## 🔍 Checking Prices (All Users)

Need to quickly check a product's price?

1. Click **"Check Price"** 
2. Type the product name
3. The price appears instantly!

---

## 💳 Managing Credits (Managers & Admins Only)

Keep track of who owes money to the shop.

### Viewing Credits:
1. Click **"Credits"** in navigation
2. See all customers with outstanding balances
3. Search for specific customers using the search box

### Recording a Payment:
1. Find the customer in the Credits list
2. Click **"Record Payment"**
3. Enter the amount they're paying
4. Choose payment method (Cash/POS/Transfer)
5. Click **"Record Payment"**

### Viewing Credit History:
- Click **"View Details"** to see:
  - All purchases made on credit
  - All payments made
  - Outstanding balance

---

## 📦 Managing Inventory (Managers & Admins Only)

Keep track of all products and their stock levels.

### Understanding Stock Indicators:
- 🟢 **Green (In Stock)**: More than 10 units available
- 🟠 **Orange (Low Stock)**: 10 or fewer units - time to restock!
- 🔴 **Red (Out of Stock)**: No units available - restock urgently!

### Adding a New Product:
1. Click **"Inventory"** → **"Add New Item"**
2. Enter:
   - Product name (e.g., "Coca Cola 50cl")
   - Price
   - Initial quantity (how many you have)
   - Category (optional, e.g., "Beverages")
3. Click **"Add Item"**

### Restocking Products:
When new stock arrives:
1. Find the product in Inventory
2. Click the **📦 button** (restock)
3. Enter how many units you're adding
4. Add supplier name and notes (optional)
5. Click **"Add Stock"**

### Editing Product Details:
1. Click the **✏️ button** on any product
2. Update name, price, or category
3. Click **"Save Changes"**

### Removing Products:
- Click the **🗑️ button** to remove products you no longer sell
- This doesn't delete history, just hides the item

---

## 👥 Managing Users (Admins Only)

Control who can access the system.

### Current User Setup:
> **Note**: Currently, new users must be created in Firebase first, then added to the system. Contact your technical admin for this.

### Editing Users:
1. Click **"Users"** in navigation
2. Find the user
3. Click **✏️ to edit their name or role**
4. Click **🔒/🔓 to activate or deactivate** their access

### User Roles:
- **Admin**: Give to trusted family members who need full control
- **Manager**: Give to supervisors who manage daily operations
- **Entry-Only**: Give to cashiers who only record sales

---

## 📈 Viewing Reports (Managers & Admins Only)

Track business performance over time.

### Generating Reports:
1. Click **"Reports"**
2. Select date range:
   - "From Date": Start date
   - "To Date": End date
3. Click **"Generate Report"**

### What You'll See:
- **Total sales amount** for the period
- **Number of transactions**
- **Average sale value**
- **Daily breakdown** of sales
- **Payment methods** used
- **Top selling products**

### Exporting Reports:
- Click **"Export to CSV"** to download for Excel
- Share with accountants or for record keeping

---

## 💡 Daily Tips for Success

### 🌅 Start of Day:
1. Check dashboard for yesterday's totals
2. Check low stock items in Inventory
3. Review any outstanding credits

### 💼 During the Day:
1. Record EVERY sale immediately
2. Always select the correct payment method
3. For credit sales, ALWAYS enter customer name
4. Check "Low Stock" warnings

### 🌙 End of Day:
1. Review today's sales on dashboard
2. Check if any items need restocking
3. Note any credits given today

---

## ⚠️ Common Issues & Solutions

### "Item not found in inventory"
- **For Managers/Admins**: Add the item to inventory first, or add it during the sale
- **For Entry-Only Staff**: Ask a manager to add the item

### "Low Stock" Warning Appears
- Note which items are low
- Inform the manager/admin to restock
- You can still sell even if stock shows 0 (in case new stock just arrived)

### Forgot Password
- Click "Forgot password?" on login page
- Enter your email
- Check your email for reset instructions

### Wrong Price Showing
- **For Managers/Admins**: Edit the item in Inventory
- **For Entry-Only Staff**: Ask a manager to update the price

---

## 📱 Mobile Tips

The app works great on phones! Tips:
- Add to home screen for app-like experience
- Turn phone sideways for better tables view
- Scroll left/right on navigation if needed
- All features work exactly the same as desktop

---

## 🚨 Important Rules

1. **NEVER share your login** with anyone
2. **Always log out** on shared computers
3. **Record sales immediately** - don't wait
4. **Double-check credit customer names** - spelling matters!
5. **Report any issues** to admin immediately

---

## 📞 Need Help?

If you encounter any problems:
1. **First**: Try refreshing the page
2. **Second**: Log out and log back in
3. **Third**: Clear your browser cache
4. **Finally**: Contact your Admin user

---

## 🎯 Quick Reference

| Task | Who Can Do It | Where to Find It |
|------|--------------|------------------|
| Record Sale | Everyone | Record Sale button |
| Check Price | Everyone | Check Price button |
| Manage Credits | Managers & Admins | Credits tab |
| Add/Restock Items | Managers & Admins | Inventory tab |
| View Reports | Managers & Admins | Reports tab |
| Manage Users | Admins Only | Users tab |

---

## 🎉 You're Ready!

Start with recording a sale - it's the most important feature. Everything else will become natural with practice.

Remember: The system automatically tracks everything, so just focus on entering information correctly.

**Welcome to the TOE's Shop family! Let's grow together! 💜**