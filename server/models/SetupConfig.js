const mongoose = require('mongoose');

const setupConfigSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['roles', 'entity_types', 'currencies', 'wealth_sources', 'service_types'],
    required: true,
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
}, { timestamps: true });

setupConfigSchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SetupConfig', setupConfigSchema);
