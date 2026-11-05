import { createContext, useContext, useState, useEffect } from "react";
import API from '../api/axios'
import { syncUserToRegistry, applyOverridesToUser } from '../utils/userRegistry'

const AuthContext = createContext()

export const AuthProvider = ({children})=>{
    const [user,setUser] = useState(null)
    const [loading,setLoading]= useState(true)

    const updateUser = (updates) => {
        setUser((prev) => {
            if (!prev) return prev
            const next = applyOverridesToUser({ ...prev, ...updates })
            localStorage.setItem('userInfo', JSON.stringify(next))
            syncUserToRegistry(next)
            return next
        })
    }

    const refreshUser = async () => {
        try {
            const savedUser = localStorage.getItem('userInfo')
            if (!savedUser) return null
            const parsed = JSON.parse(savedUser)
            if (!parsed?.token) return null
            const endpoint =
                parsed.role === 'teacher' ? '/teachers/profile' : '/auth/profile'
            const res = await API.get(endpoint)
            const updated = applyOverridesToUser({
                ...parsed,
                ...res.data,
                verificationStatus:
                    res.data.role === 'teacher'
                        ? res.data.teacherProfile?.verificationStatus || 'pending'
                        : undefined,
                token: parsed.token,
            })
            localStorage.setItem('userInfo', JSON.stringify(updated))
            syncUserToRegistry(updated)
            setUser(updated)
            return updated
        } catch (err) {
            return null
        }
    }

    useEffect(()=>{
        const initAuth = async () => {
            const savedUser = localStorage.getItem('userInfo')
            if (savedUser){
                const parsed = applyOverridesToUser(JSON.parse(savedUser))
                setUser(parsed)
                syncUserToRegistry(parsed)
                try {
                    const endpoint =
                        parsed.role === 'teacher'
                            ? '/teachers/profile'
                            : '/auth/profile'
                    const res = await API.get(endpoint)
                    const updated = applyOverridesToUser({
                        ...parsed,
                        ...res.data,
                        verificationStatus:
                            res.data.role === 'teacher'
                                ? res.data.teacherProfile?.verificationStatus || 'pending'
                                : undefined,
                        token: parsed.token,
                    })
                    localStorage.setItem('userInfo', JSON.stringify(updated))
                    syncUserToRegistry(updated)
                    setUser(updated)
                } catch (err) {
                    // keep cached user if offline
                }
            }
            setLoading(false)
        }
        initAuth()
    },[])

    const register = async (userData) => {
        const response = await API.post('/auth/register',userData)
        let data = response.data;
        if (data.role === 'teacher' && !data.teacherProfile) {
            data = {
                ...data,
                phone: userData.phone || data.phone,
                verificationStatus: 'pending',
                teacherProfile: {
                    headline: userData.headline || '',
                    bio: userData.bio || '',
                    hourlyRate: Number(userData.hourlyRate) || 0,
                    experienceYears: Number(userData.experienceYears) || 0,
                    subjects: userData.subjects || [],
                    qualifications: userData.qualifications || [],
                    verificationStatus: 'pending',
                    verificationDocuments: userData.verificationDocuments || [],
                },
            }
        } else if (data.role === 'student' && !data.studentProfile) {
            data = {
                ...data,
                phone: userData.phone || data.phone,
                studentProfile: {
                    studentId: data.studentId || 'LMO-10294',
                    grade: userData.grade || 'A/L',
                    stream: userData.stream || 'Physical Science',
                    medium: userData.medium || 'English',
                    school: userData.school || '',
                    topicProgress: [],
                    studyPlans: [],
                },
            }
        }
        data = applyOverridesToUser(data)
        localStorage.setItem('userInfo', JSON.stringify(data))
        syncUserToRegistry(data)
        setUser(data)
        return data
    }

    const login = async (email,password) => {
        const response = await API.post('/auth/login',{email,password})
        let data = response.data
        if (data.role === 'teacher' && !data.teacherProfile) {
            try {
                localStorage.setItem('userInfo', JSON.stringify(data))
                const profRes = await API.get('/teachers/profile')
                data = {
                    ...data,
                    ...profRes.data,
                    verificationStatus:
                        profRes.data.teacherProfile?.verificationStatus || 'pending',
                    token: data.token,
                }
            } catch (err) {
                // fallback if profile fetch fails
            }
        }
        data = applyOverridesToUser(data)
        localStorage.setItem('userInfo',JSON.stringify(data))
        syncUserToRegistry(data)
        setUser(data)
        return data
    }

    const logout = () => {
        localStorage.removeItem('userInfo')
        setUser(null)
    }

    return(
        <AuthContext.Provider value={{user, loading, register, login, logout, refreshUser, updateUser}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)