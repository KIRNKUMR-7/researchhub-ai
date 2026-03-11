import mongoose from 'mongoose';

const complianceRecordSchema = new mongoose.Schema({
    plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    investmentActual: { type: Number, required: true },
    investmentAsOn: { type: String, required: true },
    investmentStatus: { type: String, enum: ['compliant', 'pending', 'overdue', 'na'], required: true },
    employmentActual: { type: Number, required: true },
    employmentAsOn: { type: String, required: true },
    employmentStatus: { type: String, enum: ['compliant', 'pending', 'overdue', 'na'], required: true },
    cautionStatus: { type: String, enum: ['held', 'refund_due', 'refund_initiated', 'refunded'], required: true },
    cautionRefundDueDate: { type: String },
    cautionRefundedOn: { type: String },
    subsidyStatus: { type: String, enum: ['not_applied', 'applied', 'approved', 'disbursed', 'rejected'], required: true },
    subsidyAppliedOn: { type: String },
    subsidyApprovedOn: { type: String },
    subsidyDisbursedOn: { type: String },
    subsidyAmountDisbursed: { type: Number },
    constructionStarted: { type: Boolean, required: true },
    constructionCompleted: { type: Boolean, required: true },
    productionStarted: { type: Boolean, required: true },
    productionStartDate: { type: String },
    leaseRenewalStatus: { type: String, enum: ['compliant', 'pending', 'overdue', 'na'], required: true },
    lastInspectionDate: { type: String },
    nextInspectionDate: { type: String },
    inspectionRemarks: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('ComplianceRecord', complianceRecordSchema);
