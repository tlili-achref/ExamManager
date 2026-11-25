import { useMemo, useState, type ReactNode } from 'react'

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
  const letters = name.split(' ').map((part) => part[0]).slice(0, 2).join('')
  return <span className={`avatar avatar-${color}`}>{letters}</span>
}

function Input({ label, placeholder, icon, type = 'text', defaultValue }: { label?: string; placeholder?: string; icon?: IconName; type?: string; defaultValue?: string }) {
  return <label className="field">{label && <span>{label}</span>}<div className="input-wrap">{icon && <Icon name={icon} size={18} />}<input type={type} placeholder={placeholder} defaultValue={defaultValue} /></div></label>
}

function Select({ label, children, defaultValue }: { label?: string; children: ReactNode; defaultValue?: string }) {
  return <label className="field">{label && <span>{label}</span>}<select defaultValue={defaultValue}>{children}</select></label>
}

const nav: { id: View; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'grid' },
  { id: 'exams', label: 'Examens', icon: 'exam' },
  { id: 'planning', label: 'Planning', icon: 'calendar' },
  { id: 'rooms', label: 'Salles', icon: 'room' },
  { id: 'subjects', label: 'Matières & Groupes', icon: 'book' },
  { id: 'supervisors', label: 'Surveillants', icon: 'people' },
  { id: 'grades', label: 'Notes', icon: 'grade' },
  { id: 'student', label: 'Espace étudiant', icon: 'student' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'services', label: 'État des services', icon: 'server' },
]

const viewTitles: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Bonjour, Amine', subtitle: 'Voici un aperçu de la session d’examens.' },
  exams: { title: 'Examens', subtitle: 'Planifiez et gérez l’ensemble des examens.' },
  planning: { title: 'Planning', subtitle: 'Visualisez le calendrier et détectez les conflits.' },
  rooms: { title: 'Salles', subtitle: 'Gérez les capacités et disponibilités des salles.' },
  subjects: { title: 'Matières & Groupes', subtitle: 'Organisez les unités d’enseignement et les promotions.' },
  supervisors: { title: 'Affectation des surveillants', subtitle: 'Glissez les enseignants sur les créneaux d’examen.' },
  grades: { title: 'Saisie des notes', subtitle: 'Génie Logiciel — GL3 · Session principale' },
  student: { title: 'Mon espace', subtitle: 'Bienvenue, Yasmine. Retrouvez vos examens et résultats.' },
  notifications: { title: 'Notifications', subtitle: 'Consultez les dernières activités de la plateforme.' },
  services: { title: 'État des services', subtitle: 'Surveillance en temps réel de l’infrastructure ISI.' },
}

function Login({ onLogin }: { onLogin: (role: string) => void }) {
  const [role, setRole] = useState('Admin')
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
        <form onSubmit={(event) => { event.preventDefault(); onLogin(role) }}>
          <Input label="Adresse e-mail" icon="mail" type="email" placeholder="prenom.nom@isi.utm.tn" defaultValue="amine.benamor@isi.utm.tn" />
          <Input label="Mot de passe" icon="lock" type="password" placeholder="••••••••" defaultValue="exammanager" />
          <Select label="Profil" defaultValue={role}><option>Admin</option><option>Enseignant</option><option>Étudiant</option></Select>
          <div className="login-options"><label className="check-label"><input type="checkbox" defaultChecked /> Se souvenir de moi</label><button type="button" className="text-button">Mot de passe oublié ?</button></div>
          <button className="btn btn-primary btn-large" type="submit" onClick={() => setRole((document.querySelector('select') as HTMLSelectElement)?.value || role)}>Se connecter <Icon name="chevron" size={18} /></button>
        </form>
        <p className="login-help">Besoin d’aide ? <b>Contactez le service informatique</b></p>
      </div>
    </section>
  </main>
}

