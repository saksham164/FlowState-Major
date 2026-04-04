import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from './AuthContext'

const SubjectContext = createContext(null)
const MATERIAL_BUCKET = 'subject-files'
const STORAGE_PUBLIC_SEGMENT = `/storage/v1/object/public/${MATERIAL_BUCKET}/`

const EMPTY_STATE = {
  profile: null,
  profileSemester: 1,
  subjects: [],
  materials: [],
}

export function SubjectProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(EMPTY_STATE.profile)
  const [profileSemester, setProfileSemester] = useState(EMPTY_STATE.profileSemester)
  const [subjects, setSubjects] = useState(EMPTY_STATE.subjects)
  const [materials, setMaterials] = useState(EMPTY_STATE.materials)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshSubjects = useCallback(async () => {
    if (!user) {
      setProfile(EMPTY_STATE.profile)
      setProfileSemester(EMPTY_STATE.profileSemester)
      setSubjects(EMPTY_STATE.subjects)
      setMaterials(EMPTY_STATE.materials)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const [profileRes, subjectRes, materialRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('subject_folders')
        .select('id, name, code, semester, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('subject_materials')
        .select('id, subject_id, title, material_type, source, file_url, notes, inbox_item_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(300),
    ])

    if (profileRes.error || subjectRes.error || materialRes.error) {
      setError(
        profileRes.error?.message
          || subjectRes.error?.message
          || materialRes.error?.message
          || 'Unable to load subject folders.'
      )
      setProfile(EMPTY_STATE.profile)
      setProfileSemester(EMPTY_STATE.profileSemester)
      setSubjects(EMPTY_STATE.subjects)
      setMaterials(EMPTY_STATE.materials)
    } else {
      setError(null)
      setProfile(profileRes.data || null)
      setProfileSemester(profileRes.data?.semester || 1)
      setSubjects(subjectRes.data || [])
      setMaterials(materialRes.data || [])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    refreshSubjects()
  }, [refreshSubjects])

  const saveProfile = async (updates) => {
    if (!user) return null

    const payload = {
      user_id: user.id,
      full_name: updates.full_name || user.user_metadata?.full_name || null,
      institution: updates.institution || null,
      program: updates.program || null,
      phone: updates.phone || null,
      semester: Number(updates.semester) || profileSemester || 1,
    }

    const { data, error: upsertError } = await supabase
      .from('user_profiles')
      .upsert([payload], { onConflict: 'user_id' })
      .select('*')
      .single()

    if (upsertError) {
      throw new Error(upsertError.message)
    }

    setProfile(data)
    setProfileSemester(data.semester || 1)
    return data
  }

  const saveSemester = async (semester) => {
    return saveProfile({ ...(profile || {}), semester })
  }

  const getStoragePathFromPublicUrl = (publicUrl) => {
    if (!publicUrl || typeof publicUrl !== 'string') return null
    const markerIndex = publicUrl.indexOf(STORAGE_PUBLIC_SEGMENT)
    if (markerIndex < 0) return null
    return decodeURIComponent(publicUrl.slice(markerIndex + STORAGE_PUBLIC_SEGMENT.length))
  }

  const addSubject = async ({ name, code = '', semester = profileSemester || null }) => {
    if (!user) return null
    const { data, error: insertError } = await supabase
      .from('subject_folders')
      .insert([{ user_id: user.id, name: name.trim(), code: code.trim() || null, semester }])
      .select('id, name, code, semester, created_at')
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    setSubjects((current) => [data, ...current])
    return data
  }

  const deleteSubject = async (subjectId) => {
    if (!user) return

    const { error: materialDeleteError } = await supabase
      .from('subject_materials')
      .delete()
      .eq('subject_id', subjectId)
      .eq('user_id', user.id)

    if (materialDeleteError) {
      throw new Error(materialDeleteError.message)
    }

    const { error: subjectDeleteError } = await supabase
      .from('subject_folders')
      .delete()
      .eq('id', subjectId)
      .eq('user_id', user.id)

    if (subjectDeleteError) {
      throw new Error(subjectDeleteError.message)
    }

    setSubjects((current) => current.filter((subject) => subject.id !== subjectId))
    setMaterials((current) => current.filter((material) => material.subject_id !== subjectId))
  }

  const addMaterial = async ({
    subjectId,
    title,
    materialType = 'note',
    source = 'manual',
    fileUrl = null,
    notes = null,
    inboxItemId = null,
  }) => {
    if (!user) return null

    const payload = {
      user_id: user.id,
      subject_id: subjectId,
      title: title.trim(),
      material_type: materialType,
      source,
      file_url: fileUrl || null,
      notes: notes || null,
      inbox_item_id: inboxItemId || null,
    }

    const materialQuery = supabase.from('subject_materials')
    const mutation = inboxItemId
      ? materialQuery.upsert([payload], { onConflict: 'user_id,inbox_item_id' })
      : materialQuery.insert([payload])

    const { data, error: insertError } = await mutation
      .select('id, subject_id, title, material_type, source, file_url, notes, inbox_item_id, created_at')
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    setMaterials((current) => [data, ...current.filter((item) => item.id !== data.id)])
    return data
  }

  const uploadMaterialFile = async ({ subjectId, title, materialType = 'note', file, notes = null }) => {
    if (!user) return null
    if (!subjectId || !file) {
      throw new Error('Subject and file are required')
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${user.id}/${subjectId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase
      .storage
      .from(MATERIAL_BUCKET)
      .upload(path, file, { upsert: false })

    if (uploadError) {
      const base = uploadError.message || 'Unable to upload file.'
      if (/row-level security|permission|policy/i.test(base)) {
        throw new Error(
          `${base}. Storage policy is blocking uploads. Add INSERT/SELECT policies for bucket "${MATERIAL_BUCKET}" to authenticated users.`,
        )
      }
      if (/bucket not found/i.test(base)) {
        throw new Error(`${base}. Please create storage bucket "${MATERIAL_BUCKET}" in Supabase.`)
      }
      throw new Error(base)
    }

    const { data: urlData } = supabase.storage.from(MATERIAL_BUCKET).getPublicUrl(path)

    return addMaterial({
      subjectId,
      title: title?.trim() || file.name,
      materialType,
      source: 'manual',
      fileUrl: urlData?.publicUrl || null,
      notes,
    })
  }

  const deleteMaterial = async (materialId) => {
    if (!user || !materialId) return

    const material = materials.find((item) => item.id === materialId)
    if (!material) return

    const { error: dbDeleteError } = await supabase
      .from('subject_materials')
      .delete()
      .eq('id', materialId)
      .eq('user_id', user.id)

    if (dbDeleteError) {
      throw new Error(dbDeleteError.message || 'Unable to delete material.')
    }

    const filePath = getStoragePathFromPublicUrl(material.file_url)
    if (filePath) {
      const { error: storageDeleteError } = await supabase
        .storage
        .from(MATERIAL_BUCKET)
        .remove([filePath])

      if (storageDeleteError) {
        // Keep DB delete successful; still notify for cleanup visibility.
        throw new Error(
          `Material removed, but storage cleanup failed: ${storageDeleteError.message || 'Unknown error'}`,
        )
      }
    }

    setMaterials((current) => current.filter((item) => item.id !== materialId))
  }

  const routeInboxItemToSubject = async (item) => {
    if (!user || subjects.length === 0 || !item) return null
    const searchText = `${item.parsed_name || ''} ${item.original_text || ''} ${item.sender || ''}`.toLowerCase()
    const match = subjects.find((subject) => {
      const byName = searchText.includes(subject.name.toLowerCase())
      const byCode = subject.code ? searchText.includes(subject.code.toLowerCase()) : false
      return byName || byCode
    })

    if (!match) return null

    return addMaterial({
      subjectId: match.id,
      title: item.parsed_name || 'Gmail item',
      materialType: /assignment|exam|quiz|project|homework/i.test(`${item.parsed_name || ''} ${item.original_text || ''}`)
        ? 'assignment'
        : 'note',
      source: item.source === 'gmail' ? 'gmail' : 'inbox',
      fileUrl: null,
      notes: item.original_text || null,
      inboxItemId: item.id,
    })
  }

  const materialsBySubject = useMemo(() => (
    materials.reduce((accumulator, material) => {
      const key = material.subject_id
      if (!accumulator[key]) accumulator[key] = []
      accumulator[key].push(material)
      return accumulator
    }, {})
  ), [materials])

  return (
    <SubjectContext.Provider
      value={{
        loading,
        error,
        profile,
        profileSemester,
        subjects,
        materials,
        materialsBySubject,
        saveProfile,
        saveSemester,
        addSubject,
        deleteSubject,
        addMaterial,
        uploadMaterialFile,
        deleteMaterial,
        routeInboxItemToSubject,
        refreshSubjects,
      }}
    >
      {children}
    </SubjectContext.Provider>
  )
}

export function useSubjects() {
  const context = useContext(SubjectContext)
  if (!context) {
    throw new Error('useSubjects must be used within SubjectProvider')
  }
  return context
}
