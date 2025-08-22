
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![CI](https://github.com/maghnie/shop-manager/actions/workflows/frontend.yml/badge.svg)](https://github.com/maghnie/shop-manager/actions/workflows/frontend.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/maghnie/shop-manager/badge.svg)](https://snyk.io/test/github/maghnie/shop-manager)
[![Maintenance](https://img.shields.io/badge/Maintained-Yes-green)]()


# Inventory Management System

A modern, responsive inventory management application built with Django (backend) and React + Vite + TS (frontend), designed specifically for shops that need Arabic RTL support.

## 🌟 Features

- **Modern UI**: Clean, intuitive Arabic interface with RTL support
- **Product Management**: Add, edit, delete, and search products
- **Advanced Filtering**: Search by type, brand, material, and tags
- **Profit Analytics**: Automatic profit calculations and reporting
- **Interactive Charts**: Export-ready charts and visualizations
- **Responsive Design**: Works perfectly on desktop and mobile
- **Secure Authentication**: Built-in user authentication system
- **Docker Deployment**: Easy containerized deployment

## 🛠 Technology Stack

- **Backend**: Django 4.2, Django REST Framework
- **Frontend**: React 18, Tailwind CSS
- **Database**: PostgreSQL
- **Charts**: Chart.js
- **Deployment**: Docker & Docker Compose

## 🚀 Quick Start

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

## 📊 Product Features

### Product Fields
- Type (required)
- Brand (optional)
- Cost Price (required)
- Selling Price (required)
- Size (optional)
- Weight (optional)
- Material (optional)
- Searchable Tags (optional)

### Automated Calculations
- Profit Amount ($)
- Profit Percentage (%)
- Real-time profit preview in forms

## 📈 Reports & Analytics

- **Top Profit Products**: By dollar amount and percentage
- **Lowest Profit Analysis**: Identify products needing attention
- **Interactive Charts**: Bar charts, pie charts, and line graphs
- **Export Functionality**: Download charts as high-quality PNG
- **Summary Statistics**: Average profit, totals, and trends

## 🔧 Management Commands

```bash
# Start the application
./start.sh

# Stop the application
./stop.sh

# Create database backup
./backup.sh

# Restore from backup
./restore.sh backup_file.sql

# View logs
docker-compose logs -f

# Access Django shell
docker-compose exec web python manage.py shell
```

## 🎨 Customization

### Adding New Product Types/Brands/Materials
1. Access Django Admin: http://localhost:8000/admin
2. Navigate to the respective section
3. Add new entries with both Arabic and English names

### Modifying Sample Data
Edit the management command:
```bash
docker-compose exec web python manage.py load_sample_data
```

## 🔒 Security Features

- Token-based authentication
- CORS protection
- Input validation and sanitization
- SQL injection protection
- XSS protection

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interface
- Optimized for Arabic RTL layout
- Fast loading on mobile networks

## 🌐 Localization

- Native Arabic support
- RTL layout optimization
- Currency formatting (USD)
- Date/time localization

## 🔄 Backup & Recovery

Automated backup system included:
- Database backups with timestamps
- Easy restore functionality
- Data migration support

## 🐛 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Stop conflicting services
sudo lsof -i :8000
sudo kill -9 PID
```

**Database connection issues:**
```bash
# Restart services
docker-compose restart
```

**Frontend build issues:**
```bash
# Clear cache and rebuild
docker-compose build --no-cache web
```

## 📝 API Documentation

### Endpoints
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product
- `GET /api/reports/` - Get profit reports

### Authentication
```bash
# Get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use token
curl -H "Authorization: Token your-token-here" \
  http://localhost:8000/api/products/
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review Docker logs: `docker-compose logs`

## 🎯 Roadmap

- [ ] Real-time inventory updates
- [ ] Barcode scanning support
- [ ] Multi-currency support
- [ ] Advanced reporting features
- [ ] Mobile app development
- [ ] Multi-store support

---

**Built with ❤️ for small business owners**

## Getting started for devs

1. python -m venv venv
1. venv/Scripts/activate
1. py -m pip install Django
1. pip install psycopg2-binary --only-binary :all:
1. pip install python-dotenv
1. django-admin startproject backend
### frontend setup
1. cd frontend
1. npm install
1. npm run dev
1. npm install -D vitest
1. npm install lucide-react

