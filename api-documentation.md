# DocVerify API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication Endpoints

#### 1. User Registration
- **Method**: POST
- **Endpoint**: `/auth/register`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```
- **Rate Limited**: Yes (auth rate limit)

#### 2. User Login
- **Method**: POST
- **Endpoint**: `/auth/login`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**: Returns JWT token
- **Rate Limited**: Yes

#### 3. Get Current User
- **Method**: GET
- **Endpoint**: `/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Auth Required**: Yes

#### 4. Password Reset
- **Method**: POST
- **Endpoint**: `/auth/reset-password`
- **Body**:
```json
{
  "email": "john@example.com"
}
```

### OTP Endpoints

#### 5. Send OTP
- **Method**: POST
- **Endpoint**: `/otp/send`
- **Body**:
```json
{
  "email": "john@example.com"
}
```
- **Rate Limited**: Yes (OTP rate limit)

#### 6. Verify OTP
- **Method**: POST
- **Endpoint**: `/otp/verify`
- **Body**:
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Certificate/Document Endpoints

#### 7. Upload Document
- **Method**: POST
- **Endpoint**: `/upload`
- **Content-Type**: `multipart/form-data`
- **Body**: `document` (file)
- **Auth Required**: Yes

#### 8. Get All Certificates
- **Method**: GET
- **Endpoint**: `/certificates`
- **Query Params**: `page`, `limit`, `search`
- **Auth Required**: No (public access)

#### 9. Get Certificate by ID
- **Method**: GET
- **Endpoint**: `/certificates/:id`
- **Auth Required**: No (public access)

#### 10. Issue Certificate
- **Method**: POST
- **Endpoint**: `/certificates/issue`
- **Body**:
```json
{
  "title": "Certificate Title",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "documentType": "certificate",
  "fields": {
    "field1": "value1",
    "field2": "value2"
  },
  "canvasData": {}
}
```
- **Auth Required**: Yes

#### 11. Delete Certificate
- **Method**: DELETE
- **Endpoint**: `/certificates/:id`
- **Auth Required**: Yes

#### 12. Download Certificate
- **Method**: GET
- **Endpoint**: `/download/:id`
- **Auth Required**: No

### Verification Endpoints

#### 13. Verify Document
- **Method**: POST
- **Endpoint**: `/verify`
- **Body**:
```json
{
  "documentId": "certificate_id",
  "verificationType": "full"
}
```
- **Rate Limited**: Yes (100 requests/minute)

#### 14. Quick Verification
- **Method**: GET
- **Endpoint**: `/verify/quick/:id`
- **Auth Required**: No

### AI Endpoints

#### 15. Extract Document Data
- **Method**: POST
- **Endpoint**: `/ai/extract`
- **Body**:
```json
{
  "documentId": "certificate_id",
  "extractionType": "text"
}
```
- **Auth Required**: Yes
- **Rate Limited**: Yes (20 requests/minute)

#### 16. AI Suggestions
- **Method**: POST
- **Endpoint**: `/ai/suggest`
- **Body**:
```json
{
  "documentType": "certificate",
  "fields": ["name", "date", "grade"]
}
```
- **Auth Required**: Yes
- **Rate Limited**: Yes (50 requests/minute)

#### 17. Validate Document
- **Method**: POST
- **Endpoint**: `/ai/validate`
- **Body**:
```json
{
  "documentData": {},
  "validationRules": {}
}
```
- **Auth Required**: Yes

### Admin Endpoints

#### 18. Get All Users
- **Method**: GET
- **Endpoint**: `/admin/users`
- **Auth Required**: Yes (Admin only)

#### 19. Update User Role
- **Method**: PUT
- **Endpoint**: `/admin/users/:id/role`
- **Body**:
```json
{
  "role": "admin"
}
```
- **Auth Required**: Yes (Admin only)

#### 20. Update User Status
- **Method**: PUT
- **Endpoint**: `/admin/users/:id/status`
- **Body**:
```json
{
  "status": "active"
}
```
- **Auth Required**: Yes (Admin only)

#### 21. Delete User
- **Method**: DELETE
- **Endpoint**: `/admin/users/:id`
- **Auth Required**: Yes (Admin only)

### System Endpoints

#### 22. Health Check
- **Method**: GET
- **Endpoint**: `/health`
- **Auth Required**: No

#### 23. System Statistics
- **Method**: GET
- **Endpoint**: `/stats`
- **Auth Required**: No

#### 24. Cache Statistics
- **Method**: GET
- **Endpoint**: `/cache/stats`
- **Auth Required**: Yes

### Blockchain Endpoints

#### 25. Blockchain Status
- **Method**: GET
- **Endpoint**: `/blockchain/status`
- **Auth Required**: No

#### 26. Verify on Blockchain
- **Method**: GET
- **Endpoint**: `/blockchain/verify/:id`
- **Auth Required**: No

#### 27. Get Blockchain Transaction
- **Method**: GET
- **Endpoint**: `/blockchain/transaction/:id`
- **Auth Required**: No

### Document Editor Endpoints

#### 28. Get WYSIWYG Document
- **Method**: GET
- **Endpoint**: `/documents/wysiwyg/:id`
- **Auth Required**: Yes

#### 29. Update WYSIWYG Document
- **Method**: PUT
- **Endpoint**: `/documents/wysiwyg/:id`
- **Body**:
```json
{
  "canvasData": {},
  "fields": {}
}
```
- **Auth Required**: Yes

## Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Success Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

## Rate Limiting
- Authentication endpoints: 10 requests/minute
- OTP endpoints: 5 requests/minute
- Verification endpoints: 100 requests/minute
- AI endpoints: 20-50 requests/minute (varies by endpoint)

## Authentication Methods Supported
- JWT Bearer tokens
- Google OAuth
- GitHub OAuth

## File Upload Limits
- Maximum file size: 10MB
- Supported formats: PDF, JPG, PNG, DOC, DOCX</content>
<parameter name="filePath">e:\Final Year Project\DocVerify\api-documentation.md