function AppShell({ view, setView, role, logout, children }: { view: View; setView: (v: View) => void; role: string; logout: () => void; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const info = viewTitles[view]
  const go = (id: View) => { setView(id); setMobileOpen(false) }
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-head"><div className="brand brand-light"><span className="brand-mark">E</span><span>ExamManager</span></div><button className="icon-button close-menu" onClick={() => setMobileOpen(false)}><Icon name="close" /></button></div>
      <div className="session-pill"><span>SESSION ACTIVE</span><b>Principale · 2024/2025</b></div>
      <nav>{nav.map((item) => <button key={item.id} onClick={() => go(item.id)} className={`nav-item ${view === item.id ? 'active' : ''}`}><Icon name={item.icon} size={19} /><span>{item.label}</span>{item.id === 'notifications' && <i>3</i>}</button>)}</nav>
      <div className="sidebar-user"><Avatar name="Amine Ben Amor" /><div><b>Amine Ben Amor</b><span>{role}</span></div><button className="icon-button" onClick={logout} title="Déconnexion"><Icon name="logout" size={18} /></button></div>
    </aside>
    {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}
    <section className="content-area">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
        <div className="topbar-title"><h1>{info.title}</h1><p>{info.subtitle}</p></div>
        <div className="topbar-actions"><div className="top-search"><Icon name="search" size={18} /><input placeholder="Rechercher..." /></div><button className="icon-button notification-button" onClick={() => setView('notifications')}><Icon name="bell" /><span /></button><Avatar name="Amine Ben Amor" /></div>
      </header>
      <main className="page-content">{children}</main>
      <nav className="bottom-nav">{nav.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => go(item.id)}><Icon name={item.icon} size={20} /><span>{item.label.split(' ')[0]}</span></button>)}<button onClick={() => setMobileOpen(true)}><Icon name="menu" size={20} /><span>Plus</span></button></nav>
    </section>
  </div>
}

function KpiCard({ label, value, detail, icon, color }: { label: string; value: string; detail: string; icon: IconName; color: string }) {
  return <div className="card kpi-card"><div className={`kpi-icon ${color}`}><Icon name={icon} /></div><div className="kpi-main"><span>{label}</span><b>{value}</b><small><strong>+{detail}</strong> ce mois</small></div><div className="sparkline"><i /><i /><i /><i /><i /><i /></div></div>
}

function Dashboard({ navigate }: { navigate: (v: View) => void }) {
  return <div className="page-stack">
    <div className="quick-row"><div className="date-card"><Icon name="calendar" /><div><span>Session principale</span><b>03 — 21 Juin 2025</b></div></div><Button icon="plus" onClick={() => navigate('exams')}>Nouvel examen</Button></div>
    <div className="kpi-grid">
      <KpiCard label="Examens planifiés" value="48" detail="12" icon="exam" color="blue" />
      <KpiCard label="Salles disponibles" value="26" detail="4" icon="room" color="teal" />
      <KpiCard label="Enseignants" value="128" detail="8" icon="people" color="amber" />
      <KpiCard label="Étudiants inscrits" value="2 452" detail="124" icon="student" color="violet" />
    </div>
    <div className="dashboard-grid">
      <section className="card schedule-card">
        <div className="section-head"><div><h2>Prochains examens</h2><p>Cette semaine · 03–07 Juin</p></div><button className="text-button" onClick={() => navigate('planning')}>Voir le planning <Icon name="chevron" size={16} /></button></div>
        <div className="day-tabs"><button className="active"><b>03</b><span>Lun.</span></button><button><b>04</b><span>Mar.</span></button><button><b>05</b><span>Mer.</span></button><button><b>06</b><span>Jeu.</span></button><button><b>07</b><span>Ven.</span></button></div>
        <div className="upcoming-list">
          <ExamListItem time="08:30" title="Génie Logiciel" meta="GL3 · 90 étudiants" room="Amphi A" color="blue" />
          <ExamListItem time="10:30" title="Bases de Données" meta="L2 INFO · 64 étudiants" room="Salle B12" color="teal" />
          <ExamListItem time="14:00" title="Réseaux Avancés" meta="RT3 · 42 étudiants" room="Salle C04" color="amber" />
        </div>
      </section>
      <section className="card chart-card">
        <div className="section-head"><div><h2>Examens par département</h2><p>Session principale</p></div><button className="icon-button">•••</button></div>
        <div className="donut-wrap"><div className="donut"><div><b>48</b><span>Total</span></div></div><div className="legend"><span><i className="lg-blue" />Informatique <b>22</b></span><span><i className="lg-teal" />Génie Logiciel <b>14</b></span><span><i className="lg-amber" />Réseaux <b>8</b></span><span><i className="lg-gray" />Systèmes <b>4</b></span></div></div>
      </section>
    </div>
  </div>
}

