import { useEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  Activity, AlertCircle, ArrowRight, BarChart3, Bell, BookOpen, Bookmark,
  Bot, Building2, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  ClipboardCheck, Clock3, Database, Download, Edit3, ExternalLink, FileBarChart,
  FileCheck2, FileSearch, FileText, Filter, Gauge, GitBranch, History, Home,
  Landmark, LayoutDashboard, Library, ListChecks, LockKeyhole, Menu, MessageSquare,
  Network, Plus, RefreshCw, RotateCcw, Search,
  Settings, ShieldCheck, SlidersHorizontal, Sparkles, Tags, Upload, UserCog,
  Users, X, Zap,
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  adminTasks, documents, institutions, metrics, penalties, penaltyTrend,
  qualityIssues, reports, searchGroups, terms, updates,
} from './data'

const userNav = [
  { label: '工作台', icon: Home, to: '/' },
  { label: '统一搜索', icon: Search, to: '/search' },
  { group: '制度知识' },
  { label: '监管制度文档库', icon: Library, to: '/knowledge/docs' },
  { label: '监管术语与标准', icon: Tags, to: '/knowledge/terms' },
  { label: '业务合规约束库', icon: ShieldCheck, to: '/knowledge/constraints' },
  { label: '能力评估框架', icon: Gauge, to: '/knowledge/frameworks' },
  { group: '监管数据' },
  { label: '监管报表库', icon: FileBarChart, to: '/regulatory/reports' },
  { label: '监管指标库', icon: Activity, to: '/regulatory/metrics' },
  { label: '监管数据质量', icon: ClipboardCheck, to: '/regulatory/quality' },
  { group: '研究分析' },
  { label: '监管处罚分析', icon: AlertCircle, to: '/analysis/penalties' },
  { label: '年报与披露资料', icon: FileText, to: '/analysis/annual-reports' },
  { label: '金融机构名单', icon: Building2, to: '/analysis/institutions' },
  { label: '专题研究', icon: BookOpen, to: '/analysis/topics' },
  { group: '智能工具' },
  { label: 'AI 工作台', icon: Sparkles, to: '/ai' },
  { label: '收藏与历史', icon: Bookmark, to: '/favorites' },
]

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const emptyDashboardStats = { database: 'unknown', knowledge_objects: 0, documents: 0, reports: 0, metrics: 0, terms: 0, penalties: 0, new_documents_7d: 0, new_documents_30d: 0, pending_publish: 0, parsing_tasks: 0, users: 0 }
const formatCount = value => Number(value || 0).toLocaleString('zh-CN')

function useDashboardStats() {
  const [stats, setStats] = useState(emptyDashboardStats)
  useEffect(() => {
    let active = true
    fetch(`${API_BASE}/dashboard/stats`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('stats failed')))
      .then(value => active && setStats({ ...emptyDashboardStats, ...value }))
      .catch(() => active && setStats(emptyDashboardStats))
    return () => { active = false }
  }, [])
  return stats
}

function InitializationNotice({ type }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  useEffect(() => {
    let active = true
    fetch(`${API_BASE}/initialization/status`)
      .then(response => response.ok ? response.json() : null)
      .then(value => active && setStatus(value))
      .catch(() => active && setStatus(null))
    return () => { active = false }
  }, [])
  if (!status?.[type]?.requires_initialization) return null
  const isDocuments = type === 'documents'
  return <div className="notice initialization-notice"><AlertCircle size={17}/><span><b>{isDocuments ? '制度文档库需要初始化数据' : '监管报表库需要初始化数据'}</b><small>{isDocuments ? '请由管理员上传 PDF、Word 等制度文件，系统解析后再发布。' : '请由管理员上传 Excel 表样、Word/PDF 填报说明，系统解析后再配置。'}</small></span><button className="button ghost" onClick={() => navigate(isDocuments ? '/admin/documents' : '/admin/reports')}>进入管理后台</button></div>
}

const adminNav = [
  { label: '管理概览', icon: LayoutDashboard, to: '/admin' },
  { group: '内容管理' },
  { label: '制度法规', icon: FileText, to: '/admin/documents' },
  { label: '术语与标准', icon: Tags, to: '/admin/terms' },
  { label: '监管处罚', icon: AlertCircle, to: '/admin/penalties' },
  { label: '年报披露', icon: FileText, to: '/admin/annual-reports' },
  { label: '专题研究', icon: BookOpen, to: '/admin/topics' },
  { label: '报表配置中心', icon: FileBarChart, to: '/admin/reports' },
  { label: '指标与释疑', icon: Activity, to: '/admin/metrics' },
  { label: '内容发布中心', icon: FileCheck2, to: '/admin/publish' },
  { label: '纠错处理', icon: ClipboardCheck, to: '/admin/corrections' },
  { label: '用户管理', icon: Users, to: '/admin/users' },
  { label: '系统配置', icon: Settings, to: '/admin/settings' },
]

const userPrimaryNav = [
  { label: '工作台', to: '/' },
  { label: '制度知识', to: '/knowledge/docs', match: '/knowledge/', children: userNav.slice(3, 7) },
  { label: '监管数据', to: '/regulatory/reports', match: '/regulatory/', children: [userNav[8], userNav[9], userNav[10]] },
  { label: '研究分析', to: '/analysis/penalties', match: '/analysis/', children: [userNav[12], userNav[13], userNav[14], userNav[15]] },
  { label: 'AI 工作台', to: '/ai' },
  { label: '收藏与历史', to: '/favorites' },
]

const adminPrimaryNav = [
  { label: '管理概览', to: '/admin' },
  { label: '内容管理', to: '/admin/documents', match: '/admin/', children: [adminNav[2], adminNav[3], adminNav[4], adminNav[5], adminNav[6]] },
  { label: '报表配置', to: '/admin/reports' },
  { label: '纠错处理', to: '/admin/corrections' },
  { label: '用户管理', to: '/admin/users' },
  { label: '系统配置', to: '/admin/settings' },
]

const topicColors = {
  green: 'var(--green)', blue: 'var(--blue)', amber: 'var(--amber)', red: 'var(--red)',
}

