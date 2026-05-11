const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists - use absolute path
const uploadDir = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads'));
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create supplier-specific directory
    const supplierId = req.body.supplierId || req.params.supplierId || 'temp';
    const supplierDir = path.join(uploadDir, supplierId);

    if (!fs.existsSync(supplierDir)) {
      fs.mkdirSync(supplierDir, { recursive: true });
    }

    cb(null, supplierDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx']);
  const allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]);

  const ext = path.extname(file.originalname).toLowerCase();
  const extAllowed = allowedExtensions.has(ext);

  // Some clients may send generic mime types, so extension is primary;
  // MIME check is strict when provided.
  const mime = (file.mimetype || '').toLowerCase();
  const mimeAllowed = !mime || allowedMimeTypes.has(mime) || mime === 'application/octet-stream';

  if (extAllowed && mimeAllowed) {
    return cb(null, true);
  }

  cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, and XLSX files are allowed.'));
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

module.exports = upload;