function ExamListItem({ time, title, meta, room, color }: { time: string; title: string; meta: string; room: string; color: string }) {
  return <div className="exam-list-item"><div className="exam-time"><b>{time}</b><span>1h30</span></div><i className={`exam-line ${color}`} /><div className="exam-info"><b>{title}</b><span>{meta}</span></div><span className="room-tag"><Icon name="room" size={15} />{room}</span><Icon name="chevron" size={18} /></div>
}

const examRows = [
  ['Génie Logiciel', '03 Juin 2025', '08:30', '1h30', 'Amphi A', 'GL3', 'Planifié'],
  ['Bases de Données', '03 Juin 2025', '10:30', '2h00', 'Salle B12', 'L2 INFO', 'En cours'],
  ['Réseaux Avancés', '03 Juin 2025', '14:00', '1h30', 'Salle C04', 'RT3', 'Planifié'],
  ['Systèmes Distribués', '04 Juin 2025', '09:00', '2h00', 'Amphi B', 'GL3', 'Planifié'],
  ['Intelligence Artificielle', '04 Juin 2025', '13:30', '1h30', 'Salle A08', 'DS2', 'Terminé'],
  ['Sécurité Informatique', '05 Juin 2025', '11:00', '1h30', 'Salle B06', 'RT2', 'Annulé'],
]

function ExamTable({ onEdit }: { onEdit: () => void }) {
  return <div className="table-wrap"><table><thead><tr><th>Matière</th><th>Date</th><th>Heure</th><th>Durée</th><th>Salle</th><th>Groupe</th><th>Statut</th><th /></tr></thead><tbody>{examRows.map((row) => <tr key={row[0]}>{row.slice(0, 6).map((cell, index) => <td key={cell}>{index === 0 ? <div className="subject-cell"><span>{cell.slice(0, 2).toUpperCase()}</span><b>{cell}</b></div> : cell}</td>)}<td><Badge status={row[6]} /></td><td><div className="row-actions"><button className="icon-button" onClick={onEdit}><Icon name="edit" size={17} /></button><button className="icon-button danger"><Icon name="trash" size={17} /></button></div></td></tr>)}</tbody></table></div>
}

