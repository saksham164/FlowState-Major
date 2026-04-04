import { useMemo, useState } from 'react'
import { FolderOpen, Upload, Link as LinkIcon, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProfileData } from '../../context/ProfileContext'
import './SubjectFolders.css'

export default function SubjectFolders({ compact = false, showUpload = true }) {
  const navigate = useNavigate()
  const { folders, subjects, uploadMaterial, loading } = useProfileData()
  const [subjectId, setSubjectId] = useState('')
  const [materialType, setMaterialType] = useState('note')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  const totalMaterials = useMemo(
    () => folders.reduce((sum, folder) => sum + folder.materials.length, 0),
    [folders],
  )

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!subjectId || !file) return
    setSubmitting(true)
    setFeedback('')
    try {
      await uploadMaterial({ subjectId, title, materialType, file })
      setTitle('')
      setFile(null)
      event.target.reset()
      setFeedback('Uploaded successfully.')
    } catch (error) {
      setFeedback(error.message || 'Unable to upload file.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card subject-folders-card animate-fadeIn">
      <div className="card-header subject-folders-header">
        <div>
          <h3 className="text-title">Subject Folders</h3>
          <p className="text-body-sm">
            {loading ? 'Loading folders...' : `${subjects.length} subjects • ${totalMaterials} materials`}
          </p>
        </div>
        <span className="text-label">Semester Library</span>
      </div>

      {subjects.length === 0 ? (
        <div className="subject-folders-empty">
          <BookOpen size={18} />
          <span>Create your subjects from Profile first.</span>
          <button className="btn-ghost" onClick={() => navigate('/profile')}>Open Profile</button>
        </div>
      ) : (
        <>
          {showUpload && !compact && (
            <form className="subject-upload-form" onSubmit={handleUpload}>
              <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required>
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    Sem {subject.semester} • {subject.name}
                  </option>
                ))}
              </select>
              <select value={materialType} onChange={(event) => setMaterialType(event.target.value)}>
                <option value="note">Note</option>
                <option value="assignment">Assignment</option>
                <option value="reference">Reference</option>
              </select>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Material title (optional)"
              />
              <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} required />
              <button className="btn-primary subject-upload-btn" type="submit" disabled={submitting}>
                <Upload size={16} />
                {submitting ? 'Uploading...' : 'Upload'}
              </button>
              {feedback ? <span className="text-body-sm">{feedback}</span> : null}
            </form>
          )}

          <div className={`subject-folder-list ${compact ? 'compact' : ''}`}>
            {folders.map((folder) => (
              <div className="subject-folder-item" key={folder.id}>
                <div className="subject-folder-title-row">
                  <div className="subject-folder-title-wrap">
                    <FolderOpen size={16} />
                    <strong>{folder.name}</strong>
                  </div>
                  <span className="text-caption">Sem {folder.semester} • {folder.materials.length} items</span>
                </div>
                {folder.materials.length === 0 ? (
                  <div className="text-body-sm">No materials yet.</div>
                ) : (
                  <div className="subject-material-list">
                    {folder.materials.slice(0, compact ? 2 : 5).map((material) => (
                      <div className="subject-material-item" key={material.id}>
                        <span className="material-chip">{material.material_type}</span>
                        <span className="subject-material-title">{material.title}</span>
                        {material.file_url ? (
                          <a href={material.file_url} target="_blank" rel="noreferrer" className="subject-material-link">
                            <LinkIcon size={14} />
                            Open
                          </a>
                        ) : (
                          <span className="text-caption">{material.source === 'gmail' ? 'From Gmail' : 'Stored'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
