# 🏪 TOE's Shop - Convenience Store Management System

A modern, web-based inventory and sales management system for small convenience stores. Built with vanilla JavaScript and Firebase, designed for simplicity and ease of use.

![TOE's Shop Logo](TOE%20Shop%20Logo.ico)

## ✨ Features

### 📊 **Sales Management**
- Quick and intuitive sale recording
- Multiple payment methods (Cash, POS, Transfer, Credit)
- Automatic inventory deduction
- Real-time sales tracking

### 📦 **Inventory Control**
- Stock level monitoring with visual indicators
- Low stock alerts
- Restock management
- Category organization
- Stock history tracking

### 💳 **Credit Management**
- Customer credit tracking
- Payment recording
- Credit history and balance management
- Outstanding balance summaries

### 👥 **User Management**
- Role-based access control (Admin, Manager, Entry-Only)
- User activity logging
- Secure authentication via Firebase

### 📈 **Reporting**
- Daily sales summaries
- Custom date range reports
- Payment method analytics
- Top-selling products
- CSV export functionality

### 🎨 **User Experience**
- Responsive design for all devices
- Real-time updates
- Intuitive navigation
- Beautiful purple gradient theme
- Custom scrollbars

## 🚀 Demo

Visit the live application: [https://osioke.github.io/shop/](https://osioke.github.io/shop/)

**Demo Credentials:**
> Note: Contact repository owner for demo access

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Firebase (Firestore & Authentication)
- **Hosting**: GitHub Pages
- **Icons**: Emoji-based for universal compatibility
- **No Build Tools**: Pure JavaScript modules for simplicity

## 📋 Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase project with Firestore and Authentication enabled
- Basic knowledge of Firebase console

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/osioke/shop.git
cd shop
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Enable **Firestore Database**
4. Create a web app and copy your configuration

### 3. Configure Firebase

Update `js/firebase-config.js` with your Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 4. Set Up Firestore Structure

Create these collections in Firestore:

#### Users Collection
```javascript
{
  email: "user@example.com",
  displayName: "User Name",
  role: "admin", // or "manager" or "entry-only"
  isActive: true,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

#### Items Collection
```javascript
{
  name: "Product Name",
  currentPrice: 100,
  quantity: 50,
  minStock: 10,
  category: "Beverages",
  isActive: true,
  stockHistory: [],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Sales Collection
```javascript
{
  itemId: "item_doc_id",
  itemName: "Product Name",
  quantity: 2,
  unitPrice: 100,
  totalAmount: 200,
  paymentMethod: "cash",
  customerName: "",
  saleDate: timestamp,
  recordedBy: "user_uid"
}
```

#### Credits Collection
```javascript
{
  customerName: "Customer Name",
  totalOwed: 500,
  transactions: [],
  payments: [],
  isActive: true,
  lastUpdated: timestamp
}
```

### 5. Create Firestore Indexes

Required composite indexes:
1. **credits**: `isActive (Asc)` + `totalOwed (Desc)`
2. **items**: `isActive (Asc)` + `name (Asc)`
3. **sales**: `saleDate (Asc)` + `saleDate (Desc)`

### 6. Create First Admin User

1. Go to Firebase Console → Authentication
2. Add a new user with email/password
3. Copy the user's UID
4. Create a document in Firestore `users` collection with the UID as document ID:
```javascript
{
  email: "admin@example.com",
  displayName: "Admin Name",
  role: "admin",
  isActive: true,
  createdAt: serverTimestamp()
}
```

### 7. Deploy

For GitHub Pages:
1. Push to your repository
2. Go to Settings → Pages
3. Select source branch (usually `main`)
4. Save and wait for deployment

## 📱 Usage

### User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access to all features including user management |
| **Manager** | Sales, inventory, credits, reports (no user management) |
| **Entry-Only** | Only record sales and check prices |

### Key Workflows

#### Recording a Sale
1. Navigate to "Record Sale"
2. Search and select product
3. Enter quantity
4. Select payment method
5. Submit sale

#### Managing Inventory
1. Navigate to "Inventory"
2. Add new items or restock existing ones
3. Monitor stock levels (Green/Orange/Red indicators)
4. Update prices as needed

#### Handling Credits
1. Navigate to "Credits"
2. View outstanding balances
3. Record customer payments
4. Track payment history

## 🎨 Customization

### Changing Colors
Edit the gradient colors in `css/style.css`:
```css
/* Main gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Adding Categories
Update the category suggestions in inventory forms:
```html
<option value="Your Category">
```

### Modifying Stock Thresholds
In `app.js`, adjust the `getStockStatus` function:
```javascript
if (quantity <= 0) return { class: 'out-of-stock', text: 'Out of Stock' };
else if (quantity <= 10) return { class: 'low-stock', text: 'Low Stock' };
else return { class: 'in-stock', text: 'In Stock' };
```

## 🔒 Security

- Authentication handled by Firebase Auth
- Role-based access control on client and server (Firestore rules)
- Secure session management
- Input validation and sanitization
- HTTPS only deployment

### Recommended Firestore Rules
```javascript
// Users can only read their own document
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId && 
    request.auth.token.role == 'admin';
}

// Items - read all, write based on role
match /items/{itemId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    request.auth.token.role in ['admin', 'manager'];
}

// Sales - authenticated users can create, admins/managers can read all
match /sales/{saleId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null && 
    request.auth.token.role in ['admin', 'manager'];
}
```

## 🐛 Troubleshooting

### Common Issues

#### "userRole is undefined"
- Clear browser cache
- Ensure user document exists in Firestore with correct role

#### Inventory not updating after sales
- Check browser console for errors
- Verify Firestore write permissions
- Ensure item exists in inventory

#### Credits page shows error
- Create required Firestore indexes
- Check console for index creation links

## 📈 Performance Optimization

- Real-time listeners for live updates
- Efficient Firestore queries with proper indexing
- Lazy loading of page-specific data
- Minimal external dependencies
- CSS animations use GPU acceleration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Family members (T, O, E) who inspired this project
- Firebase for the excellent backend infrastructure
- The open-source community for inspiration

## 📞 Support

For support, email [your-email] or open an issue in this repository.

## 🚦 Project Status

**Active Development** - Regular updates and improvements

### Upcoming Features
- [ ] Profit margin tracking
- [ ] Barcode scanning support
- [ ] Advanced analytics dashboard
- [ ] Offline mode with sync

---

Built with ❤️ for TOE's Shop - Making convenience store management simple and efficient!