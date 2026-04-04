import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpenText,
  Download,
  ExternalLink,
  FileArchive,
  FileCheck2,
  FileText,
  FolderOpen,
  Link2,
  Trash2,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSubjects } from '../context/SubjectContext'
import './Folders.css'

function materialTypeLabel(type) {
  if (type === 'assignment') return 'Assignment'
  if (type === 'resource') return 'Resource'
  return 'Note'
}

function materialIcon(type) {
  if (type === 'assignment') return <FileCheck2 size={16} />
  if (type === 'resource') return <FileArchive size={16} />
  return <FileText size={16} />
}

function getExtensionFromUrl(url) {
  if (!url) return ''
  try {
    const clean = url.split('?')[0]
    const dotIndex = clean.lastIndexOf('.')
    if (dotIndex < 0) return ''
    return clean.slice(dotIndex + 1).toLowerCase()
  } catch {
    return ''
  }
}

function getOpenUrl(fileUrl) {
  if (!fileUrl) return ''
  const ext = getExtensionFromUrl(fileUrl)
  const officeExts = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']
  if (officeExts.includes(ext)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`
  }
  return fileUrl
}

export default function Folders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { subjects, materialsBySubject, loading, deleteMaterial } = useSubjects()
  const requestedSubjectId = searchParams.get('subject') || ''
  const [activeSubjectId, setActiveSubjectId] = useState(requestedSubjectId)
  const [feedback, setFeedback] = useState('')
  const [busyMaterialId, setBusyMaterialId] = useState('')

  useEffect(() => {
    if (requestedSubjectId) {
      setActiveSubjectId(requestedSubjectId)
      return
    }
    if (!activeSubjectId && subjects.length > 0) {
      const first = subjects[0].id
      setActiveSubjectId(first)
      setSearchParams({ subject: first }, { replace: true })
    }
  }, [activeSubjectId, requestedSubjectId, setSearchParams, subjects])

  const activeSubject = useMemo(
    () => subjects.find((subject) => subject.id === activeSubjectId) || subjects[0] || null,
    [activeSubjectId, subjects],
  )

  const materials = useMemo(() => {
    if (!activeSubject?.id) return []
    return (materialsBySubject[activeSubject.id] || []).slice().sort((a, b) => (
      String(b.created_at || '').localeCompare(String(a.created_at || ''))
    ))
  }, [activeSubject, materialsBySubject])

  const openSubject = (subjectId) => {
    setActiveSubjectId(subjectId)
    setSearchParams({ subject: subjectId })
  }

  const handleDeleteMaterial = async (materialId) => {
    if (!materialId || busyMaterialId) return
    const confirmed = window.confirm('Delete this material from folder? This action cannot be undone.')
    if (!confirmed) return
    setBusyMaterialId(materialId)
    setFeedback('')
    try {
      await deleteMaterial(materialId)
      setFeedback('Material deleted.')
    } catch (error) {
      setFeedback(error.message || 'Unable to delete material.')
    } finally {
      setBusyMaterialId('')
    }
  }

  return (
    <div className="folders-page animate-fadeIn">
      <header className="folders-header card">
        <div>
          <h1 className="text-headline folders-title"><FolderOpen size={26} /> Subject Folder Explorer</h1>
          <p className="text-body-sm folders-subtitle">
            Open each subject folder and access uploaded notes, assignments, and Gmail-routed resources.
          </p>
        </div>
        <div className="folders-header-actions">
          <Link className="folders-header-link" to="/profile?section=folders">Folder Setup</Link>
          <Link className="folders-header-link primary" to="/dashboard">Back to Dashboard</Link>
        </div>
      </header>

      {loading ? (
        <div className="card folders-empty">Loading your folders...</div>
      ) : subjects.length === 0 ? (
        <div className="card folders-empty">
          <BookOpenText size={18} />
          <div>
            <strong>No subjects yet</strong>
            <p className="text-body-sm">Create subjects from Profile to start storing and opening materials.</p>
          </div>
          <Link className="folders-header-link primary" to="/profile?section=folders">
            Open Folder Setup <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="folders-layout">
          <aside className="folders-subject-rail card">
            <h3 className="text-title">Your Subjects</h3>
            <div className="folders-subject-list">
              {subjects.map((subject) => {
                const itemCount = (materialsBySubject[subject.id] || []).length
                const active = subject.id === activeSubject?.id
                return (
                  <button
                    key={subject.id}
                    type="button"
                    className={`folders-subject-item ${active ? 'active' : ''}`}
                    onClick={() => openSubject(subject.id)}
                  >
                    <div className="folders-subject-main">
                      <span className="folders-subject-name">{subject.name}</span>
                      <span className="folders-subject-meta">
                        Sem {subject.semester}{subject.code ? ` | ${subject.code}` : ''}
                      </span>
                    </div>
                    <span className="folders-subject-count">{itemCount}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="folders-content card">
            <div className="folders-content-header">
              <div>
                <h2 className="text-title">{activeSubject?.name || 'Folder'}</h2>
                <p className="text-body-sm">
                  {(materials || []).length} material{materials.length === 1 ? '' : 's'} inside this folder.
                </p>
              </div>
              <Link className="folders-header-link" to="/profile?section=folders">
                Upload New Material
              </Link>
            </div>

            {materials.length === 0 ? (
              <div className="folders-material-empty">
                <FolderOpen size={20} />
                <div>
                  <strong>No resources in this folder yet</strong>
                  <p className="text-body-sm">
                    Upload files from Profile, or let Gmail-approved items auto-route here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="folders-material-grid">
                {materials.map((material) => (
                  <article key={material.id} className="folders-material-card">
                    <div className="folders-material-top">
                      <span className="folders-material-type">
                        {materialIcon(material.material_type)}
                        {materialTypeLabel(material.material_type)}
                      </span>
                      <div className="folders-material-top-right">
                        <span className={`folders-material-source ${material.source || 'manual'}`}>
                          {(material.source || 'manual').toUpperCase()}
                        </span>
                        <button
                          type="button"
                          className="folders-delete-btn folders-delete-btn-top"
                          onClick={() => handleDeleteMaterial(material.id)}
                          disabled={busyMaterialId === material.id}
                          title="Delete material"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h3>{material.title || 'Untitled material'}</h3>
                    {material.notes ? (
                      <p className="folders-material-notes">{material.notes}</p>
                    ) : (
                      <p className="folders-material-notes muted">No notes attached.</p>
                    )}
                    <div className="folders-material-footer">
                      <span className="folders-material-date">
                        {material.created_at ? new Date(material.created_at).toLocaleString() : 'Recent'}
                      </span>
                      <div className="folders-material-actions">
                        {material.file_url ? (
                          <>
                            <a href={getOpenUrl(material.file_url)} target="_blank" rel="noreferrer">
                              <ExternalLink size={14} /> Open
                            </a>
                            <a href={material.file_url} target="_blank" rel="noreferrer" download>
                              <Download size={14} /> Download
                            </a>
                          </>
                        ) : (
                          <span className="folders-material-inline">
                            <Link2 size={14} /> No file link
                          </span>
                        )}
                        {busyMaterialId === material.id ? (
                          <span className="folders-material-inline">Deleting...</span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {feedback ? <p className="text-body-sm folders-feedback">{feedback}</p> : null}
          </section>
        </div>
      )}
    </div>
  )
}
