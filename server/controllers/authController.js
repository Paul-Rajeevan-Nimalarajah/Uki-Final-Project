import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

export const registerUser = async (req,res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            phone,
            grade,
            school,
            hourlyRate,
            subjects,
            headline,
            bio,
            qualifications,
            experienceYears,
            verificationDocuments
        } = req.body

        const userExists = await User.findOne({email})
        if (userExists){
            return res.status(400).json({message:'User already exists with this email'})
        }

        const userData = {
            name,
            email,
            password,
            role: role || 'student',
            phone
        }

        if (role === 'teacher'){
            const docs = Array.isArray(verificationDocuments)
                ? verificationDocuments.filter(Boolean)
                : typeof verificationDocuments === 'string' && verificationDocuments.trim()
                ? verificationDocuments.split(',').map((d) => d.trim()).filter(Boolean)
                : []

            if (docs.length === 0) {
                return res.status(400).json({
                    message: 'Verification document submission (NIC, Degree, or Teaching Certificate) is mandatory for teacher registration.'
                })
            }

            const parsedSubjects = Array.isArray(subjects)
                ? subjects.filter(Boolean)
                : typeof subjects === 'string' && subjects.trim()
                ? subjects.split(',').map((s) => s.trim()).filter(Boolean)
                : []

            const parsedQualifications = Array.isArray(qualifications)
                ? qualifications.filter(Boolean)
                : typeof qualifications === 'string' && qualifications.trim()
                ? qualifications.split(',').map((q) => q.trim()).filter(Boolean)
                : []

            if (parsedSubjects.length === 0 || parsedQualifications.length === 0) {
                return res.status(400).json({
                    message: 'Please provide your teaching subjects and qualifications for Admin verification.'
                })
            }

            userData.teacherProfile = {
                headline: headline || '',
                bio: bio || '',
                qualifications: parsedQualifications,
                subjects: parsedSubjects,
                hourlyRate: Number(hourlyRate) || 0,
                experienceYears: Number(experienceYears) || 0,
                verificationDocuments: docs,
                verificationStatus: 'pending'
            }
        }

        if (role === 'student'){
            userData.studentProfile = {
                grade: grade || '',
                school: school || ''
            }
        }

        const user = await User.create(userData)

        if (user){
            const token = generateToken(res,user._id)

            res.status(201).json({
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
                phone: user.phone,
                teacherProfile: user.teacherProfile,
                studentProfile: user.studentProfile,
                verificationStatus: user.role === 'teacher' ? user.teacherProfile?.verificationStatus || 'pending' : undefined,
                token
            })
        }else{
            res.status(400).json({message: 'Invalid user data received'})
        }
    } catch (error) {
        res.status(500).json({message:error.message})
    }
}

export const loginUser = async (req,res)=>{
    try{
        const {email,password}=req.body

        const user = await User.findOne({email}).select('+password')

        if (user && (await user.matchPassword(password))){
            if (user.accountStatus === 'suspended') {
                return res.status(403).json({
                    message: 'Your account has been suspended by an Administrator. Please contact support.'
                })
            }
            const token = generateToken(res,user._id)

            res.status(200).json({
                _id: user._id,
                name: user.name,
                email:user.email,
                role: user.role,
                phone: user.phone,
                teacherProfile: user.teacherProfile,
                studentProfile: user.studentProfile,
                verificationStatus: user.role === 'teacher' ? user.teacherProfile?.verificationStatus || 'pending' : undefined,
                token,
            })
        }else{
            res.status(401).json({message:'Invalid email or password'})
        }
    }catch(error){
        res.status(500).json({message:error.message})
    }
}

export const getUserProfile = async (req,res) => {
    try{
        const user = await User.findById(req.user._id)

        if(user){
            res.status(200).json(user)
        }else{
            res.status(404).json({message: 'User not found'})
        }
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const { name, phone, grade, stream, medium, school } = req.body

        if (name) user.name = name
        if (phone !== undefined) user.phone = phone

        if (user.role === 'student') {
            if (!user.studentProfile) user.studentProfile = {}
            if (grade !== undefined) user.studentProfile.grade = grade
            if (stream !== undefined) user.studentProfile.stream = stream
            if (medium !== undefined) user.studentProfile.medium = medium
            if (school !== undefined) user.studentProfile.school = school
        }

        const updatedUser = await user.save()
        res.status(200).json(updatedUser)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}