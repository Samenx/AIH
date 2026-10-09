const fs = require('fs');
const path = require('path');

const sections = [
  ['AI H Application Guide', [
    'Product, workflow, and technical reference',
    'Version 1.0 | October 2026',
    '',
    'AI H is a project-workspace application that combines issue tracking, sprint planning, employee work submission, and AI-assisted documentation. It is designed to give teams one place to plan delivery, complete work, retain implementation knowledge, and review quality.',
    '',
    'This guide describes the application as implemented in this workspace: its user-facing areas, common workflows, state model, and supporting API.'
  ]],
  ['1. Product purpose', [
    'AI H connects day-to-day delivery work with durable project knowledge. Teams create and prioritize issues, move them through a delivery workflow, attach evidence when work is complete, and generate documentation from that submission.',
    '',
    'The product is particularly useful for engineering and cross-functional teams that need a lightweight project system without losing the context behind completed work.',
    '',
    'Core outcomes:',
    '- Give each contributor a focused view of assigned work.',
    '- Give project leads a shared view of progress, risk, and sprint execution.',
    '- Preserve supporting evidence and implementation decisions.',
    '- Generate and review documentation as a natural part of finishing work.'
  ]],
  ['2. Main navigation and workspace', [
    'The application shell has a persistent sidebar, a project selector in the header, notifications, and global search access. The sidebar contains the primary workspace destinations and project-specific delivery views.',
    '',
    'My work is the personal queue for the signed-in contributor. Projects is the portfolio view. The project navigation includes Issues, Board, Backlog, Sprints, and Documentation. The sidebar can collapse to an icon rail for smaller layouts.',
    '',
    'A project selector in the header changes the active project context. The visible sample workspace includes AI H Platform, E-Commerce System, Mobile Banking, and Internal Tools.'
  ]],
  ['3. My work and issue management', [
    'My work prioritizes issues assigned to the current user. It summarizes open work, active work, items waiting for a submission, and work needing attention. The issue table supports status views and text search by issue key, title, epic, or labels.',
    '',
    'Each issue records an ID, title, workflow status, priority, assignee, estimate, labels, epic, description, project, documentation status, optional work submission, and dependencies.',
    '',
    'Selecting an issue opens a detail drawer. The drawer shows the description, requirements, linked dependencies, submitted evidence, attachments, comments, properties, labels, and activity. Users can change the workflow status, inspect the priority, or begin work submission.'
  ]],
  ['4. Delivery workflow', [
    'The default workflow is: To Do, In Progress, Submit Work, Documentation Review, and Done. A separate Open view includes all work that is not Done.',
    '',
    'Issues can be moved by using the board or issue controls. When an issue is blocked by a linked prerequisite, AI H prevents it from moving to Done until that prerequisite is complete. This keeps delivery sequencing visible rather than relying on informal reminders.',
    '',
    'Priorities are Highest, High, Medium, and Low. Documentation progresses independently through Not Started, Work Submitted, Generating, Needs Review, and Approved.'
  ]],
  ['5. Board, backlog, and sprints', [
    'The Board presents active project work as columns for each workflow state. Cards show the issue key, priority, title, labels, assignee, estimate, documentation state, and any dependency warning. Cards can be dragged between columns, with dependency validation applied when completing work.',
    '',
    'The Backlog supports planning before work enters a sprint. It groups issues alongside epics and shows task priority, labels, assignee, and estimate.',
    '',
    'The Sprints page provides a sprint timeline, completion summary, dates, goal, and a scoped board. The example workspace includes active and completed sprints so teams can inspect current delivery and prior planning cycles.'
  ]],
  ['6. Projects portfolio', [
    'Projects provides a portfolio-level view of teams and initiatives. Each project card shows its key, lead, issue count, completion progress, active sprint, documentation coverage, and delivery health. The portfolio can be searched by project name, key, or lead.',
    '',
    'Opening a project switches the selected project and takes the user to its issue context. This makes the portfolio a launch point rather than a passive report.'
  ]],
  ['7. Work submission and evidence', [
    'When work is ready, a contributor can submit a work record directly from an issue. The submission asks what was completed, supporting evidence, the preferred documentation format, optional AI instructions, and optional Git information for code-based work.',
    '',
    'Evidence supports screenshots, files, code, video, and audio. Git fields can capture repository, branch, and pull request details. Submitting work records the evidence against the issue and starts the documentation flow.',
    '',
    'The employee submission is visible in the issue drawer so reviewers can validate the result before documentation approval.'
  ]],
  ['8. Documentation and AI assistance', [
    'Documentation is organized by project and task. The hierarchy view lets users search documents, expand projects, select a task document, inspect its metadata, and open it for editing or approval.',
    '',
    'AI H generates a structured document using the submitted work, evidence, selected format, and optional instructions. The editor supports preview and edit modes, AI refinement prompts, export, a table of contents, and final approval.',
    '',
    'Built-in documentation formats include technical implementation guides, sales activity reports, business analysis reports, research findings, bug-fix reports, deployment runbooks, and client handover guides. Administrators can define reusable custom structures in settings.'
  ]],
  ['9. Search, notifications, and settings', [
    'Global search searches issues, people, labels, and related project content. Notifications surface events such as generated documentation, submitted work, mentions, and sprint changes.',
    '',
    'Project settings support project details, members, issue types, workflows, notifications, documentation structures, and AI style instructions. Settings are intended for project leads and administrators who need to tailor how delivery and documentation operate.'
  ]],
  ['10. Technical architecture', [
    'The client is a React and TypeScript single-page application built with Vite and lucide-react icons. The UI state loads task data from a local Express API and falls back to local seed data if the API is unavailable.',
    '',
    'The server exposes JSON endpoints for tasks, documentation templates, submissions, document generation, approvals, notifications, and health checks. Local data is stored in server/data.json; in Vercel deployments it uses /tmp/aih-data.json.',
    '',
    'Key endpoints include GET /api/tasks, POST /api/tasks, PATCH /api/tasks/:id, POST /api/tasks/:id/submission, POST /api/tasks/:id/generate-documentation, POST /api/tasks/:id/approve-documentation, GET /api/document-templates, and GET /api/health.'
  ]],
  ['11. Typical end-to-end workflow', [
    '1. A lead creates and prioritizes an issue in the backlog.',
    '2. The issue is planned into a sprint and assigned to a contributor.',
    '3. The contributor moves it through To Do and In Progress on the board.',
    '4. When finished, the contributor submits a concise work summary and evidence.',
    '5. AI H generates project documentation from the completed work.',
    '6. A reviewer validates the task and approves the documentation.',
    '7. The issue reaches Done, while its evidence and documentation remain available to the project.'
  ]],
  ['12. Current design principles', [
    'The UI favors high-signal work views: clear workflow states, compact metadata, immediate access to creation and search, responsive layouts, and direct links between delivery and knowledge. The visual system uses a persistent sidebar, a restrained blue action color, simple status pills, and readable table/card layouts.',
    '',
    'The application can be extended with authentication, live collaboration, richer permissions, external repository integrations, automated analytics, and production-grade persistent storage without changing the central work-to-documentation workflow.'
  ]]
];

