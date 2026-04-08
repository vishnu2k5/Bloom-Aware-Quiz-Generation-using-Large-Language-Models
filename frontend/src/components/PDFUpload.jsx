import { useRef, useState } from 'react'
import axios from 'axios'
import { FileText, Upload, X } from 'lucide-react'

export default function PDFUpload({ pdfData, setPdfData }) {
  const inputRef  = useRef(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError]   = useState('')

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }
    setError('')
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await axios.post('/api/upload-pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPdfData(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to read PDF.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  if (pdfData) {
    return (
      <div className="pdf-loaded-card">
        <div className="pdf-file-icon">
          <FileText size={16} />
        </div>
        <div className="pdf-info">
          <div className="pdf-filename">{pdfData.filename}</div>
          <div className="pdf-meta">
            {pdfData.pages} pages · {pdfData.char_count.toLocaleString()} chars
          </div>
        </div>
        <button className="btn-remove" onClick={() => setPdfData(null)} title="Remove">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        className={`pdf-dropzone${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => handleFile(e.target.files[0])}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="pdf-upload-icon">
          {loading ? (
            <div style={{ width: 18, height: 18, border: '2px solid #2a2a35', borderTopColor: '#d4a843', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <Upload size={18} />
          )}
        </div>
        <div className="pdf-upload-title">
          {loading ? 'Reading PDF…' : 'Drop PDF here or click to browse'}
        </div>
        <div className="pdf-upload-sub">
          {loading ? 'Extracting text from your document' : 'Questions will be grounded in your document'}
        </div>
      </div>
      {error && (
        <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{error}</p>
      )}
    </div>
  )
}
