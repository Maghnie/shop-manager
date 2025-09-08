
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![CI](https://github.com/maghnie/shop-manager/actions/workflows/frontend.yml/badge.svg)](https://github.com/maghnie/shop-manager/actions/workflows/frontend.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/maghnie/shop-manager/badge.svg)](https://snyk.io/test/github/maghnie/shop-manager)
[![Maintenance](https://img.shields.io/badge/Maintained-Yes-green)]()


# Shop Management System

This is a product, inventory, sales, invoice, and analytics management app, specifically designed for shops that need:
- A simple UI and a powerful backend
- Arabic RTL support
- Highly customizable features
  
## Features

- **Modern UI**: Arabic interface with RTL support
- **Product Management**: Add, edit, delete, and search products
- **Inventory Management**: Keep track of stock levels, get automatic alerts for different thresholds
- **Sales & Invoice Management**: Add sales with real-time discount and profit calculations, generate partial and complete invoices
- **Customer Management**: Create and attach customer profiles per sale
- **Advanced Filtering**: Look up product information by type, brand, material, and tags
- **Product & Sales Analytics**: Automatic cost, revenue, and profit calculations and reporting
- **Interactive Charts**: Export-ready charts and visualizations
- **Docker Deployment**: Easy containerized deployment

## 📈 Reports & Analytics

- **Top Profit Products**: By dollar amount and percentage
- **Lowest Profit Analysis**: Identify products needing attention
- **Summary Statistics**: Average profit, totals, and trends
- **Total Revenue Time Series**: Quantify patterns and seasonal effects via daily, weekly, monthly, and yearly reporting
- **Revenue-per-hour Heatmap**: Identify peak sales hours
- **Year-over-year, Month-over-month Analysis**: Compare performance metrics over different time intervals

## 🌐 Localization

- Native Arabic support
- RTL layout optimization
- Currency formatting (USD)
- Date/time localization (🇱🇧)

## Tech Stack

- **Backend**: Django 4.2, Django REST Framework
- **Frontend**: React 18, Tailwind CSS
- **Database**: PostgreSQL
- **Charts**: Chart.js
- **Deployment**: Docker & Docker Compose

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB of free disk space

### Installation

1. **Clone and setup the project:**
   ```bash
   curl -O https://raw.githubusercontent.com/your-repo/deploy.sh
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Start the application:**
   ```bash
   cd inventory-management-app
   ./start.sh
   ```

3. **Access the application:**
   - Main App: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin
   - Default login: `admin` / `admin123`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'feat: add feature'` (In this house, we obey the laws of [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/))
4. Push to branch: `git push origin feature-name`
5. Submit pull request


