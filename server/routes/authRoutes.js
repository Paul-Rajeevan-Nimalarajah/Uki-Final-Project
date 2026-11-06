import express from 'express'
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    changePassword
} from '../controllers/authController.js'
import {protect} from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register',registerUser)
router.post('/login',loginUser)
router.post('/verify-email', verifyEmail)
router.post('/resend-verification', resendVerificationEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/profile',protect,getUserProfile)
router.put('/profile',protect,updateUserProfile)
router.put('/change-password', protect, changePassword)

export default router;