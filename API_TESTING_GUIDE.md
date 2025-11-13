# API Testing Guide

This guide provides examples for testing the Supplier Onboarding System API using curl or Postman.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require a JWT token. Include it in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## API Testing Examples

### 1. User Registration (Supplier)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Supplier",
    "email": "supplier@example.com",
    "phone": "+254700000000",
    "password": "Password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "firstName": "John",
    "lastName": "Supplier",
    "email": "supplier@example.com",
    "role": "supplier"
  }
}
```

### 2. User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@betika.com",
    "password": "Admin@123"
  }'
```

**Save the token from response for subsequent requests!**

### 3. Get Current User

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Create Supplier Application

```bash
curl -X POST http://localhost:5000/api/suppliers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierName": "Tech Solutions Ltd",
    "legalNature": "company",
    "entityType": "private_company",
    "serviceType": "digital_services",
    "companyEmail": "info@techsolutions.com",
    "companyRegistrationNumber": "C.12345/2020",
    "companyPhysicalAddress": {
      "street": "123 Business Street",
      "city": "Nairobi",
      "country": "Kenya",
      "postalCode": "00100"
    },
    "authorizedPerson": {
      "name": "Jane Doe",
      "relationship": "Director",
      "idPassportNumber": "12345678",
      "phone": "+254712345678",
      "email": "jane@techsolutions.com"
    },
    "creditPeriod": 30
  }'
```

### 5. Get All Suppliers

```bash
# Get all suppliers (filtered by role)
curl -X GET http://localhost:5000/api/suppliers \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:5000/api/suppliers?status=submitted&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With search
curl -X GET "http://localhost:5000/api/suppliers?search=Tech" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Get Supplier Details

```bash
curl -X GET http://localhost:5000/api/suppliers/SUPPLIER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Submit Supplier Application

```bash
curl -X POST http://localhost:5000/api/suppliers/SUPPLIER_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Upload Document

```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/file.pdf" \
  -F "supplierId=SUPPLIER_ID" \
  -F "documentType=certificate_of_incorporation" \
  -F "notes=Company registration certificate"
```

### 9. Approve Supplier Application (Procurement)

```bash
curl -X POST http://localhost:5000/api/approvals/SUPPLIER_ID/approve \
  -H "Authorization: Bearer PROCUREMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comments": "Application approved. All documents verified."
  }'
```

### 10. Reject Supplier Application

```bash
curl -X POST http://localhost:5000/api/approvals/SUPPLIER_ID/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comments": "Incomplete documentation. Please provide current tax compliance certificate."
  }'
```

### 11. Request More Information

```bash
curl -X POST http://localhost:5000/api/approvals/SUPPLIER_ID/request-info \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comments": "Please provide updated CR12 (not more than 30 days old)"
  }'
```

### 12. Assign Vendor Number

```bash
curl -X POST http://localhost:5000/api/approvals/SUPPLIER_ID/assign-vendor-number \
  -H "Authorization: Bearer PROCUREMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorNumber": "VEN-2024-0001"
  }'
```

### 13. Create Contract

```bash
curl -X POST http://localhost:5000/api/contracts \
  -H "Authorization: Bearer LEGAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier": "SUPPLIER_ID",
    "title": "IT Services Contract",
    "contractType": "services",
    "description": "Provision of cloud infrastructure services",
    "value": {
      "amount": 500000,
      "currency": "KES"
    },
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "paymentTerms": {
      "creditPeriod": 30,
      "paymentSchedule": "monthly"
    }
  }'
```

### 14. Get Dashboard Statistics

```bash
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 15. Get Pending Tasks

```bash
curl -X GET http://localhost:5000/api/dashboard/tasks?page=1&limit=10 \
  -H "Authorization: Bearer PROCUREMENT_TOKEN"
```

### 16. Get Notifications

```bash
# Get all notifications
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get unread count
curl -X GET http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark as read
curl -X PUT http://localhost:5000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 17. User Management (Super Admin)

```bash
# Get all users
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Create internal user
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@betika.com",
    "password": "SecurePass123",
    "role": "procurement",
    "department": "Procurement",
    "phone": "+254700000003"
  }'

# Update user
curl -X PUT http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

### 18. Get SLA Report

```bash
curl -X GET "http://localhost:5000/api/dashboard/sla-report?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer MANAGEMENT_TOKEN"
```

### 19. Get Expiring Contracts

```bash
curl -X GET "http://localhost:5000/api/contracts/reports/expiring?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 20. Health Check

```bash
curl -X GET http://localhost:5000/health
```

## Postman Collection

### Import into Postman

1. Create a new collection "Supplier Onboarding API"
2. Add environment variables:
   - `base_url`: http://localhost:5000/api
   - `token`: (will be set after login)

3. Create folders:
   - Authentication
   - Suppliers
   - Approvals
   - Documents
   - Contracts
   - Users
   - Dashboard
   - Notifications

4. Add requests to each folder using examples above

### Environment Setup

```json
{
  "base_url": "http://localhost:5000/api",
  "token": "",
  "supplier_id": "",
  "contract_id": "",
  "document_id": ""
}
```

### Pre-request Script (for authenticated requests)

Add to collection:

```javascript
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('token')
});
```

### Test Script (save token after login)

Add to login request:

```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set('token', jsonData.token);
    console.log('Token saved:', jsonData.token);
}
```

## Testing Workflow

### Complete Supplier Onboarding Flow

```bash
# 1. Register as supplier
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"Supplier","email":"test@supplier.com","password":"Pass123"}' \
  | jq -r '.token')

# 2. Create application
SUPPLIER_ID=$(curl -s -X POST http://localhost:5000/api/suppliers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}' \
  | jq -r '.data._id')

# 3. Upload document
curl -X POST http://localhost:5000/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "document=@file.pdf" \
  -F "supplierId=$SUPPLIER_ID" \
  -F "documentType=certificate_of_incorporation"

# 4. Submit application
curl -X POST http://localhost:5000/api/suppliers/$SUPPLIER_ID/submit \
  -H "Authorization: Bearer $TOKEN"

# 5. Login as procurement officer
PROC_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"procurement@betika.com","password":"Procurement@123"}' \
  | jq -r '.token')

# 6. Approve application
curl -X POST http://localhost:5000/api/approvals/$SUPPLIER_ID/approve \
  -H "Authorization: Bearer $PROC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments":"Approved"}'

# 7. Login as legal
LEGAL_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"legal@betika.com","password":"Legal@123"}' \
  | jq -r '.token')

# 8. Final approval
curl -X POST http://localhost:5000/api/approvals/$SUPPLIER_ID/approve \
  -H "Authorization: Bearer $LEGAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments":"Legally compliant"}'

# 9. Assign vendor number
curl -X POST http://localhost:5000/api/approvals/$SUPPLIER_ID/assign-vendor-number \
  -H "Authorization: Bearer $PROC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vendorNumber":"VEN-2024-0001"}'
```

## Error Handling

### Common Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Tips

1. **Save tokens**: Store tokens from login response for subsequent requests
2. **Use variables**: Use environment variables for IDs and tokens
3. **Check permissions**: Ensure you're using the right role's token
4. **Validate data**: Check request body matches expected format
5. **Handle errors**: Always check response status and error messages

---

**Happy Testing!** 🧪

