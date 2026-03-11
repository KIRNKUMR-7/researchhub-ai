import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot' },
    action: { type: String, required: true },
    detail: { type: String, required: true },
    time: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('ActivityLog', activityLogSchema);
