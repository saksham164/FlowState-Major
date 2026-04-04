import { Inbox as InboxIcon, Check, X, RefreshCw, Mail } from 'lucide-react'
import { useInbox } from '../context/InboxContext'
import './Inbox.css'

export default function Inbox() {
  const { inboxItems, loading, isSyncing, syncGmail, approveItem, rejectItem } = useInbox()

  return (
    <div className="inbox-page animate-fadeIn">
      <header className="inbox-header">
        <div>
          <h1 className="text-display">Inbox Triage</h1>
          <p className="text-body">Approve incoming unstructured extractions.</p>
        </div>
        <button 
          className="btn-primary flex-center" 
          onClick={syncGmail}
          disabled={isSyncing}
          style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-lg)' }}
        >
          {isSyncing ? <RefreshCw className="animate-spin" size={18} style={{ marginRight: '8px' }} /> : <InboxIcon size={18} style={{ marginRight: '8px' }} />}
          {isSyncing ? 'Scanning Gmail...' : 'Sync Gmail'}
        </button>
      </header>

      {loading ? (
        <div className="inbox-empty text-body flex-center" style={{ minHeight: '300px' }}>
          Loading your integrations...
        </div>
      ) : inboxItems.length === 0 ? (
        <div className="inbox-empty text-body flex-center" style={{ minHeight: '300px', flexDirection: 'column', gap: '1rem', opacity: 0.6 }}>
          <Mail size={48} />
          <span>Your inbox is totally empty!</span>
        </div>
      ) : (
        <div className="inbox-list">
          {inboxItems.map(item => (
            <div key={item.id} className="card inbox-item-card">
              <div className="inbox-item-content">
                <div className="inbox-item-header">
                  <div className="flex-center" style={{ gap: '8px' }}>
                    <span className="badge badge-medium" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {item.source.toUpperCase()}
                    </span>
                    <span className="text-body-sm" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      From: {item.sender || 'Unknown Origin'}
                    </span>
                  </div>
                  <span className="text-body-sm" style={{ opacity: 0.6 }}>Mapped to: {item.parsed_date || 'No Date'}</span>
                </div>
                
                <h3 className="text-title" style={{ marginTop: '0.75rem' }}>{item.parsed_name}</h3>
                <div className="inbox-item-meta">
                  <span className={`badge badge-${item.parsed_priority}`}>{item.parsed_priority}</span>
                  <span className="slot-category">{item.parsed_category}</span>
                </div>

                {item.original_text && (
                  <div className="inbox-original-text">
                    "{item.original_text}"
                  </div>
                )}
              </div>

              <div className="inbox-item-actions">
                <button 
                  className="inbox-btn reject" 
                  aria-label="Reject Item"
                  onClick={() => rejectItem(item.id)}
                >
                  <X size={24} />
                </button>
                <button 
                  className="inbox-btn approve" 
                  aria-label="Approve Item"
                  onClick={() => approveItem(item)}
                >
                  <Check size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
