import mongoose from 'mongoose';

const plotDocumentSchema = new mongoose.Schema({
    plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['allotment_order', 'lease_deed', 'noc_pollution', 'noc_fire', 'investment_certificate', 'employment_certificate', 'completion_certificate', 'subsidy_application', 'subsidy_sanction', 'inspection_report', 'caution_receipt', 'other'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    fileDate: { type: String, required: true },
    expiryDate: { type: String },
    status: { type: String, enum: ['valid', 'expired', 'pending_renewal'], required: true }
}, { timestamps: true });

export default mongoose.model('PlotDocument', plotDocumentSchema);
