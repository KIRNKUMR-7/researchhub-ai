import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'researchhub-super-secret';

// Middleware to verify token
export const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.userId;
        next();
    });
};

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already in use' });

        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({ name, email, passwordHash, role: 'officer' });
        await user.save();

        const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ user: { id: user._id, name, email, role: user.role, createdAt: user.createdAt }, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ user: { id: user._id, name: user.name, email, role: user.role, createdAt: user.createdAt }, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/me', requireAuth, async (req, res) => {
    try {
        const { name, role } = req.body;
        const user = await User.findByIdAndUpdate(req.userId, {
            ...(name && { name }),
            ...(role && { role })
        }, { new: true });
        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