function ExamForm({ close, edit = false }: { close: () => void; edit?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className="modal"><div className="modal-head"><div><h2>{edit ? 'Modifier l’examen' : 'Nouvel examen'}</h2><p>Renseignez les informations du créneau.</p></div><button className="icon-button" onClick={close}><Icon name="close" /></button></div><div className="form-grid"><Select label="Matière"><option>Génie Logiciel</option><option>Bases de Données</option><option>Réseaux Avancés</option></Select><Select label="Groupe"><option>GL3</option><option>L2 INFO</option><option>RT3</option></Select><Input label="Date" type="date" defaultValue="2025-06-03" /><Input label="Heure" type="time" defaultValue="08:30" /><Select label="Durée"><option>1h30</option><option>2h00</option><option>3h00</option></Select><Select label="Salle"><option>Amphi A</option><option>Salle B12</option><option>Salle C04</option></Select></div><div className="modal-note"><Icon name="check" size={18} /> Aucun conflit détecté pour ce créneau.</div><div className="modal-actions"><Button variant="secondary" onClick={close}>Annuler</Button><Button onClick={close}>{edit ? 'Enregistrer' : 'Créer l’examen'}</Button></div></div></div>
}

function Exams() {
  const [modal, setModal] = useState<'new' | 'edit' | null>(null)
  return <div className="page-stack"><div className="toolbar"><div className="toolbar-filters"><div className="search-field"><Icon name="search" size={18} /><input placeholder="Rechercher une matière..." /></div><select><option>Tous les statuts</option><option>Planifié</option><option>En cours</option><option>Terminé</option></select><select><option>Tous les départements</option><option>Génie Logiciel</option><option>Réseaux</option></select></div><Button icon="plus" onClick={() => setModal('new')}>Nouvel examen</Button></div><section className="card table-card"><div className="table-title"><div><h2>Liste des examens</h2><p>48 examens trouvés</p></div><Button variant="secondary" icon="download">Exporter</Button></div><ExamTable onEdit={() => setModal('edit')} /><div className="pagination"><span>Affichage de 1 à 6 sur 48</span><div><button disabled>‹</button><button className="active">1</button><button>2</button><button>3</button><button>…</button><button>8</button><button>›</button></div></div></section>{modal && <ExamForm close={() => setModal(null)} edit={modal === 'edit'} />}</div>
}

const times = ['08:30', '10:30', '12:30', '14:30']
const days = ['Lun. 03', 'Mar. 04', 'Mer. 05', 'Jeu. 06', 'Ven. 07']
const calendarEvents: Record<string, { title: string; room: string; color: string }[]> = {
  '0-0': [{ title: 'Génie Logiciel', room: 'Amphi A · GL3', color: 'blue' }],
  '0-1': [{ title: 'Bases de Données', room: 'B12 · L2 INFO', color: 'teal' }],
  '0-3': [{ title: 'Réseaux Avancés', room: 'C04 · RT3', color: 'amber' }],
  '1-0': [{ title: 'Systèmes Distribués', room: 'Amphi B · GL3', color: 'violet' }],
  '1-2': [{ title: 'Intelligence Artificielle', room: 'A08 · DS2', color: 'blue' }],
  '2-1': [{ title: 'Sécurité Informatique', room: 'B06 · RT2', color: 'teal' }],
  '3-0': [{ title: 'Cloud Computing', room: 'C02 · GL3', color: 'amber' }],
  '4-2': [{ title: 'Architecture SOA', room: 'Amphi A · GL3', color: 'violet' }],
}

function PlanningCalendar() {
  return <div className="calendar-scroll"><div className="calendar-grid"><div className="calendar-corner">GMT+1</div>{days.map((day) => <div className="calendar-day" key={day}>{day}</div>)}{times.map((time, row) => <div className="calendar-row" key={time}><div className="calendar-time">{time}</div>{days.map((day, col) => <div className="calendar-cell" key={day}>{(calendarEvents[`${col}-${row}`] || []).map((event) => <div className={`calendar-event ${event.color}`} key={event.title}><b>{event.title}</b><span>{event.room}</span></div>)}</div>)}</div>)}</div></div>
}

function Planning() {
  return <div className="page-stack"><div className="warning-banner"><Icon name="warning" /><div><b>2 conflits détectés</b><span>Chevauchement de salle ou de surveillant dans le planning actuel.</span></div><button>Examiner les conflits</button></div><section className="card calendar-card"><div className="calendar-toolbar"><div className="segmented"><button className="active">Semaine</button><button>Mois</button></div><div className="calendar-nav"><button className="icon-button">‹</button><b>03 – 07 Juin 2025</b><button className="icon-button">›</button></div><Button variant="secondary" icon="download">Exporter</Button></div><PlanningCalendar /></section></div>
}

const rooms = [
  { name: 'Amphi A', building: 'Bâtiment principal · RDC', cap: 120, available: true, used: 78 },
  { name: 'Amphi B', building: 'Bâtiment principal · 1er étage', cap: 100, available: true, used: 62 },
  { name: 'Salle B12', building: 'Bloc B · 1er étage', cap: 64, available: false, used: 92 },
  { name: 'Salle C04', building: 'Bloc C · RDC', cap: 48, available: true, used: 45 },
  { name: 'Salle A08', building: 'Bloc A · 2ème étage', cap: 36, available: true, used: 55 },
  { name: 'Salle B06', building: 'Bloc B · RDC', cap: 42, available: false, used: 88 },
]

function RoomCard({ room }: { room: typeof rooms[number] }) {
  return <article className="card room-card"><div className="room-card-head"><span className="room-icon"><Icon name="room" /></span><Badge status={room.available ? 'Disponible' : 'Occupée'} /></div><h3>{room.name}</h3><p>{room.building}</p><div className="room-cap"><span><Icon name="people" size={17} /> Capacité</span><b>{room.cap} places</b></div><div className="usage"><div><span>Taux d’occupation</span><b>{room.used}%</b></div><div className="progress"><i style={{ width: `${room.used}%` }} /></div></div><div className="room-actions"><Button variant="secondary" icon="edit">Modifier</Button><button className="icon-button danger"><Icon name="trash" size={18} /></button></div></article>
}

function Rooms() {
  const [showForm, setShowForm] = useState(false)
  return <div className="page-stack"><div className="toolbar"><div className="search-field"><Icon name="search" size={18} /><input placeholder="Rechercher une salle..." /></div><Button icon="plus" onClick={() => setShowForm(true)}>Ajouter une salle</Button></div><div className="rooms-grid">{rooms.map((room) => <RoomCard key={room.name} room={room} />)}</div>{showForm && <div className="modal-backdrop"><div className="modal compact"><div className="modal-head"><div><h2>Ajouter une salle</h2><p>Créez un nouvel espace d’examen.</p></div><button className="icon-button" onClick={() => setShowForm(false)}><Icon name="close" /></button></div><div className="form-grid"><Input label="Nom de la salle" placeholder="Ex. Salle C12" /><Input label="Capacité" type="number" placeholder="50" /><Input label="Bâtiment" placeholder="Ex. Bloc C" /><Input label="Étage" placeholder="Ex. 1er étage" /></div><div className="modal-actions"><Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button><Button onClick={() => setShowForm(false)}>Créer la salle</Button></div></div></div>}</div>
}

function Subjects() {
  const [tab, setTab] = useState<'subjects' | 'groups'>('subjects')
  const data = tab === 'subjects'
    ? [['GL301', 'Génie Logiciel', 'Mme. Leïla Trabelsi', 'GL3', '6 ECTS'], ['BD202', 'Bases de Données', 'M. Sami Gharbi', 'L2 INFO', '5 ECTS'], ['RES305', 'Réseaux Avancés', 'M. Walid Mansour', 'RT3', '4 ECTS'], ['SYS310', 'Systèmes Distribués', 'Mme. Ons Khelifi', 'GL3', '5 ECTS']]
    : [['GL3-A', '3ème année GL · Groupe A', '32 étudiants', '2024/2025', 'Actif'], ['GL3-B', '3ème année GL · Groupe B', '30 étudiants', '2024/2025', 'Actif'], ['L2-INFO-A', '2ème année Informatique', '34 étudiants', '2024/2025', 'Actif'], ['RT3', '3ème année Réseaux', '42 étudiants', '2024/2025', 'Actif']]
  return <div className="page-stack"><div className="tabs"><button className={tab === 'subjects' ? 'active' : ''} onClick={() => setTab('subjects')}>Matières <span>36</span></button><button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}>Groupes <span>12</span></button></div><div className="toolbar"><div className="search-field"><Icon name="search" size={18} /><input placeholder={`Rechercher ${tab === 'subjects' ? 'une matière' : 'un groupe'}...`} /></div><Button icon="plus">Ajouter {tab === 'subjects' ? 'une matière' : 'un groupe'}</Button></div><section className="card table-card"><div className="table-title"><div><h2>{tab === 'subjects' ? 'Catalogue des matières' : 'Liste des groupes'}</h2><p>Année universitaire 2024/2025</p></div></div><div className="table-wrap"><table><thead><tr>{(tab === 'subjects' ? ['Code', 'Matière', 'Responsable', 'Niveau', 'Crédits'] : ['Code', 'Intitulé', 'Effectif', 'Année', 'Statut']).map((h) => <th key={h}>{h}</th>)}<th /></tr></thead><tbody>{data.map((row) => <tr key={row[0]}>{row.map((cell, i) => <td key={cell}>{i === 0 ? <b className="code">{cell}</b> : i === 4 && tab === 'groups' ? <Badge status={cell} /> : cell}</td>)}<td><div className="row-actions"><button className="icon-button"><Icon name="edit" size={17} /></button><button className="icon-button danger"><Icon name="trash" size={17} /></button></div></td></tr>)}</tbody></table></div></section></div>
}

