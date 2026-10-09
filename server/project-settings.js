export const projectIds=['AI H Platform','E-Commerce System','Mobile Banking','Internal Tools'];
export function defaultSettings(project){
 const lead=({'AI H Platform':'Ahmed','E-Commerce System':'Sara','Mobile Banking':'Omar','Internal Tools':'Lina'})[project]||'Ahmed';
 return {details:{name:project,key:({'AI H Platform':'AIH','E-Commerce System':'EC','Mobile Banking':'MB','Internal Tools':'IT'})[project]||'PRJ',description:''},members:[['Ahmed','Ahmed Hassan','AH'],['Sara','Sara Khalil','SA'],['Omar','Omar Nasser','OM'],['Lina','Lina Saad','LI'],['Yousef','Yousef Ahmad','YO']].map(([name,fullName,initials])=>({name,fullName,initials,role:name===lead?'Project lead':'Contributor'})),issueTypes:{names:['Task','Story','Bug','Documentation'],defaultType:'Task'},workflows:{defaultStatus:'To Do',blockIncompleteDependencies:true,allowReopen:true},notifications:{enabled:true,taskUpdates:true,documentation:true},documentation:{defaultTemplate:'technical',requireApproval:true},ai:{style:'Clear and technical',instructions:'Use clear technical language. Include implementation, configuration, testing, and security considerations when relevant.'}};
}
export function getSettings(db,project){return db.projectSettings?.[project]||defaultSettings(project)}
export function validateSettings(value,db,project){
 const fail=message=>{throw Object.assign(new Error(message),{status:400})};
 if(!value||typeof value!=='object')fail('Invalid settings.');
 const text=(v,max=200)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 if(!text(value.details?.name,100)||!text(value.details?.key,12)||!/^[A-Z][A-Z0-9]*$/.test(value.details.key)||typeof value.details.description!=='string'||value.details.description.length>5000)fail('Enter a project name, an uppercase key (up to 12 letters/numbers), and a description up to 5,000 characters.');
 for(const other of projectIds.filter(id=>id!==project)){const details=getSettings(db,other).details;if(details.name.toLowerCase()===value.details.name.trim().toLowerCase()||details.key===value.details.key)fail('Another project already uses this name or key.')}
 if(!Array.isArray(value.members)||!value.members.length||value.members.length>100||value.members.some(m=>!m||!text(m.name,60)||!text(m.fullName,100)||!text(m.initials,3)||!['Project lead','Contributor','Reviewer'].includes(m.role))||new Set(value.members.map(m=>m.name.trim().toLowerCase())).size!==value.members.length||!value.members.some(m=>m.role==='Project lead'))fail('Use unique member names and keep at least one project lead.');
 const removed=getSettings(db,project).members.filter(m=>!value.members.some(n=>n.name.trim()===m.name));
 if(removed.some(m=>db.tasks.some(t=>t.project===project&&t.assignee===m.name)))fail('Reassign this member’s tasks before removing them.');
 if(!Array.isArray(value.issueTypes?.names)||!value.issueTypes.names.length||value.issueTypes.names.length>20||value.issueTypes.names.some(n=>!text(n,40))||new Set(value.issueTypes.names.map(n=>n.trim().toLowerCase())).size!==value.issueTypes.names.length||!value.issueTypes.names.includes(value.issueTypes.defaultType))fail('Add unique issue types and select an available default.');
 if(!['To Do','In Progress'].includes(value.workflows?.defaultStatus))fail('Choose a valid initial task status.');
 for(const [section,keys] of [['workflows',['blockIncompleteDependencies','allowReopen']],['notifications',['enabled','taskUpdates','documentation']],['documentation',['requireApproval']]])for(const key of keys)if(typeof value[section]?.[key]!=='boolean')fail('Invalid '+section+' setting.');
 if(!db.documentTemplates.some(t=>t.id===value.documentation.defaultTemplate))fail('Choose an available documentation structure.');
 if(!['Clear and technical','Concise','Detailed architecture'].includes(value.ai?.style)||typeof value.ai.instructions!=='string'||value.ai.instructions.length>8000)fail('Choose an AI style and keep instructions under 8,000 characters.');
 return {details:{name:value.details.name.trim(),key:value.details.key,description:value.details.description.trim()},members:value.members.map(({name,fullName,initials,role})=>({name:name.trim(),fullName:fullName.trim(),initials:initials.trim().toUpperCase(),role})),issueTypes:{names:value.issueTypes.names.map(n=>n.trim()),defaultType:value.issueTypes.defaultType.trim()},workflows:{defaultStatus:value.workflows.defaultStatus,blockIncompleteDependencies:value.workflows.blockIncompleteDependencies,allowReopen:value.workflows.allowReopen},notifications:{enabled:value.notifications.enabled,taskUpdates:value.notifications.taskUpdates,documentation:value.notifications.documentation},documentation:{defaultTemplate:value.documentation.defaultTemplate,requireApproval:value.documentation.requireApproval},ai:{style:value.ai.style,instructions:value.ai.instructions.trim()}};
}
export function transitionError(db,task,status){
 const settings=getSettings(db,task.project);
 if(!['To Do','In Progress','Submit Work','Documentation Review','Done'].includes(status))return 'Unknown task status.';
 if(task.status==='Done'&&status!=='Done'&&!settings.workflows.allowReopen)return 'Reopening completed tasks is disabled in project settings.';
 if(status==='Done'){
  const blockers=(task.dependencies||[]).filter(d=>d.type==='blockedBy').map(d=>db.tasks.find(t=>t.id===d.issueId)).filter(t=>t&&t.status!=='Done');
  if(settings.workflows.blockIncompleteDependencies&&blockers.length)return `Blocked by ${blockers.map(t=>t.id).join(', ')}. Complete prerequisite work first.`;
  if(settings.documentation.requireApproval&&task.doc!=='Approved')return 'Approve the generated documentation before completing this task.';
 }
 return null;
}
export function registerSettingsRoutes(app,{read,save}){
 app.get('/api/projects',(_,res)=>{const db=read();res.json(projectIds.map(id=>({id,...getSettings(db,id)})))});
 app.get('/api/project-settings/:project',(req,res)=>{if(!projectIds.includes(req.params.project))return res.status(404).json({error:'Project not found'});res.json(getSettings(read(),req.params.project))});
 app.put('/api/project-settings/:project',(req,res)=>{try{const project=req.params.project;if(!projectIds.includes(project))return res.status(404).json({error:'Project not found'});const db=read();const value=validateSettings(req.body,db,project);db.projectSettings={...db.projectSettings,[project]:value};save(db);res.json(value)}catch(e){res.status(e.status||500).json({error:e.status?e.message:'Could not save project settings.'})}});
 app.put('/api/document-templates/:id',(req,res)=>{const db=read(),template=db.documentTemplates.find(t=>t.id===req.params.id);if(!template)return res.status(404).json({error:'Structure not found'});const {name,bestFor,sections}=req.body||{};if(typeof name!=='string'||!name.trim()||name.length>150||typeof bestFor!=='string'||!Array.isArray(sections)||!sections.length||sections.length>30||sections.some(s=>typeof s!=='string'||!s.trim()||s.length>200))return res.status(400).json({error:'Enter a name and 1–30 nonempty sections.'});Object.assign(template,{name:name.trim(),bestFor:bestFor.slice(0,1000),sections:sections.map(s=>s.trim())});save(db);res.json(template)});
 app.delete('/api/document-templates/:id',(req,res)=>{const db=read(),id=req.params.id;if(projectIds.some(p=>getSettings(db,p).documentation.defaultTemplate===id))return res.status(409).json({error:'Choose another default structure in every project using this one before deleting it.'});if(!db.documentTemplates.some(t=>t.id===id))return res.status(404).json({error:'Structure not found'});db.documentTemplates=db.documentTemplates.filter(t=>t.id!==id);save(db);res.json({ok:true})});
}

export function shouldNotify(db,project,kind){const prefs=getSettings(db,project).notifications;return prefs.enabled&&Boolean(prefs[kind])}
