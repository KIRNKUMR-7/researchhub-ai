import express from 'express';
import { requireAuth } from './auth.js';
import PlotDocument from '../models/PlotDocument.js';
import Plot from '../models/Plot.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const docs = await PlotDocument.find({ userId: req.userId });
        res.json(docs.map(d => ({ ...d.toObject(), id: d._id.toString() })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { plotId } = req.body;
        const plot = await Plot.findOne({ _id: plotId, userId: req.userId });
        if (!plot) return res.status(403).json({ error: 'Not authorized for this plot' });

        const doc = new PlotDocument({ ...req.body, userId: req.userId });
        await doc.save();
        res.status(201).json({ ...doc.toObject(), id: doc._id.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const doc = await PlotDocument.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
