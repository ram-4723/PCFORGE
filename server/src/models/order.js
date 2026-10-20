import mongoose from 'mongoose'

const integerInr = (value) => Number.isSafeInteger(value) && value >= 0

const orderItemSchema = new mongoose.Schema({
  component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', default: null },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  model: { type: String, required: true, trim: true, maxlength: 120 },
  quantity: { type: Number, required: true, min: 1, max: 1000, validate: Number.isSafeInteger },
  unitPriceInr: {
    type: Number,
    required: true,
    validate: { validator: integerInr, message: 'unitPriceInr must be a non-negative safe integer in whole INR.' },
  },
}, { _id: false })

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  address: {
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 100, default: 'India' },
  },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  build: { type: mongoose.Schema.Types.ObjectId, ref: 'PCBuild', default: null, index: true },
  items: { type: [orderItemSchema], default: [] },
  customer: { type: customerSchema, required: true },
  totalInr: {
    type: Number,
    required: true,
    validate: { validator: integerInr, message: 'totalInr must be a non-negative safe integer in whole INR.' },
  },
  orderStatus: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending', required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', required: true },
}, { timestamps: true })

orderSchema.index({ orderStatus: 1, createdAt: -1 })

orderSchema.pre('validate', function requireBuildOrSnapshot(next) {
  if (!this.build && this.items.length === 0) {
    this.invalidate('items', 'An order must reference a saved build or include component snapshots.')
  }
  next()
})

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)
export default Order