const teachers = ['Leïla Trabelsi', 'Sami Gharbi', 'Walid Mansour', 'Ons Khelifi', 'Nizar Ben Salah']
function Supervisors() {
  const [assigned, setAssigned] = useState<Record<number, string[]>>({ 0: ['Leïla Trabelsi'], 1: ['Sami Gharbi', 'Ons Khelifi'] })
  const add = (index: number, teacher: string) => setAssigned((current) => ({ ...current, [index]: [...(current[index] || []).filter((t) => t !== teacher), teacher] }))
  return <div className="assignment-layout"><aside className="card teacher-pool"><div className="section-head"><div><h2>Enseignants</h2><p>5 disponibles</p></div></div><div className="search-field"><Icon name="search" size={17} /><input placeholder="Rechercher..." /></div><div className="teacher-list">{teachers.map((teacher, index) => <div className="teacher-chip" key={teacher} draggable onDragStart={(e) => e.dataTransfer.setData('teacher', teacher)}><Avatar name={teacher} color={index % 2 ? 'teal' : 'blue'} /><div><b>{teacher}</b><span>{index % 2 ? 'Réseaux' : 'Génie Logiciel'}</span></div><i>⠿</i></div>)}</div><p className="drag-help">Glissez un enseignant vers un examen.</p></aside><section className="card assignment-board"><div className="section-head"><div><h2>Examens du 03 Juin</h2><p>3 créneaux · 4 surveillants requis</p></div><Badge status="3 / 4 affectés" /></div>{examRows.slice(0, 3).map((exam, index) => <div className="exam-slot" key={exam[0]} onDragOver={(e) => e.preventDefault()} onDrop={(e) => add(index, e.dataTransfer.getData('teacher'))}><div className="slot-info"><span>{exam[2]}</span><div><b>{exam[0]}</b><small>{exam[4]} · {exam[5]}</small></div></div><div className="slot-people">{(assigned[index] || []).map((person) => <span key={person}><Avatar name={person} /><b>{person}</b><button onClick={() => setAssigned((a) => ({ ...a, [index]: a[index].filter((p) => p !== person) }))}>×</button></span>)}<div className="drop-zone"><Icon name="plus" size={17} /> Déposer ici</div></div></div>)}</section></div>
}

