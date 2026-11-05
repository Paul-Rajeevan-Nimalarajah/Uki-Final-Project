import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:[true,'Please provide a name'],
            trim:true
        },
        email:{
            type:String,
            required:[true,'Please provide an email'],
            unique:true,
            lowercase:true,
            trim:true
        },
        password:{
            type: String,
            required:[true,'Please provide a password'],
            minlength:6,
            select:false
        },
        role:{
            type: String,
            enum:['student','teacher','admin'],
            default:'student'
        },
        phone:{
            type:String,
            trim:true
        },
        avatar:{
            type:String,
            default:''
        },
        walletBalance: {
            type: Number,
            default:0
        },

        teacherProfile:{
            headline: {type: String, default: ''},
            bio:{type: String,default:''},
            qualifications: [{type: String}],
            subjects: [{type: String}],
            grades: [{type: String}],
            mediums: [{type: String}],
            availability: [{type: String}],
            verificationDocuments: [{type: String}],
            verificationStatus: {
                type: String,
                enum: ['pending','approved','rejected'],
                default:'pending'
            },
            hourlyRate: {type:Number,default:0},
            experienceYears: {type: Number, default:0},
            rating: {type:Number,default:5.0},
            ratingCount: {type:Number,default:1}
        },

        studentProfile: {
            studentId: {type: String, default: ''},
            grade: {type: String,default:''},
            stream: {type: String,default:''},
            medium: {type: String,default:'English'},
            school: {type: String,default: ''},
            topicProgress: [
                {
                    grade: {type: String, default: ''},
                    subject: {type: String, default: ''},
                    unitTitle: {type: String, default: ''},
                    topicName: {type: String, default: ''},
                    status: {
                        type: String,
                        enum: ['not_started', 'not_clear', 'clear'],
                        default: 'not_started'
                    },
                    updatedAt: {type: Date, default: Date.now}
                }
            ],
            studyPlans: [
                {
                    subject: {type: String, default: ''},
                    topicName: {type: String, default: ''},
                    preferredSlot: {type: String, default: 'Evening (5 PM - 8 PM)'},
                    day1Learn: {type: String, default: ''},
                    day4Review: {type: String, default: ''},
                    day7Recall: {type: String, default: ''},
                    createdAt: {type: Date, default: Date.now}
                }
            ]
        }
    },
    {
        timestamps:true
    }
)

userSchema.pre('save',async function (){
    if (this.role === 'student' && (!this.studentProfile || !this.studentProfile.studentId)) {
        const randomNum = Math.floor(10000 + Math.random() * 90000)
        if (!this.studentProfile) this.studentProfile = {}
        this.studentProfile.studentId = `LMO-${randomNum}`
    }
    if (!this.isModified('password')) return
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password,salt)
})

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.password)
}

const User = mongoose.model('User', userSchema)

export default User;
