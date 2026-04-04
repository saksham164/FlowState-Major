import { useState } from 'react'
import { Plus, Trash2, ArrowRight, Settings as SettingsIcon, BrainCircuit } from 'lucide-react'
import { useRules } from '../context/RuleContext'
import './Settings.css'

export default function Settings() {
  const { rules, loading, addRule, deleteRule } = useRules()
  const [newRule, setNewRule] = useState({
    keyword: '',
    target_category: 'Work',
    target_priority: 'medium'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newRule.keyword) return
    try {
      await addRule(newRule)
      setNewRule({ ...newRule, keyword: '' }) // Reset only keyword
    } catch (err) {
      alert("Error adding rule: " + err.message)
    }
  }

  return (
    <div className="settings-page animate-fadeIn">
      <header className="settings-header card settings-hero">
        <div className="settings-hero-title-row">
          <span className="settings-hero-icon"><SettingsIcon size={22} /></span>
          <h1 className="text-headline">Settings</h1>
        </div>
        <p className="text-body settings-hero-copy">
          Customize your FlowState sanctuary and automation logic.
        </p>
      </header>

      <section className="settings-section">
        <div className="settings-section-title">
          <h2 className="text-title settings-heading">
            <BrainCircuit size={22} color="var(--primary)" /> Automation Engine
          </h2>
          <p className="text-body-sm settings-copy">
            Define keywords to automatically categorize incoming Gmail tasks. If a keyword appears in sender, subject, or snippet, the rule fires.
          </p>
        </div>

        <form className="rule-form card" onSubmit={handleSubmit}>
          <div className="settings-field keyword-field">
            <label className="text-label">Keyword / Pattern</label>
            <input
              type="text"
              placeholder="e.g. Invoice, ASAP, Zoom"
              value={newRule.keyword}
              onChange={e => setNewRule({ ...newRule, keyword: e.target.value })}
              required
            />
          </div>

          <div className="settings-field compact-field">
            <label className="text-label">Category</label>
            <select
              value={newRule.target_category}
              onChange={e => setNewRule({ ...newRule, target_category: e.target.value })}
            >
              <option value="Work">Work</option>
              <option value="Study">Study</option>
              <option value="Personal">Personal</option>
              <option value="Finance">Finance</option>
              <option value="Health">Health</option>
            </select>
          </div>

          <div className="settings-field compact-field">
            <label className="text-label">Priority</label>
            <select
              value={newRule.target_priority}
              onChange={e => setNewRule({ ...newRule, target_priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <button type="submit" className="settings-submit-btn">
            <Plus size={18} /> Add Rule
          </button>
        </form>

        <div className="rules-list">
          {loading ? (
            <p className="text-body-sm">Loading your custom logic...</p>
          ) : rules.length === 0 ? (
            <div className="settings-empty card">
              <p className="text-body">No custom rules yet. Add your first logic trigger above!</p>
            </div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className="rule-card">
                <div className="rule-card-info">
                  <span className="rule-keyword">{rule.keyword}</span>
                  <ArrowRight size={16} className="rule-arrow" />
                  <span className="badge badge-medium" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {rule.target_category}
                  </span>
                  <span className={`badge badge-${rule.target_priority}`}>
                    {rule.target_priority}
                  </span>
                </div>
                <button 
                  className="btn-icon-delete"
                  onClick={() => deleteRule(rule.id)}
                  title="Delete Rule"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  )
}