const students = [
  ['2201843', 'Ben Amor Yasmine', '14.50'], ['2201921', 'Chaabane Aziz', '12.75'], ['2201756', 'Gharbi Mariem', '16.25'], ['2202014', 'Jebali Rayen', '09.50'], ['2201888', 'Mansour Inès', '15.00'], ['2201965', 'Trabelsi Mohamed', '11.25'],
]
function Grades() {
  const [published, setPublished] = useState(false)
  return <div className="page-stack"><div className="grade-summary"><div className="card"><span>Moyenne de la classe</span><b>13.21 <small>/ 20</small></b></div><div className="card"><span>Meilleure note</span><b>17.75 <small>/ 20</small></b></div><div className="card"><span>Taux de réussite</span><b>84.4 <small>%</small></b></div></div><div className="toolbar"><div className="search-field"><Icon name="search" size={18} /><input placeholder="Rechercher un étudiant..." /></div><div className="button-group"><Button variant="secondary" icon="upload">Importer CSV</Button><Button icon="check" onClick={() => setPublished(true)}>Publier les notes</Button></div></div>{published && <div className="toast"><span><Icon name="check" /></span><div><b>Notes publiées</b><p>Les étudiants ont été notifiés.</p></div><button onClick={() => setPublished(false)}>×</button></div>}<section className="card table-card"><div className="table-title"><div><h2>Liste des étudiants</h2><p>32 étudiants inscrits</p></div><Badge status="Brouillon" /></div><div className="table-wrap"><table><thead><tr><th>Matricule</th><th>Étudiant</th><th>Note / 20</th><th>Statut</th><th>Appréciation</th></tr></thead><tbody>{students.map((student) => <tr key={student[0]}><td><b className="code">{student[0]}</b></td><td><div className="student-cell"><Avatar name={student[1]} /><b>{student[1]}</b></div></td><td><input className="grade-input" type="number" defaultValue={student[2]} min="0" max="20" /></td><td><Badge status={Number(student[2]) >= 10 ? 'Admis' : 'Ajourné'} /></td><td>{Number(student[2]) >= 16 ? 'Très bien' : Number(student[2]) >= 14 ? 'Bien' : Number(student[2]) >= 12 ? 'Assez bien' : Number(student[2]) >= 10 ? 'Passable' : 'Insuffisant'}</td></tr>)}</tbody></table></div></section></div>
}

