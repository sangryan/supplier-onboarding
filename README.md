# Supplier Onboarding System

A comprehensive digital platform for managing supplier onboarding, compliance, and contract management. Built to streamline the procurement process with role-based workflows, document management, and SLA tracking.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

The Supplier Onboarding System digitizes and automates the supplier onboarding process for organizations. It addresses key pain points such as:

- Manual and time-consuming workflows
- Lack of centralized document repository
- Unclear approval processes
- Poor visibility for suppliers and management
- Compliance risks from incomplete due diligence

## ✨ Features

### Core Features

#### For Suppliers
- **Self-Service Registration**: Create account and submit applications independently
- **Dynamic Application Form**: Form fields adapt based on entity type (Company, Partnership, Individual, Trust, etc.)
- **Document Upload**: Secure upload of required KYC and compliance documents
- **Real-Time Status Tracking**: View application progress through approval stages
- **Profile Management**: Update company and contact information
- **Contract Access**: View and download signed contracts

#### For Procurement Team
- **Application Review**: Review and approve/reject supplier applications
- **Vendor Number Assignment**: Assign unique vendor numbers to approved suppliers
- **Profile Update Approval**: Review and approve supplier profile changes
- **Task Dashboard**: View all pending applications requiring action
- **Document Verification**: Review uploaded documents for compliance

#### For Legal Team
- **Legal Review**: Review applications from compliance perspective
- **Contract Management**: Upload signed contracts and manage amendments
- **Document Repository**: Access all legal documents in centralized location
- **Contract Lifecycle Management**: Track contract status, renewals, and expirations

#### For Super Admin
- **User Management**: Add, update, and deactivate internal users
- **System Configuration**: Manage system-wide settings
- **Full Oversight**: Access to all suppliers and contracts
- **Dynamic Form Setup**: Configure dropdown options and form fields

#### For Management
- **SLA Dashboard**: Monitor compliance with service level agreements
- **Performance Metrics**: View supplier onboarding statistics
- **Contract Summary**: Overview of active and expiring contracts
- **Reports & Analytics**: Comprehensive reporting on procurement activities

### Technical Features

- **Role-Based Access Control (RBAC)**: Granular permissions based on user roles
- **Approval Workflow Engine**: Multi-stage approval process (Procurement → Legal → Completion)
- **Email Notifications**: Automated notifications for status changes and actions
- **Document Version Control**: Track document updates and replacements
- **SLA Tracking**: Automatic monitoring of processing timelines
- **Search & Filter**: Advanced search and filtering capabilities
- **Audit Trail**: Complete history of all actions and approvals
- **Regional Support**: Handles both local (Kenya) and international suppliers

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Security**: Helmet, bcrypt, express-rate-limit
- **Validation**: express-validator

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **State Management**: React Query
- **Form Handling**: Formik + Yup
- **HTTP Client**: Axios
- **Notifications**: React Toastify

### Development Tools
- **Process Manager**: Nodemon
- **Concurrent Execution**: Concurrently
- **Package Manager**: npm

## 💻 System Requirements

- **Node.js**: v14.0.0 or higher
- **MongoDB**: v4.4 or higher
- **npm**: v6.0.0 or higher
- **Operating System**: Windows, macOS, or Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 500MB minimum

## 📥 Installation

### 1. Clone the Repository

```bash
cd Betika
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/supplier_onboarding

# JWT Secret (Change this to a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (Optional for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@company.com

# Frontend URL
CLIENT_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Company Details
COMPANY_NAME=Betika
COMPANY_EMAIL=procurement@betika.com
```

### 5. Start MongoDB

Ensure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Linux
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 6. Start the Application

**Development Mode** (starts both backend and frontend):

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## ⚙️ Configuration

### Email Setup

To enable email notifications:

1. Use an SMTP service (Gmail, SendGrid, etc.)
2. Update EMAIL_* variables in `.env`
3. For Gmail, you may need to:
   - Enable "Less secure app access" OR
   - Use an App Password (recommended)

### File Upload Configuration

- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 10MB)
- `UPLOAD_PATH`: Directory for storing uploaded files
- Supported formats: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX

### Database Configuration

The system uses MongoDB. To use a remote MongoDB instance:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

## 📖 Usage

### First-Time Setup

1. **Create Super Admin Account**:
   
   You can create a super admin user directly in MongoDB or through a seed script. Example:

   ```javascript
   // Run in MongoDB shell or create a seed script
   db.users.insertOne({
     firstName: "Admin",
     lastName: "User",
     email: "admin@company.com",
     password: "$2a$10$...", // Hash the password using bcrypt
     role: "super_admin",
     isActive: true,
     createdAt: new Date(),
     updatedAt: new Date()
   });
   ```

2. **Login as Super Admin**: http://localhost:3000/login

3. **Create Internal Users**:
   - Navigate to User Management
   - Add Procurement, Legal, and Management users

### Supplier Workflow

1. **Registration**: Supplier creates an account
2. **Application**: Complete the multi-step application form
3. **Document Upload**: Upload required KYC documents
4. **Submission**: Submit application for review
5. **Procurement Review**: Procurement team reviews and approves/rejects
6. **Legal Review**: Legal team reviews compliance
7. **Approval**: Application approved, vendor number assigned
8. **Contract**: Legal uploads signed contract
9. **Onboarding Complete**: Supplier is fully onboarded

### Internal User Workflow

#### Procurement Team
1. View pending applications in Tasks
2. Review supplier details and documents
3. Approve, reject, or request more information
4. Assign vendor numbers to approved suppliers

#### Legal Team
1. Review applications approved by procurement
2. Verify legal compliance
3. Approve or reject based on legal requirements
4. Upload signed contracts
5. Manage contract amendments and renewals

