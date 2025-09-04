

# **WORTH**  

## **Overview**  
This platform allows users to **import, track, and trade** their investments in **stocks, crypto, and mutual funds**.  
It integrates **brokers (AngelOne, Upstox, 5Paisa)** for stock trading, **Binance API** for crypto transactions, and an **AI-powered recommendation engine** for investment insights.  

---

## **Features**  
✅ **User Authentication** – Secure login & API key management  
✅ **Broker API Integration** – Fetch stock holdings from AngelOne, Upstox, and 5Paisa  
✅ **Crypto Wallet Support** – Connect Binance and other wallets  
✅ **Buy/Sell Stocks & Crypto** – Execute trades through respective APIs  
✅ **AI-Driven Investment Insights** – Smart portfolio analysis and goal tracking  
✅ **Live Market Data** – Get real-time stock & crypto prices  

---

## **Platform Flow 🔄**  
1. **User Registration & Login**  
2. **Broker API Connection** – Fetch stock holdings  
3. **Crypto Wallet Connection** – Fetch crypto assets  
4. **Dashboard** – Display investments & market data  
5. **Buy/Sell Stocks via Broker APIs**  
6. **Buy/Sell Crypto via Binance API**  
7. **AI Model Suggests Growth Strategies**  
8. **User Sets Goals & Adjusts Portfolio**  

### **Flow Diagram 🔄**  

![image](https://github.com/user-attachments/assets/83963550-38a8-4716-9b86-b55b9e773623)

---

---

## **Tech Stack**  
- **Frontend**: Next.js, React, Tailwind CSS  
- **Backend**: Node.js, Express.js  
- **Database**: MongoDB 
- **APIs Used**:  
  - **Stock Trading**: AngelOne, Upstox, 5Paisa  
  - **Crypto Transactions**: Binance API  
  - **Market Data**: Alpha Vantage, CoinGecko  
- **AI/ML**: Python (scikit-learn, TensorFlow)  

---

## **Setup & Installation 🛠️**  

### 1️⃣ Clone the Repo  
```sh
git clone https://github.com/AKASH7233/UETP.git
cd UETP
```

### 2️⃣ Install Dependencies  
Navigate to both the **server** and **client** folders and install dependencies:  

```sh
cd server
npm install
cd ../client
npm install
```

### 3️⃣ Configure Environment Variables  
Create a `.env` file in both `server/` and `client/` directories and add:  

**Server (`server/.env`):**  
```
MONGO_URI=your_mongodb_uri
BINANCE_API_KEY=your_binance_api_key
BROKER_API_KEY=your_broker_api_key
```

**Client (`client/.env`):**  
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 4️⃣ Run the Application  

#### **Start the Server**  
```sh
cd server
npm run start
```

#### **Start the Client**  
Open a new terminal and run:  
```sh
cd client
npm run dev
```

### 5️⃣ Open in Browser  
Visit: **`http://localhost:3000`**  

---

## **Contributing**  
🚀 **Follow this commit message format:**  
- `[Feat] - Add some feature`  
- `[Fix] - Fix a bug`  
- `[Refactor] - Refactor existing code`  
- `[Docs] - Update documentation`  
- `[Chore] - Maintenance or non-functional changes`  

Example:  
```sh
git commit -m "[Feat] - Add Binance API integration for crypto trading"
```

Pull requests should follow the same **commit message structure** to maintain clarity and organization.


---

## **License**  
📝 MIT License  

---
