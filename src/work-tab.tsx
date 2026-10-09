import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  GripVertical,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

type Status = 'To Do' | 'In Progress' | 'Submit Work' | 'Documentation Review' | 'Done';
type DocStatus = 'Not Started' | 'Work Submitted' | 'Generating' | 'Needs Review' | 'Approved';
export type WorkTask = {
  id: string;
  title: string;
  status: Status;
  priority: 'Highest' | 'High' | 'Medium' | 'Low';
  assignee: string;
  initials: string;
  points: number;
  labels: string[];
  doc: DocStatus;
  description: string;
  epic: string;
  project?: string;
  assignedDate?: string;
  dueDate?: string;
  estimateHours?: number;
  submission?: {evidence: string[]};
};

type SectionDef = {id: string; name: string; predicate: (t: WorkTask) => boolean};

const DEFAULT_SECTIONS: SectionDef[] = [
  {id: 'todo', name: 'To do', predicate: t => t.status === 'To Do'},
  {id: 'active', name: 'In progress', predicate: t => t.status === 'In Progress'},
  {id: 'submit', name: 'Ready to submit', predicate: t => t.status === 'Submit Work'},
  {id: 'review', name: 'In documentation review', predicate: t => t.status === 'Documentation Review'},
];

type SortKey = 'due' | 'name' | 'priority' | 'assignee' | 'status';
type GroupKey = 'section' | 'assignee' | 'status' | 'priority' | 'project';

function priorityRank(p: WorkTask['priority']) {
  return {Highest: 0, High: 1, Medium: 2, Low: 3}[p];
}

function Avatar({name, initials}: {name: string; initials: string}) {
  return (
    <span className={'avatar a' + initials[0]} title={name}>
      {initials}
    </span>
  );
}

function WorkBoard({tasks, open, moveTask}: {tasks: WorkTask[]; open: (task: WorkTask) => void; moveTask: (id: string, status: Status, beforeId: string | null) => void}) {
  const statuses: Status[] = ['To Do', 'In Progress', 'Submit Work', 'Documentation Review'];
  const [dragId,setDragId]=useState<string|null>(null);
  const [dropTarget,setDropTarget]=useState<{status:Status,beforeId:string|null}|null>(null);
  const drop=(status:Status,beforeId:string|null)=>{if(dragId)moveTask(dragId,status,beforeId);setDragId(null);setDropTarget(null)};
  return <div className="work-task-board">{statuses.map(status => {const items=tasks.filter(t=>t.status===status);return <section className={dropTarget?.status===status?'drop-target':''} key={status} onDragOver={e => {e.preventDefault();e.dataTransfer.dropEffect='move'}} onDrop={()=>drop(status,dropTarget?.status===status?dropTarget.beforeId:null)}><h3>{status}<small>{items.length}</small></h3>{items.map((t,index)=><React.Fragment key={t.id}>{dropTarget?.status===status&&dropTarget.beforeId===t.id&&<div className="work-drop-indicator"/>}<button className={dragId===t.id?'is-dragging':''} draggable onDragStart={e=>{e.dataTransfer.setData('text/task-id',t.id);e.dataTransfer.effectAllowed='move';setDragId(t.id)}} onDragOver={e=>{e.preventDefault();const rect=e.currentTarget.getBoundingClientRect();const beforeId=e.clientY>rect.top+rect.height/2?(items[index+1]?.id||null):t.id;if(beforeId!==dragId)setDropTarget({status,beforeId})}} onDragEnd={()=>{setDragId(null);setDropTarget(null)}} onClick={()=>open(t)}><b>{t.title}</b><span>{t.id} · {t.priority}</span></button></React.Fragment>)}{dropTarget?.status===status&&dropTarget.beforeId===null&&<div className="work-drop-indicator"/>}</section>})}</div>;
}

