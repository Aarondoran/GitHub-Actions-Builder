const workflowCanvas = document.getElementById('workflow-canvas');
const jobsContainer = document.getElementById('jobs-container');
const generateBtn = document.getElementById('generate');
const yamlOutput = document.getElementById('yaml-output');
const downloadBtn = document.getElementById('download-yaml');
const workflowNameInput = document.getElementById('workflow-name');

let jobCount = 0;

// Pre-made actions
const preMadeActions = {
  "node-ci": {
    name: "Node.js CI",
    runsOn: "ubuntu-latest",
    steps: [
      { name: "Checkout repo", uses: "actions/checkout@v3" },
      { name: "Setup Node.js", uses: "actions/setup-node@v3" },
      { name: "Install dependencies", run: "npm install" },
      { name: "Run tests", run: "npm test" }
    ]
  },
  "python-ci": {
    name: "Python CI",
    runsOn: "ubuntu-latest",
    steps: [
      { name: "Checkout repo", uses: "actions/checkout@v3" },
      { name: "Setup Python", uses: "actions/setup-python@v4" },
      { name: "Install dependencies", run: "pip install -r requirements.txt" },
      { name: "Run tests", run: "pytest" }
    ]
  },
  "publish-npm": {
    name: "Publish npm Package",
    runsOn: "ubuntu-latest",
    steps: [
      { name: "Checkout repo", uses: "actions/checkout@v3" },
      { name: "Setup Node.js", uses: "actions/setup-node@v3" },
      { name: "Publish Package", run: "npm publish" }
    ]
  },
  "deploy-gh-pages": {
    name: "Deploy GitHub Pages",
    runsOn: "ubuntu-latest",
    steps: [
      { name: "Checkout repo", uses: "actions/checkout@v3" },
      { name: "Setup Node.js", uses: "actions/setup-node@v3" },
      { name: "Install dependencies", run: "npm install" },
      { name: "Build site", run: "npm run build" },
      { name: "Deploy", uses: "peaceiris/actions-gh-pages@v3" }
    ]
  },
  "api-request": {
    name: "Call API",
    runsOn: "ubuntu-latest",
    steps: [
      { name: "Call API", run: "curl -X POST https://example.com/api" }
    ]
  }
};

// Drag & drop
let draggedTemplate = null;

document.querySelectorAll('.action').forEach(elem => {
  elem.addEventListener('dragstart', e => {
    draggedTemplate = e.target.dataset.template;
  });
});

workflowCanvas.addEventListener('dragover', e => e.preventDefault());
workflowCanvas.addEventListener('drop', e => {
  e.preventDefault();
  if (!draggedTemplate) return;

  const template = preMadeActions[draggedTemplate];
  if (!template) return;

  const jobDiv = document.createElement('div');
  jobDiv.classList.add('job');
  jobDiv.dataset.id = jobCount;
  jobDiv.dataset.template = draggedTemplate;
  jobDiv.innerHTML = `
    <h3>${template.name}</h3>
    <label>Job ID: <input type="text" class="job-id" value="${draggedTemplate}"></label>
    <label>Runs on: 
      <select class="job-runson">
        <option value="ubuntu-latest">ubuntu-latest</option>
        <option value="windows-latest">windows-latest</option>
        <option value="macos-latest">macos-latest</option>
      </select>
    </label>
    <button class="remove-job">Remove Job</button>
  `;

  const removeBtn = jobDiv.querySelector('.remove-job');
  removeBtn.addEventListener('click', () => jobDiv.remove());

  jobsContainer.appendChild(jobDiv);
  jobCount++;
  draggedTemplate = null;
});

// YAML generation
function escapeYAML(str) {
  if (!str) return '';
  return str.includes(':') || str.includes('-') ? `"${str}"` : str;
}

function generateYAML() {
  const workflowName = workflowNameInput.value || 'CI';
  let yaml = `name: ${escapeYAML(workflowName)}\n\non:\n  push:\n    branches: [ main ]\n\njobs:\n`;

  const jobs = jobsContainer.querySelectorAll('.job');
  jobs.forEach(job => {
    const jobId = job.querySelector('.job-id').value || `job${job.dataset.id}`;
    const runsOn = job.querySelector('.job-runson').value || 'ubuntu-latest';
    yaml += `  ${jobId}:\n    runs-on: ${runsOn}\n    steps:\n`;

    const templateKey = job.dataset.template;
    const steps = preMadeActions[templateKey].steps;

    steps.forEach(step => {
      if (step.uses) {
        yaml += `      - name: ${escapeYAML(step.name)}\n        uses: ${step.uses}\n`;
      } else {
        yaml += `      - name: ${escapeYAML(step.name)}\n        run: ${escapeYAML(step.run)}\n`;
      }
    });
  });

  yamlOutput.value = yaml;
}

generateBtn.addEventListener('click', generateYAML);

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([yamlOutput.value], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'workflow.yml';
  a.click();
  URL.revokeObjectURL(url);
});