function StudentSpace() {
  return <div className="page-stack"><section className="student-hero"><div><span>PROCHAIN EXAMEN</span><h2>Génie Logiciel</h2><p><Icon name="calendar" size={18} /> Mardi 03 Juin 2025 · 08:30</p><p><Icon name="room" size={18} /> Amphi A · Durée 1h30</p></div><div className="countdown"><span>Dans</span><b>04</b><small>jours</small></div></section><div className="student-grid"><section className="card"><div className="section-head"><div><h2>Mes prochains examens</h2><p>Session principale</p></div><Button variant="secondary" icon="download">Convocation PDF</Button></div><div className="student-exams"><ExamListItem time="08:30" title="Génie Logiciel" meta="03 Juin 2025" room="Amphi A" color="blue" /><ExamListItem time="10:30" title="Bases de Données" meta="05 Juin 2025" room="Salle B12" color="teal" /><ExamListItem time="14:00" title="Réseaux Avancés" meta="09 Juin 2025" room="Salle C04" color="amber" /></div></section><section className="card result-card"><div className="section-head"><div><h2>Mes résultats</h2><p>Semestre 2 · Publiés</p></div><Button variant="secondary" icon="download">Relevé</Button></div><div className="average"><div><span>Moyenne générale</span><b>14.28<small>/20</small></b></div><Badge status="Admis" /></div><div className="result-list"><span><b>Architecture logicielle</b><strong>16.25</strong></span><span><b>Développement Web</b><strong>14.50</strong></span><span><b>Cloud Computing</b><strong>12.75</strong></span></div></section></div></div>
}

