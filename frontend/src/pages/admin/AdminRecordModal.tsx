import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import type { ModelFieldMeta, ModelMeta } from '../../api/client'
import { AdminIcon } from './AdminIcons'
import { AdminNotice } from './AdminUI'

interface AdminRecordModalProps {
  model: ModelMeta
  record: Record<string, any> | null // null for Create, object for Edit
  isOpen: boolean
  onClose: () => void
  onSave: (data: Record<string, any>) => Promise<void>
  saving: boolean
}

export default function AdminRecordModal({
  model,
  record,
  isOpen,
  onClose,
  onSave,
  saving,
}: AdminRecordModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (record) {
      setFormData({ ...record })
    } else {
      const initial: Record<string, any> = {}
      model.fields.forEach((f) => {
        if (!f.primary_key) initial[f.name] = f.type === 'boolean' ? false : ''
      })
      setFormData(initial)
    }
    setError('')
  }, [record, model, isOpen])

  if (!isOpen) return null

  const handleChange = (field: ModelFieldMeta, value: any) => {
    setFormData((prev) => ({ ...prev, [field.name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSave(formData)
    } catch (err: any) {
      setError(err.message || 'Failed to save record.')
    }
  }

  const isEdit = Boolean(record)

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-label={model.class_name}>
      <div className="admin-modal">
        <div className="admin-modal-head">
          <div>
            <h3>
              {isEdit ? `Edit ${model.class_name} #${record?.id}` : `Create New ${model.class_name}`}
            </h3>
            <p>
              Table <code>{model.table_name}</code> &middot; {model.domain} &middot;{' '}
              {model.count.toLocaleString('en-IN')} records
            </p>
          </div>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close dialog">
            <AdminIcon name="cross" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            {error && <AdminNotice tone="error">{error}</AdminNotice>}

            <div className="admin-form-grid">
              {model.fields.map((field) => {
                const value = formData[field.name] ?? ''

                if (field.primary_key) {
                  return (
                    <div key={field.name} className="admin-form-field readonly">
                      <label htmlFor={`f-${field.name}`}>
                        {field.name} <span className="af-meta">(Primary Key)</span>
                      </label>
                      <input
                        id={`f-${field.name}`}
                        className="input"
                        type="text"
                        disabled
                        value={value}
                      />
                    </div>
                  )
                }

                return (
                  <div key={field.name} className="admin-form-field">
                    <label htmlFor={`f-${field.name}`}>
                      {field.name} <span className="af-meta">({field.type})</span>
                    </label>

                    {field.type === 'text' ? (
                      <textarea
                        id={`f-${field.name}`}
                        className="input"
                        rows={4}
                        value={value}
                        onChange={(e) => handleChange(field, e.target.value)}
                      />
                    ) : field.type === 'boolean' ? (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          fontSize: 13.5,
                          textTransform: 'none',
                          letterSpacing: 0,
                          fontWeight: 500,
                          color: 'var(--indigo-deep)',
                        }}
                      >
                        <input
                          id={`f-${field.name}`}
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(e) => handleChange(field, e.target.checked)}
                        />
                        Active / Enabled
                      </label>
                    ) : (
                      <input
                        id={`f-${field.name}`}
                        className="input"
                        type={field.type === 'integer' || field.type === 'float' ? 'number' : 'text'}
                        step={field.type === 'float' ? 'any' : undefined}
                        value={value}
                        onChange={(e) => handleChange(field, e.target.value)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="admin-modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving' : isEdit ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
