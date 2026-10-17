
import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabase'

function App() {

 const [page, setPage] = useState('register')
const [session, setSession] = useState(null)
const [authLoading, setAuthLoading] = useState(true)

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session)
    setAuthLoading(false)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, newSession) => {
    setSession(newSession)
    setAuthLoading(false)
  })

  return () => subscription.unsubscribe()
}, [])

  const [form, setForm] = useState({
    name: '',
    domain: 'Web Development',
    position: 'Member',
    srn: '',
    email: '',
    linkedin_url: '',
    github_url: '',
    branch: 'CSE',
    semester: '3',
    bio: '',
  })
  

  const [photo, setPhoto] = useState('')
  const photoPreview = photo ? URL.createObjectURL(photo) : ''

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }
function handlePhoto(event) {
  const file = event.target.files[0]

  if (file) {
    setPhoto(file)
  }
}

function convertToWebP(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl)

          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Could not convert image to WebP'))
          }
        },
        'image/webp',
        0.85
      )
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read the selected image'))
    }

    image.src = objectUrl
  })
}

 

if (authLoading) {
  return <p>Checking login...</p>
}

if (window.location.pathname === '/reset-password') {
  return <ResetPasswordPage />
}

if (page === 'admin') {
  if (!session) {
    return <AdminLogin onLogin={() => setPage('admin')} />
  }

  return <AdminPage />
}


