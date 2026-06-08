import { useState } from 'react'

const API = 'https://rova-backend.onrender.com'

function App() {
  const [screen, setScreen] = useState<'login' | 'trips'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [trips, setTrips] = useState<any[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const login = async () => {
    setError('')
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      setScreen('trips')
      loadTrips(data.token)
    } else {
      setError(data.error || 'Login failed')
    }
  }

  const loadTrips = async (t: string) => {
    const res = await fetch(`${API}/trips/available`, {
      headers: { Authorization: `Bearer ${t}` }
    })
    const data = await res.json()
    setTrips(data)
  }

  const acceptTrip = async (id: number) => {
    const res = await fetch(`${API}/trips/${id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.id) {
      setMessage(`Trip #${id} accepted!`)
      loadTrips(token)
    }
  }

  const completeTrip = async (id: number) => {
    const res = await fetch(`${API}/trips/${id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.id) {
      setMessage(`Trip #${id} completed!`)
      loadTrips(token)
    }
  }

  if (screen === 'login') return (
    <div style={{ padding: 40, maxWidth: 400, margin: '0 auto' }}>
      <h1>Rova Driver</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10 }} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10 }} />
      <button onClick={login} style={{ width: '100%', padding: 12, background: '#f5c518', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
        Login
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h1>Available Trips</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <button onClick={() => loadTrips(token)} style={{ marginBottom: 20, padding: 10 }}>Refresh</button>
      {trips.length === 0 && <p>No trips available</p>}
      {trips.map(trip => (
        <div key={trip.id} style={{ border: '1px solid #ccc', padding: 16, marginBottom: 12, borderRadius: 8 }}>
          <p><strong>Trip #{trip.id}</strong></p>
          <p>From: {trip.pickupAddress}</p>
          <p>To: {trip.dropoffAddress}</p>
          <p>Status: {trip.status}</p>
          {trip.status === 'REQUESTED' && (
            <button onClick={() => acceptTrip(trip.id)} style={{ padding: 10, background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', marginRight: 10 }}>
              Accept
            </button>
          )}
          {trip.status === 'ACCEPTED' && (
            <button onClick={() => completeTrip(trip.id)} style={{ padding: 10, background: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}>
              Complete
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default App