import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import academicRoutes from './routes/academicRoutes.js'
import teacherRoutes from './routes/teacherRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import marketplaceRoutes from './routes/marketplaceRoutes.js'
import { ensureProductionSampleData } from './utils/seedProductionData.js'

dotenv.config()

const app = express()

const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

app.use(cors())

app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))
app.use('/uploads', express.static(uploadsDir))
app.use('/api/auth',authRoutes)
app.use('/api/academic',academicRoutes)
app.use('/api/teachers',teacherRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/admin',adminRoutes)
app.use('/api/marketplace', marketplaceRoutes)

connectDB().then(() => {
    ensureProductionSampleData()
})

app.get('/api/health',(req,res)=>{
    res.status(200).json({
        status: 'success',
        message: 'LearnyMo Backend is active and running!',
        timestamp: new Date()
    })
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`LearnyMo Server running on http://localhost:${PORT}`);
});
