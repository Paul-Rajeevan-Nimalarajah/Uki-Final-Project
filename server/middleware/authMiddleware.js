import jwt from 'jsonwebtoken';
import User from '../models/User.js'

export const protect = async (req, res, next) => {
    let token

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ){
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token,process.env.JWT_SECRET)

            req.user = await User.findById(decoded.id).select('-password')

            if(!req.user){
                return res.status(401).json({message: 'User no longer exists'})
            }

            if (req.user.accountStatus === 'suspended') {
                return res.status(403).json({
                    message: 'Your account access has been suspended by an Administrator.'
                })
            }

            next()
        }catch(error){
            return res.status(401).json({message:'Not authorized, toke failed'})
        }
    }

    if(!token){
        return res.status(401).json({message: 'Not authorized, no token provided'})
    }
}

export const authorize = (...roles)=>{
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return res.status(403).json({
                message: `User role '${req.user.role}' is not authorized to access this route`,
            })
        }
        next()
    }
}

export const requireVerifiedTeacher = (req, res, next) => {
    if (
        req.user &&
        req.user.role === 'teacher' &&
        req.user.teacherProfile?.verificationStatus !== 'approved'
    ) {
        return res.status(403).json({
            message:
                'Access restricted: Your teacher profile and verification documents must be verified and approved by an Admin before you can access platform features.',
        })
    }
    next()
}