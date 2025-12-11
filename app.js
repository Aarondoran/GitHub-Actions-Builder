const jobsContainer = document.getElementById('jobs-container');
const addJobBtn = document.getElementById('add-job');
const generateBtn = document.getElementById('generate');
const yamlOutput = document.getElementById('yaml-output');
const downloadBtn = document.getElementById('download-yaml');
const workflowNameInput = document.getElementById('workflow-name');

let jobCount = 0;

function createStepElement(jobDiv) {
  const stepDiv = document.createElement('div');
  stepDiv.classList.add('step');
  stepDiv.innerHTML = `
    <label>
      Step Name:
      <input type="text" class="step-name" placeholder="Run tests">
    </label>
    <label>
      Run Command:
      <input type="text" class="step-run" placeholder="npm test">
    </label>
    <button class="remove-step">Remove Step</button>
  `;
  const removeBtn = stepDiv.querySelector('.remove-step');
  removeBtn.addEventListener('click', () => stepDiv.remove());
  jobDiv.querySelector('.steps-container').appendChild(stepDiv);
}

function createJobElement() {
  const jobDiv = document.createElement('div');
  jobDiv.classList.add('job');
  jobDiv.dataset.id = jobCount;

  jobDiv.innerHTML = `
    <h3>Job ${jobCount + 1}</h3>
    <label>
      Job ID (e.g., build):
      <input type="text" class="job-id" placeholder="build">
    </label>
    <label>
      Runs on:
      <select class="job-runson">
        <option value="ubuntu-latest">ubuntu-latest</option>
        <option value="windows-latest">windows-latest</option>
        <option value="macos-latest">macos-latest</option>
      </select>
    </label>
    <div class="steps-container">
      <h4>Steps</h4>
    </div>
    <button class="add-step">Add Step</button>
    <button class="remove-job">Remove Job</button>
  `;

  const addStepBtn = jobDiv.querySelector('.add-step');
  addStepBtn.addEventListener('click', () => createStepElement(jobDiv));

  const removeJobBtn = jobDiv.querySelector('.remove-job');
  removeJobBtn.addEventListener('click', () => jobDiv.remove());

  jobsContainer.appendChild(jobDiv);
  jobCount++;
}

addJobBtn.addEventListener('click', createJobElement);

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
    yaml += `  ${jobId}:\n    runs-on: ${runsOn}\n    steps:\n      - uses: actions/checkout@v3\n`;

    const steps = job.querySelectorAll('.step');
    steps.forEach(step => {
      const stepName = step.querySelector('.step-name').value || 'Step';
      const stepRun = step.querySelector('.step-run').value || '';
      yaml += `      - name: ${escapeYAML(stepName)}\n        run: ${escapeYAML(stepRun)}\n`;
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
