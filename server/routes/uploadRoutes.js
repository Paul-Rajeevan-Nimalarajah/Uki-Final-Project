import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = express.Router()

const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true })
        }
        cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
        cb(null, `${Date.now()}-${safeName}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }
})

router.post('/', (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || 'File upload error' })
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' })
        }

        const protocol = req.protocol || 'http'
        const host = req.get('host') || `localhost:${process.env.PORT || 5000}`
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`

        return res.status(200).json({
            url: fileUrl,
            format: req.file.mimetype,
            originalName: req.file.originalname
        })
    })
})

export default router;