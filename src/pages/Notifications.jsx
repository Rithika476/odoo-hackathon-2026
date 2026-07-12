import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Notifications() {
  const [items, setItems] = useState([])

  const load = async () => {
    const token = localStorage.getItem('token')
    const { data } = await axios.get('/notifications', { headers: { Authorization: `Bearer ${token}` } })
    setItems(data)
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    const token = localStorage.getItem('token')
    await axios.post(`/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <div>
      <h2 className="mb-4">Notification Inbox</h2>
      <div className="card">
        <div className="card-body">
          <ul className="list-group list-group-flush">
            {items.map(item => (
              <li key={item.id} className="list-group-item d-flex justify-content-between align-items-start">
                <div>
                  <strong>{item.title}</strong>
                  <div className="text-muted">{item.message}</div>
                  <small>{item.created_at}</small>
                </div>
                {!item.is_read && <button className="btn btn-sm btn-outline-primary" onClick={() => markRead(item.id)}>Mark Read</button>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
