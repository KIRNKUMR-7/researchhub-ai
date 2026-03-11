import mongoose from 'mongoose';

const plotSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plotNumber: { type: String, required: true },
    allotteeName: { type: String, required: true },
    company: { type: String, required: true },
    sector: { type: String, enum: ['Industrial', 'MSME', 'IT/ITES', 'Agro-based', 'Textile', 'Chemical', 'Auto Component'], required: true },
    area: { type: Number, required: true },
    location: { type: String, required: true },
    allotmentDate: { type: String, required: true },
    leaseStartDate: { type: String, required: true },
    leaseEndDate: { type: String, required: true },
    status: { type: String, enum: ['compliant', 'pending', 'defaulting', 'closed'], required: true },
    investmentCommitted: { type: Number, required: true },
    employmentCommitted: { type: Number, required: true },
    cautionDeposit: { type: Number, required: true },
    landCostSubsidy: { type: Number, required: true },
    notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Plot', plotSchema);
