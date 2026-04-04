import { useState } from 'react'
import { FolderOpen, LockKeyhole, Moon, Plus, Sun, Trash2, UserCircle2 } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useSubjects } from '../context/SubjectContext'
import { useTasks } from '../context/TaskContext'
import { useInbox } from '../context/InboxContext'
import { useTheme } from '../context/ThemeContext'
import './Profile.css'

const SECTIONS = {
  PROFILE: 'profile',
  FOLDERS: 'folders',
  SECURITY: 'security',
}

export default function Profile() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    profile,
    subjects,
    saveProfile,
    addSubject,
    deleteSubject,
    addMaterial,
    uploadMaterialFile,
    materialsBySubject,
    loading,
  } = useSubjects()
  const { tasks } = useTasks()
  const { inboxItems } = useInbox()
  const { theme, toggleTheme } = useTheme()

  const defaultSection = searchParams.get('section')
  const [activeSection, setActiveSection] = useState(
    defaultSection === SECTIONS.FOLDERS || defaultSection === SECTIONS.SECURITY
      ? defaultSection
      : SECTIONS.PROFILE,
  )
  const [feedback, setFeedback] = useState('')
  const [securityFeedback, setSecurityFeedback] = useState('')
  const [passwordForm, setPasswordForm] = useState({ next: '', confirm: '' })
  const [profileForm, setProfileForm] = useState({
    full_name: null,
    institution: null,
    program: null,
    phone: null,
    semester: null,
  })
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', semester: 1 })
  const [materialForm, setMaterialForm] = useState({
    subjectId: '',
    title: '',
    materialType: 'note',
    fileUrl: '',
    file: null,
    notes: '',
  })

  const resolvedName = profileForm.full_name ?? profile?.full_name ?? user?.user_metadata?.full_name ?? ''
  const resolvedProgram = profileForm.program ?? profile?.program ?? ''
  const resolvedInstitution = profileForm.institution ?? profile?.institution ?? ''
  const resolvedSemester = Number(profileForm.semester ?? profile?.semester ?? 1)

  const completedTasks = tasks.filter((task) => task.status === 'completed').length
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
  const totalMaterials = Object.values(materialsBySubject).reduce((sum, items) => sum + items.length, 0)
  const pendingTasks = tasks.filter((task) => task.status !== 'completed').length
  const nearDeadlines = tasks
    .filter((task) => task.status !== 'completed' && task.due_date)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 4)

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setFeedback('')
    try {
      await saveProfile({
        full_name: profileForm.full_name ?? resolvedName,
        institution: profileForm.institution ?? resolvedInstitution,
        program: profileForm.program ?? resolvedProgram,
        phone: profileForm.phone ?? profile?.phone ?? '',
        semester: resolvedSemester,
      })
      setFeedback('Profile updated.')
    } catch (error) {
      setFeedback(error.message || 'Unable to save profile.')
    }
  }

  const handleAddSubject = async (event) => {
    event.preventDefault()
    if (!subjectForm.name.trim()) return
    setFeedback('')
    try {
      await addSubject(subjectForm)
      setSubjectForm((current) => ({ ...current, name: '', code: '' }))
      setFeedback('Subject folder added.')
    } catch (error) {
      setFeedback(error.message || 'Unable to add subject.')
    }
  }

  const handleSaveMaterial = async (event) => {
    event.preventDefault()
    if (!materialForm.subjectId || !materialForm.title.trim()) return
    setFeedback('')
    try {
      if (materialForm.file) {
        await uploadMaterialFile({
          subjectId: materialForm.subjectId,
          title: materialForm.title,
          materialType: materialForm.materialType,
          file: materialForm.file,
          notes: materialForm.notes || null,
        })
      } else {
        await addMaterial({
          subjectId: materialForm.subjectId,
          title: materialForm.title,
          materialType: materialForm.materialType,
          source: 'manual',
          fileUrl: materialForm.fileUrl || null,
          notes: materialForm.notes || null,
        })
      }
      setMaterialForm((current) => ({
        ...current,
        title: '',
        fileUrl: '',
        file: null,
        notes: '',
      }))
      setFeedback('Material saved to folder.')
    } catch (error) {
      setFeedback(error.message || 'Unable to save material.')
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setSecurityFeedback('')
    if (!passwordForm.next || passwordForm.next.length < 6) {
      setSecurityFeedback('Password must be at least 6 characters.')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setSecurityFeedback('Passwords do not match.')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: passwordForm.next })
    if (error) {
      setSecurityFeedback(error.message || 'Unable to change password.')
      return
    }
    setPasswordForm({ next: '', confirm: '' })
    setSecurityFeedback('Password changed successfully.')
  }

  return (
    <div className="profile-root animate-fadeIn">
      <aside className="profile-side-menu">
        <div className="profile-side-brand">
          <h2>FlowState</h2>
          <span>DIGITAL SANCTUARY</span>
        </div>
        <button
          className={`profile-side-link ${activeSection === SECTIONS.PROFILE ? 'active' : ''}`}
          onClick={() => setActiveSection(SECTIONS.PROFILE)}
        >
          <UserCircle2 size={16} /> Profile
        </button>
        <button
          className={`profile-side-link ${activeSection === SECTIONS.FOLDERS ? 'active' : ''}`}
          onClick={() => setActiveSection(SECTIONS.FOLDERS)}
        >
          <FolderOpen size={16} /> Folders
        </button>
        <button
          className={`profile-side-link ${activeSection === SECTIONS.SECURITY ? 'active' : ''}`}
          onClick={() => setActiveSection(SECTIONS.SECURITY)}
        >
          <LockKeyhole size={16} /> Security
        </button>
        <button className="profile-side-link profile-back-link" onClick={() => navigate('/dashboard')}>
          Back To Workspace
        </button>
      </aside>

      <main className="profile-main">
        <div className="profile-top-actions">
          <button className="btn-ghost profile-workspace-btn" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
          </button>
          <button className="btn-ghost profile-workspace-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
        <header className="profile-hero">
          <div className="profile-avatar">{(resolvedName || user?.email || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <h1>{resolvedName || 'FlowState User'}</h1>
            <p>{resolvedProgram || 'Add your program details in profile section'}</p>
            <p>{resolvedInstitution || 'Set institution and semester to personalize folders'}</p>
          </div>
        </header>

        <div className="profile-content-grid">
          <section className="profile-section-main">
            {activeSection === SECTIONS.PROFILE && (
              <div className="card profile-card">
                <h3 className="text-title">Profile & Analysis</h3>
                <form className="profile-form" onSubmit={handleSaveProfile}>
                  <input
                    value={profileForm.full_name ?? resolvedName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))}
                    placeholder="Full Name"
                  />
                  <input
                    value={profileForm.institution ?? resolvedInstitution}
                    onChange={(event) => setProfileForm((current) => ({ ...current, institution: event.target.value }))}
                    placeholder="Institution"
                  />
                  <input
                    value={profileForm.program ?? resolvedProgram}
                    onChange={(event) => setProfileForm((current) => ({ ...current, program: event.target.value }))}
                    placeholder="Program"
                  />
                  <input
                    value={profileForm.phone ?? profile?.phone ?? ''}
                    onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="Phone"
                  />
                  <select
                    value={resolvedSemester}
                    onChange={(event) => setProfileForm((current) => ({ ...current, semester: Number(event.target.value) }))}
                  >
                    {Array.from({ length: 12 }).map((_, index) => (
                      <option key={index + 1} value={index + 1}>Semester {index + 1}</option>
                    ))}
                  </select>
                  <button className="btn-primary profile-btn" type="submit" disabled={loading}>Save Profile</button>
                </form>

                <div className="profile-analysis-grid">
                  <div className="profile-analysis-item">
                    <strong>{completionRate}%</strong>
                    <span>Task Completion</span>
                  </div>
                  <div className="profile-analysis-item">
                    <strong>{subjects.length}</strong>
                    <span>Subjects</span>
                  </div>
                  <div className="profile-analysis-item">
                    <strong>{totalMaterials}</strong>
                    <span>Folder Materials</span>
                  </div>
                  <div className="profile-analysis-item">
                    <strong>{pendingTasks}</strong>
                    <span>Pending Tasks</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === SECTIONS.FOLDERS && (
              <div className="card profile-card">
                <h3 className="text-title">Folder Setup & Subject Library</h3>
                <p className="text-body-sm">
                  Add semester subjects, upload notes/assignments from local device, or attach links. Gmail-approved tasks auto-route into matching subject folders.
                </p>

                <div className="profile-folder-forms-grid">
                  <form className="profile-folder-card profile-inline-form" onSubmit={handleAddSubject}>
                    <h4>Create Subject Folder</h4>
                    <input
                      value={subjectForm.name}
                      onChange={(event) => setSubjectForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Subject name (e.g. NLP)"
                      required
                    />
                    <input
                      value={subjectForm.code}
                      onChange={(event) => setSubjectForm((current) => ({ ...current, code: event.target.value }))}
                      placeholder="Code (optional)"
                    />
                    <select
                      value={subjectForm.semester}
                      onChange={(event) => setSubjectForm((current) => ({ ...current, semester: Number(event.target.value) }))}
                    >
                      {Array.from({ length: 12 }).map((_, index) => (
                        <option key={index + 1} value={index + 1}>Sem {index + 1}</option>
                      ))}
                    </select>
                    <button className="btn-primary profile-btn" type="submit"><Plus size={14} /> Add Subject</button>
                  </form>

                  <form className="profile-folder-card profile-material-form" onSubmit={handleSaveMaterial}>
                    <h4>Add Material To Folder</h4>
                    <select
                      value={materialForm.subjectId}
                      onChange={(event) => setMaterialForm((current) => ({ ...current, subjectId: event.target.value }))}
                      required
                    >
                      <option value="">Choose Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} {subject.code ? `(${subject.code})` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      value={materialForm.title}
                      onChange={(event) => setMaterialForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Material title"
                      required
                    />
                    <select
                      value={materialForm.materialType}
                      onChange={(event) => setMaterialForm((current) => ({ ...current, materialType: event.target.value }))}
                    >
                      <option value="note">Note</option>
                      <option value="assignment">Assignment</option>
                      <option value="resource">Resource</option>
                    </select>
                    <input type="file" onChange={(event) => setMaterialForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} />
                    <input
                      value={materialForm.fileUrl}
                      onChange={(event) => setMaterialForm((current) => ({ ...current, fileUrl: event.target.value }))}
                      placeholder="Or paste link (optional)"
                    />
                    <input
                      value={materialForm.notes}
                      onChange={(event) => setMaterialForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Notes (optional)"
                    />
                    <button className="btn-primary profile-btn" type="submit">Save To Folder</button>
                  </form>
                </div>

                <div className="profile-folder-list">
                  {subjects.length === 0 ? (
                    <p className="text-body-sm">No subjects added yet.</p>
                  ) : (
                    subjects.map((subject) => (
                      <div className="profile-folder-item" key={subject.id}>
                        <div>
                          <strong>{subject.name}</strong>
                          <p className="text-body-sm">
                            Sem {subject.semester}
                            {subject.code ? ` | ${subject.code}` : ''}
                            {` | ${(materialsBySubject[subject.id] || []).length} item(s)`}
                          </p>
                        </div>
                        <div className="profile-folder-actions">
                          <Link className="btn-ghost profile-open-btn" to={`/folders?subject=${subject.id}`}>
                            Open Folder
                          </Link>
                          <button
                            className="btn-ghost profile-delete-btn"
                            type="button"
                            onClick={() => deleteSubject(subject.id)}
                            aria-label={`Delete ${subject.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeSection === SECTIONS.SECURITY && (
              <div className="card profile-card">
                <h3 className="text-title">Security</h3>
                <p className="text-body-sm">Change password for this account.</p>
                <form className="profile-form" onSubmit={handleChangePassword}>
                  <input
                    type="password"
                    value={passwordForm.next}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))}
                    placeholder="New password"
                    required
                  />
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))}
                    placeholder="Confirm new password"
                    required
                  />
                  <button className="btn-primary profile-btn" type="submit">Change Password</button>
                </form>
                {securityFeedback ? <p className="text-body-sm">{securityFeedback}</p> : null}
              </div>
            )}
          </section>

          <aside className="profile-section-side">
            <div className="card profile-side-card">
              <h4>Quick Stats</h4>
              <div className="profile-mini-stats">
                <div><strong>{String(subjects.length).padStart(2, '0')}</strong><span>Subjects</span></div>
                <div><strong>{String(totalMaterials).padStart(2, '0')}</strong><span>Materials</span></div>
                <div><strong>{String(pendingTasks).padStart(2, '0')}</strong><span>Pending Tasks</span></div>
                <div><strong>{String(inboxItems.length).padStart(2, '0')}</strong><span>Inbox Queue</span></div>
              </div>
            </div>

            <div className="card profile-side-card">
              <h4>Deadlines</h4>
              {nearDeadlines.length === 0 ? (
                <p className="text-body-sm">No active deadlines.</p>
              ) : (
                nearDeadlines.map((task) => (
                  <div className="profile-deadline-row" key={task.id}>
                    <div>
                      <strong>{task.name}</strong>
                      <p>{task.category || 'Work'}</p>
                    </div>
                    <span>{task.due_date}</span>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>

        {feedback ? <p className="text-body-sm profile-feedback">{feedback}</p> : null}
      </main>
    </div>
  )
}
