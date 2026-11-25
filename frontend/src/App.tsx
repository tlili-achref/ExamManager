import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout } from './api/auth'
import { AuthUser, getStoredUser, getToken, setUnauthorizedHandler } from './api/client'
import { createExam, deleteExam, Exam, ConflictItem, getExams, getPlanning, updateExam } from './api/exams'
import { getGrades, getGradeStats, Grade, GradeStats, importGradesCsv, publishGrades, updateGradeScore } from './api/grades'
import { getNotifications, markAllNotificationsRead, markNotificationRead, NotificationItem } from './api/notifications'
import { createRoom, deleteRoom, getRooms, Room } from './api/rooms'
import { downloadConvocationPdf, getServicesStatus, ServiceSummary } from './api/status'
import { assignSupervisor, getGroups, getStudents, getSubjects, getSupervisors, getTeachers, Group, removeSupervisor, Student, Subject, SupervisorAssignment, Teacher } from './api/users'

type View =
  | 'dashboard'
  | 'exams'
  | 'planning'
  | 'rooms'
  | 'subjects'
  | 'supervisors'
  | 'grades'
  | 'student'
  | 'notifications'
  | 'services'

type IconName =
  | 'grid'
  | 'exam'
  | 'calendar'
  | 'room'
  | 'book'
  | 'people'
  | 'grade'
  | 'student'
  | 'bell'
  | 'server'
  | 'search'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'chevron'
  | 'clock'
  | 'warning'
  | 'download'
  | 'upload'
  | 'check'
  | 'menu'
  | 'close'
  | 'logout'
  | 'mail'
  | 'lock'

const iconPaths: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  exam: <><path d="M7 3h10v4H7z" /><path d="M5 5H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1" /><path d="M7 12h10M7 16h6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  room: <><path d="M3 21h18M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17" /><path d="M9 7h2M9 11h2M9 15h2M15 7h.01M15 11h.01M15 15h.01" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  grade: <><path d="M4 19V5M4 19h16" /><path d="m8 15 3-4 3 2 5-7" /></>,
  student: <><path d="m2 10 10-5 10 5-10 5z" /><path d="M6 12v5c3 2 9 2 12 0v-5M22 10v6" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></>,
  server: <><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M7 7h.01M7 17h.01" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  warning: <><path d="M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

function Button({ children, variant = 'primary', icon, onClick, type = 'button', disabled = false }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: IconName; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }) {
  return <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>{icon && <Icon name={icon} size={18} />}{children}</button>
}

function Badge({ status }: { status: string }) {
  const key = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return <span className={`badge badge-${key}`}><span className="badge-dot" />{status}</span>
}

function Avatar({ name, color = 'blue' }: { name: string; color?: 'blue' | 'teal' | 'amber' }) {
  const letters = name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('')
  return <span className={`avatar avatar-${color}`}>{letters}</span>
}

function Input({ label, placeholder, icon, type = 'text', value, onChange }: { label?: string; placeholder?: string; icon?: IconName; type?: string; value?: string | number; onChange?: (val: string) => void }) {
  return <label className="field">{label && <span>{label}</span>}<div className="input-wrap">{icon && <Icon name={icon} size={18} />}<input type={type} placeholder={placeholder} value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} /></div></label>
}

function Select({ label, children, value, onChange }: { label?: string; children: ReactNode; value?: string; onChange?: (val: string) => void }) {
  return <label className="field">{label && <span>{label}</span>}<select value={value} onChange={(e) => onChange?.(e.target.value)}>{children}</select></label>
}

