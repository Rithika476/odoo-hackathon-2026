import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgClass = {
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
  }[type] || 'bg-success'

  return (
    <div 
      className={`toast show position-fixed ${bgClass} text-white`}
      style={{ 
        top: '20px', 
        right: '20px', 
        zIndex: 9999,
        minWidth: '300px'
      }}
      role="alert"
    >
      <div className="toast-body d-flex justify-content-between align-items-center">
        <span>{message}</span>
        <button 
          type="button" 
          className="btn-close btn-close-white ms-2" 
          onClick={onClose}
        />
      </div>
    </div>
  )
}
