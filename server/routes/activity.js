import express from 'express';
import { requireAuth } from './auth.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const logs = await ActivityLog.find({ userId: req.userId }).sort({ time: -1 }).limit(20);
        res.json(logs.map(l => ({ ...l.toObject(), id: l._id.toString() })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const log = new ActivityLog({ ...req.body, userId: req.userId });
        await log.save();
        res.status(201).json({ ...log.toObject(), id: log._id.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