const nav: { id: View; label: string; icon: IconName; roles: AuthUser['role'][] }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'grid', roles: ['ADMIN', 'TEACHER'] },
  { id: 'exams', label: 'Examens', icon: 'exam', roles: ['ADMIN', 'TEACHER'] },
  { id: 'planning', label: 'Planning', icon: 'calendar', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { id: 'rooms', label: 'Salles', icon: 'room', roles: ['ADMIN', 'TEACHER'] },
  { id: 'subjects', label: 'Matières & Groupes', icon: 'book', roles: ['ADMIN', 'TEACHER'] },
  { id: 'supervisors', label: 'Surveillants', icon: 'people', roles: ['ADMIN', 'TEACHER'] },
  { id: 'grades', label: 'Notes', icon: 'grade', roles: ['TEACHER'] },
  { id: 'student', label: 'Espace étudiant', icon: 'student', roles: ['STUDENT'] },
  { id: 'notifications', label: 'Notifications', icon: 'bell', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { id: 'services', label: 'État des services', icon: 'server', roles: ['ADMIN'] },
]

const viewTitles: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Tableau de bord', subtitle: 'Voici un aperçu de la session d’examens.' },
  exams: { title: 'Examens', subtitle: 'Planifiez et gérez l’ensemble des examens.' },
  planning: { title: 'Planning', subtitle: 'Visualisez le calendrier et détectez les conflits.' },
  rooms: { title: 'Salles', subtitle: 'Gérez les capacités et disponibilités des salles.' },
  subjects: { title: 'Matières & Groupes', subtitle: 'Organisez les unités d’enseignement et les promotions.' },
  supervisors: { title: 'Affectation des surveillants', subtitle: 'Glissez les enseignants sur les créneaux d’examen.' },
  grades: { title: 'Saisie des notes', subtitle: 'Session principale · Saisie & publication' },
  student: { title: 'Mon espace', subtitle: 'Retrouvez vos examens, convocations et résultats.' },
  notifications: { title: 'Notifications', subtitle: 'Consultez les dernières activités de la plateforme.' },
  services: { title: 'État des services', subtitle: 'Surveillance en temps réel de l’infrastructure ISI.' },
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

function Login({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [email, setEmail] = useState('amine.benamor@isi.utm.tn')
  const [password, setPassword] = useState('exammanager')
  const [profileHint, setProfileHint] = useState('Admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProfileChange = (val: string) => {
    setProfileHint(val)
    if (val === 'Admin') setEmail('amine.benamor@isi.utm.tn')
    if (val === 'Enseignant') setEmail('leila.trabelsi@isi.utm.tn')
    if (val === 'Étudiant') setEmail('yasmine.benamor@isi.utm.tn')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await apiLogin(email, password)
      onLogin(res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-page">
    <section className="login-brand">
      <div className="login-brand-inner">
        <div className="brand brand-light"><span className="brand-mark">E</span><span>ExamManager</span></div>
        <div className="login-copy"><span className="eyebrow">INSTITUT SUPÉRIEUR D’INFORMATIQUE</span><h1>La gestion des examens, enfin simplifiée.</h1><p>Planifiez, coordonnez et suivez chaque session depuis un espace unique et fiable.</p></div>
        <div className="login-stats"><div><b>2 450+</b><span>Étudiants</span></div><div><b>128</b><span>Enseignants</span></div><div><b>34</b><span>Salles</span></div></div>
      </div>
      <div className="orb orb-one" /><div className="orb orb-two" />
    </section>
    <section className="login-panel">
      <div className="login-form">
        <div className="mobile-brand brand"><span className="brand-mark">E</span><span>ExamManager</span></div>
        <div><span className="eyebrow eyebrow-blue">ESPACE SÉCURISÉ</span><h2>Connectez-vous</h2><p className="muted">Accédez à votre espace de gestion universitaire.</p></div>
        <form onSubmit={submit}>
          <Input label="Adresse e-mail" icon="mail" type="email" placeholder="prenom.nom@isi.utm.tn" value={email} onChange={setEmail} />
          <Input label="Mot de passe" icon="lock" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
          <Select label="Profil" value={profileHint} onChange={handleProfileChange}><option>Admin</option><option>Enseignant</option><option>Étudiant</option></Select>
          {error && <div className="warning-banner"><Icon name="warning" /><div><b>Connexion impossible</b><span>{error}</span></div></div>}
          <div className="login-options"><label className="check-label"><input type="checkbox" defaultChecked /> Se souvenir de moi</label><button type="button" className="text-button">Mot de passe oublié ?</button></div>
          <button className="btn btn-primary btn-large" type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'} <Icon name="chevron" size={18} /></button>
        </form>
        <p className="login-help">Besoin d’aide ? <b>Contactez le service informatique</b></p>
      </div>
    </section>
  </main>
}

function AppShell({ view, setView, user, unreadCount, logout, children }: { view: View; setView: (v: View) => void; user: AuthUser; unreadCount: number; logout: () => void; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const info = viewTitles[view]
  const go = (id: View) => { setView(id); setMobileOpen(false) }
  const roleLabel = user.role === 'ADMIN' ? 'Admin' : user.role === 'TEACHER' ? 'Enseignant' : 'Étudiant'
  const visibleNav = nav.filter((item) => item.roles.includes(user.role))

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-head"><div className="brand brand-light"><span className="brand-mark">E</span><span>ExamManager</span></div><button className="icon-button close-menu" onClick={() => setMobileOpen(false)}><Icon name="close" /></button></div>
      <div className="session-pill"><span>SESSION ACTIVE</span><b>Principale · 2024/2025</b></div>
      <nav>{visibleNav.map((item) => <button key={item.id} onClick={() => go(item.id)} className={`nav-item ${view === item.id ? 'active' : ''}`}><Icon name={item.icon} size={19} /><span>{item.label}</span>{item.id === 'notifications' && unreadCount > 0 && <i>{unreadCount}</i>}</button>)}</nav>
      <div className="sidebar-user"><Avatar name={user.full_name} /><div><b>{user.full_name}</b><span>{roleLabel}</span></div><button className="icon-button" onClick={logout} title="Déconnexion"><Icon name="logout" size={18} /></button></div>
    </aside>
    {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}
    <section className="content-area">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
        <div className="topbar-title"><h1>{view === 'dashboard' ? `Bonjour, ${user.full_name.split(' ')[0]}` : info.title}</h1><p>{info.subtitle}</p></div>
        <div className="topbar-actions"><div className="top-search"><Icon name="search" size={18} /><input placeholder="Rechercher..." /></div><button className="icon-button notification-button" onClick={() => setView('notifications')}><Icon name="bell" />{unreadCount > 0 && <span />}</button><Avatar name={user.full_name} /></div>
      </header>
      <main className="page-content">{children}</main>
      <nav className="bottom-nav">{visibleNav.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => go(item.id)}><Icon name={item.icon} size={20} /><span>{item.label.split(' ')[0]}</span></button>)}<button onClick={() => setMobileOpen(true)}><Icon name="menu" size={20} /><span>Plus</span></button></nav>
    </section>
  </div>
}

function KpiCard({ label, value, detail, icon, color }: { label: string; value: string; detail: string; icon: IconName; color: string }) {
  return <div className="card kpi-card"><div className={`kpi-icon ${color}`}><Icon name={icon} /></div><div className="kpi-main"><span>{label}</span><b>{value}</b><small><strong>{detail}</strong> actifs</small></div><div className="sparkline"><i /><i /><i /><i /><i /><i /></div></div>
}

function ExamListItem({ time, duration, title, meta, room, color }: { time: string; duration?: string; title: string; meta: string; room: string; color: string }) {
  return <div className="exam-list-item"><div className="exam-time"><b>{time}</b><span>{duration || '1h30'}</span></div><i className={`exam-line ${color}`} /><div className="exam-info"><b>{title}</b><span>{meta}</span></div><span className="room-tag"><Icon name="room" size={15} />{room}</span><Icon name="chevron" size={18} /></div>
}

function Dashboard({ navigate, role }: { navigate: (v: View) => void; role: AuthUser['role'] }) {
  const [exams, setExams] = useState<Exam[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [teachersCount, setTeachersCount] = useState(0)
  const [studentsCount, setStudentsCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getExams(), getRooms(), getTeachers(), getStudents()])
      .then(([ex, rm, tc, st]) => {
        setExams(ex)
        setRooms(rm)
        setTeachersCount(tc.length)
        setStudentsCount(st.length)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur de chargement'))
  }, [])

  const colors = ['blue', 'teal', 'amber', 'violet']
  const deptCounts = useMemo(() => {
    const map: Record<string, number> = {}
    exams.forEach((e) => { map[e.department] = (map[e.department] || 0) + 1 })
    return Object.entries(map)
  }, [exams])

  return <div className="page-stack">
    {error && <div className="warning-banner"><Icon name="warning" /><div><b>Erreur</b><span>{error}</span></div></div>}
    <div className="quick-row"><div className="date-card"><Icon name="calendar" /><div><span>Session principale</span><b>03 — 21 Juin 2025</b></div></div>{role === 'TEACHER' && <Button icon="plus" onClick={() => navigate('exams')}>Nouvel examen</Button>}</div>
    <div className="kpi-grid">
      <KpiCard label="Examens planifiés" value={String(exams.length)} detail={String(exams.filter((e) => e.status === 'Planifié').length)} icon="exam" color="blue" />
      <KpiCard label="Salles disponibles" value={String(rooms.filter((r) => r.available).length)} detail={String(rooms.length)} icon="room" color="teal" />
      <KpiCard label="Enseignants" value={String(teachersCount)} detail={String(teachersCount)} icon="people" color="amber" />
      <KpiCard label="Étudiants inscrits" value={String(studentsCount)} detail={String(studentsCount)} icon="student" color="violet" />
    </div>
    <div className="dashboard-grid">
      <section className="card schedule-card">
        <div className="section-head"><div><h2>Prochains examens</h2><p>Session principale</p></div><button className="text-button" onClick={() => navigate('planning')}>Voir le planning <Icon name="chevron" size={16} /></button></div>
        <div className="upcoming-list">
          {exams.slice(0, 4).map((e, i) => (
            <ExamListItem key={e.id} time={e.start_time.slice(0, 5)} duration={formatDuration(e.duration_minutes)} title={e.subject_name} meta={`${e.group_name} · ${e.exam_date}`} room={e.room_name} color={colors[i % colors.length]} />
          ))}
        </div>
      </section>
      <section className="card chart-card">
        <div className="section-head"><div><h2>Examens par département</h2><p>Session principale</p></div></div>
        <div className="donut-wrap"><div className="donut"><div><b>{exams.length}</b><span>Total</span></div></div><div className="legend">{deptCounts.map(([dept, count], idx) => <span key={dept}><i className={`lg-${['blue', 'teal', 'amber', 'gray'][idx % 4]}`} />{dept} <b>{count}</b></span>)}</div></div>
      </section>
    </div>
  </div>
}

function ExamForm({ close, initial, rooms, onSaved }: { close: () => void; initial: Exam | null; rooms: Room[]; onSaved: () => void }) {
  const [subjectName, setSubjectName] = useState(initial?.subject_name || 'Génie Logiciel')
  const [department, setDepartment] = useState(initial?.department || 'Génie Logiciel')
  const [groupName, setGroupName] = useState(initial?.group_name || 'GL3')
  const [examDate, setExamDate] = useState(initial?.exam_date || '2025-06-03')
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) || '08:30')
  const [duration, setDuration] = useState(String(initial?.duration_minutes || 90))
  const [roomName, setRoomName] = useState(initial?.room_name || (rooms[0]?.name ?? 'Amphi A'))
  const [statusVal, setStatusVal] = useState(initial?.status || 'Planifié')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        subject_name: subjectName,
        department,
        group_name: groupName,
        exam_date: examDate,
        start_time: `${startTime}:00`,
        duration_minutes: Number(duration),
        room_name: roomName,
        status: statusVal,
      }
      if (initial) {
        await updateExam(initial.id, payload)
      } else {
        await createExam(payload)
      }
      onSaved()
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className="modal"><div className="modal-head"><div><h2>{initial ? 'Modifier l’examen' : 'Nouvel examen'}</h2><p>Renseignez les informations du créneau.</p></div><button className="icon-button" onClick={close}><Icon name="close" /></button></div><div className="form-grid"><Input label="Matière" value={subjectName} onChange={setSubjectName} /><Input label="Département" value={department} onChange={setDepartment} /><Input label="Groupe" value={groupName} onChange={setGroupName} /><Input label="Date" type="date" value={examDate} onChange={setExamDate} /><Input label="Heure" type="time" value={startTime} onChange={setStartTime} /><Select label="Durée" value={duration} onChange={setDuration}><option value="90">1h30</option><option value="120">2h00</option><option value="180">3h00</option></Select><Select label="Salle" value={roomName} onChange={setRoomName}>{rooms.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}</Select><Select label="Statut" value={statusVal} onChange={setStatusVal}><option>Planifié</option><option>En cours</option><option>Terminé</option><option>Annulé</option></Select></div>{error ? <div className="warning-banner"><Icon name="warning" /><div><b>Erreur</b><span>{error}</span></div></div> : <div className="modal-note"><Icon name="check" size={18} /> Prêt à enregistrer ce créneau.</div>}<div className="modal-actions"><Button variant="secondary" onClick={close}>Annuler</Button><Button onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : initial ? 'Enregistrer' : 'Créer l’examen'}</Button></div></div></div>
}

