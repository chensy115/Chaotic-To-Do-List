import { useEffect } from 'react'

interface Props {
  open: boolean
  title: string
  content: string
  onClose: () => void
  onToast: (message: string) => void
  onSaveImage?: () => void
  savingImage?: boolean
}

export function ReportPreviewModal({
  open,
  title,
  content,
  onClose,
  onToast,
  onSaveImage,
  savingImage = false,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      onToast('已复制到剪贴板')
    } catch {
      onToast('复制失败，请手动选择文本复制')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal report-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-body">
          <pre className="report-preview-text">{content}</pre>
        </div>

        <div className="modal-footer">
          {onSaveImage && (
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={onSaveImage}
              disabled={savingImage}
            >
              {savingImage ? '生成中…' : '保存图片'}
            </button>
          )}
          <button type="button" className="btn btn-soft btn-sm" onClick={handleCopy}>
            复制全文
          </button>
          <button type="button" className="btn btn-accent btn-sm" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
