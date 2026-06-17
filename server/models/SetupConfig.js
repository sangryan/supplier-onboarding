const mongoose = require('mongoose');

const documentRequirementSchema = new mongoose.Schema({
  field: { type: String, required: true },
  label: { type: String, required: true },
  uploadType: { type: String, enum: ['single', 'multiple'], default: 'single' },
  required: { type: Boolean, default: true },
}, { _id: false });

const setupConfigSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['roles', 'entity_types', 'currencies', 'wealth_sources', 'service_types', 'bank_names', 'departments'],
    required: true,
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  // Only used for entity_types — defines which documents must be uploaded
  documents: { type: [documentRequirementSchema], default: undefined },
}, { timestamps: true });

setupConfigSchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SetupConfig', setupConfigSchema);