function Exams({ role }: { role: AuthUser['role'] }) {
  const canEdit = role === 'TEACHER'
  const [exams, setExams] = useState<Exam[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous les statuts')
  const [deptFilter, setDeptFilter] = useState('Tous les départements')
  const [modal, setModal] = useState<{ open: boolean; exam: Exam | null }>({ open: false, exam: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      getExams({ search, status: statusFilter, department: deptFilter }),
      getRooms(),
    ])
      .then(([ex, rm]) => { setExams(ex); setRooms(rm); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [search, statusFilter, deptFilter])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number) => {
    try {
      await deleteExam(id)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur suppression')
    }
  }

  return <div className="page-stack">
    <div className="toolbar">
      <div className="toolbar-filters">
        <div className="search-field"><Icon name="search" size={18} /><input placeholder="Rechercher une matière..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>Tous les statuts</option><option>Planifié</option><option>En cours</option><option>Terminé</option><option>Annulé</option></select>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}><option>Tous les départements</option><option>Génie Logiciel</option><option>Informatique</option><option>Réseaux</option></select>
      </div>
      {canEdit && <Button icon="plus" onClick={() => setModal({ open: true, exam: null })}>Nouvel examen</Button>}
    </div>
    {error && <div className="warning-banner"><Icon name="warning" /><div><b>Erreur</b><span>{error}</span></div></div>}
    <section className="card table-card">
      <div className="table-title"><div><h2>Liste des examens</h2><p>{loading ? 'Chargement...' : `${exams.length} examens trouvés`}</p></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Matière</th><th>Date</th><th>Heure</th><th>Durée</th><th>Salle</th><th>Groupe</th><th>Statut</th><th /></tr></thead>
          <tbody>
            {exams.map((ex) => (
              <tr key={ex.id}>
                <td><div className="subject-cell"><span>{ex.subject_name.slice(0, 2).toUpperCase()}</span><b>{ex.subject_name}</b></div></td>
                <td>{ex.exam_date}</td>
                <td>{ex.start_time.slice(0, 5)}</td>
                <td>{formatDuration(ex.duration_minutes)}</td>
                <td>{ex.room_name}</td>
                <td>{ex.group_name}</td>
                <td><Badge status={ex.status} /></td>
                <td>{canEdit && <div className="row-actions"><button className="icon-button" onClick={() => setModal({ open: true, exam: ex })}><Icon name="edit" size={17} /></button><button className="icon-button danger" onClick={() => handleDelete(ex.id)}><Icon name="trash" size={17} /></button></div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
    {modal.open && <ExamForm close={() => setModal({ open: false, exam: null })} initial={modal.exam} rooms={rooms} onSaved={load} />}
  </div>
}

function Planning() {
  const [exams, setExams] = useState<Exam[]>([])
  const [conflicts, setConflicts] = useState<ConflictItem[]>([])
  const [showConflicts, setShowConflicts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPlanning()
      .then((res) => { setExams(res.exams); setConflicts(res.conflicts) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur planning'))
  }, [])

  const times = ['08:30', '10:30', '12:30', '14:00']
  const dates = Array.from(new Set(exams.map((e) => e.exam_date))).slice(0, 5)
  const days = dates.length > 0 ? dates : ['2025-06-03', '2025-06-04', '2025-06-05']
  const colors = ['blue', 'teal', 'amber', 'violet']

  return <div className="page-stack">
    {error && <div className="warning-banner"><Icon name="warning" /><div><b>Erreur</b><span>{error}</span></div></div>}
    {conflicts.length > 0 && (
      <div className="warning-banner">
        <Icon name="warning" />
        <div><b>{conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} détecté{conflicts.length > 1 ? 's' : ''}</b><span>{conflicts[0].message}</span></div>
        <button onClick={() => setShowConflicts((v) => !v)}>{showConflicts ? 'Masquer' : 'Examiner les conflits'}</button>
      </div>
    )}
    {showConflicts && conflicts.length > 0 && (
      <div className="toast"><span><Icon name="warning" /></span><div><b>Détails des conflits</b><p>{conflicts.map((c) => c.message).join(' | ')}</p></div><button onClick={() => setShowConflicts(false)}>×</button></div>
    )}
    <section className="card calendar-card">
      <div className="calendar-toolbar"><div className="segmented"><button className="active">Semaine</button></div><div className="calendar-nav"><b>Session Principale 2025</b></div></div>
      <div className="calendar-scroll">
        <div className="calendar-grid">
          <div className="calendar-corner">GMT+1</div>
          {days.map((day) => <div className="calendar-day" key={day}>{day}</div>)}
          {times.map((slot) => (
            <div className="calendar-row" key={slot}>
              <div className="calendar-time">{slot}</div>
              {days.map((day) => {
                const slotHour = Number(slot.split(':')[0])
                const matching = exams.filter((e) => e.exam_date === day && Math.abs(Number(e.start_time.split(':')[0]) - slotHour) <= 1)
                return <div className="calendar-cell" key={`${day}-${slot}`}>{matching.map((ev, i) => <div className={`calendar-event ${colors[i % colors.length]}`} key={ev.id}><b>{ev.subject_name}</b><span>{ev.room_name} · {ev.group_name}</span></div>)}</div>
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
}

function Rooms({ role }: { role: AuthUser['role'] }) {
  const canEdit = role === 'ADMIN'
  const [rooms, setRooms] = useState<Room[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('50')
  const [building, setBuilding] = useState('')
  const [floor, setFloor] = useState('RDC')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getRooms(search).then(setRooms).catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
  }, [search])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      await createRoom({ name, building, floor, capacity: Number(capacity), available: true, usage_rate: 0 })
      setShowForm(false)
      setName('')
      setBuilding('')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur création salle')
    }
  }

  return <div className="page-stack">
    <div className="toolbar"><div className="search-field"><Icon name="search" size={18} /><input placeholder="Rechercher une salle..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>{canEdit && <Button icon="plus" onClick={() => setShowForm(true)}>Ajouter une salle</Button>}</div>
    {error && <div className="warning-banner"><Icon name="warning" /><div><b>Erreur</b><span>{error}</span></div></div>}
    <div className="rooms-grid">
      {rooms.map((room) => (
        <article className="card room-card" key={room.id}>
          <div className="room-card-head"><span className="room-icon"><Icon name="room" /></span><Badge status={room.available ? 'Disponible' : 'Occupée'} /></div>
          <h3>{room.name}</h3><p>{room.building} · {room.floor}</p>
          <div className="room-cap"><span><Icon name="people" size={17} /> Capacité</span><b>{room.capacity} places</b></div>
          <div className="usage"><div><span>Taux d’occupation</span><b>{room.usage_rate}%</b></div><div className="progress"><i style={{ width: `${room.usage_rate}%` }} /></div></div>
          <div className="room-actions">{canEdit && <button className="icon-button danger" onClick={() => deleteRoom(room.id).then(load)}><Icon name="trash" size={18} /></button>}</div>
        </article>
      ))}
    </div>
    {showForm && <div className="modal-backdrop"><div className="modal compact"><div className="modal-head"><div><h2>Ajouter une salle</h2><p>Créez un nouvel espace d’examen.</p></div><button className="icon-button" onClick={() => setShowForm(false)}><Icon name="close" /></button></div><div className="form-grid"><Input label="Nom de la salle" placeholder="Ex. Salle C12" value={name} onChange={setName} /><Input label="Capacité" type="number" value={capacity} onChange={setCapacity} /><Input label="Bâtiment" placeholder="Ex. Bloc C" value={building} onChange={setBuilding} /><Input label="Étage" placeholder="Ex. 1er étage" value={floor} onChange={setFloor} /></div><div className="modal-actions"><Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button><Button onClick={handleCreate}>Créer la salle</Button></div></div></div>}
  </div>
}

function Subjects() {
  const [tab, setTab] = useState<'subjects' | 'groups'>('subjects')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([getSubjects(), getGroups()]).then(([s, g]) => { setSubjects(s); setGroups(g) })
  }, [])

  const filteredSubjects = subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.code.toLowerCase().includes(search.toLowerCase()))

  return <div className="page-stack">
    <div className="tabs"><button className={tab === 'subjects' ? 'active' : ''} onClick={() => setTab('subjects')}>Matières <span>{subjects.length}</span></button><button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}>Groupes <span>{groups.length}</span></button></div>
    <div className="toolbar"><div className="search-field"><Icon name="search" size={18} /><input placeholder={`Rechercher ${tab === 'subjects' ? 'une matière' : 'un groupe'}...`} value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
    <section className="card table-card">
      <div className="table-title"><div><h2>{tab === 'subjects' ? 'Catalogue des matières' : 'Liste des groupes'}</h2><p>Année universitaire 2024/2025</p></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr>{(tab === 'subjects' ? ['Code', 'Matière', 'Responsable', 'Niveau', 'Crédits'] : ['Code', 'Intitulé', 'Effectif', 'Année', 'Statut']).map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {tab === 'subjects'
              ? filteredSubjects.map((s) => <tr key={s.id}><td><b className="code">{s.code}</b></td><td>{s.name}</td><td>{s.teacher_name}</td><td>{s.level}</td><td>{s.credits} ECTS</td></tr>)
              : filteredGroups.map((g) => <tr key={g.id}><td><b className="code">{g.code}</b></td><td>{g.name}</td><td>{g.student_count} étudiants</td><td>{g.academic_year}</td><td><Badge status={g.status} /></td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  </div>
}

function Supervisors({ role }: { role: AuthUser['role'] }) {
  const canEdit = role === 'ADMIN'
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [assignments, setAssignments] = useState<SupervisorAssignment[]>([])

  const load = useCallback(() => {
    Promise.all([getTeachers(), getExams(), getSupervisors()]).then(([t, e, a]) => {
      setTeachers(t); setExams(e); setAssignments(a)
    })
  }, [])

  useEffect(() => { load() }, [load])

  const handleDrop = async (examId: number, teacherIdStr: string) => {
    const teacherId = Number(teacherIdStr)
    if (!teacherId) return
    await assignSupervisor(examId, teacherId)
    load()
  }

  return <div className="assignment-layout">
    <aside className="card teacher-pool">
      <div className="section-head"><div><h2>Enseignants</h2><p>{teachers.length} disponibles</p></div></div>
      <div className="teacher-list">
        {teachers.map((teacher, index) => (
          <div className="teacher-chip" key={teacher.id} draggable={canEdit} onDragStart={(e) => canEdit && e.dataTransfer.setData('teacherId', String(teacher.id))}>
            <Avatar name={teacher.full_name} color={index % 2 ? 'teal' : 'blue'} />
            <div><b>{teacher.full_name}</b><span>{teacher.department}</span></div>
            <i>⠿</i>
          </div>
        ))}
      </div>
      <p className="drag-help">Glissez un enseignant vers un examen.</p>
    </aside>
    <section className="card assignment-board">
      <div className="section-head"><div><h2>Créneaux d’examen</h2><p>{exams.length} examens</p></div><Badge status={`${assignments.length} affectés`} /></div>
      {exams.map((exam) => {
        const examSup = assignments.filter((a) => a.exam_id === exam.id)
        return (
          <div className="exam-slot" key={exam.id} onDragOver={(e) => canEdit && e.preventDefault()} onDrop={(e) => canEdit && handleDrop(exam.id, e.dataTransfer.getData('teacherId'))}>
            <div className="slot-info"><span>{exam.start_time.slice(0, 5)}</span><div><b>{exam.subject_name}</b><small>{exam.room_name} · {exam.group_name}</small></div></div>
            <div className="slot-people">
              {examSup.map((sup) => <span key={sup.id}><Avatar name={sup.teacher_name} /><b>{sup.teacher_name}</b>{canEdit && <button onClick={() => removeSupervisor(sup.id).then(load)}>×</button>}</span>)}
              {canEdit && <div className="drop-zone"><Icon name="plus" size={17} /> Déposer ici</div>}
            </div>
          </div>
        )
      })}
    </section>
  </div>
}

function Grades() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [stats, setStats] = useState<GradeStats>({ count: 0, average: 0, highest: 0, pass_rate: 0 })
  const [search, setSearch] = useState('')
  const [publishedToast, setPublishedToast] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    Promise.all([getGrades(), getGradeStats()])
      .then(([g, s]) => { setGrades(g); setStats(s); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur notes'))
  }, [])

  useEffect(() => { load() }, [load])

  const handleScoreChange = async (id: number, raw: string) => {
    const val = Number(raw)
    if (Number.isNaN(val) || val < 0 || val > 20) return
    await updateGradeScore(id, val)
    load()
  }

  const handlePublish = async () => {
    await publishGrades()
    setPublishedToast(true)
    load()
  }

  const handleCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await importGradesCsv(1, 'Génie Logiciel', file)
    load()
  }

  const filtered = grades.filter((g) => g.student_name.toLowerCase().includes(search.toLowerCase()) || g.student_matricule.includes(search))
  const allPublished = grades.length > 0 && grades.every((g) => g.published)

  return <div className="page-stack">
    <div className="grade-summary"><div className="card"><span>Moyenne de la classe</span><b>{stats.average.toFixed(2)} <small>/ 20</small></b></div><div className="card"><span>Meilleure note</span><b>{stats.highest.toFixed(2)} <small>/ 20</small></b></div><div className="card"><span>Taux de réussite</span><b>{stats.pass_rate.toFixed(1)} <small>%</small></b></div></div>
    <div className="toolbar">
      <div className="search-field"><Icon name="search" size={18} /><input placeholder="Rechercher un étudiant..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="button-group">
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsv} />
        <Button variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>Importer CSV</Button>
        <Button icon="check" onClick={handlePublish}>Publier les notes</Button>
      </div>
    </div>
    {error && <div className="warning-banner"><Icon name="warning" /><div><b>Erreur</b><span>{error}</span></div></div>}
    {publishedToast && <div className="toast"><span><Icon name="check" /></span><div><b>Notes publiées</b><p>Les étudiants ont été notifiés.</p></div><button onClick={() => setPublishedToast(false)}>×</button></div>}
    <section className="card table-card">
      <div className="table-title"><div><h2>Liste des étudiants</h2><p>{filtered.length} notes enregistrées</p></div><Badge status={allPublished ? 'Publié' : 'Brouillon'} /></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Matricule</th><th>Étudiant</th><th>Matière</th><th>Note / 20</th><th>Statut</th><th>Appréciation</th></tr></thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id}>
                <td><b className="code">{g.student_matricule}</b></td>
                <td><div className="student-cell"><Avatar name={g.student_name} /><b>{g.student_name}</b></div></td>
                <td>{g.subject_name}</td>
                <td><input className="grade-input" type="number" defaultValue={g.score} min="0" max="20" step="0.25" onBlur={(e) => handleScoreChange(g.id, e.target.value)} /></td>
                <td><Badge status={g.score >= 10 ? 'Admis' : 'Ajourné'} /></td>
                <td>{g.score >= 16 ? 'Très bien' : g.score >= 14 ? 'Bien' : g.score >= 12 ? 'Assez bien' : g.score >= 10 ? 'Passable' : 'Insuffisant'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>
}

function StudentSpace({ user }: { user: AuthUser }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getStudents(user.role === 'STUDENT' ? user.id : undefined), getExams()])
      .then(async ([stList, exList]) => {
        const st = stList[0] || null
        setStudent(st)
        setExams(exList)
        if (st) {
          const gr = await getGrades({ student_id: st.id, published_only: true })
          setGrades(gr)
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur espace étudiant'))
  }, [user])

  const avg = grades.length > 0 ? grades.reduce((acc, g) => acc + g.score, 0) / grades.length : 0
  const nextExam = exams[0]
  const colors = ['blue', 'teal', 'amber']

  const handleConvocation = async () => {
    if (!student || !nextExam) return
    try {
      await downloadConvocationPdf(student.id, nextExam.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur convocation')
    }
  }

  return <div className="page-stack">
    {error && <div className="warning-banner"><Icon name="warning" /><div><b>Erreur</b><span>{error}</span></div></div>}
    <section className="student-hero">
      <div><span>PROCHAIN EXAMEN</span><h2>{nextExam?.subject_name || 'Aucun examen'}</h2><p><Icon name="calendar" size={18} /> {nextExam?.exam_date || '—'} · {nextExam?.start_time.slice(0, 5) || '—'}</p><p><Icon name="room" size={18} /> {nextExam?.room_name || '—'} · Durée {nextExam ? formatDuration(nextExam.duration_minutes) : '—'}</p></div>
      <div className="countdown"><span>Session</span><b>04</b><small>examens</small></div>
    </section>
    <div className="student-grid">
      <section className="card">
        <div className="section-head"><div><h2>Mes prochains examens</h2><p>Session principale</p></div><Button variant="secondary" icon="download" onClick={handleConvocation} disabled={!student || !nextExam}>Convocation PDF</Button></div>
        <div className="student-exams">{exams.slice(0, 4).map((e, i) => <ExamListItem key={e.id} time={e.start_time.slice(0, 5)} duration={formatDuration(e.duration_minutes)} title={e.subject_name} meta={e.exam_date} room={e.room_name} color={colors[i % colors.length]} />)}</div>
      </section>
      <section className="card result-card">
        <div className="section-head"><div><h2>Mes résultats</h2><p>Semestre 2 · Publiés</p></div></div>
        <div className="average"><div><span>Moyenne générale</span><b>{avg.toFixed(2)}<small>/20</small></b></div><Badge status={avg >= 10 ? 'Admis' : 'Ajourné'} /></div>
        <div className="result-list">{grades.length === 0 ? <span><b>Aucune note publiée</b><strong>—</strong></span> : grades.map((g) => <span key={g.id}><b>{g.subject_name}</b><strong>{g.score.toFixed(2)}</strong></span>)}</div>
      </section>
    </div>
  </div>
}

function Notifications({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadOnly, setUnreadOnly] = useState(false)

  const load = useCallback(() => {
    getNotifications().then((data) => { setItems(data); onChange() })
  }, [onChange])

  useEffect(() => { load() }, [load])

  const visible = unreadOnly ? items.filter((n) => !n.is_read) : items
  const unreadCount = items.filter((n) => !n.is_read).length

  return <section className="card notifications-card">
    <div className="section-head">
      <div className="filter-pills">
        <button className={!unreadOnly ? 'active' : ''} onClick={() => setUnreadOnly(false)}>Toutes <span>{items.length}</span></button>
        <button className={unreadOnly ? 'active' : ''} onClick={() => setUnreadOnly(true)}>Non lues <span>{unreadCount}</span></button>
      </div>
      <button className="text-button" onClick={() => markAllNotificationsRead().then(load)}><Icon name="check" size={17} /> Tout marquer comme lu</button>
    </div>
    <div className="notification-list">
      {visible.map((note) => (
        <article className={!note.is_read ? 'unread' : ''} key={note.id} onClick={() => !note.is_read && markNotificationRead(note.id).then(load)}>
          <span className={`notification-icon ${note.icon}`}><Icon name={(note.icon as IconName) || 'bell'} /></span>
          <div><b>{note.title}</b><p>{note.message}</p><small>{new Date(note.created_at).toLocaleString()}</small></div>
          {!note.is_read && <i />}
        </article>
      ))}
    </div>
  </section>
}

function Services() {
  const [summary, setSummary] = useState<ServiceSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getServicesStatus()
      .then((res) => setSummary(res.summary))
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur statut services'))
  }, [])

  const upCount = summary.filter((s) => s.up).length

  return <div className="page-stack">
    {error && <div className="warning-banner"><Icon name="warning" /><div><b>Erreur</b><span>{error}</span></div></div>}
    <div className="system-banner"><span><Icon name="check" /></span><div><b>Systèmes opérationnels</b><p>{upCount} services sur {summary.length || 3} fonctionnent normalement.</p></div><small>Dernière vérification : à l’instant</small></div>
    <div className="services-grid">
      {summary.map((service) => (
        <article className="card service-card" key={service.name}>
          <div className="service-head"><span className="service-icon"><Icon name="server" /></span><Badge status={service.up ? 'UP' : 'DOWN'} /></div>
          <h3>{service.name}</h3><p>{service.description}</p>
          <div className="service-metrics"><div><span>Latence</span><b className={service.up ? '' : 'down'}>{service.latency}</b></div><div><span>Disponibilité (30j)</span><b>{service.uptime}</b></div></div>
          <div className="history"><span>Dernières 12 heures</span><div>{Array.from({ length: 12 }).map((_, i) => <i key={i} className={service.up ? 'up' : 'down'} />)}</div></div>
        </article>
      ))}
    </div>
  </div>
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => (getToken() ? getStoredUser() : null))
  const [view, setView] = useState<View>(() => {
    const u = getStoredUser()
    if (!u) return 'dashboard'
    return u.role === 'STUDENT' ? 'student' : u.role === 'TEACHER' ? 'grades' : 'dashboard'
  })
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnread = useCallback(() => {
    if (!getToken()) return
    getNotifications(true).then((n) => setUnreadCount(n.length)).catch(() => {})
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    if (user) refreshUnread()
  }, [user, refreshUnread])

  const allowedViews = useMemo(
    () => (user ? nav.filter((item) => item.roles.includes(user.role)).map((i) => i.id) : []),
    [user],
  )
  const activeView: View = user && allowedViews.includes(view)
    ? view
    : user?.role === 'STUDENT'
      ? 'student'
      : user?.role === 'TEACHER'
        ? 'grades'
        : 'dashboard'

  const screen = useMemo(() => {
    if (!user) return null
    switch (activeView) {
      case 'dashboard': return <Dashboard navigate={setView} role={user.role} />
      case 'exams': return <Exams role={user.role} />
      case 'planning': return <Planning />
      case 'rooms': return <Rooms role={user.role} />
      case 'subjects': return <Subjects />
      case 'supervisors': return <Supervisors role={user.role} />
      case 'grades': return <Grades />
      case 'student': return <StudentSpace user={user} />
      case 'notifications': return <Notifications onChange={refreshUnread} />
      case 'services': return <Services />
    }
  }, [activeView, user, refreshUnread])

  if (!user) {
    return <Login onLogin={(u) => {
      setUser(u)
      setView(u.role === 'STUDENT' ? 'student' : u.role === 'TEACHER' ? 'grades' : 'dashboard')
    }} />
  }

  return <AppShell view={activeView} setView={setView} user={user} unreadCount={unreadCount} logout={() => { apiLogout(); setUser(null) }}>{screen}</AppShell>
}
