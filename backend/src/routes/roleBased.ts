import express from 'express';
import {
    completeRecyclerRegistration,
    getUserProfile,
    getVerifiedRecyclers,
    registerUser
} from '../controllers/roleBasedController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Register user with role
router.post('/register', registerUser);

// Complete recycler registration (requires authentication)
router.post('/recycler/complete-registration', authenticateToken, completeRecyclerRegistration);

// Get verified recyclers (public endpoint)
router.get('/recyclers/verified', getVerifiedRecyclers);

// Get user profile with role-based data
router.get('/profile', authenticateToken, getUserProfile);

export default router; 