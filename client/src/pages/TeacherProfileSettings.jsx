import { useState,useEffect } from "react";
import API from '../api/axios'
import {Briefcase, AlertCircle, CheckCircle, Clock, Save, FileText} from 'lucide-react'

const TeacherProfileSettings = () => {
    const [formData, setFormData] = useState({
        headline: '',
        bio: '',
        hourlyRate: 0,
        experienceYears: 0,
        subjects: '',
        qualifications: '',
        verificationDocuments: ''
    })
    const [verificationStatus, setVerificationStatus] = useState('pending')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [uploading, setUploading] = useState(false)

    useEffect(()=>{
        const fetchProfile = async () => {
            try{
                const res = await API.get('/teachers/profile')
                const tp = res.data.teacherProfile || {}

                setVerificationStatus(tp.verificationStatus || 'pending')
                setFormData({
                    headline: tp.headline || '',
                    bio: tp.bio || '',
                    hourlyRate: tp.hourlyRate || 0,
                    experienceYears: tp.experienceYears || 0,
                    subjects: tp.subjects ? tp.subjects.join(', '): '',
                    qualifications: tp.qualifications ? tp.qualifications.join(', '):'',
                    verificationDocuments: tp.verificationDocuments ? tp.verificationDocuments.join(', '):'',
                })
            }catch (err){
                setError(err.response?.data?.message || 'Failed to load teacher profile') 
            }finally{
                setLoading(false)
            }
        }
        fetchProfile();
    },[])

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value })
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const uploadData = new FormData()
        uploadData.append('file',file)

        setUploading(true)

        try{
            const res = await API.post('/upload',uploadData, {
                headers: {'Content-Type' : 'multipart/form-data'}
            })

            const currentDocs = formData.verificationDocuments ? formData.verificationDocuments.split(',').map((d) => d.trim()).filter(Boolean) : []

            currentDocs.push(res.data.url)
            setFormData({...formData, verificationDocuments: currentDocs.join(', ')})
        }catch (err){
            alert(err.response?.data?.message || 'File upload failed')
        }finally{
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        setError('')

        try {
            const payload = {
                ...formData,
                subjects: formData.subjects.split(',').map((s) => s.trim()).filter(Boolean),
                qualifications: formData.qualifications.split(',').map((q)=>q.trim()).filter(Boolean),
                verificationDocuments: formData.verificationDocuments.split(',').map((d)=>d.trim()).filter(Boolean)
            }

            const res = await API.put('/teachers/profile', payload)

            setVerificationStatus(res.data.teacherProfile.verificationStatus)
            setMessage('Profile updated! Your chages are pending Admin approval.')
        }catch(err){
            setError(err.response?.data?.message || 'Failed to update profile')
        }finally {
            setSaving(false)
        }
    }
    if(loading){
        return <div className="p-8 text-center text-slate-500">Loading your profile...</div>
    }
     return(
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Teacher Profile & Verification</h2>
                    <p className="text-sm text-slate-500">Manage your credentials, teaching areas, and rates</p>
                </div>
                <div>
                    {verificationStatus === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-4 h-4"/>
                            Verified Teacher
                        </span>
                    )}
                    {verificationStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-4 h-4"/>
                            Pending Admin Review
                        </span>
                    )}
                    {verificationStatus === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-4 h-4"/>
                            Verification Rejected
                        </span>
                    )}
                </div>
            </div>

            {message && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl">
                    {message}
                </div>
            )}

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Professional Headline
                    </label>
                    <input type="text" name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g. BSc Engineering • 5+ Yrs Combined Maths Specialist" className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Hourly Rate (LKR)
                        </label>
                        <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Teaching Experience (Years)
                        </label>
                        <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Teaching Subject (Coma Separated)
                    </label>
                    <input type="text" name="subjects" value={formData.subjects} onChange={handleChange} placeholder="Combined Mathematics, Physics" className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal" />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Qualifications & Degrees (Comma Separated)</label>
                    <input type="text" name="qualifications" value={formData.qualifications} onChange={handleChange} placeholder="BSc Eng (Hons) Moratuwa, Dip in Education" className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal" />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">About You / Bio</label>
                    <textarea name="bio" rows={4} value={formData.bio} onChange={handleChange} placeholder="Tell student about your teching methodology, past student results, and expertise..." className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal"/>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Verification Documents (NIC / Degree / Certificate URLs)
                    </label>
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all text-xs font-semibold text-slate-700">
                            <FileText className="w-4 h-4 text-brand-teal"/>
                            <span>{uploading ? 'uploading to cloud...' : 'Choose File (PDF or Image)'}</span>
                            <input type="file" accept="image/*,.pdf" disabled={uploading} onChange={handleFileUpload} className="hidden"/>
                        </label>

                        {uploading && <span className="text-xs text-brand-teal animate-pulse">Uploading...</span>}
                    </div>

                    {formData.verificationDocuments && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {formData.verificationDocuments.split(',').map((docUrl,idx) => (
                                <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                                    Document {idx + 1} Attached
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand-teal hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
                    <Save className="w-4 h-4"/>
                    {saving ? 'Saving changes...' : 'Save & Submit for Verification'}
                </button>
            </form>
        </div>
     )
    
}

export default TeacherProfileSettings