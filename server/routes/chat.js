import express from 'express';
import { requireAuth } from './auth.js';
import ChatMessage from '../models/ChatMessage.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const msgs = await ChatMessage.find({ userId: req.userId }).sort({ timestamp: 1 });
        res.json(msgs.map(m => ({ ...m.toObject(), id: m._id.toString() })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const msg = new ChatMessage({ ...req.body, userId: req.userId });
        await msg.save();
        res.status(201).json({ ...msg.toObject(), id: msg._id.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
