import { BookOpenText, FolderOpen, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSubjects } from '../../context/SubjectContext'
import './SubjectFoldersPanel.css'

export default function SubjectFoldersPanel() {
  const { subjects, materialsBySubject, loading } = useSubjects()

  return (
    <div className="card subject-folders-panel animate-fadeIn" style={{ animationDelay: '0.08s' }}>
      <div className="card-header">
        <div>
          <h3 className="text-title">Subject Folders</h3>
          <p className="text-body-sm">Your semester notes and assignments organized by subject.</p>
        </div>
        <Link className="text-label" to="/folders">Open Library</Link>
      </div>

      {loading ? (
        <p className="text-body-sm">Loading folders...</p>
      ) : subjects.length === 0 ? (
        <div className="subject-empty-state">
          <BookOpenText size={18} />
          <span>Add semester subjects in Profile to create folders.</span>
        </div>
      ) : (
        <div className="subject-folder-list">
          {subjects.slice(0, 5).map((subject) => {
            const items = materialsBySubject[subject.id] || []
            const latest = items[0]
            return (
              <Link className="subject-folder-row" to={`/folders?subject=${subject.id}`} key={subject.id}>
                <div className="subject-folder-main">
                  <FolderOpen size={16} />
                  <div>
                    <div className="subject-folder-title">{subject.name}</div>
                    <div className="subject-folder-meta">
                      {items.length} item{items.length === 1 ? '' : 's'}
                      {subject.code ? ` • ${subject.code}` : ''}
                    </div>
                  </div>
                </div>
                {latest ? (
                  <div className="subject-folder-latest">{latest.title}</div>
                ) : (
                  <div className="subject-folder-latest muted">No material yet</div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      <div className="subject-folder-actions">
        <Link to="/folders" className="subject-link-btn">
          <Upload size={14} /> Open Folders
        </Link>
      </div>
    </div>
  )
}
