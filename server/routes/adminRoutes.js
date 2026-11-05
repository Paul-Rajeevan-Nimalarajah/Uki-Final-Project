import express from 'express'
import {
    getPendingTeachers,
    verifyTeacher,
    getAdminFullRecords,
    updateUserPermissions,
    updateClassStatusByAdmin,
    updateBookingStatusByAdmin,
} from '../controllers/adminController.js'
import {protect, authorize} from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/records', protect, authorize('admin'), getAdminFullRecords)
router.get('/teachers/pending', protect, authorize('admin'), getPendingTeachers)
router.put('/teachers/:id/verify', protect, authorize('admin'), verifyTeacher)
router.put('/users/:id/permissions', protect, authorize('admin'), updateUserPermissions)
router.put('/classes/:id/status', protect, authorize('admin'), updateClassStatusByAdmin)
router.put('/bookings/:id/status', protect, authorize('admin'), updateBookingStatusByAdmin)

export default router;