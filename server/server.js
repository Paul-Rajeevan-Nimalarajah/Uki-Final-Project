import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
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

app.use(cors())

app.use(express.json())
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
