import React, { useState, useEffect } from 'react'
import type { ModelFieldMeta, ModelMeta } from '../../api/client'

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
      // Default initial values
      const initial: Record<string, any> = {}
      model.fields.forEach((f) => {
        if (!f.primary_key) {
          if (f.type === 'boolean') initial[f.name] = false
          else if (f.type === 'integer' || f.type === 'float') initial[f.name] = ''
          else initial[f.name] = ''
        }
      })
      setFormData(initial)
    }
    setError('')
  }, [record, model, isOpen])

  if (!isOpen) return null

  const handleChange = (field: ModelFieldMeta, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field.name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {isEdit ? `Edit ${model.class_name} #${record?.id}` : `Create New ${model.class_name}`}
            </h3>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Table: <code>{model.table_name}</code> ({model.domain})
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '13.5px',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {model.fields.map((field) => {
                if (field.primary_key) {
                  return (
                    <div key={field.name} style={{ display: isEdit ? 'block' : 'none' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        {field.name} (Primary Key)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formData[field.name] || ''}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                        }}
                      />
                    </div>
                  )
                }

                const val = formData[field.name] ?? ''

                return (
                  <div key={field.name}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      {field.name}{' '}
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>({field.type})</span>
                    </label>

                    {field.type === 'text' ? (
                      <textarea
                        rows={4}
                        value={val}
                        onChange={(e) => handleChange(field, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          lineHeight: '1.5',
                        }}
                      />
                    ) : field.type === 'boolean' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => handleChange(field, e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#1d4ed8' }}
                        />
                        <span style={{ fontSize: '14px', color: '#334155' }}>Active / Enabled</span>
                      </label>
                    ) : (
                      <input
                        type={field.type === 'integer' || field.type === 'float' ? 'number' : 'text'}
                        step={field.type === 'float' ? 'any' : undefined}
                        value={val}
                        onChange={(e) => handleChange(field, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