function WorkCalendar({tasks, open}: {tasks: WorkTask[]; open: (task: WorkTask) => void}) {
  const scheduled=tasks.filter(t=>t.dueDate||t.assignedDate);
  const firstScheduled=scheduled[0]?.dueDate||scheduled[0]?.assignedDate;
  const [month,setMonth]=useState(()=>{const value=firstScheduled?new Date(firstScheduled+'T12:00:00'):new Date();return new Date(value.getFullYear(),value.getMonth(),1)});
  const monthStart=new Date(month.getFullYear(),month.getMonth(),1);
  const gridStart=new Date(monthStart); gridStart.setDate(1-monthStart.getDay());
  const days=Array.from({length:42},(_,index)=>{const date=new Date(gridStart);date.setDate(gridStart.getDate()+index);return date});
  const keyFor=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const tasksFor=(date:Date)=>scheduled.filter(task=>(task.dueDate||task.assignedDate)===keyFor(date));
  const today=keyFor(new Date());
  return <section className="work-month-calendar"><header><button type="button" onClick={()=>setMonth(current=>new Date(current.getFullYear(),current.getMonth()-1,1))}>‹</button><h3>{month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h3><button type="button" onClick={()=>setMonth(current=>new Date(current.getFullYear(),current.getMonth()+1,1))}>›</button></header><div className="work-calendar-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span key={day}>{day}</span>)}</div><div className="work-calendar-grid">{days.map(date=>{const key=keyFor(date),items=tasksFor(date),inMonth=date.getMonth()===month.getMonth();return <div className={'work-calendar-day '+(!inMonth?'other-month':'')+(key===today?' today':'')} key={key}><time dateTime={key}>{date.getDate()}</time>{items.map(task=><button type="button" key={task.id} onClick={()=>open(task)} title={task.title}><b>{task.title}</b><small>{task.status}{task.estimateHours!==undefined?` · ${task.estimateHours}h`:''}</small></button>)}</div>})}</div>{!scheduled.length&&<p className="work-calendar-hint">Add an assigned date or due date to place a task on this calendar.</p>}</section>;
}

function WorkDashboard({tasks}: {tasks: WorkTask[]}) {
  const completed=tasks.filter(task=>task.status==='Done').length;
  const incomplete=tasks.length-completed;
  const today=new Date().toISOString().slice(0,10);
  const overdue=tasks.filter(task=>task.status!=='Done'&&task.dueDate&&task.dueDate<today).length;
  const statusGroups=[['To do',tasks.filter(task=>task.status==='To Do').length],['In progress',tasks.filter(task=>task.status==='In Progress').length],['Ready to submit',tasks.filter(task=>task.status==='Submit Work').length],['In review',tasks.filter(task=>task.status==='Documentation Review').length]] as const;
  const projects=Array.from(new Set(tasks.map(task=>task.project||'AI H Platform'))).map(project=>[project,tasks.filter(task=>(task.project||'AI H Platform')===project).length] as const);
  const card=(title:string,value:number,filtered:boolean)=><section className="work-dashboard-stat"><span>{title}</span><b>{value}</b><small>≡ {filtered?'1 Filter':'No Filters'}</small></section>;
  const barChart=(title:string,data:readonly (readonly [string,number])[])=>{const max=Math.max(1,...data.map(([,count])=>count));return <section className="work-dashboard-panel"><h3>{title}</h3><div className="work-bar-chart">{data.map(([label,count])=><div key={label}><i style={{height:`${Math.max(2,(count/max)*100)}%`}}/><b>{count}</b><small>{label}</small></div>)}</div><footer>≡ 1 Filter <button>See all</button></footer></section>};
  return <div className="work-dashboard-grid"><div className="work-dashboard-stats">{card('Total completed tasks',completed,true)}{card('Total incomplete tasks',incomplete,true)}{card('Total overdue tasks',overdue,true)}{card('Total tasks',tasks.length,false)}</div><div className="work-dashboard-panels">{barChart('Total tasks by section',statusGroups)}<section className="work-dashboard-panel completion"><h3>Tasks by completion status this upcoming month</h3><div className="work-donut" style={{'--complete':`${tasks.length?Math.round((completed/tasks.length)*360):0}deg`} as React.CSSProperties}><b>{tasks.length}</b><small>tasks</small></div><div className="work-donut-legend"><i/> Incomplete <span>{incomplete}</span><i className="complete"/> Completed <span>{completed}</span></div><footer>≡ 2 Filters <button>See all</button></footer></section>{barChart('Total tasks by project',projects)}<section className="work-dashboard-panel trend"><h3>Task completion over time</h3><div className="work-trend"><svg viewBox="0 0 600 180" preserveAspectRatio="none"><path d="M0 150 H520 L600 70 V150 Z"/><path className="line" d="M0 150 H520 L600 70"/></svg><span>Completed work</span></div><footer>≡ 2 Filters <button>See all</button></footer></section></div></div>;
}

function useClickAway(ref: React.RefObject<HTMLElement | null>, onAway: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onAway();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [active, onAway, ref]);
}

