import mongoose from 'mongoose'
import { COMPONENT_CATEGORIES, componentSpecificationSchema } from './component.js'

const integerInr = (value) => Number.isSafeInteger(value) && value >= 0

const snapshotSchema = new mongoose.Schema({
  component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  brand: { type: String, required: true, trim: true, maxlength: 100 },
  model: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, enum: COMPONENT_CATEGORIES },
  priceInr: { type: Number, required: true, validate: { validator: integerInr, message: 'Snapshot price must be a whole-INR safe integer.' } },
  specifications: { type: componentSpecificationSchema, default: () => ({}) },
  imageUrl: { type: String, default: '' },
}, { _id: false })

const compatibilityFindingSchema = new mongoose.Schema({
  code: { type: String, required: true },
  message: { type: String, required: true },
}, { _id: false })

const compatibilitySchema = new mongoose.Schema({
  status: { type: String, enum: ['compatible', 'incompatible', 'unverified'], required: true },
  compatible: { type: Boolean, required: true },
  errors: { type: [compatibilityFindingSchema], default: [] },
  warnings: { type: [compatibilityFindingSchema], default: [] },
  unverified: { type: [compatibilityFindingSchema], default: [] },
}, { _id: false })

const pcBuildSchema = new mongoose.Schema({
  selectedComponents: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Component' }],
    required: true,
    validate: { validator: (items) => items.length > 0, message: 'A saved build must reference at least one component.' },
  },
  componentSnapshots: { type: [snapshotSchema], required: true, validate: { validator: (items) => items.length > 0, message: 'A saved build must include component snapshots.' } },
  intendedUse: { type: String, required: true, enum: ['gaming', 'programming', 'video_editing', 'office'] },
  budgetInr: { type: Number, required: true, validate: { validator: integerInr, message: 'budgetInr must be a non-negative safe integer in whole INR.' } },
  calculatedTotalInr: { type: Number, required: true, validate: { validator: integerInr, message: 'calculatedTotalInr must be a non-negative safe integer in whole INR.' } },
  compatibility: { type: compatibilitySchema, required: true },
  status: { type: String, enum: ['saved'], default: 'saved', required: true },
  ownerTokenHash: { type: String, required: true, select: false, index: true },
  expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
}, { timestamps: true })

pcBuildSchema.index({ selectedComponents: 1 })
pcBuildSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
const PCBuild = mongoose.models.PCBuild || mongoose.model('PCBuild', pcBuildSchema)
export default PCBuild
