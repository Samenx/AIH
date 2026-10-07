import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Vercel functions can only write to /tmp. Local development keeps durable JSON in the project.
const dbFile = process.env.VERCEL ? '/tmp/aih-data.json' : path.join(root, 'server', 'data.json');
app.use(express.json());

const initial = { tasks: [
  ['AIH-102','Implement Google OAuth authentication','In Progress','High','Ahmed','AH',5,['authentication','backend'],'Work Submitted','Authentication','Implement secure OAuth sign-in and account linking with Google for the platform.'],
  ['AIH-108','Design workspace invitation flow','To Do','Medium','Sara','SA',3,['design','onboarding'],'Not Started','Workspace','Create the invitation experience for administrators and new team members.'],
  ['AIH-109','Add session refresh token rotation','In Progress','Highest','Omar','OM',8,['security','api'],'Needs Review','Authentication','Add rotation and expiry validation for all refresh sessions.'],
  ['AIH-110','Create audit-log event schema','Documentation Review','High','Lina','LI',5,['database','api'],'Needs Review','Platform','Define events, retention and query patterns for audit history.'],
  ['AIH-111','Build project activity timeline','Done','Medium','Yousef','YO',3,['frontend'],'Approved','Workspace','Expose meaningful project activity in a concise timeline.'],
  ['AIH-112','Configure rate limiting middleware','Submit Work','High','Ahmed','AH',5,['security','backend'],'Not Started','Platform','Protect public API endpoints with tiered request limits.'],
  ['AIH-113','Mobile navigation accessibility pass','To Do','Low','Sara','SA',2,['accessibility','frontend'],'Not Started','Mobile','Audit keyboard and screen reader paths across mobile navigation.'],
  ['AIH-114','Refactor notification preferences','Done','Medium','Lina','LI',5,['frontend','settings'],'Approved','Workspace','Allow granular per-channel notification preference controls.'],
  ['AIH-115','Add webhook delivery retries','Documentation Review','High','Omar','OM',8,['api','reliability'],'Generating','Platform','Implement exponential retry queue and delivery observability.'],
  ['AIH-116','Fix duplicate member import','To Do','High','Yousef','YO',3,['bug','backend'],'Not Started','Workspace','Prevent duplicate memberships during bulk CSV import.'],
  ['AIH-117','Build password reset journey','Done','High','Ahmed','AH',5,['authentication','frontend'],'Approved','Authentication','Deliver a complete password reset and account recovery journey.'],
  ['AIH-118','Add transaction export endpoint','Documentation Review','Medium','Omar','OM',5,['api','reporting'],'Needs Review','Reporting','Expose a CSV export endpoint for account transactions.'],
  ['AIH-119','Implement biometric sign-in','In Progress','High','Lina','LI',8,['mobile','security'],'Work Submitted','Mobile','Enable biometric authentication for supported mobile devices.'],
  ['AIH-120','Create deployment runbook','Done','Medium','Yousef','YO',3,['deployment','documentation'],'Approved','Operations','Document production deployment, rollback, and verification steps.'],
  ['AIH-121','Add invoice payment retry queue','Submit Work','Highest','Sara','SA',8,['payments','reliability'],'Not Started','Payments','Retry failed payment collection safely with clear operational visibility.'],
  ['AIH-122','Improve dashboard loading state','To Do','Low','Ahmed','AH',2,['frontend','ux'],'Not Started','Workspace','Create useful loading and empty states for workspace pages.'],
  ['AIH-123','Migrate customer preference table','Done','High','Omar','OM',5,['database','migration'],'Approved','Data platform','Move customer preference data to the normalized schema.'],
  ['AIH-124','Create merchant onboarding checklist','Documentation Review','Medium','Lina','LI',3,['onboarding','frontend'],'Needs Review','Merchant tools','Guide merchants through required setup steps.'],
  ['AIH-125','Add incident alert routing','In Progress','Highest','Yousef','YO',5,['alerts','platform'],'Generating','Operations','Route platform alerts to the correct on-call responder.'],
  ['AIH-126','Audit API error messages','Done','Medium','Sara','SA',3,['api','quality'],'Approved','Platform','Standardize actionable API error responses across services.']
].map(([id,title,status,priority,assignee,initials,points,labels,doc,epic,description])=>({id,title,status,priority,assignee,initials,points,labels,doc,epic,description,project:projectFor(id),dependencies:dependencyFor(id),submission:demoSubmission(id),documentation:doc==='Approved'?{generatedAt:'2026-10-06T09:30:00.000Z',approved:true}:undefined,createdAt:new Date().toISOString()})), documentTemplates:[
  {id:'technical',name:'Technical implementation guide',bestFor:'Engineering features and platform changes',sections:['Overview','Purpose','Implementation','Architecture','Configuration','Testing','Security considerations']},
  {id:'sales',name:'Sales activity report',bestFor:'Sales calls, pipeline updates, and account progress',sections:['Executive summary','Accounts contacted','Activity completed','Key findings','Opportunities','Next steps']},
  {id:'analysis',name:'Business analysis report',bestFor:'Analysis, recommendations, and stakeholder decisions',sections:['Objective','Methodology','Findings','Impact','Recommendations','Next steps']},
  {id:'handover',name:'Client handover guide',bestFor:'Client delivery and operational handover',sections:['Scope delivered','How to use','Configuration','Known limitations','Support contacts','Next steps']}
], notifications: [] };
function projectFor(id){return ({'AIH-102':'AI H Platform','AIH-108':'Internal Tools','AIH-109':'AI H Platform','AIH-110':'AI H Platform','AIH-111':'Internal Tools','AIH-112':'AI H Platform','AIH-113':'Mobile Banking','AIH-114':'Internal Tools','AIH-115':'E-Commerce System','AIH-116':'E-Commerce System','AIH-117':'AI H Platform','AIH-118':'Mobile Banking','AIH-119':'Mobile Banking','AIH-120':'Internal Tools','AIH-121':'E-Commerce System','AIH-122':'AI H Platform','AIH-123':'E-Commerce System','AIH-124':'E-Commerce System','AIH-125':'AI H Platform','AIH-126':'AI H Platform'})[id]||'AI H Platform'}
function dependencyFor(id){return ({'AIH-102':[{type:'blockedBy',issueId:'AIH-109'}],'AIH-110':[{type:'blocks',issueId:'AIH-115'}],'AIH-115':[{type:'blockedBy',issueId:'AIH-110'}],'AIH-117':[{type:'blocks',issueId:'AIH-102'}],'AIH-121':[{type:'blockedBy',issueId:'AIH-118'}],'AIH-124':[{type:'blockedBy',issueId:'AIH-121'}],'AIH-125':[{type:'relatesTo',issueId:'AIH-112'}]})[id]||[]}
function demoSubmission(id){const samples={
 'AIH-111':{summary:'Built the activity timeline UI, added activity event formatting, and covered loading and empty states.',evidence:['activity-timeline-before-after.mp4','timeline-component.tsx','activity-empty-state.png'],repository:'aih/platform',branch:'feature/activity-timeline',pullRequest:'#142 Activity timeline'},
 'AIH-114':{summary:'Refactored notification preferences into reusable controls and added validation for each delivery channel.',evidence:['notification-settings.png','notification-preferences.tsx','preference-test-results.pdf'],repository:'aih/platform',branch:'refactor/notification-preferences',pullRequest:'#151 Notification preferences'},
 'AIH-117':{summary:'Implemented the password reset request, token validation, password update, and success states with test coverage.',evidence:['Screenshot evidence','Code evidence','Video evidence'],repository:'aih/platform',branch:'feature/password-reset',pullRequest:'#164 Password reset flow'},
 'AIH-120':{summary:'Created and validated a production deployment runbook with rollback steps and post-deployment checks.',evidence:['File evidence','Screenshot evidence'],repository:'aih/internal-tools',branch:'docs/deployment-runbook',pullRequest:'#72 Deployment runbook'},
 'AIH-123':{summary:'Migrated preferences to the normalized table, backfilled existing records, and verified reporting queries.',evidence:['Code evidence','File evidence'],repository:'aih/commerce',branch:'migration/customer-preferences',pullRequest:'#203 Preference migration'},
 'AIH-126':{summary:'Audited public API errors, added standardized error codes, and updated API contract tests.',evidence:['Code evidence','Screenshot evidence'],repository:'aih/platform',branch:'chore/api-errors',pullRequest:'#217 API error audit'}
 };return samples[id]};
