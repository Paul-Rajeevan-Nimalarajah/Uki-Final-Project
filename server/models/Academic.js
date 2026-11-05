import mongoose, { mongo } from "mongoose";

const topicSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true,
        trim: true
    },
    desciption: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    }
})

const unitSchema = new mongoose.Schema({
    unitNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim:true
    },
    topics: [topicSchema]
})

const academicSchema = new mongoose.Schema(
    {
        grade: {
            type: String,
            required: [true, 'Please provide a grade level (e.g. Grade 11, A/L)'],
            trim: true
        },
        stream: {
            type: String,
            enum: ['Physical Science', 'Biological Science', 'Commerce', 'Technology', 'Arts', 'General'],
            default: 'General'
        },
        subject: {
            type: String,
            required: [true, 'Please provide a subject name (e.g. Combined Mathematics, Physics'],
            trim: true
        },
        units: [unitSchema]
    },
    {
        timestamps: true
    }
)

const Academic = mongoose.model('Academic',academicSchema)
export default Academic;