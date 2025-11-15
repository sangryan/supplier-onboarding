const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is supplier or has supplier access
exports.supplierAccess = async (req, res, next) => {
  try {
    const supplierId = req.params.id || req.params.supplierId;
    
    // Super admin can access all
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Procurement and Legal can access all suppliers
    if (['procurement', 'legal', 'management'].includes(req.user.role)) {
      return next();
    }
    
    // Suppliers can only access their own data
    if (req.user.role === 'supplier') {
      // Check if the supplier application belongs to this user
      const Supplier = require('../models/Supplier');
      // Use lean() with populate to avoid Mongoose validation (in case document has unmapped enum values)
      // But we need to populate submittedBy to check ownership
      const supplier = await Supplier.findById(supplierId)
        .populate('submittedBy', '_id')
        .lean();
      
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }
      
      // Check if the supplier application was submitted by this user
      // Handle both ObjectId and string formats (with lean, populated fields are objects)
      const submittedById = supplier.submittedBy 
        ? (supplier.submittedBy._id ? supplier.submittedBy._id.toString() : supplier.submittedBy.toString())
        : null;
      
      if (submittedById && submittedById !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this supplier'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Supplier access error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking supplier access'
    });
  }
};