function read(){ if(!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify(initial,null,2)); const db=JSON.parse(fs.readFileSync(dbFile,'utf8')); let changed=false;if(!db.documentTemplates){db.documentTemplates=initial.documentTemplates;changed=true}db.tasks.forEach(t=>{if(!t.project){t.project=projectFor(t.id);changed=true}if(!t.dependencies){t.dependencies=dependencyFor(t.id);changed=true}if(!t.submission&&demoSubmission(t.id)){t.submission={...demoSubmission(t.id),submittedAt:'2026-10-06T09:30:00.000Z'};changed=true}});initial.tasks.forEach(sample=>{if(!db.tasks.some(t=>t.id===sample.id)){db.tasks.push(sample);changed=true}});if(changed)save(db);return db; }
function save(db){ fs.writeFileSync(dbFile, JSON.stringify(db,null,2)); }
function notice(db,message){ db.notifications.unshift({id:Date.now().toString(),message,createdAt:new Date().toISOString(),read:false}); db.notifications=db.notifications.slice(0,30); }

app.get('/api/health',(_,res)=>res.json({ok:true}));
app.get('/api/document-templates',(_,res)=>res.json(read().documentTemplates));
app.post('/api/document-templates',(req,res)=>{const db=read();const template={id:`custom-${Date.now()}`,name:req.body.name, bestFor:req.body.bestFor||'Custom employee-defined work',sections:req.body.sections||[]};db.documentTemplates.push(template);save(db);res.status(201).json(template)});
app.get('/api/tasks',(req,res)=>{let tasks=read().tasks;const q=String(req.query.q||'').toLowerCase();if(q)tasks=tasks.filter(t=>JSON.stringify(t).toLowerCase().includes(q));res.json(tasks)});
app.post('/api/tasks',(req,res)=>{const db=read();const task={id:`AIH-${117+db.tasks.length}`,assignee:'Ahmed',initials:'AH',doc:'Not Started',epic:'Platform',project:'AI H Platform',createdAt:new Date().toISOString(),...req.body};db.tasks.unshift(task);notice(db,`You created ${task.id}`);save(db);res.status(201).json(task)});
app.patch('/api/tasks/:id',(req,res)=>{const db=read(),task=db.tasks.find(t=>t.id===req.params.id);if(!task)return res.status(404).json({error:'Task not found'});if(req.body.status==='Done'){const blockers=(task.dependencies||[]).filter(d=>d.type==='blockedBy').map(d=>db.tasks.find(t=>t.id===d.issueId)).filter(Boolean).filter(t=>t.status!=='Done');if(blockers.length)return res.status(409).json({error:`Blocked by ${blockers.map(t=>t.id).join(', ')}`})}Object.assign(task,req.body);notice(db,`${task.id} updated`);save(db);res.json(task)});
app.post('/api/tasks/:id/submission',(req,res)=>{const db=read(),task=db.tasks.find(t=>t.id===req.params.id);if(!task)return res.status(404).json({error:'Task not found'});task.submission={...req.body,submittedAt:new Date().toISOString()};task.doc='Work Submitted';notice(db,`Work submitted for ${task.id}`);save(db);res.json(task)});
app.post('/api/tasks/:id/generate-documentation',(req,res)=>{const db=read(),task=db.tasks.find(t=>t.id===req.params.id);if(!task)return res.status(404).json({error:'Task not found'});task.doc='Needs Review';task.status='Documentation Review';task.documentation={content:req.body.content||`# ${task.title}\n\n## Overview\nGenerated technical documentation for ${task.id}.`,aiInstructions:req.body.aiInstructions||'',documentStructure:req.body.documentStructure||'Technical implementation guide',customSections:req.body.customSections||'',generatedAt:new Date().toISOString(),approved:false};notice(db,`AI generated documentation for ${task.id}`);save(db);res.json(task)});
app.post('/api/tasks/:id/approve-documentation',(req,res)=>{const db=read(),task=db.tasks.find(t=>t.id===req.params.id);if(!task)return res.status(404).json({error:'Task not found'});task.doc='Approved';task.documentation={...(task.documentation||{}),approved:true,approvedAt:new Date().toISOString()};notice(db,`Documentation approved for ${task.id}`);save(db);res.json(task)});
app.get('/api/notifications',(_,res)=>res.json(read().notifications));
if (!process.env.VERCEL) {
  app.use(express.static(path.join(root,'dist')));
  app.get(/.*/,(_,res)=>res.sendFile(path.join(root,'dist','index.html')));
  app.listen(process.env.PORT||3001,()=>console.log('AI H API running on http://localhost:3001'));
}
export default app;
