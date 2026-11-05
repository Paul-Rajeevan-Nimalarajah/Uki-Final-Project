import User from '../models/User.js'
import BookingRequest from '../models/BookingRequest.js'
import ClassSession from '../models/ClassSession.js'

export const getPendingTeachers = async (req,res) => {
    try {
        const statusFilter = req.query.status
        const query = { role: 'teacher' }
        if (statusFilter && statusFilter !== 'all') {
            query['teacherProfile.verificationStatus'] = statusFilter
        } else if (!statusFilter) {
            query['teacherProfile.verificationStatus'] = 'pending'
        }

        const teachers = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })

        res.status(200).json(teachers)
    }catch (error){
        res.status(500).json({message: error.message})
    }
}

export const getAdminFullRecords = async (req, res) => {
    try {
        const [students, teachers, bookings, classes] = await Promise.all([
            User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 }),
            User.find({ role: 'teacher' }).select('-password').sort({ createdAt: -1 }),
            BookingRequest.find({})
                .populate('student', 'name email phone studentProfile')
                .populate('teacher', 'name email phone teacherProfile')
                .populate('classSession', 'title classType fee')
                .sort({ createdAt: -1 }),
            ClassSession.find({})
                .populate('teacher', 'name email')
                .sort({ createdAt: -1 }),
        ])

        const transactions = bookings.filter((b) =>
            ['Confirmed', 'Completed'].includes(b.status)
        )

        res.status(200).json({
            students,
            teachers,
            transactions,
            allBookings: bookings,
            classes,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const verifyTeacher = async (req,res) => {
    try {
        const {status} = req.body

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({message: "Status must be 'approved', 'rejected', or 'pending'"})
        }

        const teacher = await User.findById(req.params.id)

        if (!teacher || teacher.role !== 'teacher'){
            return res.status(404).json({message: 'Teacher not found'})
        }

        teacher.teacherProfile.verificationStatus = status
        await teacher.save()

        res.status(200).json({
            message: `Teacher verification ${status} successfully`,
            teacher: {
                _id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                verificationStatus: teacher.teacherProfile.verificationStatus
            }
        })
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

export const updateUserPermissions = async (req, res) => {
    try {
        const { accountStatus, verificationStatus, permissions } = req.body
        const user = await User.findById(req.params.id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (accountStatus && ['active', 'suspended'].includes(accountStatus)) {
            user.accountStatus = accountStatus
        }

        if (
            verificationStatus &&
            ['approved', 'pending', 'rejected'].includes(verificationStatus)
        ) {
            if (!user.teacherProfile) user.teacherProfile = {}
            user.teacherProfile.verificationStatus = verificationStatus
        }

        if (permissions && typeof permissions === 'object') {
            user.permissions = {
                canCreateClasses:
                    permissions.canCreateClasses ??
                    user.permissions?.canCreateClasses ??
                    true,
                canBookClasses:
                    permissions.canBookClasses ??
                    user.permissions?.canBookClasses ??
                    true,
                canChat:
                    permissions.canChat ?? user.permissions?.canChat ?? true,
            }
        }

        await user.save()

        const updatedUser = await User.findById(user._id).select('-password')
        res.status(200).json({
            message: `Updated permissions for ${user.name}`,
            user: updatedUser,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateClassStatusByAdmin = async (req, res) => {
    try {
        const { status } = req.body
        const allowedStatuses = [
            'Draft',
            'Published',
            'Full',
            'Ongoing',
            'Completed',
            'Cancelled',
            'Suspended',
        ]

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid class status' })
        }

        const classSession = await ClassSession.findById(req.params.id)
        if (!classSession) {
            return res.status(404).json({ message: 'Class not found' })
        }

        classSession.status = status
        classSession.lockedByAdmin = true
        await classSession.save()

        const populated = await ClassSession.findById(classSession._id).populate(
            'teacher',
            'name email teacherProfile'
        )

        res.status(200).json({
            message: `Class status set to "${status}" and locked by Admin`,
            classSession: populated,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateBookingStatusByAdmin = async (req, res) => {
    try {
        const { status } = req.body
        const booking = await BookingRequest.findById(req.params.id)
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' })
        }

        booking.status = status
        booking.lockedByAdmin = true
        await booking.save()

        res.status(200).json({
            message: `Booking status set to "${status}" and locked by Admin`,
            booking,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}