if (page === 'team') {
  return <TeamPage />
}
  
  return (
    <main className="page">
      <nav className="navbar">
  <a className="brand" href="/">EMBRIONE<span>.</span></a>

  <div>
    <button type="button" onClick={() => setPage('register')}>
      Register
    </button>

    <button type="button" onClick={() => setPage('admin')}>
      Admin
    </button>
    <button type="button" onClick={() => setPage('team')}>
  Team
</button>
  </div>
</nav>

      <header className="heading">
        <p className="eyebrow">THE EMBRIONE · PES UNIVERSITY</p>
        <h1>Every great team<br /><span>starts with you.</span></h1>
        <p className="subtitle">
          Create your member profile and see your card come to life.
        </p>
      </header>

      <section className="workspace">
        <form className="form-panel" 
onSubmit={async (e) => {
  e.preventDefault()

  try {
    if (!photo) {
      alert('Please select a profile picture.')
      return
    }

    const webpBlob = await convertToWebP(photo)
    const fileName = `${crypto.randomUUID()}.webp`

    const { error: uploadError } = await supabase.storage
      .from('member-photos')
      .upload(fileName, webpBlob, {
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('member-photos')
      .getPublicUrl(fileName)

    const { error: insertError } = await supabase
      .from('members')
      .insert([{
        ...form,
        semester: Number(form.semester),
        photo_url: urlData.publicUrl,
        status: 'pending',
      }])

    if (insertError) throw insertError

    alert('Registration submitted successfully! Await admin approval.')
  } catch (error) {
    console.error('Registration error:', error)
    alert(`Registration failed: ${error.message}`)
  }
}}
>
        
          <h2>Member details</h2>
          <p className="muted">Fill in your details below.</p>

          <label>Full name
            <input name="name" value={form.name} onChange={updateField}
              placeholder="Your full name" required />
          </label>

          <div className="two-columns">
            <label>Domain
              <select name="domain" value={form.domain} onChange={updateField}>
                {['Web Development', 'Design', 'Logistics', 'Operations',
                  'Sponsorship', 'Hospitality', 'Social Media', 'Event Management']
                  .map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Position
              <select name="position" value={form.position} onChange={updateField}>
                {['Head', 'Vice-Head', 'Core Member', 'Member']
                  .map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <label>SRN
            <input name="srn" value={form.srn} onChange={updateField}
              placeholder="PES1UG23CS001" required />
          </label>

          <label>Email
            <input name="email" type="email" value={form.email}
              onChange={updateField} placeholder="you@example.com" required />
          </label>

          <div className="two-columns">
            <label>Branch
              <select name="branch" value={form.branch} onChange={updateField}>
                {['CSE', 'AIML', 'ECE', 'EEE', 'ME', 'Biotech', 'Other']
                  .map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Semester
              <select name="semester" value={form.semester} onChange={updateField}>
                {[1, 2, 3, 4, 5, 6, 7, 8]
                  .map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <label>LinkedIn URL
            <input name="linkedin_url" type="url" value={form.linkedin_url}
              onChange={updateField} placeholder="https://linkedin.com/in/..." />
          </label>

          <label>GitHub URL
            <input name="github_url" type="url" value={form.github_url}
              onChange={updateField} placeholder="https://github.com/..." />
          </label>

          <label>Short bio
            <textarea name="bio" value={form.bio} onChange={updateField}
              maxLength={200} placeholder="Tell us a little about yourself..."
              rows={4} />
            <span className="counter">{form.bio.length}/200</span>
          </label>

          <label>Profile picture
            <input type="file" accept="image/png,image/jpeg,image/jpg"
              onChange={handlePhoto} />
          </label>

          <button className="submit-button" type="submit">
            Preview submission <span>↗</span>
          </button>
        </form>

        <aside className="preview-panel">
          <div className="preview-top">
            <span>LIVE PREVIEW</span>
            <span className="live-dot">● LIVE</span>
          </div>

          <article className="member-card">
            <div className="card-glow" />
            <div className="card-top">
              <span className="mini-brand">E.</span>
              <span className="card-year">MEMBER PROFILE</span>
            </div>

            {photo
              ? <img className="avatar" src={photoPreview} alt="Profile preview" />
              : <div className="avatar placeholder">
                  {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                </div>
            }

            <p className="card-domain">{form.domain}</p>
            <h2>{form.name || 'Your Name'}</h2>
            <p className="card-position">{form.position}</p>
            <p className="card-bio">
              {form.bio || 'Your introduction will appear here.'}
            </p>

            <div className="card-divider" />
            <div className="card-meta">
              <span>{form.branch} · Sem {form.semester}</span>
              <span>EMBRIONE</span>
            </div>
          </article>

          <p className="preview-note">
            Your card updates automatically as you fill in the form.
          </p>
        </aside>
      </section>

      <footer>THE EMBRIONE · BUILDING TOGETHER.</footer>
    </main>
  )
}

function AdminPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'pending')

      if (error) {
        console.error('Error fetching registrations:', error)
      } else {
        setMembers(data || [])
      }

      setLoading(false)
    }

    fetchMembers()
  }, [])

  return (
    <main className="admin-page">
      <h1>Embrione Admin</h1>
      
<button
  onClick={async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
    }
  }}
>
  Logout
</button>

      <p>Review pending member registrations.</p>

      {loading && <p>Loading registrations...</p>}

      {!loading && members.length === 0 && (
        <p>No pending registrations found.</p>
      )}

      <div>
        {members.map((member) => (
          <div key={member.id} className="admin-member-card">
            <h2>{member.name}</h2>
            <p>Email: {member.email}</p>
            <p>Domain: {member.domain}</p>
            <p>Position: {member.position}</p>
            <p>SRN: {member.srn}</p>
            
<div>
  <button
    onClick={async () => {
      const { error } = await supabase
        .from('members')
        .update({ status: 'approved' })
        .eq('id', member.id)

      if (error) {
        alert(error.message)
      } else {
        setMembers(members.filter((m) => m.id !== member.id))
        alert('Member approved successfully!')
      }
    }}
  >
    Approve
  </button>

  <button
    onClick={async () => {
      const { error } = await supabase
        .from('members')
        .update({ status: 'rejected' })
        .eq('id', member.id)

      if (error) {
        alert(error.message)
      } else {
        setMembers(members.filter((m) => m.id !== member.id))
        alert('Registration rejected.')
      }
    }}
  >
    Reject
  </button>
</div>

            {member.photo_url && (
              <img
                src={member.photo_url}
                alt={member.name}
                width="100"
              />
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

function TeamPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [domainFilter, setDomainFilter] = useState('All')
  const [positionFilter, setPositionFilter] = useState('All')

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'approved')

      if (error) {
        console.error('Error fetching team:', error)
      } else {
        setMembers(data || [])
      }

      setLoading(false)
    }

    fetchMembers()
  }, [])

  const filteredMembers = members.filter((member) => {
    const matchesDomain =
      domainFilter === 'All' || member.domain === domainFilter

    const matchesPosition =
      positionFilter === 'All' || member.position === positionFilter

    return matchesDomain && matchesPosition
  })

  return (
    <main className="admin-page">
      <h1>Our Team</h1>
      <p>Meet the approved members of Embrione.</p>

      <label>
        Filter by domain:{' '}
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
        >
          <option value="All">All Domains</option>
          {[...new Set(members.map((m) => m.domain))].map((domain) => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>
      </label>

      <br /><br />

      <label>
        Filter by position:{' '}
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
        >
          <option value="All">All Positions</option>
          {[...new Set(members.map((m) => m.position))].map((position) => (
            <option key={position} value={position}>{position}</option>
          ))}
        </select>
      </label>

      {loading && <p>Loading team members...</p>}

      {!loading && filteredMembers.length === 0 && (
        <p>No approved team members found.</p>
      )}

      <div>
        {filteredMembers.map((member) => (
          <div key={member.id} className="admin-member-card">
            {member.photo_url && (
              <img
                src={member.photo_url}
                alt={member.name}
                width="120"
              />
            )}
            <h2>{member.name}</h2>
            <p>{member.domain} — {member.position}</p>
            <p>{member.branch}, Semester {member.semester}</p>
            <p>{member.bio}</p>

            {member.linkedin_url && (
              <a href={member.linkedin_url} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            )}

            {' '}

            {member.github_url && (
              <a href={member.github_url} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      onLogin()
    }
  }

  return (
    <main className="admin-page">
      <h1>Admin Login</h1>
      <p>Sign in to manage Embrione registrations.</p>

      <form onSubmit={handleLogin}>
        <p>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </p>

        <p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </p>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      
<button
  type="button"
  onClick={async () => {
    if (!email) {
      setError('Enter your email address first.')
      return
    }

    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    )

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setError('If this email is registered, a password reset email will be sent.')
    }
  }}
  disabled={loading}
>
  Forgot Password?
</button>

      </form>

      {error && <p>{error}</p>}

      
<button
  type="button"
  className="back-home-btn"
  onClick={() => {
    window.location.href = '/'
  }}
>
  ← Back to Home
</button>

    </main>
  )
}

function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    setMessage('')

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated successfully! You can now log in.')
      setPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <main className="admin-page">
      <h1>Reset Password</h1>
      <p>Enter your new password below.</p>

      <form onSubmit={handleReset}>
        <p>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </p>

        <p>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </p>

        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  )
}


export default App
