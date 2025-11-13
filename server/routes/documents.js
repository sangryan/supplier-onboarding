const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const Document = require('../models/Document');
const Supplier = require('../models/Supplier');
const { protect, supplierAccess } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/documents/upload
// @desc    Upload document
// @access  Private
router.post('/upload', protect, upload.single('document'), async (req, res) => {
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

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Send file
    res.download(document.filePath, document.originalName);
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