function Logo() {
  return <div className="brand">
    <span className="brand-mark"><Landmark size={20} strokeWidth={2.1} /></span>
    <span><b>银规智库</b><small>Bank Regulatory Intelligence</small></span>
  </div>
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function ExternalSourceLink({ href, children, className = '' }) {
  if (!href) return null
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>
}

function TemplateDownloadButton({ type }) {
  return <a className="button ghost template-download" href={`${API_BASE}/admin/content/template?content_type=${type}`} download>
    <Download size={15} />下载模板
  </a>
}

function AdminImportDrawer({ type, title, open, onClose }) {
  const [file, setFile] = useState(null)
  const [state, setState] = useState('idle')
  const input = useRef(null)
  const close = () => { setFile(null); setState('idle'); onClose() }
  const submit = async () => {
    if (!file) return
    setState('parsing')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('content_type', type)
      const response = await fetch(`${API_BASE}/admin/content/import`, { method: 'POST', body })
      if (!response.ok) throw new Error('import failed')
      setState('done')
    } catch { setState('error') }
  }
  return <Drawer open={open} onClose={close} title={`批量导入${title}`} subtitle="优先使用本模块的 Excel 模板，也支持 Word、PDF 自动识别" footer={state === 'done' ? <button className="button primary" onClick={close}>完成</button> : <><button className="button ghost" onClick={close}>取消</button><button className="button primary" disabled={!file || state === 'parsing'} onClick={submit}><Upload size={15}/>{state === 'parsing' ? '解析导入中…' : '开始解析导入'}</button></>}>
    {state === 'done' ? <div className="correction-success"><Check size={28}/><b>文件已接收并完成解析任务创建</b><span>解析结果会进入草稿区，管理员确认后再发布。</span></div> : <div className="import-drawer-content"><input ref={input} className="hidden-file-input" type="file" accept=".xlsx,.xls,.doc,.docx,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} /><button className="import-dropzone" onClick={() => input.current?.click()}><Upload size={30}/><b>{file ? file.name : '选择或拖入文件'}</b><span>支持 Excel、Word、PDF，单个文件不超过 100 MB</span><small>{file ? `${Math.ceil(file.size / 1024)} KB · 已准备解析` : 'Excel 用于结构化数据，Word/PDF 用于识别文本和表格'}</small></button><div className="import-steps"><span className="active"><Upload size={13}/>接收文件</span><span><FileSearch size={13}/>识别格式</span><span><Database size={13}/>提取元素</span><span><Check size={13}/>生成草稿</span></div>{state === 'error' && <p className="form-error">文件导入失败，请检查后端服务或文件格式后重试。</p>}</div>}
  </Drawer>
}

function RichTextField({ label, value, onChange, placeholder }) {
  const command = (name, argument = null) => {
    document.execCommand(name, false, argument)
  }
  return <label className="full rich-text-field"><span>{label}</span><div className="rich-text-toolbar"><button type="button" onMouseDown={e=>{e.preventDefault();command('bold')}}><b>B</b></button><button type="button" onMouseDown={e=>{e.preventDefault();command('italic')}}><i>I</i></button><button type="button" onMouseDown={e=>{e.preventDefault();command('insertUnorderedList')}}>列表</button><span>支持加粗、斜体、列表和段落</span></div><div className="rich-text-editor" contentEditable suppressContentEditableWarning onInput={e=>onChange(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{__html:value || `<p class="editor-placeholder">${placeholder}</p>`}} /></label>
}

function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = location.pathname.startsWith('/admin')
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileNav = isAdmin ? adminNav : userNav
  const primaryNav = isAdmin ? adminPrimaryNav : userPrimaryNav

  const switchMode = () => navigate(isAdmin ? '/' : '/admin')
  const isPrimaryActive = (item) => item.to === '/'
    ? location.pathname === '/'
    : item.to === '/admin'
      ? location.pathname === '/admin'
      : item.match
        ? item.children?.some(child => location.pathname === child.to)
        : location.pathname === item.to

  return <div className="app-shell">
    {mobileOpen && <button className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="关闭菜单" />}
    <aside className={`mobile-drawer ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="mobile-drawer-head">
        <Logo />
        <button className="icon-button close-mobile" onClick={() => setMobileOpen(false)} aria-label="关闭菜单"><X size={18} /></button>
      </div>
      <nav className="mobile-nav-list">
        {mobileNav.map((item, index) => item.group
          ? <div className="mobile-nav-group" key={`${item.group}-${index}`}>{item.group}</div>
          : <NavLink key={item.to} to={item.to} end={item.to === '/' || item.to === '/admin'} onClick={() => setMobileOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={18} /><span>{item.label}</span>
            </NavLink>)}
      </nav>
      <div className="mobile-drawer-foot">
        <button className="mode-switch" onClick={() => { switchMode(); setMobileOpen(false) }}>
          {isAdmin ? <Home size={17} /> : <UserCog size={17} />}
          <span>{isAdmin ? '返回用户端' : '进入管理后台'}</span>
        </button>
      </div>
    </aside>
    <header className="topbar">
      <div className="topbar-inner">
        <button className="icon-button menu-mobile" onClick={() => setMobileOpen(true)} aria-label="打开菜单"><Menu size={20} /></button>
        <button className="brand-button" onClick={() => navigate(isAdmin ? '/admin' : '/')} aria-label="返回首页"><Logo /></button>
        <nav className="primary-nav" aria-label="一级菜单">
          {primaryNav.map(item => <div className={`primary-nav-entry ${isPrimaryActive(item) ? 'active' : ''}`} key={item.label}>
            <NavLink to={item.to} end={item.to === '/' || item.to === '/admin'}>{item.label}{item.children && <ChevronDown size={14} />}</NavLink>
            {item.children && <div className="nav-dropdown">
              {item.children.map(child => <NavLink key={child.to} to={child.to} className={({ isActive }) => isActive ? 'active' : ''}><child.icon size={17}/><span><b>{child.label}</b><small>{child.to.includes('docs') ? '制度原文、版本与条款' : child.to.includes('reports') ? '报表、字段与校验规则' : child.to.includes('penalties') ? '处罚案例与多维分析' : '进入对应业务模块'}</small></span><ChevronRight size={14}/></NavLink>)}
            </div>}
          </div>)}
        </nav>
        <div className="topbar-actions">
          {!isAdmin && <button className="global-search" onClick={() => navigate('/search')}><Search size={16} /><span>搜索制度、报表、指标</span><kbd>Ctrl K</kbd></button>}
          <button className={`workspace-switch ${isAdmin ? 'admin' : ''}`} onClick={switchMode}>{isAdmin ? <Home size={16}/> : <UserCog size={16}/>}<span>{isAdmin ? '用户端' : '管理后台'}</span></button>
          <button className="icon-button" title="消息"><Bell size={18} /><i className="notification-dot" /></button>
          <div className="user-menu"><span className="avatar">管</span><span className="user-copy"><b>平台管理员</b><small>{isAdmin ? '管理员' : '普通用户视图'}</small></span><ChevronDown size={15} /></div>
        </div>
      </div>
    </header>
    <main className="page-content">{children}</main>
  </div>
}

function PageHeader({ title, description, eyebrow, actions }) {
  return <div className="page-header">
    <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {actions && <div className="page-actions">{actions}</div>}
  </div>
}

function Stat({ label, value, meta, icon: Icon, tone = 'green' }) {
  return <div className="stat-card">
    <span className={`stat-icon tone-${tone}`}><Icon size={19} /></span>
    <div><p>{label}</p><strong>{value}</strong><small>{meta}</small></div>
  </div>
}

function FilterBar({ placeholder = '输入关键词搜索', onSearch, children, moreFilters }) {
  const [value, setValue] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)
  return <div className={`filter-bar ${moreOpen ? 'is-more-open' : ''}`}>
    <label className="search-input"><Search size={17} /><input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch?.(value)} placeholder={placeholder} /><button onClick={() => onSearch?.(value)}>搜索</button></label>
    <div className="filter-actions">{children}<button className="button ghost" onClick={() => setMoreOpen(x => !x)}><Filter size={16} />更多筛选<ChevronDown size={14} className={moreOpen ? 'rotate-180' : ''}/></button></div>
    {moreOpen && <div className="more-filter-panel"><div className="more-filter-head"><b>更多筛选条件</b><span>可组合筛选，支持模糊搜索</span></div><div className="more-filter-fields">{moreFilters || <span className="more-filter-empty">暂无更多筛选条件</span>}</div></div>}
  </div>
}

function Select({ children, label, showLabel = false, value, onChange }) {
  return <label className={`select-control ${showLabel ? 'has-label' : ''}`}><span>{label}</span><select value={value} defaultValue={value ? undefined : '全部'} onChange={onChange}><option>全部</option>{children}</select><ChevronDown size={14} /></label>
}

function DateRange({ label = '时间范围' }) {
  return <label className="date-range"><span>{label}</span><input type="date" aria-label={`${label}开始日期`} /><i>至</i><input type="date" aria-label={`${label}结束日期`} /></label>
}

function Drawer({ title, subtitle, open, onClose, children, footer }) {
  if (!open) return null
  return createPortal(<>
    <button className="drawer-overlay" onClick={onClose} aria-label="关闭详情" />
    <aside className="drawer">
      <div className="drawer-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose}><X size={19} /></button></div>
      <div className="drawer-body">{children}</div>
      {footer && <div className="drawer-footer">{footer}</div>}
    </aside>
  </>, document.body)
}

function DrawerFormFooter({ onClose, onDraft, onSubmit, draftLabel = '保存草稿', submitLabel = '提交', disabled = false }) {
  return <><button className="button ghost" onClick={onClose}>取消</button><button className="button secondary" onClick={onDraft} disabled={disabled}>{draftLabel}</button><button className="button primary" onClick={onSubmit} disabled={disabled}>{submitLabel}</button></>
}

function CorrectionButton({ resourceType, resourceId, resourceTitle }) {
  const [open, setOpen] = useState(false)
  return <><button className="text-button correction-trigger" onClick={() => setOpen(true)}><ClipboardCheck size={14}/>文件纠错</button><CorrectionDrawer open={open} onClose={() => setOpen(false)} resourceType={resourceType} resourceId={resourceId} resourceTitle={resourceTitle}/></>
}

function CorrectionDrawer({ open, onClose, resourceType, resourceId, resourceTitle }) {
  const [correctionType, setCorrectionType] = useState('内容错误')
  const [description, setDescription] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [suggestedValue, setSuggestedValue] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [reporterContact, setReporterContact] = useState('')
  const [state, setState] = useState('idle')
  const submit = async () => {
    if (!description.trim()) return
    setState('submitting')
    try {
      const response = await fetch(`${API_BASE}/corrections`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({resource_type: resourceType, resource_id: resourceId, resource_title: resourceTitle, correction_type: correctionType, description, current_value: currentValue || null, suggested_value: suggestedValue || null, source_url: sourceUrl || null, reporter_name: reporterName || null, reporter_contact: reporterContact || null}) })
      if (!response.ok) throw new Error('submit failed')
      setState('submitted')
    } catch {
      setState('error')
    }
  }
  return <Drawer open={open} onClose={onClose} title="提交文件纠错" subtitle={`${resourceType === 'document' ? '法规制度' : resourceType === 'report' ? '监管报表' : '监管处罚'} · ${resourceTitle}`} footer={state === 'submitted' ? <button className="button primary" onClick={onClose}>完成</button> : <><button className="button ghost" onClick={onClose}>取消</button><button className="button primary" disabled={state === 'submitting' || !description.trim()} onClick={submit}><ClipboardCheck size={15}/>{state === 'submitting' ? '提交中…' : '提交纠错'}</button></>}>
    {state === 'submitted' ? <div className="correction-success"><ClipboardCheck size={28}/><b>纠错信息已提交</b><span>管理员会根据你提供的依据进行核对和修正。</span></div> : <div className="correction-form"><label><span>纠错类型</span><select value={correctionType} onChange={e=>setCorrectionType(e.target.value)}><option>内容错误</option><option>发布日期错误</option><option>生效/失效状态错误</option><option>监管机构错误</option><option>报表字段或规则错误</option><option>来源链接错误</option><option>其他</option></select></label><label><span>问题描述 *</span><textarea rows="4" value={description} onChange={e=>setDescription(e.target.value)} placeholder="请说明哪一处内容有误，以及错误表现。" /></label><label><span>当前内容</span><textarea rows="2" value={currentValue} onChange={e=>setCurrentValue(e.target.value)} placeholder="可粘贴页面当前显示的内容" /></label><label><span>建议修改为</span><textarea rows="2" value={suggestedValue} onChange={e=>setSuggestedValue(e.target.value)} placeholder="如有明确修改建议，请填写" /></label><label><span>依据链接</span><input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://..." /></label><div className="correction-contact"><label><span>姓名（选填）</span><input value={reporterName} onChange={e=>setReporterName(e.target.value)} /></label><label><span>联系方式（选填）</span><input value={reporterContact} onChange={e=>setReporterContact(e.target.value)} /></label></div>{state === 'error' && <p className="form-error">提交失败，请确认后端服务已启动后重试。</p>}</div>}
  </Drawer>
}

function EmptyNote({ icon: Icon = CircleHelp, title, text }) {
  return <div className="empty-note"><Icon size={25} /><b>{title}</b><span>{text}</span></div>
}

const latestTopics = [
  { title: '五篇大文章', cat: '重点专题', desc: '围绕科技金融、绿色金融、普惠金融、养老金融和数字金融，梳理监管要求与落地实践。', docs: 32, metrics: 18, color: 'green' },
  { title: 'AI 治理', cat: '数字金融', desc: '聚焦人工智能在银行业的应用边界、模型风险、数据安全和责任治理。', docs: 24, metrics: 14, color: 'blue' },
  { title: '资本新规', cat: '资本监管', desc: '跟踪资本计量、风险加权资产、信息披露及报表填报的最新变化。', docs: 28, metrics: 16, color: 'red' },
]

function HomePage() {
  const navigate = useNavigate()
  const stats = useDashboardStats()
  const [query, setQuery] = useState('')
  const goSearch = () => navigate(`/search?q=${encodeURIComponent(query)}`)
  const trend = [
    { day: '10/08', value: 162 }, { day: '10/09', value: 204 }, { day: '10/10', value: 188 },
    { day: '10/11', value: 238 }, { day: '10/12', value: 226 }, { day: '10/13', value: 274 }, { day: '10/14', value: 312 },
  ]
  return <>
    <section className="welcome-band">
      <div className="welcome-copy"><span className="eyebrow light">BANKING REGULATORY INTELLIGENCE</span><h1>让监管知识，成为判断的依据</h1><p>从制度原文到报表字段，从指标口径到处罚案例，一站检索、关联与溯源。</p>
        <label className="hero-search"><Search size={20} /><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && goSearch()} placeholder="搜索制度、文号、报表字段、监管指标…" /><button onClick={goSearch}>开始检索 <ArrowRight size={16} /></button></label>
        <div className="search-suggestions"><span>热门：</span><button onClick={() => navigate('/regulatory/metrics')}>资本充足率</button><button onClick={() => navigate('/knowledge/docs')}>数据治理</button><button onClick={() => navigate('/analysis/penalties')}>监管处罚</button></div>
      </div>
      <div className="welcome-visual" aria-label="知识资产概览">
        <div className="visual-grid" />
        <div className="visual-kpi"><small>已关联知识对象</small><b>{formatCount(stats.knowledge_objects)}</b><span><Zap size={14} /> 近 7 日新增 {formatCount(stats.new_documents_7d)}</span></div>
        <div className="visual-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="workArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55d6a0" stopOpacity={0.42}/><stop offset="100%" stopColor="#55d6a0" stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="value" stroke="#55d6a0" fill="url(#workArea)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer></div>
      </div>
    </section>

    <section className="stats-grid">
      <Stat label="监管制度" value={formatCount(stats.documents)} meta={`近 30 日新增 ${formatCount(stats.new_documents_30d)}`} icon={Library} tone="green" />
      <Stat label="监管报表" value={formatCount(stats.reports)} meta="数据库实际数量" icon={FileBarChart} tone="blue" />
      <Stat label="监管指标" value={formatCount(stats.metrics)} meta="数据库实际数量" icon={Activity} tone="amber" />
      <Stat label="处罚案例" value={formatCount(stats.penalties)} meta="数据库实际数量" icon={AlertCircle} tone="red" />
    </section>

    <div className="home-work-grid"><section className="section-block">
      <div className="section-heading"><div><span className="eyebrow">WORK DOMAINS</span><h2>核心工作场景</h2></div><button className="text-button" onClick={() => navigate('/search')}>查看全部知识 <ArrowRight size={15} /></button></div>
      <div className="domain-grid">
        <button className="domain-card" onClick={() => navigate('/knowledge/docs')}><span className="domain-index">01</span><Library size={24}/><h3>制度知识</h3><p>制度原文、条款、术语与业务约束统一管理。</p><span>进入文档库 <ArrowRight size={14}/></span></button>
        <button className="domain-card" onClick={() => navigate('/regulatory/reports')}><span className="domain-index">02</span><FileBarChart size={24}/><h3>监管数据</h3><p>报表、字段、指标与校验规则逐级关联。</p><span>进入报表库 <ArrowRight size={14}/></span></button>
        <button className="domain-card" onClick={() => navigate('/analysis/penalties')}><span className="domain-index">03</span><BarChart3 size={24}/><h3>研究分析</h3><p>处罚、机构、年报与监管主题多维分析。</p><span>进入分析中心 <ArrowRight size={14}/></span></button>
        <button className="domain-card ai-domain" onClick={() => navigate('/ai')}><span className="domain-index">AI</span><Sparkles size={24}/><h3>AI 工作台</h3><p>基于站内权威知识，完成问答、比较与释疑。</p><span>开始对话 <ArrowRight size={14}/></span></button>
      </div>
    </section>
    <section className="section-block home-topics-panel">
      <div className="section-heading"><div><span className="eyebrow">LATEST TOPICS</span><h2>最新专题研究</h2></div><button className="text-button" onClick={() => navigate('/analysis/topics')}>查看全部 <ArrowRight size={15} /></button></div>
      <div className="home-topic-list">{latestTopics.map(topic=><button key={topic.title} onClick={() => navigate('/analysis/topics')}><span className={`home-topic-icon topic-${topic.color}`}><Network size={17}/></span><span><b>{topic.title}</b><small>{topic.cat} · {topic.docs} 份制度 · {topic.metrics} 个指标</small></span><ArrowRight size={15}/></button>)}</div>
    </section></div>

    <section className="dashboard-columns">
      <div className="panel">
        <div className="panel-head"><div><span className="eyebrow">LATEST UPDATES</span><h2>最近更新</h2></div><button className="icon-button"><RefreshCw size={16}/></button></div>
        <div className="update-list">{updates.map((item, i) => <button key={i} className="update-row"><span className="update-type" style={{ borderColor: topicColors[item.tone], color: topicColors[item.tone] }}>{item.type}</span><span><b>{item.title}</b><small>{item.time}</small></span><ChevronRight size={16}/></button>)}</div>
      </div>
      <div className="panel attention-panel">
        <div className="panel-head"><div><span className="eyebrow">REGULATORY SIGNAL</span><h2>监管关注</h2></div><Badge tone="green">近30天</Badge></div>
        <div className="signal-list"><div><span>数据质量与真实性</span><b>86</b><i style={{width:'86%'}}/></div><div><span>授信与贷款管理</span><b>73</b><i style={{width:'73%'}}/></div><div><span>反洗钱义务履行</span><b>61</b><i style={{width:'61%'}}/></div><div><span>关联交易与集中度</span><b>44</b><i style={{width:'44%'}}/></div></div>
        <button className="button secondary" onClick={() => navigate('/analysis/penalties')}>查看处罚趋势 <ArrowRight size={15}/></button>
      </div>
    </section>
  </>
}

function SearchPage() {
  const params = new URLSearchParams(useLocation().search)
  const [query, setQuery] = useState(params.get('q') || '资本充足率')
  const [activeType, setActiveType] = useState('全部')
  const resultDocs = documents.filter(d => !query || `${d.title}${d.summary}${d.tags.join('')}`.includes(query) || query === '资本充足率')
  return <>
    <PageHeader eyebrow="UNIFIED SEARCH" title="统一搜索" description="在制度、条款、报表、字段、指标和处罚案例中同时检索。" />
    <section className="search-stage"><label><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="输入制度名称、文号、指标或自然语言问题"/><button>搜索</button></label><div className="scope-tabs">{['全部', ...searchGroups.map(x=>x.type)].map(t=><button key={t} className={activeType===t?'active':''} onClick={()=>setActiveType(t)}>{t}{t!=='全部' && <small>{searchGroups.find(x=>x.type===t)?.count.toLocaleString()}</small>}</button>)}</div></section>
    <div className="search-layout">
      <aside className="search-filters"><h3><SlidersHorizontal size={16}/>筛选条件</h3><div className="filter-section"><b>效力状态</b>{['现行有效','即将生效','历史版本','已废止'].map((x,i)=><label key={x}><input type="checkbox" defaultChecked={i===0}/><span>{x}</span><small>{[2481,18,624,161][i]}</small></label>)}</div><div className="filter-section"><b>发布机构</b>{['金融监管总局','中国人民银行','国务院','其他机构'].map((x,i)=><label key={x}><input type="checkbox"/><span>{x}</span><small>{[928,674,102,1580][i]}</small></label>)}</div><div className="filter-section"><b>发布时间</b><select><option>不限</option><option>近一年</option><option>近三年</option></select></div></aside>
      <section className="search-results"><div className="result-summary"><span>找到约 <b>1,286</b> 条相关结果，用时 0.18 秒</span><select><option>综合排序</option><option>最新发布</option><option>相关度</option></select></div>
        {[...resultDocs, ...documents].slice(0,5).map((doc,i)=><article className="result-item" key={`${doc.id}-${i}`}><div className="result-meta"><Badge tone={i===2?'amber':'green'}>{i===2?'监管指标':'制度文档'}</Badge><span>{doc.agency}</span><span>{doc.date}</span></div><h3>{doc.title}</h3><p>{doc.summary} 其中<span className="highlight">{query}</span>相关要求应结合适用机构、计量范围和有效版本综合判断。</p><div className="result-footer"><span><FileText size={14}/>{doc.code}</span><button>查看详情 <ArrowRight size={14}/></button></div></article>)}
      </section>
    </div>
  </>
}

function DocumentsPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('全部制度')
  const docCategories = [
    ['全部制度', 3284, '平台已收录的全部制度文档'],
    ['金监总局制度', 928, '国家金融监督管理总局及派出机构'],
    ['人民银行制度', 674, '中国人民银行及其分支机构'],
    ['外管局制度', 186, '国家外汇管理局及其分支机构'],
    ['政府制度', 102, '国务院及部委相关制度文件'],
    ['国家标准', 126, '国家标准化管理机构发布的标准'],
    ['金融标准', 84, '金融行业及银行业标准文件'],
    ['其他', 1580, '协会、交易所及其他来源文件'],
  ]
  const visibleDocs = activeCategory === '全部制度'
    ? documents
    : documents.filter(doc => doc.sourceCategory === activeCategory || (activeCategory === '其他' && !doc.sourceCategory))
  return <>
    <PageHeader eyebrow="REGULATORY DOCUMENTS" title="监管制度文档库" description="查找制度原文、沿革版本、条款释义及其关联报表和指标。" actions={<><button className="button ghost"><Download size={16}/>导出清单</button><button className="button primary"><Bell size={16}/>订阅更新</button></>} />
    <InitializationNotice type="documents" />
    <FilterBar placeholder="搜索制度名称、文号或条款内容" moreFilters={<><DateRange label="发文时间" /><Select label="地区" showLabel><option>北京</option><option>上海</option><option>广东</option><option>江苏</option><option>浙江</option><option>其他地区</option></Select><Select label="制度类型" showLabel><option>部门规章</option><option>规范性文件</option><option>政府文件</option><option>国家标准</option><option>金融标准</option></Select></>}><Select label="发文机构" showLabel><option>金监总局</option><option>人民银行</option><option>外管局</option><option>政府部门</option></Select><Select label="有效性" showLabel><option>现行有效</option><option>即将生效</option><option>历史版本</option></Select></FilterBar>
    <div className="documents-layout"><aside className="documents-sidebar"><div className="documents-sidebar-head"><b>制度分类</b><small>8 个分类</small></div><nav>{docCategories.map(([name,count,desc])=><button key={name} className={activeCategory===name?'active':''} onClick={()=>setActiveCategory(name)}><span><b>{name}</b><small>{desc}</small></span><strong>{count.toLocaleString()}</strong><ChevronRight size={14}/></button>)}</nav></aside>
      <section className="documents-content"><div className="content-toolbar"><span>{activeCategory} · 共 <b>{activeCategory==='全部制度'?'3,284':(visibleDocs.length || docCategories.find(x=>x[0]===activeCategory)?.[1] || 0).toLocaleString()}</b> 份制度文档</span><div className="view-toggle"><button className="active">列表</button><button>按主题</button><button>按发布机构</button></div></div><div className="document-list">{visibleDocs.map(doc=><article className="document-row" key={doc.id} role="link" tabIndex="0" onClick={()=>navigate(`/knowledge/docs/${doc.id}`)} onKeyDown={e=>e.key==='Enter'&&navigate(`/knowledge/docs/${doc.id}`)}><div className="document-icon"><FileText size={22}/></div><div className="document-main"><div><Badge tone={doc.status==='现行有效'?'green':'neutral'}>{doc.status}</Badge><span className="doc-type">{doc.type}</span></div><h3>{doc.title}</h3><p>{doc.summary}</p><div className="tag-list">{doc.tags.map(t=><span key={t}>{t}</span>)}</div></div><div className="document-side"><span>{doc.agency}</span><b>{doc.code}</b><small>发布：{doc.date}</small><button className="icon-button" aria-label={`查看${doc.title}`}><ChevronRight size={18}/></button></div></article>)}</div></section>
    </div>
  </>
}

const capitalDocumentChapters = [
  {
    id: 'chapter-1', title: '第一章 总则', paragraphs: [
      ['第一条', '为加强商业银行资本监管，维护银行体系稳健运行，保护存款人利益，根据《中华人民共和国银行业监督管理法》《中华人民共和国商业银行法》等法律法规，制定本办法。'],
      ['第二条', '本办法适用于在中华人民共和国境内依法设立的商业银行。政策性银行、农村合作银行等其他银行业金融机构参照执行。'],
      ['第三条', '商业银行资本应抵御其所面临的风险，包括信用风险、市场风险、操作风险以及其他风险。'],
      ['第四条', '商业银行应当建立全面风险管理架构和内部资本充足评估程序，确保资本水平与风险状况和业务发展相适应。'],
    ],
  },
  {
    id: 'chapter-2', title: '第二章 资本监管指标', paragraphs: [
      ['第五条', '商业银行资本充足率监管要求包括最低资本要求、储备资本和逆周期资本要求、系统重要性银行附加资本要求以及第二支柱资本要求。'],
      ['第六条', '商业银行核心一级资本充足率、一级资本充足率和资本充足率应当分别不低于监管规定的最低要求。'],
      ['第七条', '商业银行应当在最低资本要求基础上计提储备资本，并根据宏观经济金融形势和系统性风险状况执行逆周期资本要求。'],
      ['第八条', '系统重要性银行应当按照监管规定计提附加资本，并建立资本内在约束机制。'],
    ],
  },
  {
    id: 'chapter-3', title: '第三章 资本定义', paragraphs: [
      ['第九条', '商业银行总资本包括核心一级资本、其他一级资本和二级资本。各级资本工具应当符合损失吸收能力和持续经营要求。'],
      ['第十条', '核心一级资本包括实收资本或普通股、资本公积、盈余公积、一般风险准备、未分配利润以及可计入部分的少数股东资本。'],
      ['第十一条', '商业银行计算资本净额时，应当按照监管规定扣除商誉、其他无形资产、递延所得税资产以及对金融机构的资本投资等项目。'],
    ],
  },
  {
    id: 'chapter-4', title: '第四章 风险加权资产计量', paragraphs: [
      ['第十二条', '商业银行应当按照监管规定计量信用风险、市场风险和操作风险加权资产，并确保计量数据真实、完整和可追溯。'],
      ['第十三条', '信用风险加权资产可采用权重法或经监管认可的内部评级法计量。商业银行采用高级计量方法应满足相应资格标准。'],
      ['第十四条', '商业银行应当建立风险暴露分类、缓释工具认定、违约定义和参数估计等管理制度，并定期验证计量结果。'],
    ],
  },
  {
    id: 'chapter-5', title: '第五章 监督检查', paragraphs: [
      ['第十五条', '监管部门对商业银行资本充足状况实施持续监测和现场检查，评估资本管理、风险管理和内部控制的有效性。'],
      ['第十六条', '监管部门可以根据单家银行风险状况提出更审慎的资本要求，并要求其制定资本补充和风险化解计划。'],
      ['第十七条', '对资本充足率未达到监管要求的商业银行，监管部门有权依法采取限制分红、限制资产增长、调整高级管理人员等监管措施。'],
    ],
  },
  {
    id: 'chapter-6', title: '第六章 信息披露', paragraphs: [
      ['第十八条', '商业银行应当按照监管规定披露资本构成、风险加权资产、资本充足率、杠杆率和风险管理等信息。'],
      ['第十九条', '信息披露应当真实、准确、完整、及时，并保持披露口径和频率的一致性。重大事项应当及时披露。'],
      ['第二十条', '商业银行董事会对资本充足信息披露的真实性、准确性和完整性承担最终责任。'],
    ],
  },
  {
    id: 'chapter-7', title: '第七章 附则', paragraphs: [
      ['第二十一条', '本办法所称资本计量、风险暴露分类及相关术语，按照监管附件和配套规则执行。'],
      ['第二十二条', '商业银行应当根据本办法完善内部制度、数据治理和信息系统，确保按期达到监管要求。'],
    ],
  },
]

function DocumentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const doc = documents.find(item => item.id === id) || documents[0]
  const [assistantOpen, setAssistantOpen] = useState(true)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const ask = () => {
    if (!question.trim()) return
    setAnswer('本条要求商业银行将资本约束嵌入经营决策，并确保资本水平能够持续覆盖信用、市场和操作风险。落地时应同步核对适用机构、计量方法和过渡期安排。')
  }
  return <div className="reading-page">
    <nav className="reading-breadcrumb" aria-label="面包屑"><button onClick={()=>navigate('/')}>首页</button><ChevronRight size={13}/><button onClick={()=>navigate('/knowledge/docs')}>全部制度</button><ChevronRight size={13}/><span>{doc.topic}</span></nav>
    <div className="reading-layout">
      <article className="reading-document">
        <header className="reading-title-block">
          <div className="reading-status"><Badge tone="green">{doc.status}</Badge><span>{doc.type}</span></div>
          <h1>{doc.title} <span>{doc.code}</span></h1>
          <div className="reading-meta"><span><Clock3 size={15}/>{doc.date}</span><span><Activity size={15}/>1,286 次浏览</span><span><BookOpen size={15}/>预计阅读 28 分钟</span><button onClick={()=>navigate('/analysis/graph')}><Network size={15}/>查看知识关联</button><ExternalSourceLink href={doc.sourceUrl} className="source-page-link"><ExternalLink size={14}/>查看源页面</ExternalSourceLink><CorrectionButton resourceType="document" resourceId={doc.id} resourceTitle={doc.title}/></div>
        </header>
        <section className="document-prologue">
          <dl><div><dt>办文部门：</dt><dd>国家金融监督管理总局法规司、审慎规制司</dd></div><div><dt>发文日期：</dt><dd>{doc.date}</dd></div><div><dt>公文名称：</dt><dd>国家金融监督管理总局关于发布《{doc.title}》的令</dd></div><div><dt>文号：</dt><dd>{doc.code}</dd></div></dl>
          <h2>国家金融监督管理总局关于发布《{doc.title}》的令</h2>
          <p>为加强商业银行资本监管，提升银行业风险抵御能力，推动商业银行强化资本约束和精细化风险管理，现发布《{doc.title}》，请认真贯彻执行。</p>
          <p className="document-signature">国家金融监督管理总局<br/>{doc.date}</p>
          <h2>{doc.title}</h2>
        </section>
        <div className="regulation-body">
          {capitalDocumentChapters.map(chapter=><section id={chapter.id} key={chapter.id}><h2>{chapter.title}</h2>{chapter.paragraphs.map(([label,text])=><p key={label}><strong>{label}</strong>　{text}</p>)}</section>)}
        </div>
        <section className="reading-comments"><h3>评论</h3><div><MessageSquare size={20}/><p>当前为产品原型，评论能力将在用户体系与后端阶段接入。</p></div></section>
        <section className="reading-related"><h3>相关推荐</h3>{documents.filter(item=>item.id!==doc.id).slice(0,3).map(item=><button key={item.id} onClick={()=>navigate(`/knowledge/docs/${item.id}`)}><span>{item.topic}</span><b>{item.title}</b><small>{item.code}</small><ChevronRight size={17}/></button>)}</section>
      </article>
      <aside className="reading-side">
        <section className={`reading-assistant ${assistantOpen?'open':''}`}>
          <header><div><BookOpen size={19}/><span><b>陪读助手</b><small>围绕当前制度解释、辨析和分析影响</small></span></div><button onClick={()=>setAssistantOpen(!assistantOpen)}>{assistantOpen?'收起陪读':'打开陪读'}</button></header>
          {assistantOpen && <div className="assistant-body">
            <p><b>{doc.title}</b> · 当前文档。可选中正文后提问，也可以围绕整篇制度分析。</p>
            <div className="assistant-prompts"><button onClick={()=>setQuestion('解释这份制度的关键含义')}>解释关键含义</button><button onClick={()=>setQuestion('辨析适用机构和适用条件')}>辨析适用条件</button><button onClick={()=>setQuestion('分析对银行经营管理的实际影响')}>分析实际影响</button></div>
            <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="这段规定为什么这样规定？对我们的工作有什么影响？"/>
            {answer && <div className="assistant-answer">{answer}</div>}
            <footer><button className="button primary" disabled={!question.trim()} onClick={ask}>继续分析</button><button className="button ghost" onClick={()=>navigate(`/search?q=${encodeURIComponent(doc.title)}`)}>去站内搜索</button></footer>
          </div>}
        </section>
        <section className="reading-toc"><h3>目录</h3><nav>{capitalDocumentChapters.map((chapter,index)=><a href={`#${chapter.id}`} key={chapter.id}><span>{String(index+1).padStart(2,'0')}</span>{chapter.title}</a>)}</nav></section>
        <section className="reading-links"><h3>相关知识</h3><button onClick={()=>navigate('/knowledge/terms')}>监管术语与标准 <ChevronRight size={15}/></button><button onClick={()=>navigate('/regulatory/metrics')}>关联监管指标 <ChevronRight size={15}/></button><button onClick={()=>navigate('/analysis/penalties')}>相关处罚案例 <ChevronRight size={15}/></button></section>
      </aside>
    </div>
  </div>
}

function TermsPage() {
  const navigate=useNavigate()
  const [letter,setLetter]=useState('全部')
  const [activeType,setActiveType]=useState('国家标准')
  const standardTypes = [
    {name:'国家标准', count:126, icon:BookOpen, text:'国家标准化管理机构发布的金融及数据标准'},
    {name:'行业标准', count:84, icon:Building2, text:'金融行业与银行业通用的数据和业务标准'},
    {name:'监管指标', count:426, icon:Activity, text:'监管制度、报表及监测体系中的指标口径'},
  ]
  const visibleTerms = terms.filter(item=>item.type===activeType)
  return <><PageHeader eyebrow="GLOSSARY" title="监管术语与标准" description="统一查询监管术语的中英文名称、缩写、定义及制度出处。" />
    <FilterBar placeholder="搜索术语、英文名称、缩写或别名"><Select label="主题"><option>资本监管</option><option>流动性风险</option></Select></FilterBar>
    <div className="standards-layout">
      <aside className="standards-sidebar" aria-label="标准分类">
        <div className="standards-sidebar-title"><span>标准类型</span><small>3 个分类</small></div>
        <nav>{standardTypes.map(item=><button key={item.name} className={activeType===item.name?'active':''} onClick={()=>setActiveType(item.name)}><span className="standard-type-icon"><item.icon size={18}/></span><span><b>{item.name}</b><small>{item.text}</small></span><strong>{item.count}</strong><ChevronRight size={15}/></button>)}</nav>
        <div className="standards-sidebar-note"><ShieldCheck size={17}/><span><b>标准口径提示</b><small>优先采用现行有效版本，历史版本仅供追溯。</small></span></div>
      </aside>
      <section className="standards-content">
        <div className="standards-content-head"><div><span className="eyebrow">STANDARD CATEGORY</span><h2>{activeType}</h2><p>{standardTypes.find(item=>item.name===activeType)?.text}</p></div><span>共 <b>{standardTypes.find(item=>item.name===activeType)?.count}</b> 项</span></div>
        <div className="alphabet-bar">{['全部','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(x=><button className={letter===x?'active':''} onClick={()=>setLetter(x)} key={x}>{x}</button>)}</div>
        <div className="terms-grid">{visibleTerms.map((item,i)=><article className="term-card" key={item.term} role="link" tabIndex="0" onClick={()=>navigate(`/knowledge/terms/${encodeURIComponent(item.term)}`)} onKeyDown={e=>e.key==='Enter'&&navigate(`/knowledge/terms/${encodeURIComponent(item.term)}`)}><div className="term-number">{String(i+1).padStart(2,'0')}</div><div className="term-badges"><Badge tone={activeType==='监管指标'?'amber':activeType==='行业标准'?'green':'blue'}>{item.type}</Badge><Badge>{item.category}</Badge></div><h3>{item.term}</h3><span className="term-en">{item.en}</span><p>{item.definition}</p><footer><span><BookOpen size={14}/>{item.source}</span><ArrowRight size={15}/></footer></article>)}</div>
      </section>
    </div>
  </>
}

function TermDetailPage(){
  const navigate=useNavigate()
  const {term}=useParams()
  const item=terms.find(x=>x.term===decodeURIComponent(term||''))||terms[0]
  const related=['商业银行资本管理办法','资本充足率','资本构成情况表','资本净额']
  return <><nav className="reading-breadcrumb" aria-label="面包屑"><button onClick={()=>navigate('/')}>首页</button><ChevronRight size={13}/><button onClick={()=>navigate('/knowledge/terms')}>监管术语与标准</button><ChevronRight size={13}/><span>{item.term}</span></nav><div className="term-detail-layout"><main className="term-detail-main"><div className="term-detail-hero"><div><Badge tone="blue">{item.type}</Badge><Badge>{item.category}</Badge><h1>{item.term}</h1><span className="term-en">{item.en}</span><p>{item.definition}</p></div><button className="button primary"><Bookmark size={15}/>收藏术语</button></div><section className="panel term-definition-panel"><div className="panel-head"><div><span className="eyebrow">STANDARD DEFINITION</span><h2>标准定义</h2></div><Badge tone="green">现行有效</Badge></div><p>{item.definition} 本页面展示该术语在银行业监管、监管报送和风险管理场景中的统一使用口径，具体适用时应以对应制度版本和监管机构要求为准。</p><div className="term-attributes"><div><small>英文名称</small><b>{item.en}</b></div><div><small>术语分类</small><b>{item.category}</b></div><div><small>来源类型</small><b>{item.type}</b></div><div><small>最后校核</small><b>2026-09-30</b></div></div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">USAGE NOTES</span><h2>监管使用说明</h2></div></div><div className="term-note-list"><div><span>01</span><div><b>口径说明</b><p>应结合适用机构类型、并表范围、统计时点和监管报送频度判断，不建议脱离上下文单独解释。</p></div></div><div><span>02</span><div><b>常见误用</b><p>同名指标可能存在不同计算口径，引用时应同时标注制度来源、版本和计量单位。</p></div></div><div><span>03</span><div><b>关联对象</b><p>该术语与制度条款、报表字段和监管指标存在可追溯关联，可继续下钻查看原文依据。</p></div></div></div></section></main><aside className="term-detail-side"><section className="panel"><h3>来源依据</h3><button className="source-link" onClick={()=>navigate('/knowledge/docs/DOC-001')}><FileText size={16}/><span><b>{item.source}</b><small>查看制度原文及条款</small></span><ExternalLink size={15}/></button></section><section className="panel"><h3>关联知识</h3><div className="related-term-list">{related.map(x=><button key={x} onClick={()=>x.includes('报表')?navigate('/regulatory/reports'):navigate('/knowledge/terms')}><span>{x}</span><ChevronRight size={14}/></button>)}</div></section></aside></div></>
}

function ConstraintsPage() {
  const items=[
    {type:'禁止事项',title:'不得通过违规展期、借新还旧等方式掩盖资产质量',area:'授信管理',basis:'贷款风险分类相关制度',level:'高'},
    {type:'限制事项',title:'对单一客户或集团客户风险暴露不得超过监管比例上限',area:'集中度风险',basis:'商业银行大额风险暴露管理办法',level:'高'},
    {type:'程序要求',title:'重大关联交易应履行审议、披露和报告程序',area:'关联交易',basis:'银行保险机构关联交易管理办法',level:'中'},
    {type:'披露要求',title:'应按规定披露资本构成、风险加权资产和资本充足率信息',area:'资本监管',basis:'商业银行资本管理办法',level:'中'},
  ]
  return <><PageHeader eyebrow="COMPLIANCE CONSTRAINTS" title="业务合规约束库" description="将制度条款转化为可检索的禁止、限制、准入、报告与披露要求。" />
    <div className="mini-stats"><span><b>1,846</b>约束事项</span><span><b>286</b>禁止事项</span><span><b>642</b>限制事项</span><span><b>918</b>程序与披露</span></div>
    <FilterBar placeholder="搜索业务场景、合规要求或制度依据"><Select label="约束类型"><option>禁止事项</option><option>限制事项</option><option>程序要求</option></Select><Select label="业务领域"><option>授信管理</option><option>关联交易</option></Select></FilterBar>
    <div className="constraint-list">{items.map(x=><article key={x.title}><div className={`constraint-level ${x.level==='高'?'high':''}`}>{x.level}</div><div><Badge tone={x.level==='高'?'red':'amber'}>{x.type}</Badge><h3>{x.title}</h3><p><span>适用领域：{x.area}</span><span>制度依据：{x.basis}</span></p></div><button className="icon-button"><ChevronRight size={18}/></button></article>)}</div>
  </>
}

function FrameworkPage(){
  const [activeType,setActiveType]=useState('DCMM')
  const [activeDomain,setActiveDomain]=useState(0)
  const [activeItem,setActiveItem]=useState('')
  const frameworks={
    DCMM:{title:'数据管理能力成熟度评估（DCMM）',desc:'参考 DCMM 数据管理能力成熟度评估框架，展示能力域、能力项和五级能力等级。',count:'9 个能力域 · 33 个能力项 · 5 个能力等级',domains:[['1.数据战略',['1.1 数据战略规划','1.2 数据战略实施','1.3 数据战略评估']],['2.数据治理',['2.1 数据治理组织','2.2 数据制度建设','2.3 数据文化建设']],['3.数据架构',['3.1 数据模型','3.2 数据分布','3.3 数据集成与共享','3.4 元数据管理']],['4.数据资产',['4.1 权属管理','4.2 价值评估','4.3 资产运营']],['5.数据标准',['5.1 业务术语','5.2 主数据','5.3 参考数据','5.4 数据元','5.5 指标数据']],['6.数据质量',['6.1 数据质量需求','6.2 数据质量检查','6.3 数据质量分析','6.4 数据质量提升']],['7.数据安全',['7.1 数据合规管理','7.2 数据安全防护','7.3 数据安全审计']],['8.数据生存周期',['8.1 数据需求','8.2 数据设计与开发','8.3 数据运维','8.4 数据退役']],['9.数据应用流通',['9.1 数据应用','9.2 外部数据管理','9.3 数据开放','9.4 数据服务']]],levels:[['L1','初始级','识别数据管理目标和范围'],['L2','受管理级','形成部门级任务和计划'],['L3','稳健级','建立组织级体系并持续执行'],['L4','量化管理级','设定指标并量化跟踪改进'],['L5','优化级','形成行业最佳实践']],tags:['能力域','能力项','能力等级标准']},
    regulatory:{title:'监管数据管理能力评价框架',desc:'参考监管数据管理评价指标体系，展示整体机制、报送管理和日常质量管控三类框架。',count:'3 个一级指标 · 23 个二级指标 · 3 类评价指标',domains:[['1.整体机制保障',['1.1 组织架构','1.2 人员保障','1.3 资金预算','1.4 制度保障','1.5 系统保障','1.6 绩效考核','1.7 数据标准管理体系','1.8 质量管理流程']],['2.报送管理体系',['2.1 口径管理','2.2 职责分工','2.3 报送制度','2.4 报送流程','2.5 新产品新业务管理能力','2.7 溯源管理','2.8 质量规则','2.9 系统支撑','2.10 整改机制']],['3.日常报送质量管控',['3.1 重大变动报备执行情况','3.2 常态化质量监控','3.3 数据补录管理','3.4 主要部门日常参与情况','3.5 事后监督管理机制']]],levels:[['结果类指标','结果类','反映监管数据质量和报送结果'],['权重类指标','权重类','按指标权重和计算方法评价'],['定性类指标','定性类','按评价说明和管理机制判断']],tags:['一级指标','二级指标','评价指标类型']}
  }
  const current=frameworks[activeType]
  const domain=current.domains[activeDomain]||current.domains[0]
  const selectedItem=domain[1].includes(activeItem)?activeItem:domain[1][0]
  const detailLevels=activeType==='DCMM'?current.levels.map(x=>[x[0],x[1],`${selectedItem}：${x[2]}，形成对应的制度、流程、职责和持续改进要求。`]):[['评价指标说明','框架定义',`${selectedItem}：明确评价对象、评价边界和指标解释。`],['评分说明及计算方法','评价方法',`${selectedItem}：根据评价说明、计算方法或定性判断规则开展评价。`],['引用依据','制度标准',`${selectedItem}：关联监管制度、报表要求和数据质量管理规范。`]]
  return <><PageHeader eyebrow="CAPABILITY FRAMEWORK" title="能力评估框架" description="仅展示评估框架结构、能力项和等级定义，不展示现状、评分或评估结果。" actions={<button className="button ghost"><Download size={16}/>导出框架</button>} />
    <div className="framework-type-switch"><button className={activeType==='DCMM'?'active':''} onClick={()=>{setActiveType('DCMM');setActiveDomain(0);setActiveItem('')}}><Database size={18}/><span><b>数据管理能力成熟度 · DCMM</b><small>数据战略、治理、架构、资产、质量、安全与应用流通</small></span><ChevronRight size={16}/></button><button className={activeType==='regulatory'?'active':''} onClick={()=>{setActiveType('regulatory');setActiveDomain(0);setActiveItem('')}}><ShieldCheck size={18}/><span><b>监管数据管理能力框架</b><small>整体机制保障、报送管理体系、日常报送质量管控</small></span><ChevronRight size={16}/></button></div>
    <div className="framework-head"><div><h2>{current.title}</h2><p>{current.count}</p></div><Select label="适用机构"><option>商业银行</option><option>银行业金融机构</option></Select></div>
    <div className="framework-assessment-note"><ShieldCheck size={16}/><span>{current.desc} 当前页面仅用于能力域、能力项、评价层级和评价类型的结构化浏览。</span></div>
    <div className="framework-explorer"><aside className="framework-domain-list"><div className="list-title"><span>能力域</span><b>{current.domains.length}</b></div>{current.domains.map(([name,items],i)=><button key={name} className={activeDomain===i?'active':''} onClick={()=>{setActiveDomain(i);setActiveItem(items[0])}}><span><b>{name}</b><small>{items.length} 个能力项</small></span><ChevronRight size={15}/></button>)}</aside><section className="framework-domain-detail"><div className="framework-domain-title"><div><span className="eyebrow">FRAMEWORK DOMAIN</span><h2>{domain[0]}</h2><p>{domain[1].length} 个能力项 · 结构化评估清单</p></div><Badge tone="green">框架项</Badge></div><div className="framework-item-list">{domain[1].map((item,i)=><article className={selectedItem===item?'active':''} key={item} onClick={()=>setActiveItem(item)}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{item}</h3><p>{activeType==='DCMM'?'能力项定义、管理活动和能力等级要求将在此处展开。':'评价指标说明、评分说明及计算方法将在此处展开。'}</p></div><button className="icon-button" aria-label={`展开${item}`}><ChevronRight size={16}/></button></article>)}</div></section></div>
    <section className="framework-item-detail"><div className="framework-item-detail-head"><div><span className="eyebrow">FRAMEWORK ITEM DETAIL</span><h2>{selectedItem}</h2><p>{current.title} · {domain[0]} · 结构化展开页</p></div><Badge tone="green">仅框架内容</Badge></div><div className="framework-item-detail-grid"><section><h3>项目定义</h3><p>{activeType==='DCMM'?`“${selectedItem}”用于描述该能力域下的管理对象、职责边界、管理活动和持续改进方向。评估时应围绕组织制度、执行机制、过程记录和改进闭环进行结构化判断。`:`“${selectedItem}”用于描述监管数据管理体系中的具体评价对象，关注制度机制、报送过程、数据质量和系统支撑等框架要求。`}</p><h3>评估内容</h3><div className="framework-check-list"><span><Check size={14}/>组织职责与管理边界</span><span><Check size={14}/>制度流程与执行机制</span><span><Check size={14}/>数据、报送或系统支撑</span><span><Check size={14}/>问题改进与持续优化</span></div></section><section><h3>{activeType==='DCMM'?'等级/阶段要求':'评价说明与依据'}</h3><div className="framework-detail-levels">{detailLevels.map(([code,title,text])=><div key={code}><Badge tone={activeType==='DCMM'?'blue':'amber'}>{code}</Badge><span><b>{title}</b><small>{text}</small></span></div>)}</div></section></div><div className="framework-detail-footer"><span><FileText size={14}/>关联框架：{current.title}</span><span><ShieldCheck size={14}/>不含现状、评分和评估结果</span><button className="button ghost"><Download size={14}/>下载评估条款</button></div></section>
    <section className="panel framework-level-panel"><div className="panel-head"><div><span className="eyebrow">{activeType==='DCMM'?'MATURITY LEVELS':'EVALUATION TYPES'}</span><h2>{activeType==='DCMM'?'能力等级定义':'评价指标类型'}</h2></div><span>{current.tags.join(' · ')}</span></div><div className="level-track">{current.levels.map((l,i)=><div key={l[0]}><span style={{background:['#8a9691','#4f86c6','#2c9c73','#e6a33c','#d05e54'][i%5]}}>{l[0]}</span><b>{l[1]}</b><small>{l[2]}</small></div>)}</div></section>
  </>
}

function ReportDetailTabs({selected,activeTab,setActiveTab}){
  const forms=[['A01','资本构成情况表','42','8'],['A02','风险加权资产汇总表','68','14'],['A03','信用风险暴露情况表','96','22'],['A04','市场风险资本要求表','54','12']]
  const fields=[['F0001','核心一级资本净额','数值','万元','是','资本净额'],['F0002','风险加权资产合计','数值','万元','是','风险加权资产'],['F0003','核心一级资本充足率','百分比','%','是','资本充足率'],['F0004','报告期末机构数','整数','家','否','—'],['F0005','数据发布日期','日期','YYYY-MM-DD','是','—']]
  const rules=[['R-001','资本充足率校验','核心一级资本净额 / 风险加权资产 = 核心一级资本充足率','阻断'],['R-002','跨表一致性','A01.资本净额 = A02.资本净额','阻断'],['R-003','范围校验','数值字段不得小于 0，百分比字段不超过 100%','提醒'],['R-004','期末完整性','报告期末必填字段不得为空','阻断']]
  return <><div className="tabs report-detail-tabs">{[['template','报表表样'],['fields','字段字典'],['rules','校验规则'],['diff','版本差异'],['basis','制度依据']].map(([key,label])=><button className={activeTab===key?'active':''} onClick={()=>setActiveTab(key)} key={key}>{label}</button>)}</div>
    {activeTab==='template'&&<div className="report-template-view"><div className="template-toolbar"><div><Badge tone="green">当前有效</Badge><span>表样预览 · {selected.version}</span></div><div><button className="button ghost"><Download size={14}/>下载 Excel 表样</button><button className="button primary"><FileSearch size={14}/>查看填报说明</button></div></div><div className="template-sheet"><div className="sheet-title">{selected.name}（示例表样）<small>报告期：2026 年 10 月 · 机构名称：示例银行</small></div><div className="table-wrap"><table><thead><tr><th>序号</th><th>项目名称</th><th>项目代码</th><th>期末数</th><th>期初数</th><th>填报说明</th></tr></thead><tbody>{forms.map((x,i)=><tr key={x[0]}><td>{i+1}</td><td><b>{x[1]}</b></td><td>{x[0]}</td><td className="sheet-input">—</td><td className="sheet-input">—</td><td>按监管口径填报</td></tr>)}</tbody></table></div></div></div>}
    {activeTab==='fields'&&<div className="table-wrap"><table><thead><tr><th>字段代码</th><th>字段名称</th><th>数据类型</th><th>单位/格式</th><th>必填</th><th>关联指标</th><th>释疑</th></tr></thead><tbody>{fields.map(x=><tr key={x[0]}><td><code>{x[0]}</code></td><td><b>{x[1]}</b></td><td>{x[2]}</td><td>{x[3]}</td><td><Badge tone={x[4]==='是'?'red':'neutral'}>{x[4]}</Badge></td><td>{x[5]}</td><td><button className="text-button">查看 <ChevronRight size={13}/></button></td></tr>)}</tbody></table></div>}
    {activeTab==='rules'&&<div className="table-wrap"><table><thead><tr><th>规则代码</th><th>规则名称</th><th>校验逻辑</th><th>失败处理</th><th>状态</th></tr></thead><tbody>{rules.map(x=><tr key={x[0]}><td><code>{x[0]}</code></td><td><b>{x[1]}</b></td><td>{x[2]}</td><td><Badge tone={x[3]==='阻断'?'red':'amber'}>{x[3]}</Badge></td><td><Badge tone="green">启用</Badge></td></tr>)}</tbody></table></div>}
    {activeTab==='diff'&&<div className="version-diff"><div className="diff-toolbar"><Select label="对比版本" showLabel><option>V2026.2</option><option>V2026.1</option></Select><span>对比结果：新增 6 个字段，调整 3 条规则，删除 1 个指标映射</span></div>{[['新增','F0005 数据发布日期','新增必填字段，要求格式 YYYY-MM-DD'],['调整','R-003 范围校验','百分比上限由 120% 调整为 100%'],['调整','F0003 核心一级资本充足率','关联指标改为 CAP-002'],['删除','F0021 旧版附注字段','字段已合并至附注信息表']].map(([type,name,text])=><div className={`diff-row diff-${type}`} key={name}><Badge tone={type==='新增'?'green':type==='删除'?'red':'amber'}>{type}</Badge><div><b>{name}</b><p>{text}</p></div><button className="text-button">定位 <ChevronRight size={13}/></button></div>)}</div>}
    {activeTab==='basis'&&<div className="basis-list">{[['商业银行资本管理办法','国家金融监督管理总局令 2023年第4号','第六章 资本充足率监管要求'],['银行业金融机构监管数据标准化规范','银保监发〔2022〕15号','第三章 数据项定义与报送要求'],['监管报表填报说明（2026.2）','监管报送平台发布版本','第一部分 表样与字段口径']].map(x=><article key={x[0]}><span className="basis-icon"><FileText size={18}/></span><div><Badge tone="blue">现行有效</Badge><h3>{x[0]}</h3><p>{x[1]} · {x[2]}</p><button className="text-button">查看制度条款 <ExternalLink size={13}/></button></div></article>)}</div>}
  </>
}

function ReportsPage(){
  const [selected,setSelected]=useState(reports[0])
  const [activeTab,setActiveTab]=useState('template')
  const systems = [...new Set(reports.map(item=>item.system))]
  return <><PageHeader eyebrow="REGULATORY REPORTING" title="监管报表库" description="当前为通用配置原型；正式报表体系及清单将在你提供资料后替换。" actions={<Badge tone="amber">示例数据</Badge>} /><InitializationNotice type="reports" />
    <div className="notice"><AlertCircle size={17}/><span>页面使用占位报表体系演示交互，不代表最终银行监管报表清单。</span></div>
    <FilterBar placeholder="搜索报表名称、代码、字段或填报口径"><Select label="报表体系" showLabel><option>监管报送体系 A</option><option>金融统计体系</option></Select><Select label="频度" showLabel><option>月报</option><option>季报</option></Select></FilterBar>
    <div className="report-layout"><section className="report-list report-tree-list"><div className="list-title"><span>报送体系</span><b>{systems.length}</b></div>{systems.map((system,index)=><div className="report-system" key={system}><button className={`report-system-row ${selected?.system===system?'active':''}`} onClick={()=>{setSelected(reports.find(item=>item.system===system));setActiveTab('template')}}><ChevronDown size={14}/><FileBarChart size={16}/><span><b>{system}</b><small>{reports.filter(item=>item.system===system).length} 张报表 · {index===0?'资本与审慎监管':'月度与专题报送'}</small></span><strong>{reports.filter(item=>item.system===system).length}</strong></button><div className="report-sublist">{reports.filter(item=>item.system===system).map(r=><button key={r.code} className={selected?.code===r.code?'active':''} onClick={()=>{setSelected(r);setActiveTab('template')}}><span className="report-code">{r.code}</span><span><b>{r.name}</b><small>{r.frequency} · {r.version}</small></span><ChevronRight size={14}/></button>)}</div></div>)}</section>
      <section className="report-detail"><div className="report-title"><div><Badge tone="blue">{selected.system}</Badge><h2>{selected.name}</h2><p>{selected.code} · {selected.frequency} · 版本 {selected.version}</p></div><div className="report-title-actions"><CorrectionButton resourceType="report" resourceId={selected.code} resourceTitle={selected.name}/><button className="button ghost"><Download size={16}/>下载配置</button></div></div>
        <div className="report-kpis"><div><small>表单</small><b>{selected.forms}</b></div><div><small>字段</small><b>{selected.fields}</b></div><div><small>校验规则</small><b>{selected.rules}</b></div><div><small>最近更新</small><b className="date-value">{selected.updated}</b></div></div>
        <ReportDetailTabs selected={selected} activeTab={activeTab} setActiveTab={setActiveTab}/>
      </section></div>
  </>
}

function MetricsPage(){
  const [selected,setSelected]=useState(null)
  return <><PageHeader eyebrow="REGULATORY METRICS" title="监管指标库" description="集中查询指标定义、公式、监管要求、报表映射及常见释疑。" actions={<button className="button ghost"><Download size={16}/>导出指标</button>} />
    <div className="metric-category-bar">{['全部指标','资本监管','流动性风险','信用风险','市场风险','操作风险','集中度风险'].map((x,i)=><button className={i===0?'active':''} key={x}>{x}<small>{[426,82,64,96,42,58,31][i]}</small></button>)}</div>
    <FilterBar placeholder="搜索指标名称、代码、公式变量或释义"><Select label="适用机构"><option>商业银行</option></Select></FilterBar>
    <div className="metric-table table-wrap"><table><thead><tr><th>指标代码</th><th>指标名称</th><th>监管要求</th><th>计算公式</th><th>主题</th><th>释疑</th><th></th></tr></thead><tbody>{metrics.map(x=><tr key={x.code} onClick={()=>setSelected(x)}><td><code>{x.code}</code></td><td><b>{x.name}</b></td><td><Badge tone={x.value.includes('>=')?'green':'blue'}>{x.value}</Badge></td><td><span className="formula-cell">{x.formula}</span></td><td>{x.category}</td><td><span className="faq-count"><MessageSquare size={14}/>{x.faq}</span></td><td><ChevronRight size={16}/></td></tr>)}</tbody></table></div>
    <Drawer open={!!selected} onClose={()=>setSelected(null)} title={selected?.name} subtitle={`${selected?.code} · ${selected?.category}`} footer={<><button className="button ghost"><Bookmark size={16}/>收藏</button><button className="button primary"><Bot size={16}/>询问 AI</button></>}>
      <div className="metric-threshold"><span>监管要求</span><b>{selected?.value}</b><small>单位：{selected?.unit}</small></div>
      <section className="drawer-section"><h3>指标定义</h3><p>用于衡量商业银行相关风险管理与监管合规水平的核心指标，计算应采用监管认可的口径和数据范围。</p></section>
      <section className="drawer-section formula-box"><h3>计算公式</h3><code>{selected?.formula}</code></section>
      <section className="drawer-section"><h3>监管依据</h3><button className="source-link"><FileText size={16}/><span><b>{selected?.source}</b><small>点击定位相关条款</small></span><ExternalLink size={15}/></button></section>
      <section className="drawer-section"><h3>常见释疑</h3>{['分子和分母应采用哪个时点口径？','集团并表范围发生变化如何处理？','指标计算结果如何进行舍入？'].map((x,i)=><button className="faq-row" key={x}><span>{i+1}</span>{x}<ChevronRight size={15}/></button>)}</section>
    </Drawer>
  </>
}

function QualityPage(){
  const chart=[{name:'1月',v:76},{name:'2月',v:68},{name:'3月',v:72},{name:'4月',v:58},{name:'5月',v:53},{name:'6月',v:48}]
  return <><PageHeader eyebrow="DATA QUALITY" title="监管数据质量" description="沉淀数据质量问题、识别规则、影响范围和整改建议。" />
    <div className="stats-grid three"><Stat label="质量规则" value="286" meta="本月新增 12" icon={ListChecks} tone="blue"/><Stat label="高频问题" value="64" meta="高风险 18 项" icon={AlertCircle} tone="red"/><Stat label="关联报表" value="48" meta="覆盖 7 个体系" icon={FileBarChart} tone="green"/></div>
    <div className="dashboard-columns"><section className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">TREND</span><h2>问题数量趋势</h2></div><Badge tone="green">近6个月 -36.8%</Badge></div><div className="chart-space"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><CartesianGrid stroke="#e8ecea" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Line type="monotone" dataKey="v" stroke="#167a59" strokeWidth={2.5} dot={{fill:'#167a59',r:4}}/></LineChart></ResponsiveContainer></div></section>
      <section className="panel"><div className="panel-head"><div><span className="eyebrow">TOP ISSUES</span><h2>高频问题类型</h2></div></div><div className="quality-list">{qualityIssues.map(x=><div key={x.type}><span className={`severity severity-${x.severity}`}>{x.severity}</span><b>{x.type}</b><strong>{x.count}</strong><small className={x.change.startsWith('-')?'down':''}>{x.change}</small></div>)}</div></section></div>
    <section className="panel full-panel"><div className="panel-head"><div><span className="eyebrow">RULE LIBRARY</span><h2>质量规则库</h2></div><button className="button ghost"><Download size={15}/>导出</button></div><div className="table-wrap"><table><thead><tr><th>规则代码</th><th>问题类型</th><th>识别逻辑</th><th>影响对象</th><th>严重程度</th></tr></thead><tbody>{qualityIssues.map((x,i)=><tr key={x.type}><td>DQ-{String(i+1).padStart(3,'0')}</td><td><b>{x.type}</b></td><td>{['表 A 字段 01 应等于表 B 字段 12','字段值与制度规定口径不一致','条件必填字段为空','维度成员不在有效代码范围','环比变动超过设定阈值'][i]}</td><td>{reports[i%reports.length].name}</td><td><Badge tone={x.severity==='高'?'red':x.severity==='中'?'amber':'neutral'}>{x.severity}</Badge></td></tr>)}</tbody></table></div></section>
  </>
}

function InstitutionsPage(){
  return <><PageHeader eyebrow="INSTITUTIONS" title="金融机构名单" description="查询银行业机构基本信息、机构沿革及关联处罚与披露资料。" />
    <div className="institution-types">{['全部机构','国有大型商业银行','股份制商业银行','城市商业银行','农村商业银行','外资银行'].map((x,i)=><button className={i===0?'active':''} key={x}>{x}<small>{[4582,6,12,125,1624,41][i]}</small></button>)}</div>
    <FilterBar placeholder="搜索机构全称、简称或统一标识"><Select label="地区"><option>北京</option><option>上海</option><option>广东</option></Select><Select label="状态"><option>正常</option></Select></FilterBar>
    <div className="institution-grid">{institutions.map((x,i)=><article className="institution-card" key={x.name}><div className="institution-logo">{x.short.slice(0,2)}</div><div><Badge tone="green">{x.status}</Badge><h3>{x.name}</h3><p>{x.type} · {x.region}</p></div><div className="institution-data"><span><small>关联年报</small><b>{x.reports}</b></span><span><small>处罚案例</small><b>{x.penalties}</b></span></div><footer><button>查看机构档案</button><ArrowRight size={15}/></footer></article>)}</div>
  </>
}

function PenaltiesPage(){
  const navigate=useNavigate()
  const [activeView,setActiveView]=useState('chart')
  const [period,setPeriod]=useState('本年')
  const pie=[{name:'贷款管理',value:31,color:'#167a59'},{name:'监管数据',value:24,color:'#4f86c6'},{name:'反洗钱',value:19,color:'#e6a33c'},{name:'关联交易',value:14,color:'#d05e54'},{name:'其他',value:12,color:'#8a9691'}]
  const periodConfig={
    '本季度':{factor:.55,label:'本季度',data:penaltyTrend.slice(-3)},
    '本年':{factor:1,label:'本年',data:penaltyTrend},
    '近2年（从上年年初）':{factor:1.75,label:'近2年',data:penaltyTrend},
    '近3年（从前年年初）':{factor:2.4,label:'近3年',data:penaltyTrend},
  }
  const selectedPeriod=periodConfig[period]
  const trendData=selectedPeriod.data.map(x=>({...x,cases:Math.round(x.cases*selectedPeriod.factor),amount:Math.round(x.amount*selectedPeriod.factor)}))
  const violationRows=[['贷款管理不到位','31%','5,324','授信调查、贷后管理、资金用途核查'],['监管数据报送不准确','24%','4,080','数据错报、漏报、迟报和口径不一致'],['反洗钱义务履行不到位','19%','3,212','客户识别、可疑交易和持续尽调'],['关联交易管理不到位','14%','2,378','关联方识别、审批和限额管理'],['消费者权益保护','12%','2,041','销售适当性、收费和信息披露']]
  const caseTable=<div className="table-wrap"><table><thead><tr><th>处罚日期</th><th>处罚机构</th><th>监管机构</th><th>地区</th><th>违规行为</th><th>处罚措施</th><th>金额（万元）</th><th>正文</th></tr></thead><tbody>{penalties.map((x,i)=><tr key={x.date+x.institution}><td>{x.date}</td><td><b>{x.institution}</b></td><td><small>{x.authority}</small></td><td>{x.region}</td><td>{x.violation}</td><td>{x.action}</td><td><strong className="amount">{x.amount}</strong></td><td><button className="text-button" onClick={()=>navigate(`/analysis/penalties/${i}`)}>查看 <ArrowRight size={13}/></button></td></tr>)}</tbody></table></div>
  return <><PageHeader eyebrow="PENALTY ANALYTICS" title="监管处罚分析" description="检索公开处罚原文，分析机构、地区、违规行为和处罚趋势。" actions={<button className="button ghost"><Download size={16}/>导出分析</button>} />
    <div className="stats-grid"><Stat label="处罚案例" value="26,090" meta="本年 1,842" icon={FileText} tone="blue"/><Stat label="处罚金额" value="32.16 亿元" meta="平均 12.33 万元" icon={BarChart3} tone="red"/><Stat label="被处罚机构" value="2,015" meta="涉及 31 个地区" icon={Building2} tone="green"/><Stat label="责任人员" value="15,252" meta="双罚案件 4,513" icon={Users} tone="amber"/></div>
    <div className="tabs large-tabs">{[['chart','图表分析'],['cases','处罚正文'],['violations','违规行为'],['ai','AI 分析']].map(([key,label])=><button key={key} className={activeView===key?'active':''} onClick={()=>setActiveView(key)}>{label}</button>)}</div>
    <FilterBar placeholder="搜索机构、违法事由或处罚文号" moreFilters={<><Select label="时间快捷" showLabel value={period} onChange={e=>setPeriod(e.target.value)}><option>本季度</option><option>本年</option><option>近2年（从上年年初）</option><option>近3年（从前年年初）</option></Select><DateRange label="处罚时间" /><Select label="地区" showLabel><option>北京</option><option>上海</option><option>广东</option><option>江苏</option><option>浙江</option><option>其他地区</option></Select><Select label="处罚类型" showLabel><option>机构处罚</option><option>人员处罚</option><option>双罚制</option></Select></>}><Select label="监管机构" showLabel><option>金融监管总局</option><option>中国人民银行</option><option>国家外汇管理局</option></Select><Select label="被处罚银行类型" showLabel><option>全国性银行</option><option>区域性银行</option><option>外资银行</option><option>其他</option></Select></FilterBar>
    {activeView==='chart'&&<><div className="analytics-grid"><section className="panel chart-panel wide"><div className="panel-head"><div><span className="eyebrow">MONTHLY TREND · {selectedPeriod.label}</span><h2>处罚数量与金额趋势</h2></div><div className="legend"><span className="green-dot">案件数</span><span className="blue-dot">金额</span></div></div><div className="chart-space"><ResponsiveContainer width="100%" height="100%"><BarChart data={trendData}><CartesianGrid stroke="#e8ecea" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="cases" fill="#167a59" radius={[3,3,0,0]}/><Line dataKey="amount" stroke="#4f86c6"/></BarChart></ResponsiveContainer></div></section><section className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">VIOLATION MIX</span><h2>违规行为分布</h2></div></div><div className="pie-layout"><div className="pie-space"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={2}>{pie.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><span><b>{period==='本季度'?'426':period==='本年'?'1,842':period==='近2年（从上年年初）'?'3,520':'5,184'}</b><small>{selectedPeriod.label}案件</small></span></div><div className="pie-legend">{pie.map(x=><div key={x.name}><i style={{background:x.color}}/><span>{x.name}</span><b>{x.value}%</b></div>)}</div></div></section></div><section className="panel full-panel"><div className="panel-head"><div><span className="eyebrow">RECENT CASES</span><h2>最新处罚案例</h2></div><button className="text-button">查看全部 <ArrowRight size={14}/></button></div>{caseTable}</section></>}
    {activeView==='cases'&&<section className="panel penalty-docs-panel"><div className="panel-head"><div><span className="eyebrow">PENALTY DOCUMENTS</span><h2>处罚正文</h2><p>按公开处罚决定书查看原文、处罚依据和关联违规行为。</p></div><button className="button ghost"><Download size={15}/>导出清单</button></div><div className="penalty-doc-list">{penalties.map((x,i)=><article key={x.date+x.institution}><span className="doc-number">{String(i+1).padStart(2,'0')}</span><div><div><Badge tone="red">行政处罚</Badge><span>{x.date} · {x.region}</span></div><h3>{x.institution} · {x.violation}</h3><p>{x.authority} · {x.action} · 罚款 {x.amount} 万元</p><footer><span>处罚依据：商业银行相关监管规定</span><button className="text-button" onClick={()=>navigate(`/analysis/penalties/${i}`)}>阅读正文 <ArrowRight size={14}/></button></footer></div></article>)}</div></section>}
    {activeView==='violations'&&<section className="violations-view"><div className="violation-summary"><section className="panel"><span className="eyebrow">TOP VIOLATIONS</span><h2>违规行为分布</h2><p>当前筛选范围内共识别 17,035 个违规行为标签。</p><div className="violation-bars">{violationRows.map(([name,percent,count,desc])=><div key={name}><div><b>{name}</b><span>{count} 件 · {percent}</span></div><i><em style={{width:percent}}/></i><small>{desc}</small></div>)}</div></section><section className="panel"><span className="eyebrow">RISK SIGNALS</span><h2>风险信号</h2><div className="risk-signal-list"><div><b>数据报送准确性</b><span>近三个月相关处罚上升 18%</span><strong>高</strong></div><div><b>贷后管理</b><span>区域性银行案件占比偏高</span><strong>中</strong></div><div><b>反洗钱履职</b><span>外资银行金额均值较高</span><strong>中</strong></div></div><button className="button secondary">生成违规专题 <ArrowRight size={15}/></button></section></div><section className="panel full-panel"><div className="panel-head"><div><span className="eyebrow">CASE TAGS</span><h2>违规行为标签库</h2></div><button className="button ghost">按标签筛选 <ChevronDown size={14}/></button></div>{caseTable}</section></section>}
    {activeView==='ai'&&<section className="ai-penalty-view"><section className="panel ai-penalty-hero"><div className="ai-avatar"><Sparkles size={21}/></div><div><span className="eyebrow">AI PENALTY INSIGHT</span><h2>监管处罚智能分析</h2><p>基于已发布处罚正文、监管制度和违规行为标签，生成带引用的趋势研判。</p></div><Badge tone="green">站内知识</Badge></section><div className="ai-penalty-grid"><section className="panel"><div className="panel-head"><h2>本期分析摘要</h2><Badge tone="amber">近三年</Badge></div><p className="analysis-lead">处罚数量整体呈上升趋势，贷款管理和监管数据质量是当前最集中的风险主题。区域性银行的单案金额较低，但案件频次明显高于其他类型机构。</p><div className="insight-list"><div><strong>01</strong><span><b>高频主题</b><small>贷款管理不到位，占全部案件 31%</small></span></div><div><strong>02</strong><span><b>趋势变化</b><small>监管数据报送相关案件同比上升 18%</small></span></div><div><strong>03</strong><span><b>重点地区</b><small>长三角地区案件数和金额均高于平均水平</small></span></div></div></section><section className="panel"><div className="panel-head"><h2>你可以这样问</h2><Sparkles size={17}/></div><div className="ai-question-list">{['近三年处罚金额最高的违规行为是什么？','比较全国性银行和区域性银行的处罚差异','哪些制度条款被处罚案例频繁引用？','分析监管数据报送处罚的主要原因'].map(q=><button key={q}><MessageSquare size={15}/>{q}<ArrowRight size={14}/></button>)}</div></section></div><section className="panel ai-source-panel"><div className="panel-head"><div><span className="eyebrow">TRACEABLE SOURCES</span><h2>分析依据</h2></div><span>共引用 36 个知识对象</span></div><div className="source-citations"><button><span>1</span>2026 年公开行政处罚决定书汇编<ExternalLink size={13}/></button><button><span>2</span>商业银行数据治理指引 · 第五章<ExternalLink size={13}/></button><button><span>3</span>监管数据报送质量管理专题分析<ExternalLink size={13}/></button></div></section></section>}
  </>
}

function AnnualReportsPage(){
  const items=[['中国工商银行股份有限公司','2025年年度报告','2026-03-27','128.4 MB'],['招商银行股份有限公司','2025年年度报告','2026-03-25','86.7 MB'],['北京银行股份有限公司','2025年年度报告','2026-04-02','64.2 MB'],['上海农村商业银行股份有限公司','2025年年度报告','2026-03-30','72.1 MB']]
  return <><PageHeader eyebrow="ANNUAL REPORTS" title="年报与披露资料库" description="按机构和年度查询公开报告，并关联关键指标和原文页码。" />
    <FilterBar placeholder="搜索机构名称、报告标题或报告内容" moreFilters={<><DateRange label="发布日期" /><Select label="地区" showLabel><option>北京</option><option>上海</option><option>广东</option><option>江苏</option></Select><Select label="披露状态" showLabel><option>已披露</option><option>待更新</option></Select></>}><Select label="报告年度" showLabel><option>2025</option><option>2024</option></Select><Select label="报告类型" showLabel><option>年度报告</option><option>社会责任报告</option></Select></FilterBar>
    <div className="report-covers">{items.map((x,i)=><article key={x[0]}><div className={`report-cover cover-${i}`}><Landmark size={28}/><span>ANNUAL<br/>REPORT</span><b>2025</b></div><div><Badge tone="blue">年度报告</Badge><h3>{x[0]}</h3><p>{x[1]}</p><footer><span>{x[2]} · {x[3]}</span><button className="icon-button"><Download size={16}/></button></footer></div></article>)}</div>
  </>
}

function LegacyPenaltyDetailPage(){
  const navigate=useNavigate()
  const {id}=useParams()
  const item=penalties[Number(id)]||penalties[0]
  return <><nav className="reading-breadcrumb" aria-label="面包屑"><button onClick={()=>navigate('/')}>首页</button><ChevronRight size={13}/><button onClick={()=>navigate('/analysis/penalties')}>监管处罚分析</button><ChevronRight size={13}/><span>处罚正文</span></nav><div className="penalty-detail-layout"><main className="penalty-reading"><div className="penalty-reading-head"><div><Badge tone="red">行政处罚决定书</Badge><span>{item.date} · {item.region}</span><h1>{item.institution}</h1><p>{item.authority} · 文号：示例监管罚〔2026〕{String(Number(id||0)+18).padStart(3,'0')}号</p></div><div><button className="button ghost"><Download size={15}/>下载原文</button><button className="button primary"><Bot size={15}/>AI 解读</button></div></div><div className="tabs large-tabs penalty-detail-tabs"><button className="active">处罚正文</button><button>违规行为</button><button>处罚依据</button><button>AI 分析</button></div><article className="penalty-document"><div className="document-meta"><span>发布日期：{item.date}</span><span>监管机构：{item.authority}</span><span>来源：监管机构官网</span></div><h2>关于对{item.institution}作出处罚的决定</h2><p>当事机构：{item.institution}</p><p>经查，当事机构存在<strong>{item.violation}</strong>的违法违规事实。上述行为违反了银行业金融机构相关监管制度及审慎经营规则，影响业务管理和监管数据质量。</p><p>依据有关法律法规和监管规定，监管机构决定对当事机构采取<strong>{item.action}</strong>的行政处罚措施，处罚金额为<strong>{item.amount} 万元</strong>。</p><h3>一、主要违法违规事实</h3><ol><li>未严格落实相关业务管理制度，关键环节的审核和持续管理不到位。</li><li>部分业务资料、数据报送和内部管理记录未能真实、准确、完整反映实际情况。</li><li>整改责任和复核机制未有效发挥作用，相关问题持续时间较长。</li></ol><h3>二、行政处罚决定</h3><p>综上，监管机构依法作出上述行政处罚决定。当事机构应在规定期限内缴纳罚款，持续完善内部控制和风险管理机制，并按要求报送整改情况。</p><div className="document-sign"><span>监管机构：{item.authority}</span><span>日期：{item.date}</span></div></article></main><aside className="penalty-detail-side"><section className="panel"><h3>处罚摘要</h3><div className="penalty-summary"><span><small>处罚金额</small><b>{item.amount} 万元</b></span><span><small>处罚措施</small><b>{item.action}</b></span><span><small>违规类型</small><b>{item.violation}</b></span><span><small>地区</small><b>{item.region}</b></span></div></section><section className="panel"><h3>关联知识</h3><button className="source-link"><FileText size={16}/><span><b>商业银行相关监管规定</b><small>查看制度依据</small></span><ExternalLink size={15}/></button><button className="source-link"><Activity size={16}/><span><b>监管数据报送准确性</b><small>查看关联指标</small></span><ExternalLink size={15}/></button></section><section className="panel"><h3>AI 快速解读</h3><p className="side-note">该案例与“{item.violation}”标签高度相关，建议结合处罚依据、整改要求和同类机构案例进行对比。</p><button className="button secondary full"><Bot size={15}/>生成案例分析</button></section></aside></div></>
}

function PenaltyDetailPage(){
  const navigate=useNavigate()
  const {id}=useParams()
  const item=penalties[Number(id)]||penalties[0]
  return <><nav className="reading-breadcrumb" aria-label="面包屑"><button onClick={()=>navigate('/')}>首页</button><ChevronRight size={13}/><button onClick={()=>navigate('/analysis/penalties')}>监管处罚分析</button><ChevronRight size={13}/><span>处罚正文</span></nav><div className="penalty-detail-toolbar"><CorrectionButton resourceType="penalty" resourceId={String(id||0)} resourceTitle={`${item.institution} · ${item.violation}`}/></div><div className="penalty-detail-layout"><main className="penalty-reading"><div className="penalty-reading-head"><div><Badge tone="red">行政处罚决定书</Badge><span>{item.date} · {item.region}</span><h1>{item.institution}</h1><p>{item.authority} · 文号：示例监管罚〔2026〕{String(Number(id||0)+18).padStart(3,'0')}号</p></div><div><button className="button ghost"><Download size={15}/>下载原文</button><button className="button primary"><Bot size={15}/>AI 解读</button></div></div><div className="tabs large-tabs penalty-detail-tabs"><button className="active">处罚正文</button><button>违规行为</button><button>处罚依据</button><button>AI 分析</button></div><article className="penalty-document"><div className="document-meta"><span>发布日期：{item.date}</span><span>监管机构：{item.authority}</span><span>来源：监管机构官网</span></div><h2>关于对{item.institution}作出处罚的决定</h2><p>当事机构：{item.institution}</p><p>经查，当事机构存在<strong>{item.violation}</strong>的违法违规事实。上述行为违反了银行业金融机构相关监管制度及审慎经营规则，影响业务管理和监管数据质量。</p><p>依据有关法律法规和监管规定，监管机构决定对当事机构采取<strong>{item.action}</strong>的行政处罚措施，处罚金额为<strong>{item.amount} 万元</strong>。</p><h3>一、主要违法违规事实</h3><ol><li>未严格落实相关业务管理制度，关键环节的审核和持续管理不到位。</li><li>部分业务资料、数据报送和内部管理记录未能真实、准确、完整反映实际情况。</li><li>整改责任和复核机制未有效发挥作用，相关问题持续时间较长。</li></ol><h3>二、行政处罚决定</h3><p>综上，监管机构依法作出上述行政处罚决定。当事机构应在规定期限内缴纳罚款，持续完善内部控制和风险管理机制，并按要求报送整改情况。</p><div className="document-sign"><span>监管机构：{item.authority}</span><span>日期：{item.date}</span></div></article></main><aside className="penalty-detail-side"><section className="panel"><h3>处罚摘要</h3><div className="penalty-summary"><span><small>处罚金额</small><b>{item.amount} 万元</b></span><span><small>处罚措施</small><b>{item.action}</b></span><span><small>违规类型</small><b>{item.violation}</b></span><span><small>地区</small><b>{item.region}</b></span></div></section><section className="panel"><h3>关联知识</h3><button className="source-link"><FileText size={16}/><span><b>商业银行相关监管规定</b><small>查看制度依据</small></span><ExternalLink size={15}/></button><button className="source-link"><Activity size={16}/><span><b>监管数据报送准确性</b><small>查看关联指标</small></span><ExternalLink size={15}/></button></section><section className="panel"><h3>AI 快速解读</h3><p className="side-note">该案例与“{item.violation}”标签高度相关，建议结合处罚依据、整改要求和同类机构案例进行对比。</p><button className="button secondary full"><Bot size={15}/>生成案例分析</button></section></aside></div></>
}

function GraphPage(){
  const [active,setActive]=useState('资本充足率')
  const nodes=[{n:'资本充足率',x:50,y:48,t:'metric'},{n:'资本管理办法',x:22,y:21,t:'doc'},{n:'风险加权资产',x:77,y:20,t:'term'},{n:'资本充足情况表',x:82,y:67,t:'report'},{n:'核心一级资本',x:50,y:84,t:'term'},{n:'资本净额',x:18,y:69,t:'term'}]
  return <><PageHeader eyebrow="KNOWLEDGE GRAPH" title="知识图谱" description="探索制度、条款、报表、字段、指标、术语和处罚案例之间的关系。" />
    <div className="graph-toolbar"><label><Search size={16}/><input placeholder="搜索图谱节点" defaultValue="资本充足率"/></label><div>{['制度','指标','报表','字段','术语','处罚'].map((x,i)=><button className={`node-filter nf-${i}`} key={x}><i/>{x}</button>)}</div><button className="button ghost"><RotateCcw size={15}/>重置视图</button></div>
    <div className="graph-layout"><section className="graph-canvas"><div className="graph-grid"/><svg className="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none">{nodes.slice(1).map((n,i)=><line key={n.n} x1="50" y1="48" x2={n.x} y2={n.y} className={`line-${i%3}`}/>)}</svg>{nodes.map(n=><button key={n.n} onClick={()=>setActive(n.n)} className={`graph-node node-${n.t} ${active===n.n?'active':''}`} style={{left:`${n.x}%`,top:`${n.y}%`}}>{n.t==='doc'?<FileText/>:n.t==='report'?<FileBarChart/>:n.t==='metric'?<Activity/>:<Tags/>}<span>{n.n}</span></button>)}<div className="zoom-tools"><button>+</button><button>−</button></div></section>
      <aside className="graph-detail"><Badge tone="green">监管指标</Badge><h2>{active}</h2><p>当前节点与 18 个知识对象存在直接关系，包含制度依据、计算组成、报表映射和同类指标。</p><div className="relation-summary"><span><b>6</b>制度条款</span><span><b>4</b>报表字段</span><span><b>5</b>关联术语</span><span><b>3</b>同类指标</span></div><h3>主要关系</h3>{['依据 → 商业银行资本管理办法','计算 → 资本净额','计算 → 风险加权资产','映射 → 资本充足情况表'].map(x=><button className="relation-row" key={x}><GitBranch size={15}/>{x}<ChevronRight size={15}/></button>)}</aside></div>
  </>
}

function TopicsPage(){
  return <><PageHeader eyebrow="RESEARCH TOPICS" title="专题研究" description="围绕重点监管主题，整合制度、指标、报表、案例与研究解读。" />
    <div className="featured-topic"><div><Badge tone="green">本月专题</Badge><h2>银行业数据治理与监管报送</h2><p>从组织架构、制度标准、数据质量到监管报送，建立完整的知识关联和实践观察。</p><div><span><FileText size={15}/>46 份制度</span><span><FileBarChart size={15}/>12 套报表</span><span><AlertCircle size={15}/>286 个案例</span></div><button className="button primary">进入专题 <ArrowRight size={15}/></button></div><div className="topic-visual"><Database/><Network/><FileCheck2/><i/><i/><i/></div></div>
    <div className="topic-grid">{latestTopics.map(x=><article key={x.title}><div className={`topic-top topic-${x.color}`}><span>{x.cat}</span><Network size={30}/></div><div><h3>{x.title}</h3><p>{x.desc}</p><footer><span>{x.docs} 份制度</span><span>{x.metrics} 个指标</span><button><ArrowRight size={16}/></button></footer></div></article>)}</div>
  </>
}

function AIPage(){
  const [prompt,setPrompt]=useState('')
  const [model,setModel]=useState('银规智问 · 平衡模式')
  const [knowledgeScope,setKnowledgeScope]=useState('全部知识')
  const [messages,setMessages]=useState([
    {role:'assistant',text:'你好，我可以基于站内监管制度、报表、指标和处罚案例回答问题。你可以直接提问，也可以先指定知识范围。'}
  ])
  const promptIdeas={
    '全部知识':['资本充足率的监管要求是什么？','比较两个版本制度的主要变化','解释某报表字段的填报口径','分析近期数据质量处罚趋势'],
    '法规制度':['近三年资本监管制度有哪些变化？','这项制度对城商行是否适用？','查找数据治理相关的制度条款','解释制度中的监管指标要求'],
    '监管报表':['资本充足情况表有哪些必填字段？','解释报表 RPT-A01 的填报口径','哪些报表字段与资本充足率相关？','比较两套报表的字段差异'],
    '监管处罚':['近三年处罚金额最高的违规行为是什么？','哪些银行类型处罚频次最高？','分析监管数据报送处罚的主要原因','查找与贷款管理相关的处罚案例'],
    '通用':['帮我梳理银行资本监管知识框架','把这段监管要求总结成检查清单','生成一份监管报送准备事项','解释这个监管术语的含义'],
  }
  const send=()=>{if(!prompt.trim())return;setMessages([...messages,{role:'user',text:prompt},{role:'assistant',text:`基于“${knowledgeScope}”知识范围和${model}，初步判断：核心一级资本充足率的计算基础是核心一级资本净额与风险加权资产。正式使用时应结合机构适用范围、并表口径及当前有效制度版本。`,sources:['商业银行资本管理办法 · 第三章','指标 CAP-002 · 核心一级资本充足率']}]);setPrompt('')}
  return <div className="ai-page"><aside className="chat-sidebar"><button className="button primary full"><Plus size={16}/>新建对话</button><h3>最近会话</h3>{['资本充足率口径说明','流动性报表字段差异','数据质量处罚案例','大额风险暴露限额'].map((x,i)=><button className={i===0?'active':''} key={x}><MessageSquare size={15}/><span>{x}<small>{i===0?'今天':'本周'}</small></span></button>)}<div className="chat-scope"><ShieldCheck size={17}/><span><b>站内知识模式</b><small>回答仅使用已发布知识</small></span></div></aside>
    <section className="chat-main"><div className="chat-head"><div><span className="ai-avatar"><Sparkles size={20}/></span><div><h1>AI 监管助手</h1><p>回答附带来源，可定位到原文和知识对象</p></div></div><div className="segment"><button className="active">仅站内知识</button><button>允许网络补充</button></div></div>
      <div className="ai-controls"><label><span>大模型</span><select value={model} onChange={e=>setModel(e.target.value)}><option>银规智问 · 平衡模式</option><option>银规智问 · 深度分析</option><option>银规智问 · 快速检索</option></select><ChevronDown size={14}/></label><label><span>知识范围</span><select value={knowledgeScope} onChange={e=>setKnowledgeScope(e.target.value)}><option>全部知识</option><option>法规制度</option><option>监管报表</option><option>监管处罚</option><option>通用</option></select><ChevronDown size={14}/></label><small><ShieldCheck size={13}/>仅检索已发布内容</small></div>
      <div className="chat-messages">{messages.map((m,i)=><div className={`message ${m.role}`} key={i}>{m.role==='assistant'&&<span className="message-avatar"><Bot size={18}/></span>}<div><p>{m.text}</p>{m.sources&&<div className="source-citations">{m.sources.map((s,j)=><button key={s}><span>{j+1}</span>{s}<ExternalLink size={13}/></button>)}</div>}</div></div>)}</div>
      {messages.length===1&&<div className="prompt-suggestions"><div className="prompt-heading"><span>可以这样问</span><small>{knowledgeScope} · 已为你推荐</small></div>{promptIdeas[knowledgeScope].map(x=><button key={x} onClick={()=>setPrompt(x)}><Sparkles size={15}/>{x}</button>)}</div>}
      <div className="chat-composer"><div className="scope-row"><span><FileText size={14}/>知识范围：<b>{knowledgeScope}</b></span><span>{model} · AI 回答不替代正式监管判断</span></div><label><textarea rows="2" value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="输入你的问题，Shift + Enter 换行"/><button onClick={send}><ArrowRight size={18}/></button></label></div>
    </section></div>
}

function FavoritesPage(){
  return <><PageHeader eyebrow="PERSONAL CENTER" title="收藏与历史" description="集中查看收藏、订阅、浏览记录和 AI 会话。" /><div className="tabs large-tabs"><button className="active">我的收藏</button><button>我的订阅</button><button>浏览历史</button><button>AI 会话</button></div><div className="saved-list">{documents.slice(0,3).map((x,i)=><article key={x.id}><span className="saved-icon"><FileText size={20}/></span><div><Badge tone="green">制度文档</Badge><h3>{x.title}</h3><p>{x.code} · {x.agency}</p></div><span className="saved-time">{i===0?'今天收藏':`${i+2}天前收藏`}</span><button className="icon-button"><Bookmark size={17} fill="currentColor"/></button></article>)}</div></>
}

function AdminDashboard(){
  const stats = useDashboardStats()
  const navigate = useNavigate()
  const quickActions = [
    [Upload,'上传制度文档','支持 PDF、Word、Excel','/admin/documents'],
    [FileBarChart,'配置监管报表','维护报表、字段和规则','/admin/reports'],
    [Activity,'新增监管指标','配置公式与指标释疑','/admin/metrics'],
    [FileCheck2,'发布内容','查看待发布与版本差异','/admin/publish'],
  ]
  const taskTarget = (task) => task.type === '报表版本' ? '/admin/reports' : task.type === '指标维护' ? '/admin/metrics' : '/admin/documents'
  return <><PageHeader eyebrow="ADMIN CONSOLE" title="管理概览" description="维护知识资产、处理发布任务并监控平台运行状态。" actions={<button className="button primary"><Plus size={16}/>新建内容</button>} />
    <div className="admin-alert"><ShieldCheck size={20}/><div><b>当前为管理员账号</b><span>你的新增、编辑、发布、下线和权限变更操作均会记录审计日志。</span></div><button>查看日志</button></div>
    <div className="stats-grid"><Stat label="知识对象" value={formatCount(stats.knowledge_objects)} meta={`制度近 7 日新增 ${formatCount(stats.new_documents_7d)}`} icon={Database} tone="green"/><Stat label="待发布" value={formatCount(stats.pending_publish)} meta="来自数据库状态统计" icon={Clock3} tone="amber"/><Stat label="解析任务" value={formatCount(stats.parsing_tasks)} meta="排队或处理中" icon={RefreshCw} tone="blue"/><Stat label="用户数" value={formatCount(stats.users)} meta="数据库实际数量" icon={Users} tone="red"/></div>
    <div className="dashboard-columns"><section className="panel"><div className="panel-head"><div><span className="eyebrow">TASKS</span><h2>最近维护任务</h2></div><button className="text-button" onClick={()=>navigate('/admin/tasks')}>全部任务 <ArrowRight size={14}/></button></div><div className="task-list">{adminTasks.map(x=><button className="task-list-row" key={x.title} onClick={()=>navigate(taskTarget(x))}><span className={`task-state ts-${x.status}`}>{x.status}</span><div><b>{x.title}</b><small>{x.type} · {x.owner} · {x.time}</small><i><em style={{width:`${x.progress}%`}}/></i></div><strong>{x.progress}%</strong><ArrowRight size={14}/></button>)}</div></section>
      <section className="panel"><div className="panel-head"><div><span className="eyebrow">CONTENT HEALTH</span><h2>内容健康度</h2></div><Badge tone="green">良好</Badge></div><div className="health-score"><div><b>92</b><small>/ 100</small></div><span>较上月 +3</span></div><div className="health-list"><div><span>来源完整率</span><i><em style={{width:'98%'}}/></i><b>98%</b></div><div><span>按期复核率</span><i><em style={{width:'91%'}}/></i><b>91%</b></div><div><span>关系完整率</span><i><em style={{width:'86%'}}/></i><b>86%</b></div></div></section></div>
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">QUICK ACTIONS</span><h2>快捷维护</h2></div></div><div className="quick-actions">{quickActions.map(([I,t,d,to])=><button key={t} onClick={()=>navigate(to)}><I size={22}/><span><b>{t}</b><small>{d}</small></span><ArrowRight size={16}/></button>)}</div></section>
  </>
}

function AdminTasks(){
  const navigate = useNavigate()
  const taskTarget = (task) => task.type === '报表版本' ? '/admin/reports' : task.type === '指标维护' ? '/admin/metrics' : '/admin/documents'
  return <><PageHeader eyebrow="TASK CENTER" title="维护任务" description="查看制度解析、报表配置、指标维护和发布流程中的全部任务。" actions={<button className="button ghost" onClick={()=>navigate('/admin')}><ChevronLeft size={15}/>返回管理概览</button>} />
    <div className="task-center-summary"><div><b>{adminTasks.length}</b><span>全部任务</span></div><div><b>{adminTasks.filter(x=>x.status==='处理中').length}</b><span>处理中</span></div><div><b>{adminTasks.filter(x=>x.status==='待发布').length}</b><span>待发布</span></div><div><b>{adminTasks.filter(x=>x.status==='已完成').length}</b><span>已完成</span></div></div>
    <section className="panel"><div className="panel-head"><div><span className="eyebrow">ALL TASKS</span><h2>全部维护任务</h2></div><button className="button ghost" onClick={()=>window.location.reload()}><RefreshCw size={15}/>刷新</button></div><div className="task-list task-list-expanded">{adminTasks.map(x=><button className="task-list-row" key={x.title} onClick={()=>navigate(taskTarget(x))}><span className={`task-state ts-${x.status}`}>{x.status}</span><div><b>{x.title}</b><small>{x.type} · {x.owner} · {x.time}</small><i><em style={{width:`${x.progress}%`}}/></i></div><strong>{x.progress}%</strong><ArrowRight size={15}/></button>)}</div></section>
  </>
}

function AdminContentCatalog({ type, title, eyebrow, description, icon: Icon, rows, columns }) {
  const [open,setOpen]=useState(false)
  const [editing,setEditing]=useState(false)
  const [importOpen,setImportOpen]=useState(false)
  const [selectedFile,setSelectedFile]=useState(null)
  const [importState,setImportState]=useState('idle')
  const fileInput=useRef(null)
  const [saved,setSaved]=useState(false)
  const [draft,setDraft]=useState({})
  const setField=(key,value)=>setDraft(prev=>({...prev,[key]:value}))
  const field=(key,label,placeholder,wide=false)=><label className={wide?'full':''}><span>{label}</span><input value={draft[key]||''} onChange={e=>setField(key,e.target.value)} placeholder={placeholder}/></label>
  const form={
    terms:<><div className="form-grid">{field('term','术语名称 *','如：核心一级资本充足率')}{field('english','英文名称','如：CET1 Capital Adequacy Ratio')}<label><span>分类 *</span><select value={draft.category || ''} onChange={e=>setField('category',e.target.value)}><option value="">请选择分类</option><option>国家标准</option><option>行业标准</option><option>监管指标</option><option>其他</option></select></label><label><span>来源依据 *</span><select value={draft.sourceMode || 'existing'} onChange={e=>setField('sourceMode',e.target.value)}><option value="existing">选择已有制度或标准</option><option value="custom">自定义来源依据</option></select>{draft.sourceMode === 'custom' ? <input value={draft.source || ''} onChange={e=>setField('source',e.target.value)} placeholder="输入来源依据名称"/> : <select value={draft.source || ''} onChange={e=>setField('source',e.target.value)}><option value="">请选择来源依据</option><option>商业银行资本管理办法</option><option>银行业金融机构数据治理指引</option><option>金融机构编码规范</option></select>}</label><RichTextField label="标准定义 *" value={draft.definition} onChange={value=>setField('definition',value)} placeholder="填写统一定义、适用范围和统计口径"/></div></>,
    penalties:<><div className="form-grid">{field('institution','被处罚机构 *','银行或机构名称')}{field('authority','监管机构 *','如：国家金融监督管理总局')}{field('date','处罚日期 *','YYYY-MM-DD')}{field('amount','处罚金额（万元）','如：120')}{field('violation','违规行为 *','填写主要违规事实',true)}{field('sourceUrl','源页面链接','https://...',true)}</div></>,
    annual:<><div className="form-grid">{field('institution','机构名称 *','银行或机构名称')}{field('year','报告年度 *','如：2025')}{field('reportType','报告类型 *','年度报告 / 社会责任报告')}{field('publishDate','发布日期','YYYY-MM-DD')}{field('region','地区','如：北京')}{field('file','报告文件','上传后显示文件名',true)}</div></>,
    topics:<><div className="form-grid">{field('title','专题名称 *','如：资本新规')}{field('category','专题分类 *','如：资本监管')}{field('description','专题说明 *','填写专题介绍和研究范围',true)}<label className="full checkbox-field"><input type="checkbox" checked={Boolean(draft.featured)} onChange={e=>setField('featured',e.target.checked)}/><span>设为首页最新专题</span></label></div></>,
  }
  const close=()=>{setOpen(false);setSaved(false);setEditing(false);setDraft({})}
  const beginEdit=(row)=>{
    const next = type === 'terms'
      ? {term: row[0], category: row[1]?.split(' · ')[0] || '', source: row[2], sourceMode: 'existing', definition: `<p>${row[0]}的监管定义和适用口径。</p>`}
      : type === 'penalties'
        ? {institution: row[0], authority: row[1]?.split(' · ')[0] || '', date: row[2]?.split(' · ')[0] || '', amount: row[2]?.split(' · ')[1]?.replace(' 万元','') || '', violation: row[3]}
        : type === 'annual'
          ? {institution: row[0], reportType: row[1], publishDate: row[2]?.split(' · ')[0] || '', file: row[2]?.split(' · ')[1] || '', status: row[3]}
          : {title: row[0], category: row[1]?.split(' · ')[0] || '', description: row[3] || ''}
    setDraft(next); setEditing(true); setSaved(false); setOpen(true)
  }
  const closeImport=()=>{setImportOpen(false);setSelectedFile(null);setImportState('idle')}
  const parseImport=async()=>{if(!selectedFile)return;setImportState('parsing');try{const formData=new FormData();formData.append('file',selectedFile);formData.append('content_type',type);const response=await fetch(`${API_BASE}/admin/content/import`,{method:'POST',body:formData});if(!response.ok)throw new Error('import failed');await response.json();setImportState('done')}catch{setImportState('error')}}
  return <><PageHeader eyebrow={eyebrow} title={title} description={description} actions={<><button className="button ghost" onClick={()=>setImportOpen(true)}><Upload size={16}/>批量导入</button><TemplateDownloadButton type={type}/><button className="button primary" onClick={()=>setOpen(true)}><Plus size={16}/>新增内容</button></>} />
    <div className="admin-tabs"><button className="active">全部内容 <span>{rows.length}</span></button><button>草稿 <span>3</span></button><button>待发布 <span>5</span></button><button>已发布 <span>{rows.length - 3}</span></button></div>
    <FilterBar placeholder={`搜索${title}名称、来源或关键词`}><Select label="状态"><option>已发布</option><option>草稿</option><option>待发布</option></Select><button className="button ghost"><RefreshCw size={15}/>刷新</button></FilterBar>
    <div className="table-wrap admin-table"><table><thead><tr><th><input type="checkbox"/></th><th>内容名称</th>{columns.map(column=><th key={column}>{column}</th>)}<th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row[0]}><td><input type="checkbox"/></td><td><div className="admin-content-name"><span><Icon size={16}/></span><b>{row[0]}</b></div></td>{row.slice(1).map((value,columnIndex)=><td key={`${row[0]}-${columnIndex}`}>{value}</td>)}<td><Badge tone={index === rows.length - 1 ? 'amber' : 'green'}>{index === rows.length - 1 ? '待发布' : '已发布'}</Badge></td><td>2026-10-{String(14 - (index % 5)).padStart(2,'0')}</td><td><div className="row-actions"><button title="编辑" onClick={()=>beginEdit(row)}><Edit3 size={15}/></button><button title="历史"><History size={15}/></button><button title="更多"><ChevronDown size={15}/></button></div></td></tr>)}</tbody></table></div>
    <Drawer open={open} onClose={close} title={`${editing ? '编辑' : '新增'}${title}`} subtitle="保存后进入草稿状态，管理员可继续关联、校验和发布" footer={saved?<button className="button primary" onClick={close}>完成</button>:<DrawerFormFooter onClose={close} onDraft={()=>setSaved(true)} onSubmit={()=>setSaved(true)} submitLabel="提交"/>}>
      {saved?<div className="correction-success"><Check size={28}/><b>内容草稿已保存</b><span>后续可在编辑、关联和发布流程中继续完善。</span></div>:<div className="admin-create-form">{form[type]}</div>}
    </Drawer>
    <Drawer open={importOpen} onClose={closeImport} title={`批量导入${title}`} subtitle="支持 Excel 模板批量导入，也支持 Word、PDF 自动识别相关内容" footer={importState==='done'?<button className="button primary" onClick={closeImport}>完成</button>:<><button className="button ghost" onClick={closeImport}>取消</button><button className="button primary" disabled={!selectedFile||importState==='parsing'} onClick={parseImport}><Upload size={15}/>{importState==='parsing'?'解析导入中…':'开始解析导入'}</button></>}>
      {importState==='done'?<div className="correction-success"><Check size={28}/><b>文件已接收并完成解析任务创建</b><span>系统将继续识别字段、正文、表格和来源信息，解析结果进入草稿区。</span></div>:<div className="import-drawer-content"><input ref={fileInput} className="hidden-file-input" type="file" accept=".xlsx,.xls,.doc,.docx,.pdf" onChange={e=>setSelectedFile(e.target.files?.[0]||null)}/><button className="import-dropzone" onClick={()=>fileInput.current?.click()}><Upload size={30}/><b>{selectedFile?selectedFile.name:'选择或拖入文件'}</b><span>支持 Excel、Word、PDF，单个文件不超过 100 MB</span><small>{selectedFile?`${Math.ceil(selectedFile.size/1024)} KB · 已准备解析`:'Excel 用于批量数据，Word/PDF 用于识别正文、标题和表格'}</small></button><div className="import-steps"><span className="active"><Upload size={13}/>接收文件</span><span><FileSearch size={13}/>识别格式</span><span><Database size={13}/>提取元素</span><span><Check size={13}/>生成草稿</span></div>{importState==='error'&&<p className="form-error">文件导入失败，请检查后端服务或文件格式后重试。</p>}</div>}
    </Drawer>
  </>
}

function AdminTerms(){
  const rows=[['金融机构编码','国家标准 · 基础数据','金融机构编码规范'],['监管数据','行业标准 · 数据治理','银行业金融机构数据治理指引'],['核心一级资本充足率','监管指标 · 资本监管','商业银行资本管理办法'],['流动性覆盖率','监管指标 · 流动性风险','商业银行流动性风险管理办法']]
  return <AdminContentCatalog type="terms" title="术语与标准" eyebrow="TERMS & STANDARDS" description="维护国家标准、行业标准和监管指标的术语定义、释疑与制度出处。" icon={Tags} rows={rows} columns={['分类','来源依据']}/>
}

function AdminPenalties(){
  const rows=penalties.slice(0,5).map(x=>[x.institution,`${x.authority} · ${x.region}`,`${x.date} · ${x.amount} 万元`,x.violation])
  return <AdminContentCatalog type="penalties" title="监管处罚" eyebrow="PENALTY CONTENT" description="维护监管处罚正文、违规行为标签、处罚依据和来源网页索引。" icon={AlertCircle} rows={rows} columns={['监管机构与地区','处罚日期与金额','违规行为']}/>
}

function AdminAnnualReports(){
  const rows=[['中国工商银行股份有限公司','2025 年度报告','2026-03-27 · 128.4 MB','已披露'],['招商银行股份有限公司','2025 年度报告','2026-03-25 · 86.7 MB','已披露'],['北京银行股份有限公司','2025 年度报告','2026-04-02 · 64.2 MB','已披露'],['上海农村商业银行股份有限公司','2025 年度报告','2026-03-30 · 72.1 MB','待更新']]
  return <AdminContentCatalog type="annual" title="年报披露" eyebrow="ANNUAL DISCLOSURES" description="维护银行年报、社会责任报告和披露资料，保留原文件及页码索引。" icon={FileText} rows={rows} columns={['报告类型','发布日期与文件','披露状态']}/>
}

function AdminTopics(){
  const rows=latestTopics.map(x=>[x.title,`${x.cat} · ${x.docs} 份制度`,`${x.metrics} 个指标 · 关联处罚案例`,x.desc])
  return <AdminContentCatalog type="topics" title="专题研究" eyebrow="RESEARCH TOPICS" description="维护专题研究的主题说明、关联知识对象、展示顺序和发布状态。" icon={BookOpen} rows={rows} columns={['专题分类','关联内容','摘要']}/>
}

function AdminDocuments(){
  const [upload,setUpload]=useState(false)
  const [editOpen,setEditOpen]=useState(false)
  const [editDraft,setEditDraft]=useState({})
  const [sourceMode,setSourceMode]=useState('file')
  const beginEdit=(item)=>{setEditDraft({title:item.title,code:item.code,topic:item.topic,agency:item.agency,status:item.status,summary:item.summary});setEditOpen(true)}
  return <><PageHeader eyebrow="CONTENT MANAGEMENT" title="制度法规管理" description="上传、解析、编辑、发布和维护制度法规及其源文件、版本和附件。" actions={<><TemplateDownloadButton type="documents"/><button className="button primary" onClick={()=>setUpload(true)}><Upload size={16}/>上传文档</button></>} />
    <div className="admin-tabs"><button className="active">全部文档 <span>3,284</span></button><button>草稿 <span>26</span></button><button>解析中 <span>7</span></button><button>待发布 <span>12</span></button><button>已发布 <span>3,214</span></button><button>已下线 <span>25</span></button></div>
    <FilterBar placeholder="搜索文档名称、文号或来源"><Select label="状态"><option>草稿</option><option>已发布</option></Select><button className="button ghost"><RefreshCw size={15}/>刷新</button></FilterBar>
    <div className="table-wrap admin-table"><table><thead><tr><th><input type="checkbox"/></th><th>文档名称</th><th>业务主题</th><th>状态</th><th>版本</th><th>更新时间</th><th>更新人</th><th>操作</th></tr></thead><tbody>{documents.map((x,i)=><tr key={x.id}><td><input type="checkbox"/></td><td><b>{x.title}</b><small className="block-small">{x.code}</small></td><td>{x.topic}</td><td><Badge tone={i===4?'amber':'green'}>{i===4?'待发布':'已发布'}</Badge></td><td>V{2+i}.0</td><td>2026-10-{String(14-i).padStart(2,'0')}</td><td>管理员</td><td><div className="row-actions"><button title="编辑" onClick={()=>beginEdit(x)}><Edit3 size={15}/></button><button title="历史"><History size={15}/></button><button title="更多"><ChevronDown size={15}/></button></div></td></tr>)}</tbody></table></div>
    <Drawer open={upload} onClose={()=>setUpload(false)} title="上传制度文档" subtitle="上传后系统将自动解析正文、目录、表格和附件" footer={<DrawerFormFooter onClose={()=>setUpload(false)} onDraft={()=>setUpload(false)} onSubmit={()=>setUpload(false)} draftLabel="保存草稿" submitLabel="提交"/>}>
      <div className="source-mode"><button className={sourceMode==='file'?'active':''} onClick={()=>setSourceMode('file')}><Upload size={15}/>上传文件</button><button className={sourceMode==='url'?'active':''} onClick={()=>setSourceMode('url')}><ExternalLink size={15}/>网页 URL</button></div>
      {sourceMode==='file' ? <div className="upload-zone"><Upload size={28}/><b>拖放文件到此处，或点击选择文件</b><span>支持 Word、PDF、Excel、HTML、TXT，单个文件不超过 100 MB</span><button className="button ghost">选择文件</button><small className="upload-retain">源文件将保留，可下载追溯</small></div> : <div className="url-source-zone"><ExternalLink size={27}/><b>录入制度或处罚网页地址</b><span>系统将抓取正文、目录、表格和页面元数据，并保留源网页索引。</span><input placeholder="https://example.gov.cn/..." /></div>}
      <div className="parse-pipeline"><span className="done"><Check size={13}/>提取来源</span><span><ArrowRight size={13}/>格式解析</span><span><ArrowRight size={13}/>目录识别</span><span><ArrowRight size={13}/>建立索引</span><span><ArrowRight size={13}/>预览发布</span></div>
      <div className="form-grid"><label><span>内容类型 *</span><select><option>监管制度</option><option>行政处罚</option><option>报表填写说明</option><option>报表表样</option></select></label><label><span>业务主题 *</span><select><option>资本监管</option><option>数据治理</option><option>流动性风险</option></select></label><label><span>发文机构 *</span><select><option>请选择</option><option>国家金融监督管理总局</option><option>中国人民银行</option><option>国家外汇管理局</option></select></label><label><span>效力状态 *</span><select><option>现行有效</option><option>即将生效</option><option>历史版本</option></select></label><label className="full"><span>版本或来源说明</span><input placeholder="填写版本号、来源网页标题或附件说明"/></label><label className="full"><span>处理备注</span><textarea rows="3" placeholder="填写解析、关联或发布前的处理说明"/></label></div>
      <div className="source-retention"><LockKeyhole size={16}/><span><b>源文件与源网页索引</b><small>解析后的网页版本用于检索和 AI 问答，原始文件或网页 URL 始终保留。</small></span><Badge tone="green">自动保留</Badge></div>
    </Drawer>
    <Drawer open={editOpen} onClose={()=>setEditOpen(false)} title="编辑制度文档" subtitle="修改后保存为新草稿版本，原版本继续保留" footer={<DrawerFormFooter onClose={()=>setEditOpen(false)} onDraft={()=>setEditOpen(false)} onSubmit={()=>setEditOpen(false)} submitLabel="提交"/>}>
      <div className="form-grid"><label className="full"><span>文档名称 *</span><input value={editDraft.title||''} onChange={e=>setEditDraft({...editDraft,title:e.target.value})}/></label><label><span>文号</span><input value={editDraft.code||''} onChange={e=>setEditDraft({...editDraft,code:e.target.value})}/></label><label><span>业务主题</span><input value={editDraft.topic||''} onChange={e=>setEditDraft({...editDraft,topic:e.target.value})}/></label><label><span>发文机构</span><input value={editDraft.agency||''} onChange={e=>setEditDraft({...editDraft,agency:e.target.value})}/></label><label><span>效力状态</span><select value={editDraft.status||''} onChange={e=>setEditDraft({...editDraft,status:e.target.value})}><option>现行有效</option><option>即将生效</option><option>历史版本</option></select></label><label className="full"><span>摘要</span><textarea rows="5" value={editDraft.summary||''} onChange={e=>setEditDraft({...editDraft,summary:e.target.value})}/></label></div>
    </Drawer>
  </>
}

function AdminReports(){
  const [selected,setSelected]=useState(reports[1])
  const [importOpen,setImportOpen]=useState(false)
  const [fieldEditOpen,setFieldEditOpen]=useState(false)
  const [fieldDraft,setFieldDraft]=useState({})
  const reportFields=['核心一级资本净额','一级资本净额','资本净额','风险加权资产','资本充足率']
  const beginFieldEdit=(name,index)=>{setFieldDraft({code:`F${String(index+1).padStart(4,'0')}`,name,dataType:index===4?'百分比':'数值',unit:index===4?'%':'万元',required:true});setFieldEditOpen(true)}
  return <><PageHeader eyebrow="REPORT CONFIGURATION" title="报表配置中心" description="配置报表体系、任务版本、表单、字段、维度和校验规则。" actions={<><button className="button ghost" onClick={()=>setImportOpen(true)}><Upload size={16}/>批量导入</button><TemplateDownloadButton type="reports"/><button className="button primary"><Plus size={16}/>新建报表任务</button></>} />
    <div className="notice"><AlertCircle size={17}/><span>等待业务方提供正式银行报表类型和清单后，将在此完成首批配置。</span></div>
    <div className="config-layout"><aside className="config-tree"><div className="tree-head"><b>报表体系</b><button className="icon-button"><Plus size={16}/></button></div>{['监管报送体系 A','监管报送体系 B','金融统计体系','客户风险监测体系'].map((x,i)=><div key={x}><button className={i===1?'active':''}><ChevronDown size={15}/><FileBarChart size={16}/>{x}<small>{[12,8,24,16][i]}</small></button>{i===1&&<div className="tree-children">{reports.slice(0,3).map(r=><button key={r.code} onClick={()=>setSelected(r)} className={selected.code===r.code?'active':''}>{r.name}</button>)}</div>}</div>)}</aside>
      <section className="config-main"><div className="config-head"><div><Badge tone="amber">{selected.status}</Badge><h2>{selected.name}</h2><p>{selected.code} · {selected.system} · 版本 {selected.version}</p></div><div><button className="button ghost"><History size={15}/>版本</button><button className="button primary"><FileCheck2 size={15}/>发布</button></div></div>
        <div className="config-steps">{['基本信息','表单配置','字段配置','维度代码','校验规则','关联关系','预览发布'].map((x,i)=><button className={i===2?'active':i<2?'done':''} key={x}><span>{i<2?<Check size={14}/>:i+1}</span>{x}</button>)}</div>
        <div className="config-toolbar"><label><Search size={15}/><input placeholder="搜索字段代码或名称"/></label><button className="button ghost"><Upload size={15}/>导入字段</button><button className="button primary"><Plus size={15}/>新增字段</button></div>
        <div className="table-wrap"><table><thead><tr><th>序号</th><th>字段代码</th><th>字段名称</th><th>数据类型</th><th>单位</th><th>必填</th><th>关联指标</th><th>操作</th></tr></thead><tbody>{reportFields.map((x,i)=><tr key={x}><td>{i+1}</td><td><code>F{String(i+1).padStart(4,'0')}</code></td><td><b>{x}</b></td><td>{i===4?'百分比':'数值'}</td><td>{i===4?'%':'万元'}</td><td><Check size={15} className="check-icon"/></td><td>{i===4?<Badge tone="green">CAP-001</Badge>:'—'}</td><td><div className="row-actions"><button title="编辑" onClick={()=>beginFieldEdit(x,i)}><Edit3 size={15}/></button><button title="更多"><ChevronDown size={15}/></button></div></td></tr>)}</tbody></table></div>
      </section></div><AdminImportDrawer type="reports" title="报表配置" open={importOpen} onClose={()=>setImportOpen(false)}/><Drawer open={fieldEditOpen} onClose={()=>setFieldEditOpen(false)} title="编辑报表字段" subtitle="维护字段定义、数据类型、单位和必填属性" footer={<DrawerFormFooter onClose={()=>setFieldEditOpen(false)} onDraft={()=>setFieldEditOpen(false)} onSubmit={()=>setFieldEditOpen(false)} submitLabel="提交"/>}><div className="form-grid"><label><span>字段代码 *</span><input value={fieldDraft.code||''} onChange={e=>setFieldDraft({...fieldDraft,code:e.target.value})}/></label><label><span>字段名称 *</span><input value={fieldDraft.name||''} onChange={e=>setFieldDraft({...fieldDraft,name:e.target.value})}/></label><label><span>数据类型</span><select value={fieldDraft.dataType||''} onChange={e=>setFieldDraft({...fieldDraft,dataType:e.target.value})}><option>数值</option><option>百分比</option><option>文本</option><option>日期</option></select></label><label><span>单位</span><input value={fieldDraft.unit||''} onChange={e=>setFieldDraft({...fieldDraft,unit:e.target.value})}/></label><label className="full checkbox-field"><input type="checkbox" checked={Boolean(fieldDraft.required)} onChange={e=>setFieldDraft({...fieldDraft,required:e.target.checked})}/><span>必填字段</span></label><label className="full"><span>字段定义</span><textarea rows="4" value={fieldDraft.definition||''} onChange={e=>setFieldDraft({...fieldDraft,definition:e.target.value})}/></label></div></Drawer>
  </>
}

function AdminMetrics(){
  const [importOpen,setImportOpen]=useState(false)
  const [editOpen,setEditOpen]=useState(false)
  const [editDraft,setEditDraft]=useState({})
  const beginEdit=(item)=>{setEditDraft({code:item.code,name:item.name,category:item.category,value:item.value,formula:item.formula,source:item.source});setEditOpen(true)}
  return <><PageHeader eyebrow="METRIC MANAGEMENT" title="指标与释疑" description="维护指标定义、公式、变量、监管要求、报表映射和常见问题。" actions={<><button className="button ghost" onClick={()=>setImportOpen(true)}><Upload size={16}/>批量导入</button><TemplateDownloadButton type="metrics"/><button className="button primary"><Plus size={16}/>新增指标</button></>} />
    <div className="admin-tabs"><button className="active">全部指标 <span>426</span></button><button>草稿 <span>9</span></button><button>待发布 <span>6</span></button><button>已发布 <span>411</span></button></div>
    <FilterBar placeholder="搜索指标名称、代码或公式变量"><Select label="指标主题"><option>资本监管</option><option>流动性风险</option></Select></FilterBar>
    <div className="metric-table table-wrap admin-table"><table><thead><tr><th>指标代码</th><th>指标名称</th><th>监管要求</th><th>公式状态</th><th>字段映射</th><th>释疑</th><th>状态</th><th>操作</th></tr></thead><tbody>{metrics.map((x,i)=><tr key={x.code}><td><code>{x.code}</code></td><td><b>{x.name}</b><small className="block-small">{x.category}</small></td><td>{x.value}</td><td><Badge tone="green"><Check size={12}/>已配置</Badge></td><td>{3+i} 个字段</td><td>{x.faq} 条</td><td><Badge tone={i===4?'amber':'green'}>{i===4?'待发布':'已发布'}</Badge></td><td><div className="row-actions"><button title="编辑" onClick={()=>beginEdit(x)}><Edit3 size={15}/></button><button title="历史"><History size={15}/></button></div></td></tr>)}</tbody></table></div>
  <AdminImportDrawer type="metrics" title="指标与释疑" open={importOpen} onClose={()=>setImportOpen(false)}/><Drawer open={editOpen} onClose={()=>setEditOpen(false)} title="编辑监管指标" subtitle="修改指标口径、公式和监管要求" footer={<DrawerFormFooter onClose={()=>setEditOpen(false)} onDraft={()=>setEditOpen(false)} onSubmit={()=>setEditOpen(false)} submitLabel="提交"/>}><div className="form-grid"><label><span>指标代码 *</span><input value={editDraft.code||''} onChange={e=>setEditDraft({...editDraft,code:e.target.value})}/></label><label><span>指标名称 *</span><input value={editDraft.name||''} onChange={e=>setEditDraft({...editDraft,name:e.target.value})}/></label><label><span>监管主题</span><input value={editDraft.category||''} onChange={e=>setEditDraft({...editDraft,category:e.target.value})}/></label><label><span>监管要求</span><input value={editDraft.value||''} onChange={e=>setEditDraft({...editDraft,value:e.target.value})}/></label><label className="full"><span>计算公式</span><textarea rows="3" value={editDraft.formula||''} onChange={e=>setEditDraft({...editDraft,formula:e.target.value})}/></label><label className="full"><span>制度依据</span><input value={editDraft.source||''} onChange={e=>setEditDraft({...editDraft,source:e.target.value})}/></label></div></Drawer></>
}

function AdminPublish(){
  const items=[...documents.slice(0,2).map((x,i)=>({name:x.title,type:'制度文档',version:`V${3+i}.0`,change:'更新条款结构及关联指标',time:`2026-10-${14-i}`,risk:i===0?'高':'中'})),{name:'监管报送体系 B 2026.2',type:'报表版本',version:'V2026.2',change:'新增 18 个字段、调整 6 条校验规则',time:'2026-10-12',risk:'高'},{name:'流动性覆盖率释疑',type:'指标释疑',version:'V1.3',change:'补充现金流出分类边界说明',time:'2026-10-11',risk:'低'}]
  return <><PageHeader eyebrow="PUBLISH CENTER" title="内容发布中心" description="查看待发布内容、版本差异，并执行发布、定时发布和下线。" actions={<button className="button primary"><FileCheck2 size={16}/>批量发布</button>} />
    <div className="publish-summary"><div><b>18</b><span>待发布</span></div><div><b>3</b><span>高影响变更</span></div><div><b>5</b><span>计划今日发布</span></div><div><b>42</b><span>本月已发布</span></div></div>
    <div className="admin-tabs"><button className="active">待发布 <span>18</span></button><button>定时发布 <span>4</span></button><button>发布记录 <span>286</span></button><button>已下线 <span>25</span></button></div>
    <div className="publish-list">{items.map(x=><article key={x.name}><input type="checkbox"/><span className="publish-icon">{x.type==='制度文档'?<FileText/>:x.type==='报表版本'?<FileBarChart/>:<Activity/>}</span><div><div><Badge tone={x.risk==='高'?'red':x.risk==='中'?'amber':'neutral'}>{x.risk}影响</Badge><span>{x.type}</span></div><h3>{x.name}</h3><p>{x.version} · {x.change}</p></div><span className="publish-time"><small>提交时间</small>{x.time}</span><div className="publish-actions"><button className="button ghost">查看差异</button><button className="button primary">发布</button></div></article>)}</div>
  </>
}

function AdminCorrections(){
  const [items,setItems]=useState([])
  const [status,setStatus]=useState('all')
  const [loading,setLoading]=useState(true)
  const load=()=>{setLoading(true);const query=status==='all'?'':`?status=${status}`;fetch(`${API_BASE}/admin/corrections${query}`).then(r=>r.ok?r.json():Promise.reject()).then(data=>setItems(data.items||[])).catch(()=>setItems([])).finally(()=>setLoading(false))}
  useEffect(()=>{load()},[status])
  const update=(id,next)=>fetch(`${API_BASE}/admin/corrections/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:next,admin_note:next==='resolved'?'已核对并完成修正':next==='rejected'?'经核对暂不采纳':'管理员已接收，正在核对'})}).then(()=>load())
  const resourceMap={document:'制度文档',report:'监管报表',penalty:'监管处罚'}
  const statusMap={pending:['待处理','amber'],processing:['处理中','blue'],resolved:['已解决','green'],rejected:['已驳回','neutral']}
  return <><PageHeader eyebrow="CORRECTION CENTER" title="纠错处理" description="接收用户提交的制度、报表和处罚信息纠错，完成核对、修正和处理留痕。" actions={<button className="button ghost" onClick={load}><RefreshCw size={15}/>刷新</button>} />
    <div className="admin-tabs correction-tabs">{[['all','全部'],['pending','待处理'],['processing','处理中'],['resolved','已解决']].map(([key,label])=><button key={key} className={status===key?'active':''} onClick={()=>setStatus(key)}>{label}</button>)}</div>
    {loading?<div className="panel loading-note">正在加载纠错记录…</div>:items.length===0?<EmptyNote icon={ClipboardCheck} title="暂无纠错记录" text="用户提交纠错后，记录会在这里出现。"/>:<div className="correction-admin-list">{items.map(item=>{const state=statusMap[item.status]||['未知','neutral'];return <article className="panel correction-admin-item" key={item.id}><div className="correction-admin-head"><div><Badge tone={state[1]}>{state[0]}</Badge><Badge tone="blue">{resourceMap[item.resource_type]||item.resource_type}</Badge><span>{item.correction_type}</span></div><small>{new Date(item.created_at).toLocaleString('zh-CN')}</small></div><h3>{item.resource_title}</h3><p>{item.description}</p><div className="correction-admin-meta"><span>提交人：{item.reporter_name||'匿名用户'}</span><span>联系方式：{item.reporter_contact||'未提供'}</span>{item.suggested_value&&<span>建议修改：{item.suggested_value}</span>}</div><footer>{item.source_url&&<a href={item.source_url} target="_blank" rel="noreferrer"><ExternalLink size={13}/>查看依据</a>}<div>{item.status==='pending'&&<button className="button ghost" onClick={()=>update(item.id,'processing')}>开始处理</button>}{item.status==='pending'||item.status==='processing'?<><button className="button secondary" onClick={()=>update(item.id,'rejected')}>驳回</button><button className="button primary" onClick={()=>update(item.id,'resolved')}><Check size={14}/>修正完成</button></>:<span className="admin-note">{item.admin_note||'已完成处理'}</span>}</div></footer></article>})}</div>}
  </>
}

function AdminUsers(){
  const users=[['张明','zhangming@bank.local','管理员','风险管理部','正常','今天 09:18'],['李静','lijing@bank.local','普通用户','合规管理部','正常','昨天 16:42'],['王晨','wangchen@bank.local','普通用户','财务会计部','正常','10月12日'],['陈宇','chenyu@bank.local','管理员','数据管理部','正常','10月11日'],['周敏','zhoumin@bank.local','普通用户','内部审计部','已停用','9月28日']]
  const [editOpen,setEditOpen]=useState(false)
  const [editDraft,setEditDraft]=useState({})
  const beginEdit=(item)=>{setEditDraft({name:item[0],email:item[1],role:item[2],department:item[3],status:item[4]});setEditOpen(true)}
  return <><PageHeader eyebrow="USER MANAGEMENT" title="用户管理" description="平台仅设置管理员和普通用户两类角色。" actions={<><button className="button ghost"><Upload size={16}/>批量导入</button><TemplateDownloadButton type="users"/><button className="button primary"><Plus size={16}/>新增用户</button></>} />
    <div className="stats-grid three"><Stat label="全部用户" value="126" meta="本月新增 8" icon={Users} tone="blue"/><Stat label="管理员" value="4" meta="统一后台权限" icon={UserCog} tone="red"/><Stat label="普通用户" value="122" meta="仅查询已发布内容" icon={Search} tone="green"/></div>
    <FilterBar placeholder="搜索姓名、邮箱或部门"><Select label="角色"><option>管理员</option><option>普通用户</option></Select><Select label="状态"><option>正常</option><option>已停用</option></Select></FilterBar>
    <div className="table-wrap admin-table"><table><thead><tr><th>用户</th><th>部门</th><th>角色</th><th>状态</th><th>最后登录</th><th>操作</th></tr></thead><tbody>{users.map((x,i)=><tr key={x[1]}><td><div className="user-cell"><span>{x[0].slice(-1)}</span><div><b>{x[0]}</b><small>{x[1]}</small></div></div></td><td>{x[3]}</td><td><Badge tone={x[2]==='管理员'?'red':'blue'}>{x[2]}</Badge></td><td><Badge tone={x[4]==='正常'?'green':'neutral'}>{x[4]}</Badge></td><td>{x[5]}</td><td><div className="row-actions"><button title="编辑" onClick={()=>beginEdit(x)}><Edit3 size={15}/></button><button title="更多"><ChevronDown size={15}/></button></div></td></tr>)}</tbody></table></div>
    <Drawer open={editOpen} onClose={()=>setEditOpen(false)} title="编辑用户" subtitle="管理员可调整用户角色、部门和状态" footer={<DrawerFormFooter onClose={()=>setEditOpen(false)} onDraft={()=>setEditOpen(false)} onSubmit={()=>setEditOpen(false)} submitLabel="提交"/>}><div className="form-grid"><label><span>姓名 *</span><input value={editDraft.name||''} onChange={e=>setEditDraft({...editDraft,name:e.target.value})}/></label><label><span>邮箱 *</span><input value={editDraft.email||''} onChange={e=>setEditDraft({...editDraft,email:e.target.value})}/></label><label><span>角色 *</span><select value={editDraft.role||''} onChange={e=>setEditDraft({...editDraft,role:e.target.value})}><option>管理员</option><option>普通用户</option></select></label><label><span>部门</span><input value={editDraft.department||''} onChange={e=>setEditDraft({...editDraft,department:e.target.value})}/></label><label><span>状态</span><select value={editDraft.status||''} onChange={e=>setEditDraft({...editDraft,status:e.target.value})}><option>正常</option><option>已停用</option></select></label></div></Drawer>
  </>
}

function AdminSettings(){
  const groups=[{icon:Tags,title:'基础字典',desc:'发布机构、制度层级、业务主题、机构类型、频度与单位',count:'18 类字典'},{icon:Search,title:'搜索配置',desc:'同义词、停用词、搜索提升词和热门搜索',count:'286 条规则'},{icon:LockKeyhole,title:'安全策略',desc:'登录策略、会话超时、文件限制与多因素认证',count:'12 项配置'},{icon:Database,title:'任务与存储',desc:'解析、OCR、索引、导入导出任务和对象存储',count:'7 个任务'},{icon:Bot,title:'AI 配置',desc:'知识范围、模型参数、提示词与引用规则',count:'5 项配置'},{icon:History,title:'审计日志',desc:'查看登录、编辑、发布、回滚和用户变更记录',count:'12,486 条'}]
  const [crawlEnabled, setCrawlEnabled] = useState(true)
  const [crawlEditOpen,setCrawlEditOpen]=useState(false)
  const [crawlDraft,setCrawlDraft]=useState({})
  const crawlSources=[
    ['Iweicha 监管处罚案例库', '监管处罚', 'http://iweicha.com/smp/smp10.aspx?sys_code=MS599&def=bpc.xml&version=0&fun_type=7', '每日 02:00', '成功 · 50 条'],
    ['人民银行监管处罚案例库', '监管处罚', 'http://iweicha.com/smp/smp10.aspx?sys_code=MS599&def=ppc.xml&fun_type=1-002&version=0', '每日 02:00', '成功 · 50 条'],
    ['国家外汇管理局监管处罚案例库', '监管处罚', 'http://iweicha.com/smp/smp10.aspx?sys_code=MS599&def=fpc.xml&fun_type=1-002&version=0', '每日 02:00', '成功 · 50 条'],
    ['国家金融监督管理总局制度发布', '监管发文', 'https://www.cbirc.gov.cn/cn/view/pages/ItemList.html?itemPId=915', '每日 02:00', '成功 · 126 条'],
    ['国家金融监督管理总局行政处罚', '监管处罚', 'https://www.cbirc.gov.cn/cn/view/pages/ItemList.html?itemPId=4115', '每日 02:30', '成功 · 38 条'],
    ['中国人民银行政策法规', '监管发文', 'https://www.pbc.gov.cn/goutongjiaoliu/113456/113469/index.html', '每日 03:00', '成功 · 64 条'],
  ]
  return <><PageHeader eyebrow="SYSTEM SETTINGS" title="系统配置" description="管理平台基础字典、搜索、安全、任务、AI 和审计设置。" />
    <div className="settings-grid">{groups.map(g=><button key={g.title}><span className="settings-icon"><g.icon size={21}/></span><div><h3>{g.title}</h3><p>{g.desc}</p><small>{g.count}</small></div><ChevronRight size={17}/></button>)}</div>
    <section className="panel crawler-panel"><div className="panel-head"><div><span className="eyebrow">SOURCE CRAWLER</span><h2>监管来源目录爬取</h2><p>每日抓取固定监管发文和监管处罚目录，解析后更新制度库与处罚库。</p></div><label className="switch-row"><span>每日自动爬取</span><input type="checkbox" checked={crawlEnabled} onChange={e=>setCrawlEnabled(e.target.checked)}/><i/></label></div>
      <div className="crawler-toolbar"><span><RefreshCw size={15}/>下次执行：2026-10-19 02:00 · 时区 Asia/Shanghai</span><button className="button ghost"><Plus size={15}/>新增 URL 目录</button></div>
      <div className="crawler-list">{crawlSources.map(([name,type,url,time,result])=><article key={url}><span className="crawler-icon"><ExternalLink size={17}/></span><div className="crawler-main"><div><b>{name}</b><Badge tone="blue">{type}</Badge></div><ExternalSourceLink href={url} className="crawler-source-link"><ExternalLink size={12}/>{url}</ExternalSourceLink><small>执行频率：{time} · 最近抓取：{result}</small></div><div className="crawler-actions"><button className="button ghost" onClick={()=>{setCrawlDraft({name,type,url,time});setCrawlEditOpen(true)}}>编辑</button><button className="icon-button" title="立即执行"><RefreshCw size={15}/></button></div></article>)}</div>
      <div className="crawler-note"><ShieldCheck size={16}/><span>仅抓取管理员配置的目录页及其详情页；每条内容保留源 URL、抓取时间、内容摘要和版本指纹，重复内容不会重复入库。</span></div>
    </section>
    <section className="panel full-panel"><div className="panel-head"><div><span className="eyebrow">PLATFORM INFO</span><h2>平台信息</h2></div></div><div className="settings-form"><label><span>平台名称</span><input defaultValue="银规智库"/></label><label><span>默认语言</span><select><option>简体中文</option></select></label><label><span>内容复核提醒</span><select><option>到期前 7 天</option></select></label><label><span>默认可见范围</span><select><option>全体用户可见</option><option>仅管理员可见</option></select></label></div><div className="panel-actions"><button className="button primary">保存设置</button></div></section>
    <Drawer open={crawlEditOpen} onClose={()=>setCrawlEditOpen(false)} title="编辑爬取目录" subtitle="修改目录名称、来源类型、URL 和每日执行时间" footer={<DrawerFormFooter onClose={()=>setCrawlEditOpen(false)} onDraft={()=>setCrawlEditOpen(false)} onSubmit={()=>setCrawlEditOpen(false)} submitLabel="提交"/>}><div className="form-grid"><label className="full"><span>目录名称 *</span><input value={crawlDraft.name||''} onChange={e=>setCrawlDraft({...crawlDraft,name:e.target.value})}/></label><label><span>内容类型</span><select value={crawlDraft.type||''} onChange={e=>setCrawlDraft({...crawlDraft,type:e.target.value})}><option>监管发文</option><option>监管处罚</option></select></label><label><span>执行时间</span><input value={crawlDraft.time||''} onChange={e=>setCrawlDraft({...crawlDraft,time:e.target.value})}/></label><label className="full"><span>URL 目录 *</span><input value={crawlDraft.url||''} onChange={e=>setCrawlDraft({...crawlDraft,url:e.target.value})}/></label></div></Drawer>
  </>
}

function Placeholder({type}){
  const map={annual:['年报与披露资料库','AnnualReportsPage'],topics:['专题研究','TopicsPage']}
  return <EmptyNote title={map[type]?.[0]||'功能页面'} text="原型页面正在整理中"/>
}

export default function App(){
  return <AppShell><Routes>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/search" element={<SearchPage/>}/>
    <Route path="/knowledge/docs" element={<DocumentsPage/>}/>
    <Route path="/knowledge/docs/:id" element={<DocumentDetailPage/>}/>
    <Route path="/knowledge/terms" element={<TermsPage/>}/>
    <Route path="/knowledge/terms/:term" element={<TermDetailPage/>}/>
    <Route path="/knowledge/constraints" element={<ConstraintsPage/>}/>
    <Route path="/knowledge/frameworks" element={<FrameworkPage/>}/>
    <Route path="/regulatory/reports" element={<ReportsPage/>}/>
    <Route path="/regulatory/metrics" element={<MetricsPage/>}/>
    <Route path="/regulatory/quality" element={<QualityPage/>}/>
    <Route path="/analysis/institutions" element={<InstitutionsPage/>}/>
    <Route path="/analysis/penalties" element={<PenaltiesPage/>}/>
    <Route path="/analysis/penalties/:id" element={<PenaltyDetailPage/>}/>
    <Route path="/analysis/annual-reports" element={<AnnualReportsPage/>}/>
    <Route path="/analysis/topics" element={<TopicsPage/>}/>
    <Route path="/ai" element={<AIPage/>}/>
    <Route path="/favorites" element={<FavoritesPage/>}/>
    <Route path="/admin" element={<AdminDashboard/>}/>
    <Route path="/admin/tasks" element={<AdminTasks/>}/>
    <Route path="/admin/documents" element={<AdminDocuments/>}/>
    <Route path="/admin/terms" element={<AdminTerms/>}/>
    <Route path="/admin/penalties" element={<AdminPenalties/>}/>
    <Route path="/admin/annual-reports" element={<AdminAnnualReports/>}/>
    <Route path="/admin/topics" element={<AdminTopics/>}/>
    <Route path="/admin/reports" element={<AdminReports/>}/>
    <Route path="/admin/metrics" element={<AdminMetrics/>}/>
    <Route path="/admin/publish" element={<AdminPublish/>}/>
    <Route path="/admin/corrections" element={<AdminCorrections/>}/>
    <Route path="/admin/users" element={<AdminUsers/>}/>
    <Route path="/admin/settings" element={<AdminSettings/>}/>
    <Route path="*" element={<HomePage/>}/>
  </Routes></AppShell>
}