export function WorkList({
  tasks,
  mine,
  projectName,
  open,
  onCreate,
  onQuickCreate,
  onStart,
  onSubmit,
}: {
  tasks: WorkTask[];
  mine: boolean;
  projectName: string;
  open: (t: WorkTask) => void;
  onCreate: () => void;
  onQuickCreate: (title: string) => Promise<void>;
  onStart: (id: string) => void;
  onSubmit: (task: WorkTask) => void;
}) {
  const [viewTab, setViewTab] = useState<'tasks' | 'completed'>('tasks');
  const [taskView, setTaskView] = useState<'list' | 'board' | 'calendar' | 'dashboard' | 'files'>('list');
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | null>(null);
  const [filterPriority, setFilterPriority] = useState<WorkTask['priority'] | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [groupBy, setGroupBy] = useState<GroupKey>('section');
  const [menu, setMenu] = useState<'filter' | 'sort' | 'group' | 'options' | null>(null);
  const [inlineSection, setInlineSection] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Status>>({});
  const [taskOrder, setTaskOrder] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [rowDropTarget, setRowDropTarget] = useState<{group: string; beforeId: string} | null>(null);
  const [listDragId, setListDragId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useClickAway(menuRef, () => setMenu(null), menu !== null);
  useClickAway(searchRef, () => setSearchOpen(false), searchOpen);

  const allTasks = useMemo(() => tasks.map(task => ({...task, status: statusOverrides[task.id] || task.status})), [tasks, statusOverrides]);
  const changeStatus = (id: string, status: Status) => {
    setStatusOverrides(current => ({...current, [id]: status}));
    fetch('/api/tasks/' + id, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status})}).then(response => {if (!response.ok) throw new Error('Status update was rejected')}).catch(() => setStatusOverrides(current => ({...current, [id]: tasks.find(task => task.id === id)?.status || 'To Do'})));
  };
  const moveTask = (id: string, status: Status, beforeId: string | null) => {
    setTaskOrder(current => {
      const order = current.length ? current : allTasks.map(task => task.id);
      const remaining = order.filter(taskId => taskId !== id);
      const targetIndex = beforeId ? remaining.indexOf(beforeId) : -1;
      const insertAt = targetIndex >= 0 ? targetIndex : remaining.length;
      return [...remaining.slice(0, insertAt), id, ...remaining.slice(insertAt)];
    });
    changeStatus(id, status);
  };

  const scoped = useMemo(() => {
    let list = allTasks;
    if (!mine) list = list.filter(t => (t.project || 'AI H Platform') === projectName);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        t =>
          `${t.title} ${t.id} ${t.assignee} ${t.status} ${t.epic} ${t.labels.join(' ')} ${t.project || ''}`
            .toLowerCase()
            .includes(q),
      );
    if (filterAssignee) list = list.filter(t => t.assignee === filterAssignee);
    if (filterStatus) list = list.filter(t => t.status === filterStatus);
    if (filterPriority) list = list.filter(t => t.priority === filterPriority);
    if (filterProject) list = list.filter(t => (t.project || 'AI H Platform') === filterProject);
    if (viewTab === 'tasks') list = list.filter(t => t.status !== 'Done');
    else list = list.filter(t => t.status === 'Done');
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'assignee') return a.assignee.localeCompare(b.assignee);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'priority') return priorityRank(a.priority) - priorityRank(b.priority);
      return a.id.localeCompare(b.id);
    });
    if (!taskOrder.length) return sorted;
    const rank = new Map(taskOrder.map((id, index) => [id, index]));
    return [...sorted].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  }, [
    allTasks,
    mine,
    projectName,
    search,
    filterAssignee,
    filterStatus,
    filterPriority,
    filterProject,
    viewTab,
    sortBy,
    taskOrder,
  ]);

  const assignees = useMemo(() => Array.from(new Set(allTasks.map(t => t.assignee))).sort(), [allTasks]);
  const projects = useMemo(
    () => Array.from(new Set(allTasks.map(t => t.project || 'AI H Platform'))).sort(),
    [allTasks],
  );

  const toggleCollapse = (id: string) => setCollapsed(c => ({...c, [id]: !c[id]}));

  const submitInline = async (_sectionId: string) => {
    const title = inlineTitle.trim();
    if (!title) {
      setInlineSection(null);
      return;
    }
    await onQuickCreate(title);
    setInlineTitle('');
    setInlineSection(null);
  };

  const renderRow = (t: WorkTask, groupId: string) => (
    <div
      className={'work-asana-row' + (t.status === 'Done' ? ' done' : '') + (rowDropTarget?.beforeId === t.id ? ' is-drop-before' : '')}
      key={t.id}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={e => {e.dataTransfer.setData('text/task-id', t.id);e.dataTransfer.effectAllowed='move';setListDragId(t.id)}}
      onDragOver={e => {e.preventDefault();e.dataTransfer.dropEffect='move';if(listDragId!==t.id)setRowDropTarget({group:groupId,beforeId:t.id})}}
      onDragEnd={() => {setListDragId(null);setDropTarget(null);setRowDropTarget(null)}}
      onClick={() => open(t)}
      onKeyDown={e => e.key === 'Enter' && open(t)}
    >
      <span className="work-asana-drag" aria-hidden="true"><GripVertical size={14}/></span>
      <div className="work-asana-name">
        <span>{t.title}</span>
        <small>{t.id}</small>
      </div>
      <span className="work-asana-assignee work-asana-cell-muted">
        <Avatar name={t.assignee} initials={t.initials} />
      </span>
      <span className="work-asana-project" title={t.project || projectName}>
        {(t.project || projectName).slice(0, 22)}
      </span>
      <span className={'work-asana-status work-asana-priority ' + t.priority.toLowerCase()}>{t.priority}</span>
      <span className="work-asana-due">{t.dueDate?new Date(t.dueDate+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'}):'—'}</span>
      <span className={'work-asana-doc-dot' + (t.doc !== 'Not Started' ? ' has-doc' : '')}>{t.doc === 'Not Started' ? 'Not started' : t.doc}</span>
      <span className="work-asana-visibility">Only me</span>
      {t.status === 'To Do' ? <button type="button" className="work-asana-row-actions work-asana-row-cta" onClick={e => {e.stopPropagation();onStart(t.id)}}>Start</button> : t.status === 'In Progress' || t.status === 'Submit Work' ? <button type="button" className="work-asana-row-actions work-asana-row-cta" onClick={e => {e.stopPropagation();onSubmit(t)}}>Submit</button> : <button type="button" className="work-asana-row-actions" aria-label="Open task" onClick={e => {e.stopPropagation();open(t)}}><MoreHorizontal size={16} /></button>}
    </div>
  );

  const groupedBlocks = useMemo(() => {
    if (groupBy !== 'section') {
      const keyFn = (t: WorkTask) => {
        if (groupBy === 'assignee') return t.assignee;
        if (groupBy === 'status') return t.status;
        if (groupBy === 'priority') return t.priority;
        return t.project || projectName;
      };
      const map = new Map<string, WorkTask[]>();
      scoped.forEach(t => {
        const k = keyFn(t);
        map.set(k, [...(map.get(k) || []), t]);
      });
      return Array.from(map.entries()).map(([name, items]) => ({id: name, name, items}));
    }
    return sections
      .map(s => ({id: s.id, name: s.name, items: scoped.filter(s.predicate)}))
      .filter(g => g.items.length > 0 || viewTab === 'tasks');
  }, [groupBy, scoped, sections, viewTab, projectName]);

  const title = mine ? 'My tasks' : projectName;
  const icon = mine ? 'M' : projectName.slice(0, 1).toUpperCase();

  return (
    <section className={'work-asana work-view-'+taskView} aria-label="Work tasks" onClick={e => e.stopPropagation()}>
      <div className="work-asana-inner">
        <header className="work-asana-header">
          <div className="work-asana-title-row">
            <span className="work-asana-icon">{icon}</span>
            <button type="button" className="work-asana-title-btn">
              {title}
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <nav className="work-asana-subtabs work-asana-view-switcher" aria-label="Task views">
          {([['list','List'],['board','Board'],['calendar','Calendar'],['dashboard','Dashboard'],['files','Files']] as const).map(([id,label])=><button type="button" key={id} className={taskView===id?'active':''} onClick={()=>setTaskView(id)}>{label}</button>)}
        </nav>

        {taskView==='board'&&<WorkBoard tasks={scoped} open={open} moveTask={moveTask}/>} 
        {taskView==='calendar'&&<WorkCalendar tasks={scoped} open={open}/>} 
        {taskView==='dashboard'&&<WorkDashboard tasks={allTasks.filter(task=>mine||((task.project||'AI H Platform')===projectName))}/>}
        {taskView==='files'&&<div className="work-task-files">{scoped.flatMap(t=>(t.submission?.evidence||[]).map(file=>({file,task:t}))).map(({file,task})=><button key={task.id+file} onClick={()=>open(task)}><Sparkles size={14}/><span><b>{file}</b><small>{task.id} · {task.title}</small></span></button>)}{!scoped.some(t=>t.submission?.evidence?.length)&&<div className="work-task-empty"><b>No submitted files</b><span>Evidence attached during work submission will appear here.</span></div>}</div>}

        <div className="work-asana-toolbar">
          <div className="work-asana-toolbar-left">
            <div className="work-asana-add">
              <button type="button" className="work-asana-add-main" onClick={() => setInlineSection('__top__')}>
                <Plus size={14} /> Add task
              </button>
              <button type="button" className="work-asana-add-split" aria-label="More create options" onClick={onCreate}>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
          <div className="work-asana-toolbar-right" ref={menuRef}>
            <div className="work-asana-tool-wrap">
              <button
                type="button"
                className={'work-asana-tool' + (menu === 'filter' ? ' open' : '')}
                onClick={() => setMenu(m => (m === 'filter' ? null : 'filter'))}
              >
                <SlidersHorizontal size={14} /> <span>Filter</span>
              </button>
              {menu === 'filter' && (
                <div className="work-asana-menu">
                  <div className="work-asana-menu-label">Assignee</div>
                  <button type="button" className={!filterAssignee ? 'selected' : ''} onClick={() => setFilterAssignee(null)}>
                    All assignees
                  </button>
                  {assignees.map(a => (
                    <button
                      key={a}
                      type="button"
                      className={filterAssignee === a ? 'selected' : ''}
                      onClick={() => setFilterAssignee(a)}
                    >
                      {a}
                    </button>
                  ))}
                  <div className="work-asana-menu-label">Status</div>
                  {(['To Do', 'In Progress', 'Submit Work', 'Documentation Review', 'Done'] as Status[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      className={filterStatus === s ? 'selected' : ''}
                      onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                    >
                      {s}
                    </button>
                  ))}
                  <div className="work-asana-menu-label">Priority</div>
                  {(['Highest', 'High', 'Medium', 'Low'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      className={filterPriority === p ? 'selected' : ''}
                      onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                    >
                      {p}
                    </button>
                  ))}
                  <div className="work-asana-menu-label">Project</div>
                  {projects.map(p => (
                    <button
                      key={p}
                      type="button"
                      className={filterProject === p ? 'selected' : ''}
                      onClick={() => setFilterProject(filterProject === p ? null : p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="work-asana-tool-wrap">
              <button
                type="button"
                className={'work-asana-tool' + (menu === 'sort' ? ' open' : '')}
                onClick={() => setMenu(m => (m === 'sort' ? null : 'sort'))}
              >
                <ArrowUpDown size={14} /> <span>Sort</span>
              </button>
              {menu === 'sort' && (
                <div className="work-asana-menu">
                  {(
                    [
                      ['name', 'Name'],
                      ['priority', 'Priority'],
                      ['assignee', 'Assignee'],
                      ['status', 'Status'],
                      ['due', 'Created'],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={sortBy === key ? 'selected' : ''}
                      onClick={() => {
                        setSortBy(key);
                        setMenu(null);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="work-asana-tool-wrap">
              <button
                type="button"
                className={'work-asana-tool' + (menu === 'group' ? ' open' : '')}
                onClick={() => setMenu(m => (m === 'group' ? null : 'group'))}
              >
                <LayoutGrid size={14} /> <span>Group</span>
              </button>
              {menu === 'group' && (
                <div className="work-asana-menu">
                  {(
                    [
                      ['section', 'Section'],
                      ['assignee', 'Assignee'],
                      ['status', 'Status'],
                      ['priority', 'Priority'],
                      ['project', 'Project'],
                    ] as [GroupKey, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={groupBy === key ? 'selected' : ''}
                      onClick={() => {
                        setGroupBy(key);
                        setMenu(null);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="work-asana-tool-wrap">
              <button
                type="button"
                className={'work-asana-tool' + (menu === 'options' ? ' open' : '')}
                onClick={() => setMenu(m => (m === 'options' ? null : 'options'))}
              >
                <MoreHorizontal size={14} /> <span>Options</span>
              </button>
              {menu === 'options' && (
                <div className="work-asana-menu"><button type="button" onClick={() => {setViewTab('completed');setMenu(null)}}>View completed work</button></div>
              )}
            </div>
            <div className="work-asana-search-wrap" ref={searchRef}>
              <button type="button" className="work-asana-tool" onClick={() => setSearchOpen(o => !o)} aria-label="Search tasks">
                <Search size={14} />
              </button>
              {searchOpen && (
                <div className="work-asana-search-pop">
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search tasks…"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {inlineSection === '__top__' && (
          <div className="work-asana-inline-create">
            <span className="work-asana-check-btn" />
            <input
              autoFocus
              value={inlineTitle}
              onChange={e => setInlineTitle(e.target.value)}
              placeholder="Write a task name"
              onKeyDown={e => {
                if (e.key === 'Enter') void submitInline('__top__');
                if (e.key === 'Escape') {
                  setInlineSection(null);
                  setInlineTitle('');
                }
              }}
              onBlur={() => void submitInline('__top__')}
            />
          </div>
        )}

        <div className="work-asana-table-wrap">
          <div className="work-asana-cols">
            <span>Name</span>
            <span>Due date</span>
            <span>Collaborators</span>
            <span>Projects</span>
            <span>Task visibility</span>
            <span>Priority</span>
            <span>Docs</span>
            <span />
          </div>

          {scoped.length === 0 && (
            <div className="work-asana-empty">
              <Check size={24} strokeWidth={1.5} />
              <b>No tasks match</b>
              <span>Adjust filters or add a task to get started.</span>
            </div>
          )}

          {groupedBlocks.map(group => {
            const isCollapsed = collapsed[group.id];
            const dropStatus: Record<string, Status> = {todo: 'To Do', active: 'In Progress', submit: 'Submit Work', review: 'Documentation Review'};
            return (
              <div className={'work-asana-section '+(dropTarget===group.id?'drop-target':'')} key={group.id} onDragOver={e=>{if(dropStatus[group.id]){e.preventDefault();e.dataTransfer.dropEffect='move';setDropTarget(group.id)}}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)){setDropTarget(null);setRowDropTarget(null)}}} onDrop={e=>{const id=e.dataTransfer.getData('text/task-id');const beforeId=rowDropTarget?.group===group.id?rowDropTarget.beforeId:null;if(id&&dropStatus[group.id])moveTask(id,dropStatus[group.id],beforeId);setListDragId(null);setDropTarget(null);setRowDropTarget(null)}}>
                <div className="work-asana-section-head">
                  <button
                    type="button"
                    className={'chevron' + (isCollapsed ? ' collapsed' : '')}
                    onClick={() => toggleCollapse(group.id)}
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <span>{group.name}</span>
                  <span className="work-asana-section-count">{group.items.length}</span>
                </div>
                {!isCollapsed && (
                  <>
                    {group.items.map(task=>renderRow(task,group.id))}
                    {viewTab === 'tasks' && (
                      <>
                        {inlineSection === group.id ? (
                          <div className="work-asana-inline-create">
                            <span className="work-asana-check-btn" />
                            <input
                              autoFocus
                              value={inlineTitle}
                              onChange={e => setInlineTitle(e.target.value)}
                              placeholder="Write a task name"
                              onKeyDown={e => {
                                if (e.key === 'Enter') void submitInline(group.id);
                                if (e.key === 'Escape') {
                                  setInlineSection(null);
                                  setInlineTitle('');
                                }
                              }}
                              onBlur={() => void submitInline(group.id)}
                            />
                          </div>
                        ) : (
                          <button type="button" className="work-asana-add-inline" onClick={() => setInlineSection(group.id)}>
                            Add task
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}
