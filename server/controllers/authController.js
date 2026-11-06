import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'
import { sendEmail, buildOtpEmailHtml } from '../utils/sendEmail.js'

const generateSixDigitOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

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

        const existingUser = await User.findOne({email}).select('+emailVerificationOTP')
        if (existingUser && (existingUser.isEmailVerified || !existingUser.emailVerificationOTP)){
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

        const otpCode = generateSixDigitOTP()
        userData.isEmailVerified = false
        userData.emailVerificationOTP = otpCode
        userData.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000)

        let user
        if (existingUser) {
            existingUser.name = userData.name
            existingUser.password = userData.password
            existingUser.role = userData.role
            existingUser.phone = userData.phone
            if (userData.teacherProfile) existingUser.teacherProfile = userData.teacherProfile
            if (userData.studentProfile) existingUser.studentProfile = userData.studentProfile
            existingUser.isEmailVerified = false
            existingUser.emailVerificationOTP = otpCode
            existingUser.emailVerificationExpires = userData.emailVerificationExpires
            user = await existingUser.save()
        } else {
            user = await User.create(userData)
        }

        if (user){
            const emailResult = await sendEmail({
                to: user.email,
                subject: 'Verify Your LearnyMo Account — 6-Digit Code',
                otpCode,
                html: buildOtpEmailHtml({
                    name: user.name,
                    title: 'Verify Your Email Address',
                    subtitle: 'welcome to LearnyMo! Please enter the 6-digit code below to verify your email address and activate your account.',
                    otpCode
                })
            })

            const token = generateToken(res,user._id)

            res.status(201).json({
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
                phone: user.phone,
                isEmailVerified: user.isEmailVerified,
                requiresEmailVerification: true,
                teacherProfile: user.teacherProfile,
                studentProfile: user.studentProfile,
                verificationStatus: user.role === 'teacher' ? user.teacherProfile?.verificationStatus || 'pending' : undefined,
                token,
                emailSent: emailResult.sent,
                emailError: emailResult.error,
                devOtp: emailResult.devFallback ? otpCode : undefined
            })
        }else{
            res.status(400).json({message: 'Invalid user data received'})
        }
    } catch (error) {
        res.status(500).json({message:error.message})
    }
}

export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email || !otp) {
            return res.status(400).json({ message: 'Please provide your email and 6-digit verification code' })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
            '+emailVerificationOTP +emailVerificationExpires'
        )

        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address' })
        }

        if (
            !user.isEmailVerified &&
            (!user.emailVerificationOTP ||
                user.emailVerificationOTP !== otp.trim() ||
                !user.emailVerificationExpires ||
                user.emailVerificationExpires < new Date())
        ) {
            return res.status(400).json({
                message: 'Invalid or expired verification code. Please request a new code.'
            })
        }

        user.isEmailVerified = true
        user.emailVerificationOTP = undefined
        user.emailVerificationExpires = undefined
        await user.save()

        const token = generateToken(res, user._id)

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            isEmailVerified: true,
            teacherProfile: user.teacherProfile,
            studentProfile: user.studentProfile,
            verificationStatus: user.role === 'teacher' ? user.teacherProfile?.verificationStatus || 'pending' : undefined,
            token,
            message: 'Email verified successfully!'
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ message: 'Please provide your email address' })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address' })
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'This email is already verified' })
        }

        const otpCode = generateSixDigitOTP()
        user.emailVerificationOTP = otpCode
        user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000)
        await user.save()

        const emailResult = await sendEmail({
            to: user.email,
            subject: 'Your New LearnyMo Verification Code',
            otpCode,
            html: buildOtpEmailHtml({
                name: user.name,
                title: 'Verify Your Email Address',
                subtitle: 'here is your new 6-digit verification code for LearnyMo.',
                otpCode
            })
        })

        res.status(200).json({
            message: emailResult.sent
                ? 'A new 6-digit verification code has been sent to your email.'
                : 'Verification code generated (check server console or dev banner).',
            emailSent: emailResult.sent,
            devOtp: emailResult.devFallback ? otpCode : undefined
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ message: 'Please provide your registered email address' })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email address' })
        }

        const otpCode = generateSixDigitOTP()
        user.resetPasswordOTP = otpCode
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000)
        await user.save()

        const emailResult = await sendEmail({
            to: user.email,
            subject: 'LearnyMo Password Reset Code',
            otpCode,
            html: buildOtpEmailHtml({
                name: user.name,
                title: 'Reset Your LearnyMo Password',
                subtitle: 'we received a request to reset your password. Enter the 6-digit code below on the password reset page to set a new password.',
                otpCode,
                footerNote: 'This password reset code expires in 15 minutes. If you did not request a password reset, your account remains secure.'
            })
        })

        res.status(200).json({
            message: emailResult.sent
                ? 'A 6-digit password reset code has been sent to your email address.'
                : 'Password reset code generated! (SMTP not active yet — use the code shown below or in server console).',
            emailSent: emailResult.sent,
            devOtp: emailResult.devFallback ? otpCode : undefined
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: 'Please provide your email, 6-digit reset code, and new password'
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters long'
            })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
            '+password +resetPasswordOTP +resetPasswordExpires'
        )

        if (!user) {
            return res.status(404).json({ message: 'No account found with that email address' })
        }

        if (
            !user.resetPasswordOTP ||
            user.resetPasswordOTP !== otp.trim() ||
            !user.resetPasswordExpires ||
            user.resetPasswordExpires < new Date()
        ) {
            return res.status(400).json({
                message: 'Invalid or expired reset code. Please request a new code.'
            })
        }

        user.password = newPassword
        user.resetPasswordOTP = undefined
        user.resetPasswordExpires = undefined
        user.isEmailVerified = true
        await user.save()

        res.status(200).json({
            message: 'Your password has been reset successfully! You can now sign in with your new password.'
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Please provide both your current password and a new password'
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters long'
            })
        }

        const user = await User.findById(req.user._id).select('+password')
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const isMatch = await user.matchPassword(currentPassword)
        if (!isMatch) {
            return res.status(401).json({ message: 'Your current password is incorrect' })
        }

        user.password = newPassword
        await user.save()

        res.status(200).json({
            message: 'Password updated successfully!'
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
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
                isEmailVerified: user.isEmailVerified,
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