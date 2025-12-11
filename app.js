const jobsContainer = document.getElementById('jobs-container');
const generateBtn = document.getElementById('generate');
const yamlOutput = document.getElementById('yaml-output');
const downloadBtn = document.getElementById('download-yaml');
const workflowNameInput = document.getElementById('workflow-name');
const templateButtons = document.querySelectorAll('.template-btn');

let jobCount = 0;

// Pre-made job templates
const templates = {
  "node-ci": {
    id: "node-ci",
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
    id: "python-ci",
    name: "Python CI",
    runsOn: "ubuntu-latest",
    steps: [
      { name: "Checkout repo", uses: "actions/checkout@v3" },
      { name: "Setup Python", uses: "actions/setup-python@v4" },
      { name: "Install dependencies", run: "pip install -r requirements.txt" },
      { name: "Run tests", run: "pytest" }
    ]
  },
  "deploy-gh-pages": {
    id: "deploy-gh-pages",
    name: "Deploy GitHub Pages",
    runsOn: "ubuntu-latest",
    steps: [
      { name: "Checkout repo", uses: "actions/checkout@v3" },
      { name: "Setup Node.js", uses: "actions/setup-node@v3" },
      { name: "Install dependencies", run: "npm install" },
      { name: "Build site", run: "npm run build" },
      { name: "Deploy", uses: "peaceiris/actions-gh-pages@v3", run: "" }
    ]
  }
};

// Add a pre-made job to the workflow
templateButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.template;
    const template = templates[key];
    if (!template) return;

    const jobDiv = document.createElement('div');
    jobDiv.classList.add('job');
    jobDiv.dataset.id = jobCount;
    jobDiv.innerHTML = `
      <h3>${template.name}</h3>
      <label>Job ID: <input type="text" class="job-id" value="${template.id}"></label>
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

    // Store steps in dataset for YAML generation
    jobDiv.dataset.steps = JSON.stringify(template.steps);

    jobsContainer.appendChild(jobDiv);
    jobCount++;
  });
});

// Helper to escape YAML
function escapeYAML(str) {
  if (!str) return '';
  return str.includes(':') || str.includes('-') ? `"${str}"` : str;
}

// Generate YAML
function generateYAML() {
  const workflowName = workflowNameInput.value || 'CI';
  let yaml = `name: ${escapeYAML(workflowName)}\n\non:\n  push:\n    branches: [ main ]\n\njobs:\n`;

  const jobs = jobsContainer.querySelectorAll('.job');
  jobs.forEach(job => {
    const jobId = job.querySelector('.job-id').value || `job${job.dataset.id}`;
    const runsOn = job.querySelector('.job-runson').value || 'ubuntu-latest';
    yaml += `  ${jobId}:\n    runs-on: ${runsOn}\n    steps:\n`;

    const steps = JSON.parse(job.dataset.steps);
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

// Download YAML file
downloadBtn.addEventListener('click', () => {
  const blob = new Blob([yamlOutput.value], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'workflow.yml';
  a.click();
  URL.revokeObjectURL(url);
});