const width = 595, height = 842, left = 54, top = 782, bottom = 58, lineHeight = 15;
const escape = value => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const wrap = (text, limit = 88) => {
  if (!text) return [''];
  const words = text.split(/\s+/); const lines = []; let line = '';
  for (const word of words) { if ((line + ' ' + word).trim().length > limit) { lines.push(line); line = word; } else line = (line + ' ' + word).trim(); }
  if (line) lines.push(line); return lines;
};
const pages = []; let page = [];
for (const [title, paragraphs] of sections) {
  const block = [{text: title, size: title === 'AI H Application Guide' ? 24 : 17, gap: 13, color: '1D4ED8'}, ...paragraphs.flatMap(text => wrap(text).map((line, index) => ({text: line, size: 10.5, gap: index === 0 ? 4 : 0, color: '27364A'})))];
  const needed = block.reduce((sum, line) => sum + lineHeight + line.gap, 0) + 18;
  const used = page.reduce((sum, line) => sum + lineHeight + line.gap, 0);
  if (page.length && top - used - needed < bottom) { pages.push(page); page = []; }
  page.push(...block, {text: '', size: 10, gap: 8, color: '27364A'});
}
if (page.length) pages.push(page);

let objects = []; const add = value => { objects.push(value); return objects.length; };
const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
const pageIds = [];
for (let index = 0; index < pages.length; index++) {
  let y = top; const stream = ['q', '0.97 0.98 1 rg', `0 0 ${width} ${height} re f`, 'Q'];
  stream.push('0.12 0.31 0.66 rg', `${left} 811 487 2 re f`);
  for (const line of pages[index]) { y -= line.gap; if (line.text) { const isHeading = line.size >= 17; stream.push(`BT /${isHeading ? 'F2' : 'F1'} ${line.size} Tf ${line.color.match(/../g).map(v => (parseInt(v,16)/255).toFixed(3)).join(' ')} rg ${left} ${y} Td (${escape(line.text)}) Tj ET`); } y -= lineHeight; }
  stream.push(`BT /F1 8 Tf 0.45 0.49 0.56 rg ${left} 30 Td (AI H Application Guide) Tj ${width - 130} 30 Td (Page ${index + 1} of ${pages.length}) Tj ET`);
  const content = add(`<< /Length ${Buffer.byteLength(stream.join('\n'))} >>\nstream\n${stream.join('\n')}\nendstream`);
  pageIds.push(add(`<< /Type /Page /Parent PAGES /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R >>`));
}
const pagesId = add(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
objects = objects.map(value => value.replace('PAGES', `${pagesId} 0 R`));
const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'; const offsets = [0];
objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
const xref = Buffer.byteLength(pdf); pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const output = path.join(__dirname, '..', 'AIH-Application-Guide.pdf');
fs.writeFileSync(output, pdf, 'binary');
console.log(output);
