# 💎 Master API & Frontend Integration Guide

This is the comprehensive "Source of Truth" for every frontend-facing API in the system. Use this as a reference for authentication, modular billing, customer management, and system configuration.

---

## 🔑 1. Security & Authentication

All requests to this API (except public ones) must follow the **"Route First, Auth Second"** pattern.

### Base Configuration
- **Base URL**: `http://localhost:8080/aurixwebapi`
- **Content-Type**: `application/json`

### Required Authentication Headers
Standard headers for secured endpoints:
| Header | Description | Required |
| :--- | :--- | :--- |
| `username` | API User Username | Yes |
| `password` | API User Password | Yes |
| `shopcode` | (Optional Query Param) | For Multi-Branch routing |

### 🛠️ API User (Client Security)
Managing client identities that use these APIs.
- **Base Path**: `/apiuser`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/create` | Create a new API client user. |
| `PUT` | `/update/{id}`| Update client credentials/role. |
| `GET` | `/find-by-id/{id}`| Fetch client info (password hidden). |
| `DELETE`| `/delete/{id}`| Remove an API client. |

### 👤 System User & Login
Managing system users (Staff/Admins) and the main login flow.
- **Base Path**: `/user`

| Method | Endpoint | Description | JSON Model |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Main user login. | `{username, password}` |
| `POST` | `/register` | New staff registration. | `User` object |
| `PUT` | `/update/{uname}`| Update profile info. | `User` object |
| `POST` | `/changePassword`| Update staff password. | `username`, `oldPassword`, `newPassword` |

---

## 💰 2. Sales & Billing Module
The core engine for estimates and itemized sales.

### 🧩 Modular Sales Entry
- **Base Path**: `/salesentry`

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/saveGeneral` | Save bill header (Customer & Totals). |
| `POST` | `/saveSales` | Save itemized sales list. |
| `POST` | `/saveSman` | Save salesman assignments for bill. |
| `POST` | `/saveStone` | Save stone weights and rates. |

### 🔍 Sales Lookup & LifeCycle
- **Paths**: `/saleschecking`, `/salesdelete`, `/salesprint`

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/saleschecking/estenochecking/{goldSlv}` | Get list of distinct Est. Nos by Metal ('G' or 'S'). |
| `GET` | `/salesdelete/check/{estNo}` | Check if an estimate is valid for deletion. |
| `DELETE`| `/salesdelete/delete/{estNo}` | Permanently remove all estimate data. |
| `GET` | `/salesprint/report/{estNo}?type=T` | Get Thermal Printer report string. |

---

## 👥 3. Customer & CRM Module
Handling customer profiles and lounge browsing.

### 👤 Customer Data & CRM
- **Base Path**: `/customer`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/crmphoneno/{phone}` | Find CRM profile by mobile number. |
| `POST` | `/create` | Create a new CRM customer profile. |
| `PUT` | `/update/{crmid}` | Update existing CRM data. |
| `GET` | `/find-by-custid?custid=ID`| Find CRM data by legacy Customer ID. |

### 🍹 Customer Lounge (Browsing)
- **Base Path**: `/customerlounge`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/getCategoryForCustomer` | Get list of top-level categories. |
| `GET` | `/getDesignList?category=CAT`| Get designs for a specific category. |
| `GET` | `/getDetailedBarcodeData` | Get full tech specs for a barcode. |

---

## 🏷️ 4. Masters & Inventory
Core data for staff, stock, and company settings.

### 🏷️ Barcode API
- **Base Path**: `/barcodeapi`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/data/{barcode}` | Get all item details (weight, rate, etc.) for a barcode. |
| `GET` | `/getImagebyBarcode/{barcode}`| Retrieve the product image for a specific barcode. |

### 👤 Salesman Master
- **Base Path**: `/salesmanmaster`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/findBySalesMan` | Get the full list of salesmen for the current shop. |
| `GET` | `/findBySmcode?smcode=X`| Lookup a specific salesman by their code. |

---

## 🧾 5. Cash Marking & Discounts (Post-Billing)
Logic for tagging bills, applying VA changes, and final discounts.

### 💰 Cashmark Module
- **Base Path**: `/cashmark`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/getcheckestno/{id}` | Check if an estimate is already billed in cashmarking. |
| `GET` | `/checkdiamond?estno=X`| Check if an estimate contains diamond items. |
| `POST` | `/updatevadata` | Update Value-Addition (VA) for specific items. |
| `POST` | `/updateestmstrdmdrate`| Update diamond-specific rates for a bill. |

---

## 📦 6. Universal Data Models
Key JSON structures used across the application.

### 💰 SalesEntryPayload (The Master Billing Model)
Used by all `/salesentry/save...` endpoints.

```json
{
  "estNo": 1234,
  "estDte": "2024-04-08",
  "estGrate": 6500.50,
  "custid": "CUST101",
  "estCunm": "John Doe",
  "goldSlv": "G",
  "shopcode": "TCR",
  "estTamt": 150000.00,
  "purSplitflag": false,
  "saleItems": [
    {
      "barcode": "B123",
      "pname": "Gold Ring",
      "pweight": 5.25,
      "vaamt": 150.00
    }
  ],
  "stoneEntries": [
    {
      "stnname": "Diamond",
      "stnwgt": 0.25,
      "stnrate": 45000.00
    }
  ]
}
```

---

## 🚀 Architectural Principles: "Route First, Auth Second"
Every endpoint in this manual follows a standardized two-step process:
1. **Remote Routing**: The API checks `isLocalShop(shopcode)`. If the target branch is remote, it automatically proxies the request.
2. **Local Auth**: If local, it validates the request using `username`/`password` headers via the `AspCommonFunctions.authUser` library.

---

## 💡 Developer Best Practices
- **Date Format**: Standardized at `YYYY-MM-DD`.
- **Response Format**: All successful operations respond with `200 OK` and a consistent JSON status object.
- **Error Handling**: Standardized via `GlobalExceptionHandler` for clear, frontend-friendly messages.
