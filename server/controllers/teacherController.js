import User from '../models/User.js'

export const getTeacherProfile = async (req,res) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user || user.role !== 'teacher'){
            return res.status(403).json({message: 'Teacher profile not found'})
        }

        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

export const updateTeacherProfile = async (req,res) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user || user.role !== 'teacher'){
            return res.status(403).json({message: 'Teacher profile not found'})
        }

        const {name, phone, headline, bio, qualifications, subjects, hourlyRate, experienceYears, verificationDocuments} = req.body

        if (name) user.name =name
        if (phone) user.phone = phone

        if (headline !== undefined) user.teacherProfile.headline = headline
        if (bio !== undefined) user.teacherProfile.bio = bio
        if (hourlyRate !== undefined) user.teacherProfile.hourlyRate = Number(hourlyRate)
        if (experienceYears !== undefined) user.teacherProfile.experienceYears = Number(experienceYears)

        if (qualifications) user.teacherProfile.qualifications = qualifications
        if (subjects) user.teacherProfile.subjects = subjects
        if (verificationDocuments !== undefined) {
            const validDocs = Array.isArray(verificationDocuments)
                ? verificationDocuments.filter(Boolean)
                : []
            if (validDocs.length === 0) {
                return res.status(400).json({
                    message: 'At least one verification document is required for teacher verification.'
                })
            }
            user.teacherProfile.verificationDocuments = validDocs
        }

        const updatedUser = await user.save()
        res.status(200).json(updatedUser)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}