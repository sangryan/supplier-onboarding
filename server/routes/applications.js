const express = require('express');
const router = express.Router();

// Application routes are handled by suppliers.js
// This file exists for clarity and can be extended with application-specific features

// Redirect to suppliers routes
router.use('/', require('./suppliers'));

module.exports = router;

