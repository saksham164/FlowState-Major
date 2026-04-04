import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from './AuthContext'

const ProfileContext = createContext(null)
const MATERIAL_BUCKET = 'subject-files'
const ALLOWED_MATERIAL_TYPES = ['note', 'assignment', 'reference']

function sanitizeMaterialType(type) {
  return ALLOWED_MATERIAL_TYPES.includes(type) ? type : 'note'
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function inferMaterialType(text) {
  const lower = String(text || '').toLowerCase()
  if (/(assignment|deadline|submission|project|homework|exam|quiz|test)/.test(lower)) {
    return 'assignment'
  }
  if (/(syllabus|reference|material|resource|notes)/.test(lower)) {
    return 'reference'
  }
  return 'note'
}

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshProfileData = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setSubjects([])
      setMaterials([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    const [profileResult, subjectsResult, materialsResult] = await Promise.allSettled([
      supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('subjects').select('*').order('semester', { ascending: true }).order('name', { ascending: true }),
      supabase.from('subject_materials').select('*').order('created_at', { ascending: false }),
    ])

    if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
      setProfile(profileResult.value.data || null)
    } else {
      setProfile(null)
    }

    if (subjectsResult.status === 'fulfilled' && !subjectsResult.value.error) {
      setSubjects(subjectsResult.value.data || [])
    } else {
      setSubjects([])
    }

    if (materialsResult.status === 'fulfilled' && !materialsResult.value.error) {
      setMaterials(materialsResult.value.data || [])
      setError(null)
    } else {
      setMaterials([])
      setError('Unable to load profile folders right now.')
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    refreshProfileData()
  }, [refreshProfileData])

  const saveProfile = useCallback(async (updates) => {
    if (!user) return null
    const payload = {
      id: user.id,
      email: user.email,
      full_name: updates.full_name || user.user_metadata?.full_name || null,
      institution: updates.institution || null,
      program: updates.program || null,
      phone: updates.phone || null,
      semester: updates.semester ? Number(updates.semester) : null,
    }

    const { data, error: saveError } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (saveError) {
      throw new Error(saveError.message)
    }
    setProfile(data)
    return data
  }, [user])

  const addSubject = useCallback(async ({ name, semester }) => {
    if (!user) return null
    const { data, error: insertError } = await supabase
      .from('subjects')
      .insert([{
        user_id: user.id,
        name: name.trim(),
        semester: Number(semester) || 1,
      }])
      .select()
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }
    setSubjects((current) => [...current, data].sort((a, b) => (a.semester - b.semester) || a.name.localeCompare(b.name)))
    return data
  }, [user])

  const deleteSubject = useCallback(async (subjectId) => {
    const { error: deleteError } = await supabase.from('subjects').delete().eq('id', subjectId)
    if (deleteError) {
      throw new Error(deleteError.message)
    }
    setSubjects((current) => current.filter((subject) => subject.id !== subjectId))
    setMaterials((current) => current.filter((material) => material.subject_id !== subjectId))
  }, [])

  const uploadMaterial = useCallback(async ({ subjectId, title, materialType, file }) => {
    if (!user) return null
    if (!subjectId || !file) {
      throw new Error('Subject and file are required')
    }

    const filePath = `${user.id}/${subjectId}/${Date.now()}-${sanitizeFileName(file.name)}`
    const { error: uploadError } = await supabase.storage
      .from(MATERIAL_BUCKET)
      .upload(filePath, file, { upsert: false })

    if (uploadError) {
      throw new Error(`${uploadError.message}. Ensure storage bucket "${MATERIAL_BUCKET}" exists.`)
    }

    const { data: urlData } = supabase.storage.from(MATERIAL_BUCKET).getPublicUrl(filePath)

    const { data, error: insertError } = await supabase
      .from('subject_materials')
      .insert([{
        user_id: user.id,
        subject_id: subjectId,
        title: title?.trim() || file.name,
        material_type: sanitizeMaterialType(materialType),
        source: 'upload',
        file_path: filePath,
        file_url: urlData?.publicUrl || null,
      }])
      .select()
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }
    setMaterials((current) => [data, ...current])
    return data
  }, [user])

  const inferSubjectFromInboxItem = useCallback((item) => {
    if (!subjects.length) return null
    const haystack = `${item?.parsed_name || ''} ${item?.original_text || ''} ${item?.sender || ''}`.toLowerCase()
    const exactMatch = subjects.find((subject) => haystack.includes(subject.name.toLowerCase()))
    if (exactMatch) return exactMatch
    if (String(item?.parsed_category || '').toLowerCase() === 'study') {
      return subjects[0]
    }
    return null
  }, [subjects])

  const createMaterialFromInboxItem = useCallback(async (item) => {
    if (!user || !item) return null
    const matchedSubject = inferSubjectFromInboxItem(item)
    if (!matchedSubject) return null

    const combinedText = `${item.parsed_name || ''} ${item.original_text || ''}`
    const { data, error: insertError } = await supabase
      .from('subject_materials')
      .insert([{
        user_id: user.id,
        subject_id: matchedSubject.id,
        title: item.parsed_name || 'Gmail item',
        material_type: inferMaterialType(combinedText),
        source: 'gmail',
        description: item.original_text || null,
        external_ref: item.sender || null,
      }])
      .select()
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    setMaterials((current) => [data, ...current])
    return data
  }, [inferSubjectFromInboxItem, user])

  const folders = useMemo(() => {
    return subjects.map((subject) => ({
      ...subject,
      materials: materials.filter((material) => material.subject_id === subject.id),
    }))
  }, [materials, subjects])

  return (
    <ProfileContext.Provider
      value={{
        profile,
        subjects,
        materials,
        folders,
        loading,
        error,
        refreshProfileData,
        saveProfile,
        addSubject,
        deleteSubject,
        uploadMaterial,
        createMaterialFromInboxItem,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfileData() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfileData must be used within ProfileProvider')
  }
  return context
}
