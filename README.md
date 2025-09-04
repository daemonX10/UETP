# UETP - Stock Trading Platform
## Final Year Project

A comprehensive real-time stock trading platform built with modern web technologies, featuring real-time market data, portfolio management, and order placement capabilities.

## 🚀 Project Overview

This full-stack trading platform provides:

- **Real-time Market Data**: Live stock prices with WebSocket connections
- **User Authentication**: Secure JWT-based authentication system
- **Portfolio Management**: Track holdings, P&L, and performance
- **Order Placement**: Buy/sell stocks with validation
- **Market Analysis**: Top gainers, losers, and market trends
- **Responsive UI**: Modern, mobile-friendly interface

## 🛠 Technology Stack

### Frontend
- **Next.js 15.2.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI components
- **WebSocket Client** - Real-time data updates

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **JWT** - JSON Web Tokens for authentication
- **WebSocket** - Real-time communication
- **bcryptjs** - Password hashing

## 📁 Project Structure

```
UETP/
├── client/                 # Frontend (Next.js)
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   │   ├── dashboard/ # Main dashboard
│   │   │   ├── login/     # Authentication
│   │   │   ├── register/  # User registration
│   │   │   ├── portfolio/ # Portfolio management
│   │   │   └── trading/   # Order placement
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/          # API client and utilities
│   ├── public/           # Static assets
│   └── package.json      # Dependencies
├── server/               # Backend (Node.js/Express)
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # Database schemas
│   │   ├── routes/       # API routes
│   │   ├── middlewares/  # Authentication middleware
│   │   └── utils/        # Utility functions
│   └── package.json      # Dependencies
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd UETP
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   ```

### Environment Configuration

1. **Backend Environment** (`server/.env`)
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/uetp_trading
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:3000
   CORS_ORIGIN=http://localhost:3000
   ```

2. **Frontend Environment** (`client/.env.local`)
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_WS_URL=ws://localhost:5000
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd server
   npm start
   ```
   Server will run on: http://localhost:5000

2. **Start Frontend Development Server**
   ```bash
   cd client
   npm run dev
   ```
   Application will run on: http://localhost:3000

## 📋 Features

### ✅ Implemented Features

1. **User Authentication**
   - User registration with email verification
   - Secure login/logout
   - JWT token management
   - Protected routes

2. **Real-time Market Data**
   - Live stock prices (15 Indian stocks)
   - WebSocket connections
   - Automatic reconnection
   - Real-time updates every 2 seconds

3. **Portfolio Management**
   - View holdings and positions
   - Real-time P&L calculations
   - Portfolio summary cards
   - Performance tracking

4. **Trading System**
   - Buy/sell order placement
   - Stock search functionality
   - Order validation
   - Market data integration

5. **Dashboard**
   - Portfolio overview
   - Market movers (gainers/losers)
   - Watchlist management
   - Quick action buttons

### 🔄 API Endpoints

#### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

#### Market Data
- `GET /api/market/stocks` - Get all stocks
- `GET /api/market/gainers` - Top gainers
- `GET /api/market/losers` - Top losers
- `WebSocket /` - Real-time market data

#### Portfolio
- `GET /api/portfolio` - Get user portfolio
- `GET /api/portfolio/holdings` - Get holdings

#### Trading
- `POST /api/trading/buy` - Place buy order
- `POST /api/trading/sell` - Place sell order

## 📊 Database Schema

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Stock Schema
```javascript
{
  symbol: String (unique),
  name: String,
  price: Number,
  change: Number,
  changePercent: Number,
  volume: Number,
  marketCap: Number,
  lastUpdated: Date
}
```

### Portfolio Schema
```javascript
{
  userId: ObjectId,
  symbol: String,
  quantity: Number,
  averagePrice: Number,
  currentPrice: Number,
  totalInvestment: Number,
  currentValue: Number,
  pnl: Number,
  pnlPercent: Number
}
```

## 🎯 Usage Guide

### 1. Registration
- Navigate to `/register`
- Fill in name, email, and password
- Click "Create Account"

### 2. Login
- Navigate to `/login`
- Enter email and password
- Access dashboard after successful login

### 3. Dashboard
- View portfolio summary
- Monitor watchlist with live prices
- See market movers
- Quick navigation to other sections

### 4. Portfolio
- View all holdings
- See real-time P&L
- Track performance metrics

### 5. Trading
- Search for stocks
- View real-time prices
- Place buy/sell orders
- Validate order details

## 🔧 Development

### Frontend Development
```bash
cd client
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd server
npm start            # Start server
npm run dev          # Start with nodemon (if configured)
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy with automatic builds

### Backend (Railway/Heroku)
1. Create new project
2. Connect GitHub repository
3. Set environment variables
4. Deploy with automatic builds

### Database (MongoDB Atlas)
1. Create cluster
2. Configure network access
3. Update connection string

## 📈 Market Data Simulation

The platform includes a comprehensive market data simulation system:

- **15 Indian Stocks**: RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, BHARTIARTL, WIPRO, MARUTI, SUNPHARMA, ULTRACEMCO, TITAN, NESTLEIND, TECHM, BAJFINANCE
- **Real-time Updates**: Price changes every 2 seconds
- **Realistic Movement**: Prices fluctuate within realistic ranges
- **Volume Simulation**: Random volume generation
- **WebSocket Broadcasting**: Live updates to all connected clients

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Server-side validation
- **Error Handling**: Comprehensive error responses

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live data without page refresh
- **Loading States**: Smooth user experience
- **Error Handling**: User-friendly error messages
- **Modern Components**: Clean, professional interface

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

This is a final year project. For academic purposes and evaluation.

## 📝 License

This project is developed for educational purposes as part of a final year project.

## 🆘 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure MongoDB is running
   - Check environment variables
   - Verify port availability

2. **WebSocket Connection Failed**
   - Check backend server status
   - Verify WebSocket URL
   - Check firewall settings

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

### Support

For issues and questions related to this final year project, please refer to the documentation or contact the project team.

---

**Project Status**: ✅ Production Ready

**Last Updated**: January 2025

**Version**: 1.0.0
