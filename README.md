# DocVerify - Document Verification Platform

A comprehensive document verification platform with blockchain integration, AI-powered data extraction, and WYSIWYG document editor.

## 🌟 Features

### Core Features
- **Document Upload & Verification**: Upload documents and generate verifiable certificates with unique IDs
- **QR Code Generation**: Automatic QR code generation for easy document verification
- **Blockchain Integration**: Document hashes stored on blockchain for immutability
- **AI-Powered Extraction**: Automatic extraction of document data using Groq LLM (Llama 3.3 70B)

### User Experience
- **WYSIWYG Editor**: Full-featured document editor with:
  - Text editing (bold, italic, underline, alignment)
  - Font family selection
  - Shape tools (rectangles, circles, lines)
  - Image upload support
  - Keyboard shortcuts (Ctrl+Z/Y for undo/redo, Delete, Ctrl+D to duplicate)
  - Layer management
  - Zoom controls
  - Export to PNG
- **Dark/Light Theme**: System-aware theme switching with manual override
- **Breadcrumb Navigation**: Easy navigation throughout the dashboard
- **Loading Skeletons**: Smooth loading states for better UX

### Security
- **JWT Authentication**: Secure token-based authentication
- **OTP Verification**: Email-based OTP for registration and password reset
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Configurable origins for production

### Roles & Permissions
- **User**: Upload documents, create certificates, view own documents
- **Admin**: Manage all documents, bulk issuance, user management
- **Verifier**: Scan and verify documents, view verification history

## 🚀 Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Fabric.js for WYSIWYG canvas
- Framer Motion for animations
- React Router for navigation
- React Hot Toast for notifications

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Redis for caching (optional)
- JWT for authentication
- Multer for file uploads

### Blockchain
- Hardhat for local development
- Ethers.js for blockchain interaction
- Solidity smart contract

### AI/ML
- Groq SDK with Llama 3.3 70B model
- Document data extraction and analysis

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Blockchain Setup (for local development)
```bash
cd blockchain
npm install
npx hardhat node  # Start local node
npx hardhat run scripts/deploy.js --network localhost
```

## 🔧 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/docverify
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GROQ_API_KEY=your-groq-api-key
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🎨 Theme System

The application supports three theme modes:
- **Light**: Clean light interface
- **Dark**: Dark mode for reduced eye strain
- **System**: Automatically follows OS preference

Theme settings persist across sessions and can be changed in Settings or using the theme toggle in the header.

## ⌨️ Keyboard Shortcuts

In the WYSIWYG Editor:
- `Ctrl + Z` - Undo
- `Ctrl + Y` - Redo
- `Delete` / `Backspace` - Delete selected element
- `Ctrl + D` - Duplicate selected element
- `Escape` - Deselect

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### OTP
- `POST /api/otp/send` - Send OTP to email
- `POST /api/otp/verify` - Verify OTP

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### Verification
- `GET /api/verify/:id` - Verify document by ID

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get system statistics
- `POST /api/admin/bulk-issue` - Bulk issue documents

## 🔒 Security Features

1. **Rate Limiting**: 
   - Auth routes: 10 requests/minute
   - OTP routes: 5 requests/minute

2. **Input Validation**: All inputs validated before processing

3. **JWT Tokens**: Secure token-based authentication with 7-day expiry

4. **Password Hashing**: bcrypt with salt rounds

5. **CORS**: Configurable allowed origins for production

## 📈 Performance Optimizations

- Lazy loading for all route components
- Redis caching for frequently accessed data
- Optimized bundle size with code splitting
- Image optimization with Cloudinary
- Skeleton loading states for better perceived performance

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Final Year Project - Document Verification System
