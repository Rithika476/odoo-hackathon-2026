export default function ConfirmationDialog({ 
  show, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) {
  if (!show) return null

  const btnVariant = variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary'

  return (
    <div 
      className="modal show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onCancel}
            />
          </div>
          <div className="modal-body">
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button 
              type="button" 
              className={`btn ${btnVariant}`} 
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
