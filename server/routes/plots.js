import express from 'express';
import { requireAuth } from './auth.js';
import Plot from '../models/Plot.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const plots = await Plot.find({ userId: req.userId }).sort({ createdAt: -1 });
        // Map _id to id for frontend compatibility
        res.json(plots.map(p => ({ ...p.toObject(), id: p._id.toString() })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const plot = new Plot({ ...req.body, userId: req.userId });
        await plot.save();
        res.status(201).json({ ...plot.toObject(), id: plot._id.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const plot = await Plot.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
        if (!plot) return res.status(404).json({ error: 'Plot not found' });
        res.json({ ...plot.toObject(), id: plot._id.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const plot = await Plot.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!plot) return res.status(404).json({ error: 'Plot not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