## 👥 User Roles

### Supplier
- Submit and track applications
- Upload documents
- Update profile information
- View contracts

### Procurement (Finance Team)
- Review and approve applications
- Assign vendor numbers
- Approve profile updates
- Manage supplier records

### Legal Team
- Legal review of applications
- Upload signed contracts
- Manage contract lifecycle
- Handle amendments and renewals

### Management
- View dashboards and reports
- Monitor SLA performance
- Track supplier metrics
- No direct approval actions

### Super Admin
- Full system access
- User management
- System configuration
- Override capabilities

## 🔌 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register        - Register new supplier
POST   /api/auth/login           - Login user
GET    /api/auth/me              - Get current user
PUT    /api/auth/update-profile  - Update profile
PUT    /api/auth/change-password - Change password
```

### Supplier Endpoints

```
POST   /api/suppliers                              - Create supplier
GET    /api/suppliers                              - Get all suppliers (filtered by role)
GET    /api/suppliers/:id                          - Get supplier details
PUT    /api/suppliers/:id                          - Update supplier
POST   /api/suppliers/:id/submit                   - Submit for review
POST   /api/suppliers/:id/profile-update-request   - Request profile update
```

### Approval Endpoints

```
POST   /api/approvals/:supplierId/approve             - Approve application
POST   /api/approvals/:supplierId/reject              - Reject application
POST   /api/approvals/:supplierId/request-info        - Request more info
POST   /api/approvals/:supplierId/assign-vendor-number - Assign vendor number
POST   /api/approvals/profile-updates/:requestId/approve - Approve profile update
```

### Document Endpoints

```
POST   /api/documents/upload                - Upload document
GET    /api/documents/supplier/:supplierId  - Get supplier documents
GET    /api/documents/:id                   - Get document details
GET    /api/documents/:id/download          - Download document
DELETE /api/documents/:id                   - Delete document
PUT    /api/documents/:id/status            - Update document status
```

### Contract Endpoints

```
POST   /api/contracts                       - Create contract
GET    /api/contracts                       - Get all contracts
GET    /api/contracts/:id                   - Get contract details
PUT    /api/contracts/:id                   - Update contract
POST   /api/contracts/:id/activate          - Activate contract
POST   /api/contracts/:id/upload-signed     - Upload signed contract
POST   /api/contracts/:id/amendments        - Add amendment
GET    /api/contracts/reports/expiring      - Get expiring contracts
```

### User Management Endpoints

```
GET    /api/users           - Get all users
POST   /api/users           - Create user
GET    /api/users/:id       - Get user
PUT    /api/users/:id       - Update user
DELETE /api/users/:id       - Deactivate user
POST   /api/users/:id/reset-password - Reset password
```

### Dashboard & Reports

```
GET    /api/dashboard/stats             - Get dashboard statistics
GET    /api/dashboard/recent-activities - Get recent activities
GET    /api/dashboard/tasks             - Get pending tasks
GET    /api/dashboard/sla-report        - Get SLA performance report
GET    /api/dashboard/contract-summary  - Get contract summary
```

### Notifications

```
GET    /api/notifications              - Get user notifications
GET    /api/notifications/unread-count - Get unread count
PUT    /api/notifications/:id/read     - Mark as read
PUT    /api/notifications/mark-all-read - Mark all as read
DELETE /api/notifications/:id          - Delete notification
```

## 📁 Project Structure

```
supplier-onboarding-system/
├── client/                      # Frontend React application
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── Layout/
│   │   │   └── PrivateRoute.js
│   │   ├── context/             # React context
│   │   │   └── AuthContext.js
│   │   ├── pages/               # Page components
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Supplier/
│   │   │   ├── Admin/
│   │   │   ├── Contracts/
│   │   │   ├── Reports/
│   │   │   └── Profile/
│   │   ├── utils/               # Utility functions
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── server/                      # Backend Express application
│   ├── middleware/              # Express middleware
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/                  # Mongoose models
│   │   ├── User.js
│   │   ├── Supplier.js
│   │   ├── Document.js
│   │   ├── Contract.js
│   │   └── Notification.js
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── suppliers.js
│   │   ├── approvals.js
│   │   ├── documents.js
│   │   ├── contracts.js
│   │   ├── users.js
│   │   ├── dashboard.js
│   │   ├── notifications.js
│   │   └── applications.js
│   ├── utils/                   # Utility functions
│   │   └── notifications.js
│   └── index.js                 # Server entry point
├── uploads/                     # Uploaded documents (gitignored)
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Example environment file
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Development

### Running Tests

```bash
# Backend tests
npm test

# Frontend tests
cd client && npm test
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### Database Seeding

To seed the database with sample data:

```bash
node server/seeds/seed.js
```

### Debugging

- Backend logs are output to console
- Set `NODE_ENV=development` for detailed error messages
- Use MongoDB Compass for database inspection

## 🌐 Deployment

### Production Build

```bash
# Build frontend
cd client
npm run build

# Start production server
cd ..
NODE_ENV=production npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production MongoDB URI
4. Set up email service
5. Configure file storage (AWS S3 or similar)

### Hosting Options

- **Backend**: Heroku, DigitalOcean, AWS EC2, Railway
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas, AWS DocumentDB
- **Files**: AWS S3, Google Cloud Storage, Azure Blob Storage

### Security Considerations

- Use HTTPS in production
- Enable CORS only for trusted domains
- Implement rate limiting
- Regular security updates
- Backup database regularly
- Monitor logs for suspicious activity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email procurement@betika.com or create an issue in the repository.

## 🙏 Acknowledgments

- Material-UI for the excellent component library
- MongoDB for the flexible database solution
- All contributors and users of this system

---

**Built with ❤️ for efficient supplier onboarding**

