import express from 'express';
import { requireAuth } from './auth.js';
import ComplianceRecord from '../models/ComplianceRecord.js';
import Plot from '../models/Plot.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const records = await ComplianceRecord.find({ userId: req.userId });
        res.json(records.map(r => ({ ...r.toObject(), id: r._id.toString() })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { plotId } = req.body;
        // verify plot belongs to user
        const plot = await Plot.findOne({ _id: plotId, userId: req.userId });
        if (!plot) return res.status(403).json({ error: 'Not authorized for this plot' });

        let record = await ComplianceRecord.findOne({ plotId });
        if (record) {
            record = Object.assign(record, { ...req.body, updatedBy: req.userId });
        } else {
            record = new ComplianceRecord({ ...req.body, userId: req.userId, updatedBy: req.userId });
        }
        await record.save();
        res.json({ ...record.toObject(), id: record._id.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
