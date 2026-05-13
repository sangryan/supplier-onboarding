const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const Document = require('../models/Document');
const Supplier = require('../models/Supplier');
const { protect, supplierAccess } = require('../middleware/auth');
const upload = require('../middleware/upload');

const uploadsPath = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads'));

const findFileByName = async (dir, fileName) => {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === fileName) {
      return entryPath;
    }

    if (entry.isDirectory()) {
      const found = await findFileByName(entryPath, fileName);
      if (found) return found;
    }
  }

  return null;
};

const resolveDocumentPath = async (document) => {
  const candidates = [];

  if (document.filePath) {
    candidates.push(path.resolve(document.filePath));

    const normalized = String(document.filePath).replace(/\\/g, '/').replace(/^\.\//, '');
    if (normalized.startsWith('uploads/')) {
      candidates.push(path.join(uploadsPath, normalized.replace(/^uploads\//, '')));
    } else if (!path.isAbsolute(document.filePath)) {
      candidates.push(path.join(uploadsPath, normalized));
    }
  }

  if (document.supplier && document.fileName) {
    const supplierId = document.supplier._id || document.supplier;
    candidates.push(path.join(uploadsPath, String(supplierId), document.fileName));
  }

  if (document.fileName) {
    candidates.push(path.join(uploadsPath, 'temp', document.fileName));
    candidates.push(path.join(uploadsPath, document.fileName));
  }

  for (const candidate of [...new Set(candidates)]) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next known storage shape.
    }
  }

  if (document.fileName) {
    return findFileByName(uploadsPath, document.fileName);
  }

  return null;
};

const handleUpload = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File is too large. Maximum allowed size is 20MB.'
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Upload failed'
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Upload failed'
    });
  });
};

// @route   POST /api/documents/upload
// @desc    Upload document
// @access  Private
router.post('/upload', protect, handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { supplierId, documentType, notes } = req.body;

    // Verify supplier exists and user has access
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check access
    if (req.user.role === 'supplier' && supplier.submittedBy.toString() !== req.user.id) {
      await fs.unlink(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Create document record
    const document = await Document.create({
      supplier: supplierId,
      documentType,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      uploadedBy: req.user.id,
      notes,
      status: 'pending_review'
    });

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Upload document error:', error);

    // Clean up file if error occurs
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading document'
    });
  }
});

// @route   GET /api/documents/supplier/:supplierId
// @desc    Get all documents for a supplier
// @access  Private
router.get('/supplier/:supplierId', protect, supplierAccess, async (req, res) => {
  try {
    const documents = await Document.find({ supplier: req.params.supplierId })
      .populate('uploadedBy', 'firstName lastName role')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents'
    });
  }
});

// @route   GET /api/documents/:id
// @desc    Get single document
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('supplier')
      .populate('uploadedBy', 'firstName lastName');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access
    if (req.user.role === 'supplier') {
      const supplier = await Supplier.findById(document.supplier._id);
      if (supplier.submittedBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document'
    });
  }
});

// @route   GET /api/documents/:id/download
// @desc    Download document
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('supplier');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access
    if (req.user.role === 'supplier') {
      const supplier = await Supplier.findById(document.supplier._id);
      if (supplier.submittedBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
    }

    const absolutePath = await resolveDocumentPath(document);
    if (!absolutePath) {
      console.error(`File not found for document ${document._id}. Stored path: ${document.filePath}`);
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Send file
    res.download(absolutePath, document.originalName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document'
    });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('supplier');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access
    if (req.user.role === 'supplier') {
      const supplier = await Supplier.findById(document.supplier._id);
      if (supplier.submittedBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete document record
    await document.deleteOne();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document'
    });
  }
});

// @route   PUT /api/documents/:id/status
// @desc    Update document status
// @access  Private (Procurement, Legal)
router.put('/:id/status', protect, async (req, res) => {
  try {
    if (!['procurement', 'legal', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { status, notes } = req.body;

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document status'
    });
  }
});

module.exports = router;
