export default function LoadingSkeleton({ type = 'card', rows = 3 }) {
  if (type === 'card') {
    return (
      <div className="card p-3 mb-4" aria-hidden="true">
        <div className="placeholder-glow">
          <div className="placeholder col-4 mb-3"></div>
          <div className="placeholder col-6 mb-2"></div>
          <div className="placeholder col-8 mb-2"></div>
          <div className="placeholder col-5 mb-2"></div>
          <div className="placeholder col-7"></div>
        </div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="card" aria-hidden="true">
        <div className="card-body">
          <div className="placeholder-glow mb-3">
            <div className="placeholder col-3"></div>
          </div>
          <table className="table">
            <thead>
              <tr>
                {[...Array(5)].map((_, i) => (
                  <th key={i}>
                    <div className="placeholder col-12"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(rows)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[...Array(5)].map((_, colIndex) => (
                    <td key={colIndex}>
                      <div className="placeholder col-12"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (type === 'input') {
    return (
      <div className="placeholder-glow" aria-hidden="true">
        <div className="placeholder col-12 mb-2"></div>
        <div className="placeholder col-12"></div>
      </div>
    )
  }

  if (type === 'spinner') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return null
}