const notes = [
  { title: 'Nouvel examen planifié', text: 'L’examen de Génie Logiciel a été planifié le 03 Juin à 08:30.', time: 'Il y a 12 min', icon: 'calendar' as IconName, unread: true },
  { title: 'Conflit de planning détecté', text: 'La salle B12 est affectée à deux examens le 05 Juin à 10:30.', time: 'Il y a 34 min', icon: 'warning' as IconName, unread: true },
  { title: 'Notes publiées', text: 'Les notes de Bases de Données ont été publiées par M. Sami Gharbi.', time: 'Il y a 2 h', icon: 'grade' as IconName, unread: true },
  { title: 'Salle mise à jour', text: 'La capacité de l’Amphi A a été modifiée à 120 places.', time: 'Hier à 16:42', icon: 'room' as IconName, unread: false },
  { title: 'Affectation terminée', text: 'Tous les surveillants du 03 Juin ont été affectés.', time: 'Hier à 11:20', icon: 'people' as IconName, unread: false },
]
function Notifications() {
  const [readAll, setReadAll] = useState(false)
  return <section className="card notifications-card"><div className="section-head"><div className="filter-pills"><button className="active">Toutes <span>5</span></button><button>Non lues <span>{readAll ? 0 : 3}</span></button></div><button className="text-button" onClick={() => setReadAll(true)}><Icon name="check" size={17} /> Tout marquer comme lu</button></div><div className="notification-list">{notes.map((note) => <article className={`${note.unread && !readAll ? 'unread' : ''}`} key={note.title}><span className={`notification-icon ${note.icon}`}><Icon name={note.icon} /></span><div><b>{note.title}</b><p>{note.text}</p><small>{note.time}</small></div>{note.unread && !readAll && <i />}</article>)}</div></section>
}

const services = [
  { name: 'REST API', description: 'API principale ExamManager', latency: '42 ms', uptime: '99.98%', up: true, history: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'SOAP Service', description: 'Intégration système universitaire', latency: '118 ms', uptime: '99.72%', up: true, history: [1,1,1,1,0,1,1,1,1,1,1,1] },
  { name: 'Microservices', description: 'Planning, notes & notifications', latency: '—', uptime: '98.44%', up: false, history: [1,1,1,1,1,1,1,1,1,0,0,0] },
]
function Services() {
  return <div className="page-stack"><div className="system-banner"><span><Icon name="check" /></span><div><b>Systèmes opérationnels</b><p>2 services sur 3 fonctionnent normalement.</p></div><small>Dernière vérification : à l’instant</small></div><div className="services-grid">{services.map((service) => <article className="card service-card" key={service.name}><div className="service-head"><span className="service-icon"><Icon name="server" /></span><Badge status={service.up ? 'UP' : 'DOWN'} /></div><h3>{service.name}</h3><p>{service.description}</p><div className="service-metrics"><div><span>Latence</span><b className={service.up ? '' : 'down'}>{service.latency}</b></div><div><span>Disponibilité (30j)</span><b>{service.uptime}</b></div></div><div className="history"><span>Dernières 12 heures</span><div>{service.history.map((up, i) => <i key={i} className={up ? 'up' : 'down'} />)}</div></div></article>)}</div><section className="card incident-card"><div className="section-head"><div><h2>Incidents récents</h2><p>Historique des dernières 24 heures</p></div></div><div className="incident"><span className="incident-dot" /><div><b>Microservices — Dégradation en cours</b><p>Le service de notifications rencontre des délais de traitement.</p></div><small>Depuis 10:42</small></div><div className="incident resolved"><span className="incident-dot" /><div><b>SOAP Service — Incident résolu</b><p>Temps de réponse élevé pendant 6 minutes.</p></div><small>Hier, 18:12</small></div></section></div>
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState('Admin')
  const [view, setView] = useState<View>('dashboard')
  const screen = useMemo(() => {
    switch (view) {
      case 'dashboard': return <Dashboard navigate={setView} />
      case 'exams': return <Exams />
      case 'planning': return <Planning />
      case 'rooms': return <Rooms />
      case 'subjects': return <Subjects />
      case 'supervisors': return <Supervisors />
      case 'grades': return <Grades />
      case 'student': return <StudentSpace />
      case 'notifications': return <Notifications />
      case 'services': return <Services />
    }
  }, [view])
  if (!loggedIn) return <Login onLogin={(selectedRole) => { setRole(selectedRole); setView(selectedRole === 'Étudiant' ? 'student' : selectedRole === 'Enseignant' ? 'grades' : 'dashboard'); setLoggedIn(true) }} />
  return <AppShell view={view} setView={setView} role={role} logout={() => setLoggedIn(false)}>{screen}</AppShell>
}
