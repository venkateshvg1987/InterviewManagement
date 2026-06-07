// State management
let currentRole = "java-angular";
let currentKit = null;
let currentMode = "kit"; // "kit", "screener", or "history"
let uploadedFiles = {
  jd: null,
  cv: null
};
let bulkUploadedFiles = []; // array of { name: string, content: string }
let screenedCandidatesList = []; // array of screened candidate data
let lastActiveTab = "overview";
let selectedExportSet = "all";

// Evaluation history pagination and date filters state
let historyCurrentPage = 1;
let historyFilterFrom = "";
let historyFilterTo = "";

// Firebase Configuration and Initialization
const firebaseConfig = {
  apiKey: "AIzaSyA3Yd5P_jvG2UT6j5_9duGPmtgM9vWp2Lg",
  authDomain: "candidateassessment.firebaseapp.com",
  projectId: "candidateassessment",
  storageBucket: "candidateassessment.firebasestorage.app",
  messagingSenderId: "60627314041",
  appId: "1:60627314041:web:46cc75a3bfbdbb28e4fba8"
};

let db = null;
let useFirestore = false;

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    useFirestore = true;
    console.log("Firebase Firestore initialized successfully.");
  } else {
    console.warn("Firebase compat SDK not loaded. Falling back to LocalStorage.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase:", err);
}

// Scorecard State
let panelistLists = {
  tech: ["Santhosh", "Guna Sekar"],
  managerial: ["Venkatesh VG"],
  hr: ["Annapoorani", "Andrews"]
};

let scorecardState = {
  activeRound: "tech1",
  rounds: {
    tech1: { interviewer: "", status: "Pending", comments: "", ratings: {} },
    tech2: { interviewer: "", status: "Pending", comments: "", ratings: {} },
    managerial: { interviewer: "", status: "Pending", comments: "", ratings: {} }
  },
  finalDecision: "Pending",
  finalComments: "",
  finalInterviewer: ""
};

// DOM Elements
const roleSelect = document.getElementById("role-select");
const jdText = document.getElementById("jd-text");
const cvText = document.getElementById("cv-text");
const btnGenerate = document.getElementById("btn-generate");
const btnLoadDemo = document.getElementById("btn-load-demo");
const btnLoadSampleCv = document.getElementById("btn-load-sample-cv");

const welcomeDashboard = document.getElementById("welcome-dashboard");
const loadingView = document.getElementById("loading-view");
const resultsContainer = document.getElementById("results-container");
const screenerDashboard = document.getElementById("screener-dashboard");
const screenerPane = document.getElementById("screener-pane");

const modeKitBtn = document.getElementById("mode-kit-btn");
const modeScreenerBtn = document.getElementById("mode-screener-btn");
const sidebarKitInputs = document.getElementById("sidebar-kit-inputs");
const sidebarScreenerInputs = document.getElementById("sidebar-screener-inputs");
const btnScreenCandidates = document.getElementById("btn-screen-candidates");
const btnScreenerBackHome = document.getElementById("btn-screener-back-home");

const step1El = document.getElementById("step-1");
const step2El = document.getElementById("step-2");
const step3El = document.getElementById("step-3");
const step4El = document.getElementById("step-4");

// Tab elements
const tabOverviewBtn = document.getElementById("tab-overview-btn");
const tabSet1Btn = document.getElementById("tab-set1-btn");
const tabSet2Btn = document.getElementById("tab-set2-btn");
const tabSet3Btn = document.getElementById("tab-set3-btn");
const tabExportBtn = document.getElementById("tab-export-btn");

const resultsPane = document.getElementById("results-pane");

// Sample resumes database for the Load Sample CV feature
const SAMPLE_CVS = {
  "java-angular": `CANDIDATE CV / RESUME
Name: Alex Mercer
Role: Junior Full Stack Engineer
Summary: 2 years of experience building web applications. Proficient in Java, Spring Boot, and Angular fundamentals.
Experience:
- Junior Developer at Innovate Solutions (1.5 years): Assisted in writing REST endpoints using Spring Boot and building components in Angular. Worked on database CRUD tasks and unit testing.
Technical Skills: Java 17, Spring Boot, Angular, PostgreSQL, Git, Maven.`,

  "ai-engineer": `CANDIDATE CV / RESUME
Name: Sarah Connor
Role: Lead AI Engineer
Summary: 12 years of software engineering, with 5 years focused on Generative AI systems, RAG, and agentic workflows.
Experience:
- Lead AI Engineer at Cyberdyne Systems (3 years): Architected enterprise RAG systems indexing 50,000 PDF policies using pgvector and LangChain. Implemented semantic caching using Redis, reducing API costs by 30%.
- AI Architect at TechCorp (4 years): Designed stateful multi-agent workflows using LangGraph for automated customer ticket routing. Integrates Spring AI in Java legacy setups.
Technical Skills: Python, LangChain, LangGraph, Qdrant, OpenAI APIs, Spring AI, AWS Bedrock.`,

  "ai-architect": `CANDIDATE CV / RESUME
Name: Dr. John von Neumann
Role: Enterprise AI Architect
Summary: 15+ years of software architecture experience, designing cloud-native distributed platforms. Expert in enterprise AI strategy, compliance architectures, and scalable model serving.
Experience:
- Principal AI Architect at Global Corp (4 years): Built federated LLM Gateway proxy handling 1M daily requests with failover, budget control, and token rate limiting. Enforced HIPAA compliance and PII filters.
- Chief Architect at DataGrid (6 years): Designed multi-tenant SaaS ML platforms, HNSW vector database memory-tiering optimizations on Kubernetes, and model drift telemetry using Arize.
Technical Skills: Enterprise Systems, Go, Kubernetes, Terraform, Triton Inference, pgvector, GDPR/HIPAA.`
};

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  setupModeSelector();
  setupPresets();
  setupFileUploads();
  setupBulkFileUploads();
  setupTabs();
  setupSampleCvLoader();
  setupScreenerActions();
  setupHistoryActions();
  loadPanelistConfiguration();
});

// Setup Sample CV click handler
function setupSampleCvLoader() {
  btnLoadSampleCv.addEventListener("click", () => {
    const role = roleSelect.value;
    if (SAMPLE_CVS[role]) {
      cvText.value = SAMPLE_CVS[role];
      // Reset uploaded files state for CV
      document.getElementById("cv-file-list").innerHTML = "";
      uploadedFiles.cv = null;
    }
  });
}

// Mode Selection Handler
function setupModeSelector() {
  const modeHistoryBtn = document.getElementById("mode-history-btn");
  const historyDashboard = document.getElementById("history-dashboard");

  modeKitBtn.addEventListener("click", () => {
    currentMode = "kit";
    modeKitBtn.classList.add("active");
    modeScreenerBtn.classList.remove("active");
    modeHistoryBtn.classList.remove("active");
    sidebarKitInputs.style.display = "block";
    sidebarScreenerInputs.style.display = "none";
    // Reset view
    resultsContainer.style.display = "none";
    screenerDashboard.style.display = "none";
    historyDashboard.style.display = "none";
    loadingView.style.display = "none";
    welcomeDashboard.style.display = "block";
  });

  modeScreenerBtn.addEventListener("click", () => {
    currentMode = "screener";
    modeKitBtn.classList.remove("active");
    modeScreenerBtn.classList.add("active");
    modeHistoryBtn.classList.remove("active");
    sidebarKitInputs.style.display = "none";
    sidebarScreenerInputs.style.display = "block";
    // Reset view
    resultsContainer.style.display = "none";
    screenerDashboard.style.display = "none";
    historyDashboard.style.display = "none";
    loadingView.style.display = "none";
    welcomeDashboard.style.display = "block";
  });

  modeHistoryBtn.addEventListener("click", () => {
    currentMode = "history";
    modeKitBtn.classList.remove("active");
    modeScreenerBtn.classList.remove("active");
    modeHistoryBtn.classList.add("active");
    sidebarKitInputs.style.display = "none";
    sidebarScreenerInputs.style.display = "none";
    // Reset view
    resultsContainer.style.display = "none";
    screenerDashboard.style.display = "none";
    welcomeDashboard.style.display = "none";
    loadingView.style.display = "none";
    historyDashboard.style.display = "block";
    window.renderHistoryDashboard();
  });
}

// Bulk CV File Loaders
function setupBulkFileUploads() {
  const input = document.getElementById("bulk-cv-files");
  const zone = document.getElementById("bulk-cv-dropzone");
  const list = document.getElementById("bulk-cv-file-list");

  zone.addEventListener("click", () => input.click());

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.style.backgroundColor = "#e5e5e7";
  });

  zone.addEventListener("dragleave", () => {
    zone.style.backgroundColor = "#faf8ff";
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.style.backgroundColor = "#faf8ff";
    if (e.dataTransfer.files.length > 0) {
      handleBulkFiles(e.dataTransfer.files, list);
    }
  });

  input.addEventListener("change", (e) => {
    if (input.files.length > 0) {
      handleBulkFiles(input.files, list);
    }
  });
}

async function handleBulkFiles(files, listEl) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Create UI item
    const itemIdx = bulkUploadedFiles.length;
    const li = document.createElement("li");
    li.className = "file-item";
    li.id = `bulk-file-item-${itemIdx}`;
    li.innerHTML = `
      <span>${file.name} (Loading...)</span>
      <span class="file-remove" onclick="removeBulkFile(${itemIdx})">×</span>
    `;
    listEl.appendChild(li);

    // Parse file text
    const text = await readUploadedFileText(file);
    
    // Save to bulk list
    bulkUploadedFiles.push({
      id: itemIdx,
      name: file.name,
      content: text
    });

    li.querySelector("span").innerHTML = `${file.name} (${(file.size / 1024).toFixed(1)} KB) - Loaded`;
  }
}

function readUploadedFileText(file) {
  return new Promise((resolve) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (['txt', 'md', 'json', 'yml', 'yaml', 'xml', 'csv'].includes(extension)) {
      const reader = new FileReader();
      reader.onload = function(e) {
        resolve(e.target.result);
      };
      reader.readAsText(file);
    } else if (extension === 'pdf') {
      const reader = new FileReader();
      reader.onload = async function(e) {
        try {
          const arrayBuffer = e.target.result;
          if (typeof pdfjsLib === 'undefined') {
            resolve("[PDF.js not loaded. Could not parse PDF text automatically.]");
            return;
          }
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(" ");
            fullText += pageText + "\n";
          }
          resolve(fullText);
        } catch (err) {
          console.error(err);
          resolve(`[Failed to parse PDF: ${err.message}]`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (['docx', 'doc'].includes(extension)) {
      const reader = new FileReader();
      reader.onload = async function(e) {
        try {
          const arrayBuffer = e.target.result;
          if (typeof mammoth === 'undefined') {
            resolve("[Mammoth.js not loaded. Could not parse DOCX text automatically.]");
            return;
          }
          const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          resolve(result.value);
        } catch (err) {
          console.error(err);
          resolve(`[Failed to parse Word document: ${err.message}]`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      resolve(`[Unsupported extension. File: ${file.name}]`);
    }
  });
}

window.removeBulkFile = function(idx) {
  bulkUploadedFiles = bulkUploadedFiles.filter(f => f.id !== idx);
  const item = document.getElementById(`bulk-file-item-${idx}`);
  if (item) item.remove();
};

// Batch Screener Action Configurations
function setupScreenerActions() {
  btnScreenerBackHome.addEventListener("click", () => {
    screenerDashboard.style.display = "none";
    resultsContainer.style.display = "none";
    welcomeDashboard.style.display = "block";
  });

  btnScreenCandidates.addEventListener("click", async () => {
    const jdVal = jdText.value.trim();
    if (!jdVal) {
      alert("Please enter or upload a Job Description.");
      return;
    }
    if (bulkUploadedFiles.length === 0) {
      alert("Please upload at least one candidate CV to screen.");
      return;
    }

    // Set loading titles
    document.getElementById("loading-title").innerText = "Screening Resumes...";
    document.getElementById("loading-desc").innerText = "Please wait while we evaluate candidate matches against the Job Description.";
    
    const listEl = document.getElementById("loading-steps-list");
    listEl.innerHTML = `
      <li class="loading-step active" id="screener-loading-step">Analyzing uploaded resumes against target requirements</li>
    `;

    // Show loading view
    welcomeDashboard.style.display = "none";
    resultsContainer.style.display = "none";
    screenerDashboard.style.display = "none";
    loadingView.style.display = "block";

    // Simulate work with setTimeout
    setTimeout(async () => {
      const role = roleSelect.value;
      const baseKit = PRESETS[role];
      
      const jdSkills = extractSkills(jdVal);
      const jdSeniority = parseJDSeniority(jdVal);
      
      screenedCandidatesList = [];

      for (let i = 0; i < bulkUploadedFiles.length; i++) {
        const fileData = bulkUploadedFiles[i];
        
        document.getElementById("screener-loading-step").innerText = `Evaluating CV ${i+1} of ${bulkUploadedFiles.length}: ${fileData.name}`;
        
        const cvData = parseCV(fileData.content);
        
        if (cvData.name === "the candidate" || cvData.name.trim() === "" || cvData.name.length > 50) {
          cvData.name = fileData.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        }

        const match = calculateMatchMetrics(cvData, jdSkills, jdSeniority.yearsRequired, jdSeniority.level);
        
        // Filter out candidates with score < 80%
        if (match.score >= 80) {
          screenedCandidatesList.push({
            name: cvData.name,
            filename: fileData.name,
            experienceYears: cvData.experienceYears,
            seniority: cvData.seniority,
            tech: cvData.tech,
            match: match,
            rawContent: fileData.content
          });
        }
      }

      setTimeout(() => {
        loadingView.style.display = "none";
        renderScreenerDashboard(jdSkills, jdSeniority);
        screenerDashboard.style.display = "block";
        // Auto-save this screening run details to history DB
        saveScreeningRun(role, bulkUploadedFiles.length, screenedCandidatesList);
      }, 300);

    }, 400);
  });
}

function renderScreenerDashboard(jdSkills, jdSeniority) {
  const count = screenedCandidatesList.length;
  const totalProcessed = bulkUploadedFiles.length;
  const passedPct = totalProcessed > 0 ? Math.round((count / totalProcessed) * 100) : 0;
  
  let tableRows = "";
  if (count === 0) {
    tableRows = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">
          No candidates met the 80% Match threshold for this role.
        </td>
      </tr>
    `;
  } else {
    screenedCandidatesList.forEach((candidate, idx) => {
      const score = candidate.match.score;
      const track = candidate.seniority;
      
      const badgeText = {
        "junior": "Junior Track",
        "intermediate": "Intermediate Track",
        "expert": "Expert/Lead Track"
      }[track] || "General Track";
      
      tableRows += `
        <tr>
          <td class="name-cell" style="font-weight: bold; color: var(--text-headers);" title="${candidate.name}">${candidate.name}</td>
          <td><span class="seniority-badge ${track}">${badgeText}</span></td>
          <td>${candidate.experienceYears} Years</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: bold; min-width: 35px;">${score}%</span>
              <div class="confidence-bar-container" style="width: 100px; height: 8px;">
                <div class="confidence-bar strong" style="width: ${score}%;"></div>
              </div>
            </div>
          </td>
          <td>
            <button class="btn-primary" onclick="viewScreenedCandidateKit(${idx})">Start Assessment</button>
          </td>
        </tr>
      `;
    });
  }

  const html = `
    <div class="screener-title-row">
      <h2>Batch Candidate Screening Report</h2>
      <span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 0.85rem; color: var(--text-muted); font-style: italic;">
        Target Role: ${PRESETS[roleSelect.value].roleName} (Required exp: ${jdSeniority.yearsRequired}+ yrs)
      </span>
    </div>

    <!-- Statistics cards -->
    <div class="screening-stats-grid">
      <div class="stat-card">
        <h4>Total Processed</h4>
        <div class="stat-value">${totalProcessed}</div>
      </div>
      <div class="stat-card passed">
        <h4>Passed Threshold (>=80%)</h4>
        <div class="stat-value" style="color: #047857;">${count}</div>
      </div>
      <div class="stat-card">
        <h4>Pre-Screen Yield</h4>
        <div class="stat-value">${passedPct}%</div>
      </div>
    </div>

    <p style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 0.95rem; color: var(--text-muted); margin-bottom: 20px;">
      Below is the list of candidates whose credentials matched <strong>80% or more</strong> against the core technical skills and experience expectations in the Job Description. Click <strong>Assess Candidate</strong> to generate their tailored interview kit.
    </p>

    <div class="table-responsive">
      <table class="screening-table">
        <thead>
          <tr>
            <th style="width: 24%;">Candidate Name</th>
            <th style="width: 22%;">Seniority Track</th>
            <th style="width: 18%;">Experience</th>
            <th style="width: 18%;">Match Score</th>
            <th style="width: 18%;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;

  screenerPane.innerHTML = html;
}

window.viewScreenedCandidateKit = function(idx) {
  const candidate = screenedCandidatesList[idx];
  if (!candidate) return;

  const role = roleSelect.value;
  const jdVal = jdText.value.trim();
  
  const cvData = parseCV(candidate.rawContent);
  cvData.name = candidate.name; // Preserve parsed name
  
  const kit = generateDynamicKit(PRESETS[role], cvData, jdVal);

  // Render individual kit
  screenerDashboard.style.display = "none";
  showResults(kit);
};

// Preset Quick Starts
function setupPresets() {
  const cards = document.querySelectorAll(".preset-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const role = card.getAttribute("data-role");
      roleSelect.value = role;
      currentRole = role;
      
      // Load preset sample JD and clear CV
      if (role === "java-angular") {
        jdText.value = `Position: Senior Full Stack Developer (Java + Angular)
Experience: 8-12 Years
Required Skills:
- Back-end: Java 17+, Spring Boot, Spring Cloud, Hibernate/JPA, Microservices architecture, Kafka messaging, REST APIs.
- Front-end: Angular 16+, TypeScript, RxJS, state management (NgRx/Signals), CSS/HTML.
- Database: PostgreSQL, SQL query optimization, transaction management.
- Cloud & Infrastructure: AWS (ECS, RDS, S3), Docker containerization, Kubernetes orchestrations, CI/CD pipelines.
- Leadership: Technical mentorship, architectural ownership, and code review standards.`;
      } else if (role === "ai-engineer") {
        jdText.value = `Position: Lead AI Engineer
Experience: 10-15 Years
Required Skills:
- AI & LLMs: Retrieval-Augmented Generation (RAG), Prompt Engineering, Agentic Workflows (LangGraph/LangChain), Spring AI.
- Databases: Vector databases (pgvector, Qdrant, Pinecone), Redis semantic caching.
- Infrastructure: AWS Bedrock, Vertex AI, model optimization, cost and latency control.
- Guardrails: Safety frameworks (NeMo Guardrails, Llama Guard), hallucination preventions, PII scrubbing.`;
      } else if (role === "ai-architect") {
        jdText.value = `Position: Lead AI Architect
Experience: 12-15+ Years
Required Skills:
- Enterprise Architecture: Platform design, federated AI gateways, cost-control models, multi-agent mesh systems.
- Governance & Compliance: EU AI Act, HIPAA/GDPR, AI safety/ethics frameworks.
- Observability: LLM telemetry (Arize, TruLens, Phoenix), drift monitoring.
- Cloud Topologies: Private endpoint integrations, hybrid VPC setups, model serving (vLLM/Triton), scaling.`;
      }
      
      // Leave CV empty by default
      cvText.value = "";
      document.getElementById("cv-file-list").innerHTML = "";
      uploadedFiles.cv = null;
    });
  });

  // Handle Load Demo button click (Loads raw presets without CV)
  btnLoadDemo.addEventListener("click", () => {
    const role = roleSelect.value;
    const data = PRESETS[role];
    if (data) {
      showResults(data);
    } else {
      alert("No preset data found for this role.");
    }
  });
}

// File Upload Parser
function setupFileUploads() {
  setupUploadZone("jd-file", "jd-file-list", 'jd');
  setupUploadZone("cv-file", "cv-file-list", 'cv');
}

function setupUploadZone(inputId, listId, type) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  const zone = input.parentElement;

  zone.addEventListener("click", () => input.click());

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.style.backgroundColor = "#e5e5e7";
  });

  zone.addEventListener("dragleave", () => {
    zone.style.backgroundColor = "#fafafa";
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.style.backgroundColor = "#fafafa";
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0], list, type);
    }
  });

  input.addEventListener("change", (e) => {
    if (input.files.length > 0) {
      handleFile(input.files[0], list, type);
    }
  });
}

function handleFile(file, listEl, type) {
  uploadedFiles[type] = file;
  listEl.innerHTML = `
    <li class="file-item">
      <span>${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
      <span class="file-remove" onclick="removeUploadedFile('${type}', '${listEl.id}')">×</span>
    </li>
  `;

  const targetTextarea = type === 'jd' ? jdText : cvText;
  const extension = file.name.split('.').pop().toLowerCase();

  if (['txt', 'md', 'json', 'yml', 'yaml', 'xml', 'csv'].includes(extension)) {
    const reader = new FileReader();
    reader.onload = function(e) {
      targetTextarea.value = e.target.result;
    };
    reader.readAsText(file);
  } else if (extension === 'pdf') {
    targetTextarea.value = "Parsing PDF file, please wait...";
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const arrayBuffer = e.target.result;
        if (typeof pdfjsLib === 'undefined') {
          throw new Error("PDF.js library was not loaded successfully from the CDN.");
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(" ");
          fullText += pageText + "\n";
        }
        targetTextarea.value = fullText;
      } catch (err) {
        console.error(err);
        targetTextarea.value = `Failed to parse PDF automatically: ${err.message}\n\nPlease copy-paste the text content directly into this field.`;
      }
    };
    reader.readAsArrayBuffer(file);
  } else if (['docx', 'doc'].includes(extension)) {
    targetTextarea.value = "Parsing Word file, please wait...";
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const arrayBuffer = e.target.result;
        if (typeof mammoth === 'undefined') {
          throw new Error("Mammoth.js library was not loaded successfully from the CDN.");
        }
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        targetTextarea.value = result.value;
      } catch (err) {
        console.error(err);
        targetTextarea.value = `Failed to parse Word document automatically: ${err.message}\n\nPlease copy-paste the text content directly into this field.`;
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    targetTextarea.value = `[File uploaded: ${file.name}]\n\n(This file extension is not supported for auto-parsing. Please copy-paste the text content directly here.)`;
  }
}

window.removeUploadedFile = function(type, listId) {
  uploadedFiles[type] = null;
  document.getElementById(listId).innerHTML = "";
  if (type === 'jd') {
    jdText.value = "";
  } else {
    cvText.value = "";
  }
};

// Tabs navigation
function setupTabs() {
  const tabs = [
    { btn: tabOverviewBtn, target: "overview" },
    { btn: tabSet1Btn, target: "set1" },
    { btn: tabSet2Btn, target: "set2" },
    { btn: tabSet3Btn, target: "set3" },
    { btn: tabExportBtn, target: "export" }
  ];

  tabs.forEach(t => {
    t.btn.addEventListener("click", () => {
      tabs.forEach(x => x.btn.classList.remove("active"));
      t.btn.classList.add("active");
      if (t.target !== "export") {
        lastActiveTab = t.target;
      }
      renderActiveTab(t.target);
    });
  });
}

// Generate interview kit based on inputs
btnGenerate.addEventListener("click", async () => {
  const role = roleSelect.value;
  const jdVal = jdText.value.trim();
  const cvVal = cvText.value.trim();

  if (!jdVal) {
    alert("Please enter or upload a Job Description.");
    return;
  }

  // Show loading view
  welcomeDashboard.style.display = "none";
  resultsContainer.style.display = "none";
  loadingView.style.display = "block";
  resetLoadingSteps();

  updateStep("step-1", "active");
  setTimeout(() => {
    updateStep("step-1", "completed");
    updateStep("step-2", "active");
    setTimeout(() => {
      updateStep("step-2", "completed");
      updateStep("step-3", "active");
      setTimeout(() => {
        updateStep("step-3", "completed");
        updateStep("step-4", "active");
        setTimeout(() => {
          updateStep("step-4", "completed");
          
          if (cvVal && !cvVal.includes("Parsing ") && !cvVal.includes("[File uploaded:")) {
            // Dynamic, candidate-aware kit generation
            const cvData = parseCV(cvVal);
            if ((cvData.name === "the candidate" || cvData.name.trim() === "" || cvData.name.length > 50) && uploadedFiles.cv) {
              cvData.name = uploadedFiles.cv.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            } else if (cvData.name === "the candidate" || cvData.name.trim() === "" || cvData.name.length > 50) {
              cvData.name = "Candidate";
            }
            const customKit = generateDynamicKit(PRESETS[role], cvData, jdVal);
            showResults(customKit);
          } else {
            // No CV uploaded, load default presets directly
            showResults(PRESETS[role]);
          }
        }, 200);
      }, 200);
    }, 200);
  }, 200);
});

function resetLoadingSteps() {
  const steps = ["step-1", "step-2", "step-3", "step-4"];
  steps.forEach(id => {
    const el = document.getElementById(id);
    el.className = "loading-step pending";
  });
}

function updateStep(id, status) {
  const el = document.getElementById(id);
  el.className = `loading-step ${status}`;
}

// Display results dashboard
function showResults(kit) {
  currentKit = kit;
  loadingView.style.display = "none";
  welcomeDashboard.style.display = "none";
  resultsContainer.style.display = "block";
  lastActiveTab = "overview";

  // Ensure candidate name is tracked for scorecard
  let candidateName = "Candidate";
  if (kit.candidateInsight && kit.candidateInsight.name && kit.candidateInsight.name !== "Candidate" && kit.candidateInsight.name !== "the candidate") {
    candidateName = kit.candidateInsight.name;
  } else if (cvText.value.trim().length > 0) {
    const cvData = parseCV(cvText.value);
    if (cvData.name && cvData.name !== "the candidate" && cvData.name !== "Candidate") {
      candidateName = cvData.name;
    } else if (uploadedFiles.cv) {
      candidateName = uploadedFiles.cv.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
  } else if (uploadedFiles.cv) {
    candidateName = uploadedFiles.cv.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
  
  if (kit.candidateInsight) {
    kit.candidateInsight.name = candidateName;
  } else {
    kit.candidateInsight = { name: candidateName, track: "intermediate" };
  }

  if (kit.assessmentId) {
    loadScorecardState(kit.assessmentId, () => {
      tabOverviewBtn.click();
    });
  } else {
    findLatestAssessment(candidateName, currentRole, (assessment) => {
      if (assessment) {
        kit.assessmentId = assessment.id;
        loadScorecardState(assessment.id, () => {
          tabOverviewBtn.click();
        });
      } else {
        const newId = `${candidateName}_${currentRole}_${Date.now()}`.replace(/\s+/g, "_");
        kit.assessmentId = newId;
        
        scorecardState = {
          assessmentId: newId,
          activeRound: "tech1",
          rounds: {
            tech1: { interviewer: "", status: "Pending", comments: "", ratings: {} },
            tech2: { interviewer: "", status: "Pending", comments: "", ratings: {} },
            managerial: { interviewer: "", status: "Pending", comments: "", ratings: {} }
          },
          finalDecision: "Pending",
          finalComments: "",
          finalInterviewer: ""
        };
        
        saveCandidateAssessmentToDB(() => {
          tabOverviewBtn.click();
        });
      }
    });
  }
}

// Render active tab panel
function renderActiveTab(tabName) {
  if (!currentKit) return;

  let html = "";
  if (tabName === "overview") {
    html = renderOverviewTab();
  } else if (tabName === "set1") {
    html = renderSetTab(currentKit.sets.standard, "SET 1: STANDARD DIFFICULTY");
  } else if (tabName === "set2") {
    html = renderSetTab(currentKit.sets.advanced, "SET 2: ADVANCED DIFFICULTY");
  } else if (tabName === "set3") {
    html = renderSetTab(currentKit.sets.expert, "SET 3: EXPERT DIFFICULTY");
  } else if (tabName === "export") {
    html = renderExportTab();
  }

  resultsPane.innerHTML = html;
}

function renderOverviewTab() {
  const skills = currentKit.skills || {};
  let skillsHtml = "";
  
  const skillCategories = [
    { label: "Technical Skills", key: "technical" },
    { label: "Mandatory Skills", key: "mandatory" },
    { label: "Preferred Skills", key: "preferred" },
    { label: "Architecture Requirements", key: "architecture" },
    { label: "Cloud Requirements", key: "cloud" },
    { label: "AI Requirements", key: "ai" },
    { label: "Leadership Expectations", key: "leadership" }
  ];

  skillCategories.forEach(cat => {
    const list = skills[cat.key] || [];
    if (list.length > 0) {
      skillsHtml += `
        <tr>
          <th>${cat.label}</th>
          <td>
            <div class="skills-badge-list">
              ${list.map(s => `<span class="skill-badge">${s}</span>`).join("")}
            </div>
          </td>
        </tr>
      `;
    }
  });

  let gapsHtml = "";
  if (currentKit.gaps && currentKit.gaps.length > 0) {
    gapsHtml += `
      <h3>Job Description vs Candidate CV Gap Analysis</h3>
      <table class="skills-table">
        <thead>
          <tr>
            <th style="width: 30%;">Skill / Area</th>
            <th style="width: 20%;">Status</th>
            <th>Notes / Analysis</th>
          </tr>
        </thead>
        <tbody>
          ${currentKit.gaps.map(g => `
            <tr>
              <td style="font-weight: bold;">${g.skill}</td>
              <td><span class="gap-tag gap-${g.status}">${g.status}</span></td>
              <td>${g.notes}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // Render the candidate insight card if it exists
  let insightHtml = "";
  if (currentKit.candidateInsight) {
    const track = currentKit.candidateInsight.track; // "junior", "intermediate", "expert"
    const verdict = currentKit.candidateInsight.verdict || "potential";
    const score = currentKit.candidateInsight.score || 50;
    
    const badgeText = {
      "junior": "Junior Track",
      "intermediate": "Intermediate Track",
      "expert": "Expert/Lead Track"
    }[track] || "General Track";
    
    const verdictText = {
      "strong": "Strong Match",
      "potential": "Potential Match",
      "low": "Gap / Low Match"
    }[verdict] || "Potential Match";
    
    insightHtml = `
      <div class="candidate-insight-card">
        <div class="insight-card-header">
          <h3>Panelist Evaluation Guidance</h3>
          <div class="score-badge-container">
            <span class="verdict-badge ${verdict}">${verdictText}</span>
            <span class="score-percentage-badge">${score}% Match</span>
          </div>
        </div>
        
        <div class="insight-metrics-row">
          <div class="metric-block">
            <span class="metric-label">Recommended Assessment Track:</span>
            <span class="seniority-badge ${track}">${badgeText}</span>
          </div>
          <div class="metric-block" style="flex-grow: 1; display: flex; align-items: center; gap: 8px;">
            <span class="metric-label">JD Match Confidence:</span>
            <div class="confidence-bar-container">
              <div class="confidence-bar ${verdict}" style="width: ${score}%;"></div>
            </div>
          </div>
        </div>
        
        <p class="insight-text">${currentKit.candidateInsight.rationale}</p>
      </div>
    `;
  }

  const candidateName = currentKit.candidateInsight ? currentKit.candidateInsight.name || "Candidate" : "Candidate";
  return `
    <div class="report-section">
      <div class="report-header">
        <h2>Candidate: ${candidateName} | Strategy Overview</h2>
        <div class="meta-info">${currentKit.roleName}</div>
      </div>
      
      ${insightHtml}
      
      <h3>Candidate Profile Summary</h3>
      <p>${currentKit.summary}</p>
      
      <h3>Job Description Skill Extraction</h3>
      <table class="skills-table">
        <tbody>
          ${skillsHtml}
        </tbody>
      </table>
 
      ${gapsHtml}
      
      ${renderScorecardHTML()}
    </div>
  `;
}

function renderSetTab(setData, title) {
  if (!setData || !setData.questions) {
    return `<div class="report-section"><p>This difficulty set has not been generated or contains no questions.</p></div>`;
  }

  // Render Section 1: Intro
  let introHtml = `
    <h3>Section 1: Introduction & Experience Validation (5 Minutes)</h3>
    <p>Use these initial questions to warm up the candidate, validate their resume claims, and understand their leadership styles.</p>
    <div class="qa-block">
      <div class="qa-question"><span class="qa-number">1</span> Can you walk us through the most architecturally challenging project you've owned in the past 3 years? Focus on scale and key decisions.</div>
      <div class="qa-answer-box">
        <div class="qa-answer-label">Evaluation Intent:</div>
        <p>Assess candidate's structural communication, clear ownership claims, and how they define architectural trade-offs under system stress.</p>
      </div>
    </div>
    <div class="qa-block">
      <div class="qa-question"><span class="qa-number">2</span> How do you manage technical debt and guide your development team on coding standard reviews and design patterns?</div>
      <div class="qa-answer-box">
        <div class="qa-answer-label">Evaluation Intent:</div>
        <p>Look for concrete developer mentorship processes, architectural standards guidelines, and active code health checks.</p>
      </div>
    </div>
  `;

  // Render Section 2: Technical QA
  let techHtml = `<h3>Section 2: Core Technical Assessment (20 Minutes)</h3>`;
  setData.questions.forEach((q, index) => {
    // Dynamic tag for domains
    const domain = getQuestionDomain(q.question);
    techHtml += `
      <div class="qa-block">
        <div class="qa-question">
          <span class="qa-number">${index + 1}</span>
          <span>${q.question}</span>
        </div>
        <div style="margin-left: 38px; margin-bottom: 8px; font-size: 0.75rem; font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-transform: uppercase; color: var(--text-muted); font-weight: bold;">
          Domain Category: ${domain}
        </div>
        <div class="qa-answer-box">
          <div class="qa-answer-label">Expected Answer Summary:</div>
          <p>${q.answer}</p>
        </div>
        <div class="qa-metrics-grid">
          <div class="qa-metric-item strong">
            <div class="qa-metric-title">Good Candidate Mention Indicators:</div>
            <p>${q.good || "Provides clear technical answers with standard architectural terms."}</p>
          </div>
          <div class="qa-metric-item strong">
            <div class="qa-metric-title">Exceptional Candidate Mention Indicators:</div>
            <p>${q.exceptional || "Provides highly advanced insights, optimization techniques, and concrete trade-offs."}</p>
          </div>
          <div class="qa-metric-item weak">
            <div class="qa-metric-title">Common Mistakes & Red Flags:</div>
            <p>${q.mistakes || "Lack of practical production execution context or incorrect explanations."}</p>
          </div>
        </div>
        ${q.followUps && q.followUps.length > 0 ? `
          <div class="qa-followups">
            <strong>Follow-Up Inquiries:</strong>
            <ul>
              ${q.followUps.map(f => `<li>${f}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    `;
  });

  // Render Section 3: Architecture
  let archHtml = `<h3>Section 3: System Design / Architecture (20 Minutes)</h3>`;
  if (setData.architecture && setData.architecture.length > 0) {
    setData.architecture.forEach((a, index) => {
      archHtml += `
        <div class="arch-block">
          <div class="arch-title">Scenario ${index + 1}: ${a.problem}</div>
          <p><strong>Expected Architecture:</strong> ${a.expected}</p>
          <p style="margin-top: 10px;"><strong>Key Components:</strong></p>
          <ul style="padding-left: 20px; margin-bottom: 10px;">
            ${(a.components || []).map(c => `<li>${c}</li>`).join("")}
          </ul>
          <p><strong>Scalability Considerations:</strong> ${a.scalability || "Horizontal routing, load balancers, and distributed cache."}</p>
          <p><strong>Security Protocols:</strong> ${a.security || "JWT Authorization, encrypted secrets, and transport security TLS."}</p>
          <p><strong>Interviewer Evaluation Points:</strong> ${a.evaluation || "Assess their understanding of concurrency, data replication, and recovery."}</p>
        </div>
      `;
    });
  }

  // Render Section 4: Projects
  let projHtml = `<h3>Section 4: Practical Project Discussion (15 Minutes)</h3>`;
  if (setData.projects && setData.projects.length > 0) {
    setData.projects.forEach((p, index) => {
      projHtml += `
        <div class="project-block">
          <div class="project-title">Project Case: ${p.name}</div>
          <div class="project-details-grid">
            <div class="project-detail-section">
              <div class="project-detail-title">Business Context</div>
              <p>${p.context}</p>
            </div>
            <div class="project-detail-section">
              <div class="project-detail-title">System Requirements</div>
              <p>${p.requirements}</p>
            </div>
            <div class="project-detail-section">
              <div class="project-detail-title">Expected Architecture Design</div>
              <p>${p.design}</p>
            </div>
            <div class="project-detail-section">
              <div class="project-detail-title">Technology Stack</div>
              <p>${p.stack}</p>
            </div>
          </div>
          <p style="margin-bottom: 15px;"><strong>Key Implementation Challenges:</strong> ${p.challenges}</p>
          
          <div class="project-detail-title" style="margin-bottom: 10px;">Interactive Discussion Questions</div>
          ${p.questions ? p.questions.map((pq, pIndex) => `
            <div class="qa-block" style="margin-bottom: 15px; margin-left: 0;">
              <div style="font-weight: bold; margin-bottom: 4px;">Q: ${pq}</div>
              <div style="border-left: 2px solid #555; padding-left: 10px; font-style: italic;">
                <strong>Expected Response:</strong> ${p.answers[pIndex]}
              </div>
            </div>
          `).join("") : ""}
        </div>
      `;
    });
  }

  return `
    <div class="report-section">
      <div class="report-header">
        <h2>${title}</h2>
        <div class="meta-info">Total Duration: 60 Minutes</div>
      </div>
      ${introHtml}
      ${techHtml}
      ${archHtml}
      ${projHtml}
    </div>
  `;
}

function renderExportTab() {
  const defaultSec = lastActiveTab !== "export" ? lastActiveTab : "all";
  
  setTimeout(() => {
    const sel = document.getElementById("export-set-select");
    if (sel) {
      sel.value = defaultSec;
      changeExportSection(defaultSec);
    }
  }, 50);

  return `
    <div class="export-container-wrapper">
      <div class="export-panel no-print">
        <h3>Export Assessment</h3>
        <p>Save the generated interview sheets as a professional document or print them for the interview panel.</p>
        
        <div class="export-select-container" style="margin: 20px 0; text-align: left; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          <label for="export-set-select" style="font-weight: bold; display: block; margin-bottom: 8px; color: var(--text-headers);">Select Section to Export / Print:</label>
          <select id="export-set-select" onchange="changeExportSection(this.value)" style="width: 100%; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.95rem; background-color: #ffffff;">
            <option value="all">Full Assessment (All Sections)</option>
            <option value="overview">Strategy Overview & Gap Analysis</option>
            <option value="set1">Set 1: Standard Difficulty Questions</option>
            <option value="set2">Set 2: Advanced Difficulty Questions</option>
            <option value="set3">Set 3: Expert Difficulty Questions</option>
          </select>
        </div>

        <div class="export-buttons">
          <button class="btn-primary" onclick="window.print()">Print PDF</button>
          <button class="btn-secondary" onclick="exportMarkdownSection()">Download Markdown</button>
        </div>
      </div>
      
      <!-- Clean, printable section preview -->
      <div id="printable-preview-area" class="report-section">
        <h4 class="no-print" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-transform: uppercase; font-size: 0.8rem; color: var(--text-muted); margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">Print Preview:</h4>
        <div id="printable-preview-content">
          <!-- Active selection preview is rendered here -->
        </div>
      </div>
    </div>
  `;
}

// Handler for dropdown preview switch
window.changeExportSection = function(section) {
  selectedExportSet = section;
  const previewContent = document.getElementById("printable-preview-content");
  if (!previewContent || !currentKit) return;

  let html = "";
  if (section === "all") {
    html = `
      <div class="all-printable-sections">
        ${renderOverviewTab()}
        <div style="page-break-before: always; margin-top: 40px; border-top: 2px solid var(--text-headers); padding-top: 20px;"></div>
        ${renderSetTab(currentKit.sets.standard, "SET 1: STANDARD DIFFICULTY")}
        <div style="page-break-before: always; margin-top: 40px; border-top: 2px solid var(--text-headers); padding-top: 20px;"></div>
        ${renderSetTab(currentKit.sets.advanced, "SET 2: ADVANCED DIFFICULTY")}
        <div style="page-break-before: always; margin-top: 40px; border-top: 2px solid var(--text-headers); padding-top: 20px;"></div>
        ${renderSetTab(currentKit.sets.expert, "SET 3: EXPERT DIFFICULTY")}
      </div>
    `;
  } else if (section === "overview") {
    html = renderOverviewTab();
  } else if (section === "set1") {
    html = renderSetTab(currentKit.sets.standard, "SET 1: STANDARD DIFFICULTY");
  } else if (section === "set2") {
    html = renderSetTab(currentKit.sets.advanced, "SET 2: ADVANCED DIFFICULTY");
  } else if (section === "set3") {
    html = renderSetTab(currentKit.sets.expert, "SET 3: EXPERT DIFFICULTY");
  }
  
  previewContent.innerHTML = html;
};

// Full kit markdown generator
function generateMarkdownForKit(kit) {
  let md = `# Candidate Evaluation Assessment: ${kit.roleName}\n\n`;
  
  if (kit.candidateInsight) {
    md += `## Recommended Tracking: ${kit.candidateInsight.track.toUpperCase()}\n`;
    md += `> ${kit.candidateInsight.rationale}\n\n`;
  }

  md += `## 1. Candidate Profile Summary\n${kit.summary}\n\n`;
  
  md += `## 2. Ingestion Skill Extractions\n`;
  Object.keys(kit.skills).forEach(cat => {
    md += `- **${cat.toUpperCase()}**: ${kit.skills[cat].join(", ")}\n`;
  });
  md += `\n`;

  if (kit.gaps && kit.gaps.length > 0) {
    md += `## 3. Gap Analysis (JD vs CV)\n`;
    kit.gaps.forEach(g => {
      md += `- **${g.skill}** [${g.status.toUpperCase()}]: ${g.notes}\n`;
    });
    md += `\n`;
  }

  const difficulties = ["standard", "advanced", "expert"];
  difficulties.forEach(diff => {
    const set = kit.sets[diff];
    if (set && set.questions) {
      md += `# INTERVIEW SET: ${diff.toUpperCase()} DIFFICULTY\n\n`;
      md += `## Section 1: Core Technical Questions\n\n`;
      set.questions.forEach((q, idx) => {
        md += `### Q${idx + 1}: ${q.question}\n`;
        md += `**Domain:** ${getQuestionDomain(q.question)}\n`;
        md += `**Expected Answer:** ${q.answer}\n\n`;
        md += `- **Good Indicator:** ${q.good}\n`;
        md += `- **Exceptional Indicator:** ${q.exceptional}\n`;
        md += `- **Mistakes/Red Flags:** ${q.mistakes}\n\n`;
        if (q.followUps && q.followUps.length > 0) {
          md += `**Follow-Ups:**\n`;
          q.followUps.forEach(f => md += `- ${f}\n`);
          md += `\n`;
        }
      });

      if (set.architecture && set.architecture.length > 0) {
        md += `## Section 2: System Design & Architecture\n\n`;
        set.architecture.forEach((a, idx) => {
          md += `### Design Scenario ${idx + 1}: ${a.problem}\n`;
          md += `- **Expected Design:** ${a.expected}\n`;
          md += `- **Components:** ${a.components.join(", ")}\n`;
          md += `- **Scalability:** ${a.scalability}\n`;
          md += `- **Security:** ${a.security}\n`;
          md += `- **Evaluation Points:** ${a.evaluation}\n\n`;
        });
      }

      if (set.projects && set.projects.length > 0) {
        md += `## Section 3: Practical Projects\n\n`;
        set.projects.forEach((p, idx) => {
          md += `### Project Case ${idx + 1}: ${p.name}\n`;
          md += `- **Context:** ${p.context}\n`;
          md += `- **Requirements:** ${p.requirements}\n`;
          md += `- **Stack:** ${p.stack}\n`;
          md += `- **Challenges:** ${p.challenges}\n\n`;
        });
      }
    }
  });
  return md;
}

// Export specific section to Markdown file
window.exportMarkdownSection = function() {
  if (!currentKit) return;

  const section = selectedExportSet;
  let md = "";

  if (section === "all") {
    md = generateMarkdownForKit(currentKit);
  } else if (section === "overview") {
    md = `# Strategy Overview: ${currentKit.roleName}\n\n`;
    if (currentKit.candidateInsight) {
      md += `## Recommended Tracking: ${currentKit.candidateInsight.track.toUpperCase()}\n`;
      md += `> ${currentKit.candidateInsight.rationale}\n\n`;
    }
    md += `## 1. Candidate Profile Summary\n${currentKit.summary}\n\n`;
    md += `## 2. Ingestion Skill Extractions\n`;
    Object.keys(currentKit.skills).forEach(cat => {
      md += `- **${cat.toUpperCase()}**: ${currentKit.skills[cat].join(", ")}\n`;
    });
    md += `\n`;
    if (currentKit.gaps && currentKit.gaps.length > 0) {
      md += `## 3. Gap Analysis (JD vs CV)\n`;
      currentKit.gaps.forEach(g => {
        md += `- **${g.skill}** [${g.status.toUpperCase()}]: ${g.notes}\n`;
      });
    }
  } else {
    const diff = {
      "set1": "standard",
      "set2": "advanced",
      "set3": "expert"
    }[section];
    const title = {
      "set1": "SET 1: STANDARD DIFFICULTY",
      "set2": "SET 2: ADVANCED DIFFICULTY",
      "set3": "SET 3: EXPERT DIFFICULTY"
    }[section];
    
    const set = currentKit.sets[diff];
    if (set) {
      md = `# ${title} - ${currentKit.roleName}\n\n`;
      md += `## Section 1: Core Technical Questions\n\n`;
      if (set.questions) {
        set.questions.forEach((q, idx) => {
          md += `### Q${idx + 1}: ${q.question}\n`;
          md += `**Domain:** ${getQuestionDomain(q.question)}\n`;
          md += `**Expected Answer:** ${q.answer}\n\n`;
          md += `- **Good Indicator:** ${q.good}\n`;
          md += `- **Exceptional Indicator:** ${q.exceptional}\n`;
          md += `- **Mistakes/Red Flags:** ${q.mistakes}\n\n`;
          if (q.followUps && q.followUps.length > 0) {
            md += `**Follow-Ups:**\n`;
            q.followUps.forEach(f => md += `- ${f}\n`);
            md += `\n`;
          }
        });
      }
      if (set.architecture && set.architecture.length > 0) {
        md += `## Section 2: System Design & Architecture\n\n`;
        set.architecture.forEach((a, idx) => {
          md += `### Design Scenario ${idx + 1}: ${a.problem}\n`;
          md += `- **Expected Design:** ${a.expected}\n`;
          md += `- **Components:** ${a.components.join(", ")}\n`;
          md += `- **Scalability:** ${a.scalability}\n`;
          md += `- **Security:** ${a.security}\n`;
          md += `- **Evaluation Points:** ${a.evaluation}\n\n`;
        });
      }
      if (set.projects && set.projects.length > 0) {
        md += `## Section 3: Practical Projects\n\n`;
        set.projects.forEach((p, idx) => {
          md += `### Project Case ${idx + 1}: ${p.name}\n`;
          md += `- **Context:** ${p.context}\n`;
          md += `- **Requirements:** ${p.requirements}\n`;
          md += `- **Stack:** ${p.stack}\n`;
          md += `- **Challenges:** ${p.challenges}\n\n`;
        });
      }
    }
  }

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Assessment_${currentRole}_${section}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Fallback compatibility
window.exportMarkdown = function() {
  window.exportMarkdownSection();
};

// --- MULTI-ROUND EVALUATION SCORECARD & DATABASE CONTROLS ---

function loadPanelistConfiguration() {
  const cleanPanelists = (data) => {
    if (data.tech) data.tech = data.tech.filter(name => name !== "Venkatesh VG");
    if (data.managerial) data.managerial = data.managerial.filter(name => name !== "Santhosh" && name !== "Guna Sekar");
    if (data.hr) data.hr = data.hr.filter(name => name !== "Venkatesh VG");
    return data;
  };

  if (useFirestore && db) {
    db.collection("settings").doc("panelists").get()
      .then(doc => {
        if (doc.exists) {
          let data = doc.data();
          data = cleanPanelists(data);
          if (data.tech) panelistLists.tech = data.tech;
          if (data.managerial) panelistLists.managerial = data.managerial;
          if (data.hr) panelistLists.hr = data.hr;
          savePanelistConfiguration();
        } else {
          loadPanelistsFromLocalStorage();
        }
      })
      .catch(err => {
        console.error("Firestore read settings failed. Loading from LocalStorage:", err);
        loadPanelistsFromLocalStorage();
      });
  } else {
    loadPanelistsFromLocalStorage();
  }
}

function loadPanelistsFromLocalStorage() {
  const saved = localStorage.getItem("TECH_EVAL_PANELISTS");
  if (saved) {
    try {
      let data = JSON.parse(saved);
      if (data.tech) data.tech = data.tech.filter(name => name !== "Venkatesh VG");
      if (data.managerial) data.managerial = data.managerial.filter(name => name !== "Santhosh" && name !== "Guna Sekar");
      if (data.hr) data.hr = data.hr.filter(name => name !== "Venkatesh VG");
      
      if (data.tech) panelistLists.tech = data.tech;
      if (data.managerial) panelistLists.managerial = data.managerial;
      if (data.hr) panelistLists.hr = data.hr;
      savePanelistConfiguration();
    } catch (err) {
      console.error("Failed to parse panelist settings from local storage:", err);
    }
  } else {
    savePanelistConfiguration();
  }
}

function savePanelistConfiguration() {
  const data = {
    tech: panelistLists.tech,
    managerial: panelistLists.managerial,
    hr: panelistLists.hr
  };
  
  if (useFirestore && db) {
    db.collection("settings").doc("panelists").set(data)
      .catch(err => {
        console.error("Firestore save settings failed. Saving to LocalStorage:", err);
        localStorage.setItem("TECH_EVAL_PANELISTS", JSON.stringify(data));
      });
  } else {
    localStorage.setItem("TECH_EVAL_PANELISTS", JSON.stringify(data));
  }
}

function renderInterviewerSelect(roundKey, selectedVal, type) {
  const list = panelistLists[type] || [];
  const displayList = [...list];
  if (selectedVal && !displayList.includes(selectedVal)) {
    displayList.push(selectedVal);
  }
  
  let finalSelectedVal = selectedVal;
  if (!selectedVal) {
    if (type === 'managerial') {
      finalSelectedVal = "Venkatesh VG";
    } else if (type === 'hr') {
      finalSelectedVal = "Annapoorani";
    }
  }
  
  const options = displayList.map(name => `
    <option value="${name}" ${finalSelectedVal === name ? 'selected' : ''}>${name}</option>
  `).join("");
  
  return `
    <select class="sidebar-select" id="${roundKey}-interviewer-select" data-round="${roundKey}" data-type="${type}" onchange="handleInterviewerDropdownChange(this)" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
      <option value="" ${!finalSelectedVal ? 'selected' : ''}>-- Select Interviewer --</option>
      ${options}
      <option value="custom">+ Add Custom Name...</option>
    </select>
    <input type="text" id="${roundKey}-custom-interviewer" class="custom-interviewer-input" style="display: none; margin-top: 8px; width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;" placeholder="Enter custom name">
  `;
}

window.handleInterviewerDropdownChange = function(selectEl) {
  const roundKey = selectEl.getAttribute("data-round");
  const customInput = document.getElementById(`${roundKey}-custom-interviewer`);
  if (selectEl.value === "custom") {
    customInput.style.display = "block";
    customInput.focus();
  } else {
    customInput.style.display = "none";
  }
};

function setupHistoryActions() {
  const btnHistoryBackHome = document.getElementById("btn-history-back-home");
  if (btnHistoryBackHome) {
    btnHistoryBackHome.addEventListener("click", () => {
      document.getElementById("history-dashboard").style.display = "none";
      welcomeDashboard.style.display = "block";
    });
  }
}

// Generate rating options dropdown HTML helper
function renderRatingOptions(selectedVal) {
  const options = [
    { val: "5.0", label: "5.0 - Expert" },
    { val: "4.5", label: "4.5" },
    { val: "4.0", label: "4.0 - Strong" },
    { val: "3.5", label: "3.5" },
    { val: "3.0", label: "3.0 - Competent" },
    { val: "2.5", label: "2.5" },
    { val: "2.0", label: "2.0 - Basic" },
    { val: "1.5", label: "1.5" },
    { val: "1.0", label: "1.0 - Novice" },
    { val: "0.0", label: "0.0 - Not Evaluated" }
  ];
  return options.map(o => `
    <option value="${o.val}" ${parseFloat(selectedVal) === parseFloat(o.val) ? 'selected' : ''}>${o.label}</option>
  `).join("");
}

// Round scorecard score compiler
function calculateAverageRoundScore(roundKey) {
  const ratings = scorecardState.rounds[roundKey].ratings || {};
  const vals = Object.values(ratings).filter(v => v > 0);
  if (vals.length === 0) return "0.0";
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

// Combined overall scorecard average compiler
function calculateOverallAverageScore() {
  let sum = 0;
  let count = 0;
  const rounds = ["tech1", "tech2", "managerial"];
  rounds.forEach(r => {
    const avg = parseFloat(calculateAverageRoundScore(r));
    if (avg > 0) {
      sum += avg;
      count++;
    }
  });
  if (count === 0) return "0.0";
  return (sum / count).toFixed(1);
}

// Generate evaluation form card
function renderScorecardHTML() {
  const kit = currentKit;
  if (!kit) return "";

  // Compile technical skills list
  const technicalSkills = [
    ...(kit.skills.technical || []),
    ...(kit.skills.mandatory || []),
    ...(kit.skills.preferred || []),
    ...(kit.skills.architecture || []),
    ...(kit.skills.cloud || []),
    ...(kit.skills.ai || [])
  ]
  .filter((val, idx, self) => self.indexOf(val) === idx && val.trim().length > 0)
  .slice(0, 6);

  // Compile managerial skills list
  const managerialSkills = [
    ...(kit.skills.leadership || []),
    "Communication & Presentation",
    "Culture Alignment & Value Fit",
    "Conflict Resolution & Collaboration",
    "Team Mentorship & Growth"
  ]
  .filter((val, idx, self) => self.indexOf(val) === idx && val.trim().length > 0)
  .slice(0, 5);

  // Fallback if empty
  if (technicalSkills.length === 0) technicalSkills.push("Technical Knowledge", "System Architecture", "Coding Proficiency");

  const tech1Rows = technicalSkills.map(skill => {
    const rating = scorecardState.rounds.tech1.ratings[skill] || "0.0";
    return `
      <tr>
        <td style="font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">${skill}</td>
        <td>
          <select class="scorecard-rating-select" data-round="tech1" data-skill="${skill}">
            ${renderRatingOptions(rating)}
          </select>
        </td>
      </tr>
    `;
  }).join("");

  const tech2Rows = technicalSkills.map(skill => {
    const rating = scorecardState.rounds.tech2.ratings[skill] || "0.0";
    return `
      <tr>
        <td style="font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">${skill}</td>
        <td>
          <select class="scorecard-rating-select" data-round="tech2" data-skill="${skill}">
            ${renderRatingOptions(rating)}
          </select>
        </td>
      </tr>
    `;
  }).join("");

  const managerialRows = managerialSkills.map(skill => {
    const rating = scorecardState.rounds.managerial.ratings[skill] || "0.0";
    return `
      <tr>
        <td style="font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">${skill}</td>
        <td>
          <select class="scorecard-rating-select" data-round="managerial" data-skill="${skill}">
            ${renderRatingOptions(rating)}
          </select>
        </td>
      </tr>
    `;
  }).join("");

  const candidateName = kit.candidateInsight ? kit.candidateInsight.name || "" : "";
  
  const t1Status = scorecardState.rounds.tech1.status;
  const t2Status = scorecardState.rounds.tech2.status;
  
  const tech2Enabled = t1Status === "Select";
  const managerialEnabled = t1Status === "Select" && t2Status === "Select";
  
  let currentActive = scorecardState.activeRound || "tech1";
  if (currentActive === "tech2" && !tech2Enabled) {
    currentActive = "tech1";
    scorecardState.activeRound = "tech1";
  } else if (currentActive === "managerial" && !managerialEnabled) {
    currentActive = tech2Enabled ? "tech2" : "tech1";
    scorecardState.activeRound = currentActive;
  }

  return `
    <div class="multi-round-scorecard-card no-print">
      <h3>Multi-Round Panel Evaluation Scorecard</h3>
      
      <div style="margin-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
        <label style="font-weight: bold; display: block; margin-bottom: 6px; color: var(--text-headers);">Candidate Name (Key Element):</label>
        <input type="text" id="scorecard-candidate-name" value="${candidateName}" placeholder="Enter candidate name to link scorecard..." style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; font-family: inherit;" onchange="handleScorecardNameChange(this.value)">
      </div>
      
      <p style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
        Grade the candidate through Technical Round 1, Technical Round 2, and the Managerial Round. Save each round to sync with the database.
      </p>

      <!-- Round Sub Tabs -->
      <div class="round-tab-bar">
        <button class="round-tab-btn ${currentActive === 'tech1' ? 'active' : ''}" onclick="switchRoundTab('tech1')">Tech Round 1</button>
        <button class="round-tab-btn ${currentActive === 'tech2' ? 'active' : ''}" ${tech2Enabled ? '' : 'disabled'} onclick="switchRoundTab('tech2')">Tech Round 2</button>
        <button class="round-tab-btn ${currentActive === 'managerial' ? 'active' : ''}" ${managerialEnabled ? '' : 'disabled'} onclick="switchRoundTab('managerial')">Managerial Round</button>
        <button class="round-tab-btn ${currentActive === 'final' ? 'active' : ''}" onclick="switchRoundTab('final')">Final Decision</button>
      </div>

      <!-- Tech Round 1 Panel -->
      <div id="round-panel-tech1" class="round-panel" style="display: ${currentActive === 'tech1' ? 'block' : 'none'};">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div>
            <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Interviewer Name:</label>
            ${renderInterviewerSelect('tech1', scorecardState.rounds.tech1.interviewer, 'tech')}
          </div>
          <div>
            <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Round Status:</label>
            <div class="decision-toggle-group">
              <button class="decision-btn select-btn ${scorecardState.rounds.tech1.status === 'Select' ? 'active' : ''}" onclick="setRoundStatus('tech1', 'Select')">Select</button>
              <button class="decision-btn reject-btn ${scorecardState.rounds.tech1.status === 'Reject' ? 'active' : ''}" onclick="setRoundStatus('tech1', 'Reject')">Reject</button>
              <button class="decision-btn hold-btn ${scorecardState.rounds.tech1.status === 'Hold' ? 'active' : ''}" onclick="setRoundStatus('tech1', 'Hold')">Hold</button>
            </div>
          </div>
        </div>

        <table class="skills-table">
          <thead>
            <tr>
              <th style="width: 60%;">Technical Skill / Area</th>
              <th style="width: 40%;">Rating</th>
            </tr>
          </thead>
          <tbody>
            ${tech1Rows}
          </tbody>
        </table>

        <div style="margin-top: 20px;">
          <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Round Comments / Interview Notes:</label>
          <textarea id="tech1-comments" placeholder="Write technical evaluation notes..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; font-size: 0.95rem; resize: none;">${scorecardState.rounds.tech1.comments}</textarea>
        </div>

        <button class="btn-primary" onclick="saveRoundDetails('tech1')" style="width: 100%; margin-top: 20px;">Save Round 1 Assessment</button>
      </div>

      <!-- Tech Round 2 Panel -->
      <div id="round-panel-tech2" class="round-panel" style="display: ${currentActive === 'tech2' ? 'block' : 'none'};">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div>
            <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Interviewer Name:</label>
            ${renderInterviewerSelect('tech2', scorecardState.rounds.tech2.interviewer, 'tech')}
          </div>
          <div>
            <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Round Status:</label>
            <div class="decision-toggle-group">
              <button class="decision-btn select-btn ${scorecardState.rounds.tech2.status === 'Select' ? 'active' : ''}" onclick="setRoundStatus('tech2', 'Select')">Select</button>
              <button class="decision-btn reject-btn ${scorecardState.rounds.tech2.status === 'Reject' ? 'active' : ''}" onclick="setRoundStatus('tech2', 'Reject')">Reject</button>
              <button class="decision-btn hold-btn ${scorecardState.rounds.tech2.status === 'Hold' ? 'active' : ''}" onclick="setRoundStatus('tech2', 'Hold')">Hold</button>
            </div>
          </div>
        </div>

        <table class="skills-table">
          <thead>
            <tr>
              <th style="width: 60%;">Technical Skill / Area</th>
              <th style="width: 40%;">Rating</th>
            </tr>
          </thead>
          <tbody>
            ${tech2Rows}
          </tbody>
        </table>

        <div style="margin-top: 20px;">
          <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Round Comments / Interview Notes:</label>
          <textarea id="tech2-comments" placeholder="Write technical evaluation notes..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; font-size: 0.95rem; resize: none;">${scorecardState.rounds.tech2.comments}</textarea>
        </div>

        <button class="btn-primary" onclick="saveRoundDetails('tech2')" style="width: 100%; margin-top: 20px;">Save Round 2 Assessment</button>
      </div>

      <!-- Managerial Round Panel -->
      <div id="round-panel-managerial" class="round-panel" style="display: ${currentActive === 'managerial' ? 'block' : 'none'};">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div>
            <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Interviewer Name:</label>
            ${renderInterviewerSelect('managerial', scorecardState.rounds.managerial.interviewer, 'managerial')}
          </div>
          <div>
            <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Round Status:</label>
            <div class="decision-toggle-group">
              <button class="decision-btn select-btn ${scorecardState.rounds.managerial.status === 'Select' ? 'active' : ''}" onclick="setRoundStatus('managerial', 'Select')">Select</button>
              <button class="decision-btn reject-btn ${scorecardState.rounds.managerial.status === 'Reject' ? 'active' : ''}" onclick="setRoundStatus('managerial', 'Reject')">Reject</button>
              <button class="decision-btn hold-btn ${scorecardState.rounds.managerial.status === 'Hold' ? 'active' : ''}" onclick="setRoundStatus('managerial', 'Hold')">Hold</button>
            </div>
          </div>
        </div>

        <table class="skills-table">
          <thead>
            <tr>
              <th style="width: 60%;">Soft Skill / Leadership Expectation</th>
              <th style="width: 40%;">Rating</th>
            </tr>
          </thead>
          <tbody>
            ${managerialRows}
          </tbody>
        </table>

        <div style="margin-top: 20px;">
          <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Round Comments / Interview Notes:</label>
          <textarea id="managerial-comments" placeholder="Write leadership & cultural evaluation notes..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; font-size: 0.95rem; resize: none;">${scorecardState.rounds.managerial.comments}</textarea>
        </div>

        <button class="btn-primary" onclick="saveRoundDetails('managerial')" style="width: 100%; margin-top: 20px;">Save Managerial Assessment</button>
      </div>

      <!-- Final Decision Panel -->
      <div id="round-panel-final" class="round-panel" style="display: ${currentActive === 'final' ? 'block' : 'none'};">
        <h4 style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 1rem; color: var(--text-headers); margin-bottom: 12px; border-bottom: 1px solid var(--border-light); padding-bottom: 6px; font-weight: bold;">Rounds Summary</h4>
        
        <table class="screening-table" style="margin-bottom: 24px;">
          <thead>
            <tr>
              <th style="width: 30%;">Round</th>
              <th style="width: 30%;">Interviewer</th>
              <th style="width: 20%;">Average Score</th>
              <th style="width: 20%;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Technical Round 1</td>
              <td>${scorecardState.rounds.tech1.interviewer || "<i>Not Evaluated</i>"}</td>
              <td>${calculateAverageRoundScore('tech1')} / 5.0</td>
              <td><span class="status-badge ${scorecardState.rounds.tech1.status.toLowerCase()}">${scorecardState.rounds.tech1.status}</span></td>
            </tr>
            <tr>
              <td>Technical Round 2</td>
              <td>${scorecardState.rounds.tech2.interviewer || "<i>Not Evaluated</i>"}</td>
              <td>${calculateAverageRoundScore('tech2')} / 5.0</td>
              <td><span class="status-badge ${scorecardState.rounds.tech2.status.toLowerCase()}">${scorecardState.rounds.tech2.status}</span></td>
            </tr>
            <tr>
              <td>Managerial Round</td>
              <td>${scorecardState.rounds.managerial.interviewer || "<i>Not Evaluated</i>"}</td>
              <td>${calculateAverageRoundScore('managerial')} / 5.0</td>
              <td><span class="status-badge ${scorecardState.rounds.managerial.status.toLowerCase()}">${scorecardState.rounds.managerial.status}</span></td>
            </tr>
          </tbody>
        </table>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
          <div>
            <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Final Hiring Status:</label>
            <div class="decision-toggle-group">
              <button class="decision-btn select-btn ${scorecardState.finalDecision === 'Select' ? 'active' : ''}" onclick="setFinalDecision('Select')">Select</button>
              <button class="decision-btn reject-btn ${scorecardState.finalDecision === 'Reject' ? 'active' : ''}" onclick="setFinalDecision('Reject')">Reject</button>
              <button class="decision-btn hold-btn ${scorecardState.finalDecision === 'Hold' ? 'active' : ''}" onclick="setFinalDecision('Hold')">Hold</button>
            </div>
          </div>
          <div>
            <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">HR / Decision Maker Name:</label>
            ${renderInterviewerSelect('final', scorecardState.finalInterviewer || "", 'hr')}
          </div>
          <div>
            <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Candidate Overall Average:</label>
            <div style="font-size: 1.8rem; font-weight: bold; color: var(--text-headers); font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding-top: 4px;">
              ${calculateOverallAverageScore()} / 5.0
            </div>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <label style="font-weight: bold; display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Final Hiring Comments & Feedback Summary:</label>
          <textarea id="final-comments" placeholder="Write overall hiring feedback, salary expectations, next steps..." style="width: 100%; height: 90px; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; font-size: 0.95rem; resize: none;">${scorecardState.finalComments}</textarea>
        </div>

        <button class="btn-primary" onclick="saveFinalHiringAssessment()" style="width: 100%; margin-top: 24px; background-color: var(--text-headers); border-color: var(--text-headers);">Submit & Save Final Candidate Report</button>
      </div>
    </div>
  `;
}

window.handleScorecardNameChange = function(newName) {
  const trimmed = newName.trim();
  if (!trimmed) {
    alert("Candidate name cannot be empty.");
    return;
  }
  
  if (currentKit) {
    if (!currentKit.candidateInsight) {
      currentKit.candidateInsight = { track: "intermediate" };
    }
    currentKit.candidateInsight.name = trimmed;
  }
  
  findLatestAssessment(trimmed, currentRole, (assessment) => {
    if (assessment) {
      scorecardState.assessmentId = assessment.id;
      scorecardState.rounds = assessment.rounds;
      scorecardState.finalDecision = assessment.finalDecision || "Pending";
      scorecardState.finalComments = assessment.finalComments || "";
      scorecardState.finalInterviewer = assessment.finalInterviewer || "";
      
      const t1 = scorecardState.rounds.tech1.status;
      const t2 = scorecardState.rounds.tech2.status;
      const mgr = scorecardState.rounds.managerial.status;
      
      if (t1 === "Pending") {
        scorecardState.activeRound = "tech1";
      } else if (t2 === "Pending" && t1 === "Select") {
        scorecardState.activeRound = "tech2";
      } else if (mgr === "Pending" && t1 === "Select" && t2 === "Select") {
        scorecardState.activeRound = "managerial";
      } else {
        scorecardState.activeRound = "final";
      }
      
      renderActiveTab("overview");
    } else {
      renderActiveTab("overview");
    }
  });
};

window.switchRoundTab = function(roundKey) {
  scorecardState.activeRound = roundKey;
  
  const btns = document.querySelectorAll(".round-tab-btn");
  btns.forEach(btn => {
    if (btn.innerText.toLowerCase().includes(roundKey === 'tech1' ? 'round 1' : roundKey === 'tech2' ? 'round 2' : roundKey === 'managerial' ? 'managerial' : 'final')) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const panels = document.querySelectorAll(".round-panel");
  panels.forEach(p => p.style.display = "none");
  const activePanel = document.getElementById(`round-panel-${roundKey}`);
  if (activePanel) activePanel.style.display = "block";
};

window.updateTabButtonsLockState = function() {
  const t1Status = scorecardState.rounds.tech1.status;
  const t2Status = scorecardState.rounds.tech2.status;
  
  const tech2Enabled = t1Status === "Select";
  const managerialEnabled = t1Status === "Select" && t2Status === "Select";
  
  const btns = document.querySelectorAll(".round-tab-btn");
  btns.forEach(btn => {
    const label = btn.innerText.toLowerCase();
    if (label.includes("round 2")) {
      if (tech2Enabled) {
        btn.removeAttribute("disabled");
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      } else {
        btn.setAttribute("disabled", "true");
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
      }
    } else if (label.includes("managerial")) {
      if (managerialEnabled) {
        btn.removeAttribute("disabled");
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      } else {
        btn.setAttribute("disabled", "true");
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
      }
    }
  });
};

window.setRoundStatus = function(roundKey, status) {
  scorecardState.rounds[roundKey].status = status;
  
  if (status === "Reject") {
    scorecardState.finalDecision = "Reject";
  }
  
  saveCandidateAssessmentToDB();
  
  const panel = document.getElementById(`round-panel-${roundKey}`);
  if (panel) {
    const btns = panel.querySelectorAll(".decision-btn");
    btns.forEach(btn => {
      if (btn.innerText.toLowerCase() === status.toLowerCase()) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
  
  window.updateTabButtonsLockState();

  if (status === "Select") {
    if (roundKey === "tech1") {
      setTimeout(() => window.switchRoundTab("tech2"), 150);
    } else if (roundKey === "tech2") {
      setTimeout(() => window.switchRoundTab("managerial"), 150);
    } else if (roundKey === "managerial") {
      setTimeout(() => window.switchRoundTab("final"), 150);
    }
  } else if (status === "Reject") {
    setTimeout(() => window.switchRoundTab("final"), 150);
  }
};

window.setFinalDecision = function(decision) {
  scorecardState.finalDecision = decision;
  saveCandidateAssessmentToDB();
  const panel = document.getElementById("round-panel-final");
  if (panel) {
    const btns = panel.querySelectorAll(".decision-btn");
    btns.forEach(btn => {
      if (btn.innerText.toLowerCase() === decision.toLowerCase()) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
};

window.saveRoundDetails = function(roundKey) {
  const nameInput = document.getElementById("scorecard-candidate-name");
  if (nameInput) {
    const newName = nameInput.value.trim();
    if (newName) {
      if (!currentKit.candidateInsight) {
        currentKit.candidateInsight = { track: "intermediate" };
      }
      currentKit.candidateInsight.name = newName;
    } else {
      alert("Please enter a candidate name.");
      return;
    }
  }

  const selectEl = document.getElementById(`${roundKey}-interviewer-select`);
  let interviewer = "";
  if (selectEl) {
    if (selectEl.value === "custom") {
      const customInput = document.getElementById(`${roundKey}-custom-interviewer`);
      interviewer = customInput ? customInput.value.trim() : "";
      if (interviewer) {
        const type = selectEl.getAttribute("data-type");
        if (panelistLists[type] && !panelistLists[type].includes(interviewer)) {
          panelistLists[type].push(interviewer);
          savePanelistConfiguration();
        }
      } else {
        alert("Please enter a custom interviewer name.");
        return;
      }
    } else {
      interviewer = selectEl.value;
    }
  }

  const comments = document.getElementById(`${roundKey}-comments`).value.trim();
  
  const ratings = {};
  const selects = document.querySelectorAll(`.scorecard-rating-select[data-round="${roundKey}"]`);
  selects.forEach(sel => {
    const skill = sel.getAttribute("data-skill");
    ratings[skill] = parseFloat(sel.value);
  });
  
  scorecardState.rounds[roundKey].interviewer = interviewer;
  scorecardState.rounds[roundKey].comments = comments;
  scorecardState.rounds[roundKey].ratings = ratings;
  
  const ratingVals = Object.values(ratings).filter(v => v > 0);
  const avg = ratingVals.length > 0 ? (ratingVals.reduce((a,b) => a+b, 0) / ratingVals.length).toFixed(1) : "0.0";
  scorecardState.rounds[roundKey].averageScore = parseFloat(avg);
  
  if (scorecardState.rounds[roundKey].status === "Select") {
    if (roundKey === "tech1") {
      scorecardState.activeRound = "tech2";
    } else if (roundKey === "tech2") {
      scorecardState.activeRound = "managerial";
    }
  }
  
  saveCandidateAssessmentToDB(() => {
    alert(`${roundKey === 'tech1' ? 'Technical Round 1' : roundKey === 'tech2' ? 'Technical Round 2' : 'Managerial Round'} assessment details saved successfully!`);
    renderActiveTab("overview");
  });
};

window.saveFinalHiringAssessment = function() {
  const nameInput = document.getElementById("scorecard-candidate-name");
  if (nameInput) {
    const newName = nameInput.value.trim();
    if (newName) {
      if (!currentKit.candidateInsight) {
        currentKit.candidateInsight = { track: "intermediate" };
      }
      currentKit.candidateInsight.name = newName;
    } else {
      alert("Please enter a candidate name.");
      return;
    }
  }

  const selectEl = document.getElementById("final-interviewer-select");
  let interviewer = "";
  if (selectEl) {
    if (selectEl.value === "custom") {
      const customInput = document.getElementById("final-custom-interviewer");
      interviewer = customInput ? customInput.value.trim() : "";
      if (interviewer) {
        const type = selectEl.getAttribute("data-type");
        if (panelistLists[type] && !panelistLists[type].includes(interviewer)) {
          panelistLists[type].push(interviewer);
          savePanelistConfiguration();
        }
      } else {
        alert("Please enter a custom HR panelist name.");
        return;
      }
    } else {
      interviewer = selectEl.value;
    }
  }
  scorecardState.finalInterviewer = interviewer;

  const comments = document.getElementById("final-comments").value.trim();
  scorecardState.finalComments = comments;
  
  saveCandidateAssessmentToDB(() => {
    alert("Candidate final hiring report submitted and saved successfully!");
    renderActiveTab("overview");
  });
};

function saveCandidateAssessmentToDB(callback) {
  if (!currentKit) return;
  
  const candidateName = currentKit.candidateInsight ? currentKit.candidateInsight.name || currentKit.candidateName || "Candidate" : "Candidate";
  if (!scorecardState.assessmentId) {
    scorecardState.assessmentId = `${candidateName}_${currentRole}_${Date.now()}`.replace(/\s+/g, "_");
  }
  const docId = scorecardState.assessmentId;

  const t1 = scorecardState.rounds.tech1.status;
  const t2 = scorecardState.rounds.tech2.status;
  const mgr = scorecardState.rounds.managerial.status;
  if (t1 === "Reject" || t2 === "Reject" || mgr === "Reject") {
    scorecardState.finalDecision = "Reject";
  }

  const data = {
    id: docId,
    candidateName: candidateName,
    role: currentRole,
    roleName: currentKit.roleName,
    track: currentKit.candidateInsight ? currentKit.candidateInsight.track : "intermediate",
    date: new Date().toISOString(),
    rounds: scorecardState.rounds,
    finalDecision: scorecardState.finalDecision,
    finalComments: scorecardState.finalComments,
    finalInterviewer: scorecardState.finalInterviewer || "",
    overallAverage: calculateOverallAverageScore()
  };

  if (useFirestore && db) {
    db.collection("interviews").doc(docId).set(data)
      .then(() => {
        if (callback) callback();
      })
      .catch(err => {
        console.error("Firestore save failed. Falling back to LocalStorage:", err);
        saveToLocalStorage(data);
        if (callback) callback();
      });
  } else {
    saveToLocalStorage(data);
    if (callback) callback();
  }
}

function saveToLocalStorage(data) {
  const saved = localStorage.getItem("TECH_EVAL_INTERVIEWS");
  let interviews = saved ? JSON.parse(saved) : [];
  interviews = interviews.filter(item => item.id !== data.id);
  interviews.push(data);
  localStorage.setItem("TECH_EVAL_INTERVIEWS", JSON.stringify(interviews));
}

function loadScorecardState(assessmentId, callback) {
  scorecardState = {
    assessmentId: assessmentId,
    activeRound: "tech1",
    rounds: {
      tech1: { interviewer: "", status: "Pending", comments: "", ratings: {} },
      tech2: { interviewer: "", status: "Pending", comments: "", ratings: {} },
      managerial: { interviewer: "", status: "Pending", comments: "", ratings: {} }
    },
    finalDecision: "Pending",
    finalComments: "",
    finalInterviewer: "",
    overallAverage: 0
  };

  const onStateLoaded = () => {
    const t1 = scorecardState.rounds.tech1.status;
    const t2 = scorecardState.rounds.tech2.status;
    const mgr = scorecardState.rounds.managerial.status;
    
    if (t1 === "Pending" || t1 === "Reject" || t1 === "Hold") {
      scorecardState.activeRound = "tech1";
    } else if (t2 === "Pending" || t2 === "Reject" || t2 === "Hold") {
      scorecardState.activeRound = "tech2";
    } else if (mgr === "Pending" || mgr === "Reject" || mgr === "Hold") {
      scorecardState.activeRound = "managerial";
    } else {
      scorecardState.activeRound = "final";
    }
    
    if (callback) callback();
  };

  if (useFirestore && db) {
    db.collection("interviews").doc(assessmentId).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          scorecardState.assessmentId = data.id || assessmentId;
          if (data.rounds) {
            scorecardState.rounds = data.rounds;
          }
          scorecardState.finalDecision = data.finalDecision || "Pending";
          scorecardState.finalComments = data.finalComments || "";
          scorecardState.finalInterviewer = data.finalInterviewer || "";
        }
        onStateLoaded();
      })
      .catch(err => {
        console.error("Firestore read failed. Reading from LocalStorage:", err);
        loadFromLocalStorage(assessmentId);
        onStateLoaded();
      });
  } else {
    loadFromLocalStorage(assessmentId);
    onStateLoaded();
  }
}

function loadFromLocalStorage(assessmentId) {
  const saved = localStorage.getItem("TECH_EVAL_INTERVIEWS");
  if (saved) {
    const interviews = JSON.parse(saved);
    const found = interviews.find(item => item.id === assessmentId);
    if (found) {
      scorecardState.assessmentId = found.id || assessmentId;
      if (found.rounds) scorecardState.rounds = found.rounds;
      scorecardState.finalDecision = found.finalDecision || "Pending";
      scorecardState.finalComments = found.finalComments || "";
      scorecardState.finalInterviewer = found.finalInterviewer || "";
    }
  }
}

function findLatestAssessment(candidateName, role, callback) {
  const cleanName = candidateName.trim();
  if (!cleanName) {
    callback(null);
    return;
  }

  if (useFirestore && db) {
    db.collection("interviews")
      .where("candidateName", "==", cleanName)
      .get()
      .then(snap => {
        let matches = [];
        snap.forEach(doc => {
          const data = doc.data();
          if (data.role === role) {
            matches.push(data);
          }
        });
        if (matches.length > 0) {
          matches.sort((a, b) => new Date(b.date) - new Date(a.date));
          callback(matches[0]);
        } else {
          callback(null);
        }
      })
      .catch(err => {
        console.error("Firestore findLatestAssessment failed. Falling back to LocalStorage:", err);
        const localLatest = findLatestAssessmentInLocalStorage(cleanName, role);
        callback(localLatest);
      });
  } else {
    const localLatest = findLatestAssessmentInLocalStorage(cleanName, role);
    callback(localLatest);
  }
}

function findLatestAssessmentInLocalStorage(candidateName, role) {
  const saved = localStorage.getItem("TECH_EVAL_INTERVIEWS");
  if (!saved) return null;
  try {
    const interviews = JSON.parse(saved);
    const matches = interviews.filter(item => 
      item.candidateName.toLowerCase() === candidateName.toLowerCase() && 
      item.role === role
    );
    if (matches.length > 0) {
      matches.sort((a, b) => new Date(b.date) - new Date(a.date));
      return matches[0];
    }
  } catch (err) {
    console.error("Failed to parse interviews from LocalStorage for lookup:", err);
  }
  return null;
}

function saveScreeningRun(role, totalProcessed, shortlisted) {
  const docId = `run_${Date.now()}`;
  
  const candidatesData = shortlisted.map(c => ({
    name: c.name,
    filename: c.filename,
    experienceYears: c.experienceYears,
    seniority: c.seniority,
    tech: c.tech,
    match: {
      score: c.match.score,
      verdict: c.match.verdict,
      matchedSkills: c.match.matchedSkills,
      missingSkills: c.match.missingSkills
    },
    rawContent: c.rawContent
  }));

  const data = {
    id: docId,
    role: role,
    roleName: PRESETS[role].roleName,
    date: new Date().toISOString(),
    totalProcessed: totalProcessed,
    shortlistedCount: shortlisted.length,
    yield: totalProcessed > 0 ? Math.round((shortlisted.length / totalProcessed) * 100) : 0,
    candidates: candidatesData
  };

  if (useFirestore && db) {
    db.collection("screenings").doc(docId).set(data)
      .catch(err => {
        console.error("Firestore save screening failed. Saving to LocalStorage:", err);
        saveScreeningToLocalStorage(data);
      });
  } else {
    saveScreeningToLocalStorage(data);
  }
}

function saveScreeningToLocalStorage(data) {
  const saved = localStorage.getItem("TECH_EVAL_SCREENINGS");
  const screenings = saved ? JSON.parse(saved) : [];
  screenings.push(data);
  localStorage.setItem("TECH_EVAL_SCREENINGS", JSON.stringify(screenings));
}

function loadInterviewsFromLocalStorage() {
  const saved = localStorage.getItem("TECH_EVAL_INTERVIEWS");
  return saved ? JSON.parse(saved).sort((a,b) => new Date(b.date) - new Date(a.date)) : [];
}

function loadScreeningsFromLocalStorage() {
  const saved = localStorage.getItem("TECH_EVAL_SCREENINGS");
  return saved ? JSON.parse(saved).sort((a,b) => new Date(b.date) - new Date(a.date)) : [];
}

window.renderHistoryDashboard = async function() {
  const historyPane = document.getElementById("history-pane");
  if (!historyPane) return;
  
  historyPane.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 200px;">
      <div class="spinner" style="border-top-color: #7c3aed;"></div>
      <div style="margin-left: 15px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-weight: bold; color: var(--text-muted);">Loading evaluations history...</div>
    </div>
  `;

  let interviews = [];
  if (useFirestore && db) {
    try {
      const snap = await db.collection("interviews").orderBy("date", "desc").get();
      snap.forEach(doc => {
        interviews.push(doc.data());
      });
    } catch (err) {
      console.error("Failed to load interviews from Firestore:", err);
      interviews = loadInterviewsFromLocalStorage();
    }
  } else {
    interviews = loadInterviewsFromLocalStorage();
  }

  let screenings = [];
  if (useFirestore && db) {
    try {
      const snap = await db.collection("screenings").orderBy("date", "desc").get();
      snap.forEach(doc => {
        screenings.push(doc.data());
      });
    } catch (err) {
      console.error("Failed to load screenings from Firestore:", err);
      screenings = loadScreeningsFromLocalStorage();
    }
  } else {
    screenings = loadScreeningsFromLocalStorage();
  }

  // Sort interviews and screenings descending by date
  interviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  screenings.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filter interviews by date range
  let filteredInterviews = interviews.filter(item => {
    if (!item.date) return true;
    const itemDate = new Date(item.date);
    if (historyFilterFrom) {
      const fromDate = new Date(historyFilterFrom + "T00:00:00");
      if (itemDate < fromDate) return false;
    }
    if (historyFilterTo) {
      const toDate = new Date(historyFilterTo + "T23:59:59.999");
      if (itemDate > toDate) return false;
    }
    return true;
  });

  // Filter screenings by date range
  let filteredScreenings = screenings.filter(item => {
    if (!item.date) return true;
    const itemDate = new Date(item.date);
    if (historyFilterFrom) {
      const fromDate = new Date(historyFilterFrom + "T00:00:00");
      if (itemDate < fromDate) return false;
    }
    if (historyFilterTo) {
      const toDate = new Date(historyFilterTo + "T23:59:59.999");
      if (itemDate > toDate) return false;
    }
    return true;
  });

  // Paginate interviews
  const totalFilteredCount = filteredInterviews.length;
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / itemsPerPage));
  if (historyCurrentPage > totalPages) {
    historyCurrentPage = totalPages;
  }
  if (historyCurrentPage < 1) {
    historyCurrentPage = 1;
  }
  const startIndex = (historyCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInterviews = filteredInterviews.slice(startIndex, endIndex);

  let interviewRows = "";
  if (paginatedInterviews.length === 0) {
    interviewRows = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
          No interview evaluations recorded yet.
        </td>
      </tr>
    `;
  } else {
    const isRejected = (item) => {
      return item.finalDecision === "Reject" || 
             (item.rounds && item.rounds.tech1 && item.rounds.tech1.status === "Reject") || 
             (item.rounds && item.rounds.tech2 && item.rounds.tech2.status === "Reject") || 
             (item.rounds && item.rounds.managerial && item.rounds.managerial.status === "Reject");
    };

    paginatedInterviews.forEach((item, pageIdx) => {
      const idxInFiltered = startIndex + pageIdx;
      const t1 = item.rounds.tech1.status;
      const t2 = item.rounds.tech2.status;
      const mgr = item.rounds.managerial.status;
      const isCandRejected = isRejected(item);
      const decText = isCandRejected ? "Reject" : (item.finalDecision || "Pending");
      
      interviewRows += `
        <tr>
          <td class="name-cell" style="font-weight: bold; color: var(--text-headers);" title="${item.candidateName}">${item.candidateName}</td>
          <td class="role-cell" title="${item.roleName}">${item.roleName}</td>
          <td><span class="status-badge ${t1.toLowerCase()}">${t1}</span></td>
          <td><span class="status-badge ${t2.toLowerCase()}">${t2}</span></td>
          <td><span class="status-badge ${mgr.toLowerCase()}">${mgr}</span></td>
          <td><span class="status-badge ${decText.toLowerCase()}">${decText}</span></td>
          <td style="text-align: right;" class="no-print">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn-primary" onclick="viewHistoryAssessment(${idxInFiltered})">View</button>
              <button class="btn-secondary" onclick="deleteHistoryAssessment('${item.id}', ${idxInFiltered})" style="color: #ef4444; border-color: #fca5a5;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  let screeningRows = "";
  if (filteredScreenings.length === 0) {
    screeningRows = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
          No screening batch runs recorded yet.
        </td>
      </tr>
    `;
  } else {
    filteredScreenings.forEach((item, idx) => {
      const date = new Date(item.date).toLocaleDateString() + " " + new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      screeningRows += `
        <tr>
          <td style="font-weight: bold; color: var(--text-headers);">${date}</td>
          <td class="role-cell" title="${item.roleName}">${item.roleName}</td>
          <td>${item.totalProcessed} CVs</td>
          <td>${item.shortlistedCount} Candidates</td>
          <td>${item.yield}%</td>
          <td style="text-align: right;" class="no-print">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn-primary" onclick="viewHistoryShortlist('${item.id}', ${idx})">View Run</button>
              <button class="btn-secondary" onclick="deleteHistoryScreening('${item.id}', ${idx})" style="color: #ef4444; border-color: #fca5a5;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  window.historyInterviewsList = filteredInterviews;
  window.historyScreeningsList = filteredScreenings;

  const isRejected = (item) => {
    return item.finalDecision === "Reject" || 
           (item.rounds && item.rounds.tech1 && item.rounds.tech1.status === "Reject") || 
           (item.rounds && item.rounds.tech2 && item.rounds.tech2.status === "Reject") || 
           (item.rounds && item.rounds.managerial && item.rounds.managerial.status === "Reject");
  };

  const totalInterviews = filteredInterviews.length;
  const selectedInterviews = filteredInterviews.filter(item => item.finalDecision === "Select" && !isRejected(item)).length;
  const rejectedInterviews = filteredInterviews.filter(item => isRejected(item)).length;
  const holdPendingInterviews = filteredInterviews.filter(item => !isRejected(item) && item.finalDecision !== "Select").length;

  // Render pagination buttons HTML
  let paginationHtml = "";
  if (totalPages > 1) {
    paginationHtml = `<div class="pagination-container no-print">`;
    // Prev button
    paginationHtml += `
      <button class="pagination-btn" ${historyCurrentPage === 1 ? 'disabled' : ''} onclick="changeHistoryPage(${historyCurrentPage - 1})">
        Prev
      </button>
    `;
    // Page numbers
    for (let p = 1; p <= totalPages; p++) {
      paginationHtml += `
        <button class="pagination-btn ${p === historyCurrentPage ? 'active' : ''}" onclick="changeHistoryPage(${p})">
          ${p}
        </button>
      `;
    }
    // Next button
    paginationHtml += `
      <button class="pagination-btn" ${historyCurrentPage === totalPages ? 'disabled' : ''} onclick="changeHistoryPage(${historyCurrentPage + 1})">
        Next
      </button>
    </div>`;
  }

  historyPane.innerHTML = `
    <!-- Excel & PDF Export controls -->
    <div class="history-controls-row no-print" style="display: flex; gap: 12px; margin-bottom: 20px; justify-content: flex-end; align-items: center;">
      <button class="btn-primary" onclick="exportInterviewsCSV()" style="width: auto; margin: 0; padding: 10px 20px; font-size: 0.85rem; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Export to Excel (CSV)</button>
      <button class="btn-secondary" onclick="window.print()" style="width: auto; margin: 0; padding: 10px 20px; font-size: 0.85rem; border-color: var(--text-headers); color: var(--text-headers); font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Print Dashboard (PDF)</button>
    </div>

    <!-- Date range filters bar -->
    <div class="history-filters-bar no-print">
      <div class="history-filter-item">
        <label for="history-from-date">From Date:</label>
        <input type="date" id="history-from-date" class="history-filter-input" value="${historyFilterFrom || ''}">
      </div>
      <div class="history-filter-item">
        <label for="history-to-date">To Date:</label>
        <input type="date" id="history-to-date" class="history-filter-input" value="${historyFilterTo || ''}">
      </div>
      <button class="btn-secondary" onclick="resetHistoryFilters()" style="padding: 6px 12px; font-size: 0.8rem; margin: 0; height: auto; width: auto; border-color: var(--text-headers); color: var(--text-headers); font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Reset Filters</button>
    </div>

    <!-- Evaluation Statistics Summary Cards -->
    <div class="history-stats-grid">
      <div class="stat-card">
        <h4>Total Evaluated</h4>
        <div class="stat-value">${totalInterviews}</div>
      </div>
      <div class="stat-card selected">
        <h4>Selected</h4>
        <div class="stat-value" style="color: #047857;">${selectedInterviews}</div>
      </div>
      <div class="stat-card rejected">
        <h4>Rejected</h4>
        <div class="stat-value" style="color: #ef4444;">${rejectedInterviews}</div>
      </div>
      <div class="stat-card pending-hold">
        <h4>Hold / Pending</h4>
        <div class="stat-value" style="color: #f59e0b;">${holdPendingInterviews}</div>
      </div>
    </div>

    <div class="history-card-list">
      <div>
        <h2 class="history-section-title">Candidate Evaluation Tracker</h2>
        <div class="table-responsive">
          <table class="screening-table">
            <thead>
              <tr>
                <th style="width: 18%;">Candidate Name</th>
                <th style="width: 20%;">Target Position</th>
                <th style="width: 9%;">Tech 1</th>
                <th style="width: 9%;">Tech 2</th>
                <th style="width: 9%;">Managerial</th>
                <th style="width: 12%;">Final Status</th>
                <th style="width: 23%; text-align: right;" class="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${interviewRows}
            </tbody>
          </table>
        </div>
        ${paginationHtml}
      </div>

      <div style="margin-top: 20px;">
        <h2 class="history-section-title">CV Screening Batch Runs</h2>
        <div class="table-responsive">
          <table class="screening-table">
            <thead>
              <tr>
                <th style="width: 18%;">Run Date / Time</th>
                <th style="width: 22%;">Target Role</th>
                <th style="width: 14%;">CVs Processed</th>
                <th style="width: 14%;">Shortlisted</th>
                <th style="width: 10%;">Yield %</th>
                <th style="width: 22%; text-align: right;" class="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${screeningRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Attach date input change listeners
  const fromInput = document.getElementById("history-from-date");
  const toInput = document.getElementById("history-to-date");
  if (fromInput) {
    fromInput.addEventListener("change", (e) => {
      historyFilterFrom = e.target.value;
      historyCurrentPage = 1;
      window.renderHistoryDashboard();
    });
  }
  if (toInput) {
    toInput.addEventListener("change", (e) => {
      historyFilterTo = e.target.value;
      historyCurrentPage = 1;
      window.renderHistoryDashboard();
    });
  }
};

window.changeHistoryPage = function(page) {
  historyCurrentPage = page;
  window.renderHistoryDashboard();
};

window.resetHistoryFilters = function() {
  historyFilterFrom = "";
  historyFilterTo = "";
  historyCurrentPage = 1;
  window.renderHistoryDashboard();
};

window.exportInterviewsCSV = function() {
  const interviews = window.historyInterviewsList || [];
  if (interviews.length === 0) {
    alert("No interview evaluations available to export.");
    return;
  }
  
  const headers = [
    "Candidate Name",
    "Target Role",
    "Tech 1 Interviewer",
    "Tech 1 Status",
    "Tech 1 Score",
    "Tech 2 Interviewer",
    "Tech 2 Status",
    "Tech 2 Score",
    "Managerial Interviewer",
    "Managerial Status",
    "Managerial Score",
    "Overall Average",
    "Final Status",
    "HR Panelist",
    "Evaluation Date"
  ];
  
  let csvRows = [headers.join(",")];
  
  interviews.forEach(item => {
    const t1 = item.rounds.tech1;
    const t2 = item.rounds.tech2;
    const mgr = item.rounds.managerial;
    
    const row = [
      `"${item.candidateName.replace(/"/g, '""')}"`,
      `"${item.roleName.replace(/"/g, '""')}"`,
      `"${(t1.interviewer || "").replace(/"/g, '""')}"`,
      `"${t1.status}"`,
      `"${t1.averageScore || '0.0'}"`,
      `"${(t2.interviewer || "").replace(/"/g, '""')}"`,
      `"${t2.status}"`,
      `"${t2.averageScore || '0.0'}"`,
      `"${(mgr.interviewer || "").replace(/"/g, '""')}"`,
      `"${mgr.status}"`,
      `"${mgr.averageScore || '0.0'}"`,
      `"${item.overallAverage || '0.0'}"`,
      `"${item.finalDecision}"`,
      `"${(item.finalInterviewer || "").replace(/"/g, '""')}"`,
      `"${new Date(item.date).toLocaleDateString()}"`
    ];
    csvRows.push(row.join(","));
  });
  
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Candidate_Evaluations_Export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.viewHistoryAssessment = function(idx) {
  const item = window.historyInterviewsList[idx];
  if (!item) return;

  currentRole = item.role;
  roleSelect.value = item.role;

  const cvData = {
    name: item.candidateName,
    companies: ["TechCorp"],
    tech: Object.keys(item.rounds.tech1.ratings || {}),
    seniority: item.track,
    experienceYears: 10,
    insightRationale: item.finalComments
  };

  const kit = generateDynamicKit(PRESETS[item.role], cvData, "Skills Required: " + cvData.tech.join(", "));
  kit.assessmentId = item.id;
  kit.candidateInsight.track = item.track;
  kit.candidateInsight.name = item.candidateName;
  
  document.getElementById("history-dashboard").style.display = "none";
  showResults(kit);
};

window.viewHistoryShortlist = function(docId, idx) {
  const run = window.historyScreeningsList[idx];
  if (!run) return;

  roleSelect.value = run.role;
  currentRole = run.role;
  
  screenedCandidatesList = run.candidates;
  
  const mockJdSkills = Object.keys(run.candidates[0] ? run.candidates[0].match.matchedSkills.reduce((acc, s) => ({...acc, [s]: true}), {}) : {});
  const mockJdSeniority = { yearsRequired: 8, level: "expert" };

  document.getElementById("history-dashboard").style.display = "none";
  renderScreenerDashboard(mockJdSkills, mockJdSeniority);
  screenerDashboard.style.display = "block";
};

window.deleteHistoryAssessment = function(docId, idx) {
  if (!confirm("Are you sure you want to delete this evaluation report?")) return;
  
  if (useFirestore && db) {
    db.collection("interviews").doc(docId).delete()
      .then(() => {
        window.renderHistoryDashboard();
      })
      .catch(err => {
        console.error("Firestore delete failed:", err);
        deleteInterviewFromLocalStorage(docId);
        window.renderHistoryDashboard();
      });
  } else {
    deleteInterviewFromLocalStorage(docId);
    window.renderHistoryDashboard();
  }
};

function deleteInterviewFromLocalStorage(docId) {
  const saved = localStorage.getItem("TECH_EVAL_INTERVIEWS");
  if (saved) {
    let interviews = JSON.parse(saved);
    interviews = interviews.filter(item => item.id !== docId);
    localStorage.setItem("TECH_EVAL_INTERVIEWS", JSON.stringify(interviews));
  }
}

window.deleteHistoryScreening = function(docId, idx) {
  if (!confirm("Are you sure you want to delete this screening run?")) return;
  
  if (useFirestore && db) {
    db.collection("screenings").doc(docId).delete()
      .then(() => {
        window.renderHistoryDashboard();
      })
      .catch(err => {
        console.error("Firestore delete failed:", err);
        deleteScreeningFromLocalStorage(docId);
        window.renderHistoryDashboard();
      });
  } else {
    deleteScreeningFromLocalStorage(docId);
    window.renderHistoryDashboard();
  }
};

function deleteScreeningFromLocalStorage(docId) {
  const saved = localStorage.getItem("TECH_EVAL_SCREENINGS");
  if (saved) {
    let screenings = JSON.parse(saved);
    screenings = screenings.filter(item => item.id !== docId);
    localStorage.setItem("TECH_EVAL_SCREENINGS", JSON.stringify(screenings));
  }
}

// Skill vocabulary database for extraction
const SKILL_KEYWORDS = [
  // Languages & Core
  "Java", "Spring Boot", "Spring Cloud", "Hibernate", "JPA", "Angular", "TypeScript", "RxJS", "NgRx", "Signals", "JavaScript", "HTML", "CSS", "Python", "Go", "Golang", "C++", "Scala",
  // Databases & Storage
  "PostgreSQL", "SQL", "MySQL", "Oracle", "MongoDB", "Cassandra", "Redis", "Elasticsearch", "Neo4j", "HNSW", "IVF", "Vector database", "pgvector", "Qdrant", "Pinecone", "Milvus",
  // Messaging & Tooling
  "Kafka", "RabbitMQ", "gRPC", "REST API", "RESTful", "GraphQL", "WebClient", "Spring AI", "LangChain", "LangGraph", "LlamaIndex",
  // Architecture & Patterns
  "Microservices", "Design Patterns", "SOLID", "OOP", "MVC", "Event-driven", "CQRS", "DDD", "Domain-Driven Design",
  // Cloud & DevOps
  "AWS", "ECS", "EKS", "S3", "RDS", "EC2", "Docker", "Kubernetes", "K8s", "Terraform", "CI/CD", "Maven", "Gradle", "Git",
  // AI Architecture & MLOps
  "Generative AI", "LLM", "RAG", "Prompt Engineering", "Fine-tuning", "Embeddings", "Agentic Workflows", "Multi-agent", "Triton", "vLLM", "Ollama", "Hugging Face", "Arize", "TruLens", "Phoenix", "Observability", "Telemetry", "MLOps",
  // Governance & Compliance
  "EU AI Act", "GDPR", "HIPAA", "Sovereignty", "AI safety", "NeMo Guardrails", "Llama Guard", "PII"
];

// Helper to extract keywords from text
function extractSkills(text) {
  if (!text) return [];
  const found = [];
  const lowerText = text.toLowerCase();
  SKILL_KEYWORDS.forEach(skill => {
    const lowerSkill = skill.toLowerCase();
    if (lowerSkill.includes(" ") || lowerSkill.includes("+")) {
      if (lowerText.includes(lowerSkill)) {
        found.push(skill);
      }
    } else {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('\\b' + escaped + '\\b', 'i');
      if (regex.test(text)) {
        found.push(skill);
      }
    }
  });
  return found;
}

// Helper to parse JD experience expectations
function parseJDSeniority(jdText) {
  const res = {
    yearsRequired: 8, // default fallback
    level: "expert"   // default fallback
  };
  if (!jdText) return res;
  
  const match = jdText.match(/(\d+)\s*[-to+]*\s*(\d+)?\s*years/i);
  if (match) {
    res.yearsRequired = parseInt(match[1]);
  }
  
  const lowerJD = jdText.toLowerCase();
  if (lowerJD.includes("junior") || lowerJD.includes("associate") || res.yearsRequired < 4) {
    res.level = "junior";
  } else if (lowerJD.includes("lead") || lowerJD.includes("principal") || lowerJD.includes("architect") || lowerJD.includes("director") || res.yearsRequired >= 8) {
    res.level = "expert";
  } else {
    res.level = "intermediate";
  }
  return res;
}

// Local dynamic CV-aware generator helpers (Seniority & Core Domain customizer)
function parseCV(cvText) {
  const cvData = {
    name: "the candidate",
    companies: [],
    tech: [],
    seniority: "intermediate", // default
    experienceYears: 5,
    insightRationale: ""
  };

  if (!cvText) return cvData;

  // Extract Name (look for "Name: John Doe" or first line)
  const nameMatch = cvText.match(/(?:name|candidate|applicant):\s*([^\n\r]+)/i);
  if (nameMatch && nameMatch[1].trim().length <= 50) {
    cvData.name = nameMatch[1].trim();
  } else {
    const lines = cvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 0 && lines[0].length <= 50 && !lines[0].toLowerCase().includes('cv') && !lines[0].toLowerCase().includes('resume')) {
      cvData.name = lines[0];
    } else {
      cvData.name = ""; // Trigger fallback to clean filename
    }
  }

  // Extract experience years
  let years = 0;
  const yearPatterns = [
    /(\d+)\s*[\+\-]?\s*years?(?:\s+of)?(?:\s+[a-zA-Z\+]+)*\s+experience/i,
    /(\d+)\s*[\+\-]?\s*years?/i,
    /experience:\s*(\d+)\s*[\+\-]?\s*years/i
  ];
  for (const pattern of yearPatterns) {
    const match = cvText.match(pattern);
    if (match) {
      years = parseInt(match[1]);
      break;
    }
  }

  // Fallback: search for date ranges like "2018 - 2022" or "2015 - Present"
  if (years === 0) {
    const dateRangeMatches = cvText.match(/\b(19\d{2}|20\d{2})\s*[-–—to]+\s*(Present|19\d{2}|20\d{2})\b/gi);
    if (dateRangeMatches) {
      let totalMonths = 0;
      dateRangeMatches.forEach(m => {
        const parts = m.split(/[-–—to]+/i).map(p => p.trim());
        if (parts.length === 2) {
          const startYear = parseInt(parts[0]);
          let endYear = new Date().getFullYear();
          if (!parts[1].toLowerCase().includes("present")) {
            const val = parseInt(parts[1]);
            if (!isNaN(val)) endYear = val;
          }
          const diff = endYear - startYear;
          if (diff > 0 && diff < 40) {
            totalMonths += diff * 12;
          }
        }
      });
      if (totalMonths > 0) {
        years = Math.round(totalMonths / 12);
      }
    }
  }

  if (years === 0) {
    years = 5; // default fallback
  }
  cvData.experienceYears = years;

  // Detect seniority
  let seniority = "intermediate"; // default fallback
  
  if (years >= 8) {
    seniority = "expert";
  } else if (years >= 4) {
    seniority = "intermediate";
    const hasLeadTitle = /\b(lead|principal|architect|director|senior|sr\.?)\b/i.test(cvText);
    if (hasLeadTitle) {
      seniority = "expert";
    }
  } else {
    // years < 4
    seniority = "junior";
    const hasLeadTitle = /\b(lead|principal|architect|director|senior|sr\.?)\b/i.test(cvText);
    if (hasLeadTitle && years >= 2) {
      seniority = "intermediate";
    }
  }
  cvData.seniority = seniority;

  // Extract Companies
  const companyRegex = /(?:at|for)\s+([A-Z][A-Za-z0-9\s]{2,15})(?:\s+Solutions|\s+Corp|\s+Systems|\s+Group|\s+Technologies|\s+Inc|\s+\(|,)/g;
  let match;
  while ((match = companyRegex.exec(cvText)) !== null) {
    if (match[1]) {
      const companyName = match[1].trim();
      if (!cvData.companies.includes(companyName) && !["The", "A", "Company", "Experience", "Summary", "Role", "Present", "June", "July", "August"].includes(companyName)) {
        cvData.companies.push(companyName);
      }
    }
  }
  
  if (cvData.companies.length === 0) {
    cvData.companies = ["TechCorp", "Innovate Solutions"];
  }

  // Extract Technologies
  cvData.tech = extractSkills(cvText);

  return cvData;
}

// JD-CV matching score calculator
function calculateMatchMetrics(cvData, jdSkills, jdYears, jdLevel) {
  // Overlap of JD required skills in candidate's CV
  const matchedSkills = jdSkills.filter(s => cvData.tech.some(c => c.toLowerCase() === s.toLowerCase()));
  const missingSkills = jdSkills.filter(s => !cvData.tech.some(c => c.toLowerCase() === s.toLowerCase()));
  
  let skillMatchPct = jdSkills.length > 0 ? (matchedSkills.length / jdSkills.length) * 100 : 80;
  
  // Skill match penalty: Deduct 40% from skill match score if matches less than 40% of JD-required skills
  if (jdSkills.length > 0 && (matchedSkills.length / jdSkills.length) < 0.40) {
    skillMatchPct = Math.max(0, skillMatchPct - 40);
  }
  
  // Experience years comparison: Steep Experience Penalty of 8% per year gap
  let expMatchPct = 100;
  if (cvData.experienceYears < jdYears) {
    const gap = jdYears - cvData.experienceYears;
    expMatchPct = Math.max(0, 100 - (gap * 8));
  } else if (cvData.experienceYears > jdYears + 5) {
    // Experience overqualification penalty: Cap experience match if too high
    if (jdLevel === "junior") {
      expMatchPct = 50;
    } else if (jdLevel === "intermediate") {
      expMatchPct = 70;
    }
  }
  
  // Seniority level alignment (including overqualification alignment)
  let trackAlignmentPct = 100;
  if (jdLevel === "expert" && cvData.seniority === "junior") {
    trackAlignmentPct = 20;
  } else if (jdLevel === "expert" && cvData.seniority === "intermediate") {
    trackAlignmentPct = 60;
  } else if (jdLevel === "intermediate" && cvData.seniority === "junior") {
    trackAlignmentPct = 45;
  } else if (jdLevel === "junior" && cvData.seniority === "expert") {
    trackAlignmentPct = 20;
  } else if (jdLevel === "junior" && cvData.seniority === "intermediate") {
    trackAlignmentPct = 70;
  } else if (jdLevel === "intermediate" && cvData.seniority === "expert") {
    trackAlignmentPct = 60;
  }
  
  // Compute overall match score (scale 1-100)
  let overallScore = Math.max(10, Math.min(100, Math.round(
    (skillMatchPct * 0.5) + (expMatchPct * 0.3) + (trackAlignmentPct * 0.2)
  )));
  
  // Hard Seniority Mismatch Caps
  if (jdLevel === "expert" && cvData.seniority === "junior") {
    overallScore = Math.min(overallScore, 35);
  } else if (jdLevel === "expert" && cvData.seniority === "intermediate") {
    overallScore = Math.min(overallScore, 65);
  } else if (jdLevel === "intermediate" && cvData.seniority === "junior") {
    overallScore = Math.min(overallScore, 55);
  } else if (jdLevel === "junior" && cvData.seniority === "expert") {
    overallScore = Math.min(overallScore, 40);
  } else if (jdLevel === "intermediate" && cvData.seniority === "expert") {
    overallScore = Math.min(overallScore, 65);
  } else if (jdLevel === "junior" && cvData.seniority === "intermediate") {
    overallScore = Math.min(overallScore, 75);
  }
  
  let verdict = "low";
  if (overallScore >= 80) verdict = "strong";
  else if (overallScore >= 55) verdict = "potential";
  
  return {
    score: overallScore,
    verdict: verdict,
    matchedSkills: matchedSkills,
    missingSkills: missingSkills
  };
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getQuestionDomain(qText) {
  const text = qText.toLowerCase();
  if (text.includes("pattern") || text.includes("solid") || text.includes("oop") || text.includes("design") || text.includes("dependency injection")) return "Design Patterns";
  if (text.includes("database") || text.includes("sql") || text.includes("postgres") || text.includes("index") || text.includes("query") || text.includes("transaction") || text.includes("jpa") || text.includes("hibernate") || text.includes("lock") || text.includes("redis") || text.includes("cache")) return "Database Optimization";
  if (text.includes("microservice") || text.includes("kafka") || text.includes("gateway") || text.includes("rest api") || text.includes("http") || text.includes("webclient")) return "Microservices";
  if (text.includes("architecture") || text.includes("cloud") || text.includes("aws") || text.includes("kubernetes") || text.includes("docker") || text.includes("vpc") || text.includes("disaster recovery") || text.includes("sovereignty")) return "Architecture";
  if (text.includes("concurrency") || text.includes("thread") || text.includes("async") || text.includes("backpressure") || text.includes("algorithm") || text.includes("deadlock") || text.includes("loop")) return "Problem Solving";
  if (text.includes("ai") || text.includes("llm") || text.includes("rag") || text.includes("prompt") || text.includes("embedding") || text.includes("agent") || text.includes("llama") || text.includes("model")) return "AI Skills";
  return "General Technical";
}

function simplifyQuestionText(text) {
  return text
    .replace(/\b(50,000|15,000|100,000|500,000|1,000,000|10,000)\b/g, "250")
    .replace(/\b(millions of rows|millions of documents|50 million)\b/g, "thousands of records")
    .replace(/\b(distributed checkpointer|federated query router|disaster recovery|active-active|envelope encryption|secure enclaves|vLLM|Triton|multi-agent mesh|sharded|multi-region|cross-region)\b/g, "standard")
    .replace("How do you design a low-latency, secure federated query router", "How do you query data from multiple collections")
    .replace("Describe the architecture of an Enterprise LLM Gateway", "How do you call an external LLM API from a backend server");
}

function simplifyAnswerText(text) {
  return text
    .replace(/\b(50,000|15,000|100,000|500,000|1,000,000|10,000)\b/g, "250")
    .replace(/\b(millions of rows|millions of documents|50 million)\b/g, "thousands of records")
    .replace("We use a decoupled, event-driven Change Data Capture (CDC)", "We write a standard scheduled backend worker")
    .replace("Active-Active model serving nodes", "A standard hosted instance");
}

function scaleUpQuestionText(text) {
  return text
    .replace("15,000", "750,000")
    .replace("50,000", "2,000,000")
    .replace("10 million", "500 million")
    .replace("10,000", "500,000");
}

function scaleUpAnswerText(text) {
  return text
    .replace("15,000", "750,000")
    .replace("50,000", "2,000,000")
    .replace("10 million", "500 million");
}

// Highly dynamic generation using pool + domain balancing + seniority mapping
function generateDynamicKit(baseKit, cvData, jdVal) {
  const kit = JSON.parse(JSON.stringify(baseKit));
  
  const company = cvData.companies[0] || "TechCorp";
  const firstTech = cvData.tech[0] || "Java";
  
  // Extract JD details
  const jdSkills = extractSkills(jdVal);
  const jdSeniority = parseJDSeniority(jdVal);
  
  // Compute match metrics
  const match = calculateMatchMetrics(cvData, jdSkills, jdSeniority.yearsRequired, jdSeniority.level);
  
  // Compile personalized panelist insight rationale
  const techMatchText = match.matchedSkills.length > 0 
    ? `matches key required technical skills: **${match.matchedSkills.slice(0, 5).join(", ")}**` 
    : `does not explicitly list the primary technical stack required for this position`;
  const techMissingText = match.missingSkills.length > 0 
    ? `gaps were identified in critical requirements: **${match.missingSkills.slice(0, 4).join(", ")}**` 
    : `demonstrates complete technical coverage`;
  
  const companyString = cvData.companies.slice(0, 2).join(" & ");
  
  let rationale = "";
  if (match.verdict === "strong") {
    rationale = `Candidate **${cvData.name}** is a **Strong Match** for this role with an overall score of **${match.score}%**. They possess **${cvData.experienceYears} years** of experience (JD requires ${jdSeniority.yearsRequired}+ years) and have an active track record at **${companyString}**. Their profile ${techMatchText}, and ${techMissingText}. The generated kit is tuned to the **${cvData.seniority.toUpperCase()}** track to evaluate their deep system design capability.`;
  } else if (match.verdict === "potential") {
    rationale = `Candidate **${cvData.name}** is a **Potential Match** with a score of **${match.score}%**. They have **${cvData.experienceYears} years** of experience (JD requires ${jdSeniority.yearsRequired}+ years). While showing competence in **${cvData.tech.slice(0, 3).join(", ")}**, there are gaps in required skills such as **${match.missingSkills.slice(0, 3).join(", ")}**. Assess their capability and adaptation speed during standard and advanced tracks.`;
  } else {
    rationale = `Candidate **${cvData.name}** represents a **Gap / Low Match** with a score of **${match.score}%**. They possess **${cvData.experienceYears} years** of experience, which falls short of the JD requirement of **${jdSeniority.yearsRequired}+ years** for this level. They lack critical required technologies such as **${match.missingSkills.slice(0, 4).join(", ")}**. If proceeding, focus on fundamental coding and component architecture.`;
  }
  
  // Save panelist evaluation guidance insights
  kit.candidateInsight = {
    track: cvData.seniority,
    verdict: match.verdict,
    score: match.score,
    rationale: rationale
  };

  // Compile a large pool of all preset questions to pull from and categorize
  const allQuestionsPool = [];
  const baseSets = baseKit.sets;
  Object.keys(baseSets).forEach(key => {
    if (baseSets[key] && baseSets[key].questions) {
      baseSets[key].questions.forEach(q => {
        allQuestionsPool.push(JSON.parse(JSON.stringify(q)));
      });
    }
  });

  // Group questions by domains
  const domains = ["Microservices", "Architecture", "Design Patterns", "Database Optimization", "Problem Solving", "AI Skills"];
  const domainGroups = {};
  domains.forEach(d => domainGroups[d] = []);
  
  allQuestionsPool.forEach(q => {
    const domain = getQuestionDomain(q.question);
    if (domainGroups[domain]) {
      domainGroups[domain].push(q);
    } else {
      domainGroups["Problem Solving"].push(q);
    }
  });

  // Set counts based on role
  let roleKey = "java-angular";
  if (baseKit.roleName.includes("AI Engineer")) roleKey = "ai-engineer";
  else if (baseKit.roleName.includes("AI Architect")) roleKey = "ai-architect";

  let qCounts = {
    "java-angular": [14, 13, 13],
    "ai-engineer": [17, 17, 16],
    "ai-architect": [20, 20, 20]
  }[roleKey];

  // Pick questions sequentially to guarantee coverage
  function buildSetQuestions(count, targetSeniority) {
    const selected = [];
    const domainOrder = shuffleArray([...domains]);
    let domainIdx = 0;

    while (selected.length < count) {
      const currentDomain = domainOrder[domainIdx % domains.length];
      const pool = domainGroups[currentDomain];
      
      if (pool && pool.length > 0) {
        const shuffledPool = shuffleArray(pool);
        const item = shuffledPool.find(x => !selected.some(s => s.question === x.question));
        if (item) {
          selected.push(JSON.parse(JSON.stringify(item)));
        } else {
          const fallbackPool = allQuestionsPool.filter(x => !selected.some(s => s.question === x.question));
          if (fallbackPool.length > 0) {
            selected.push(JSON.parse(JSON.stringify(shuffleArray(fallbackPool)[0])));
          } else {
            selected.push(JSON.parse(JSON.stringify(allQuestionsPool[Math.floor(Math.random() * allQuestionsPool.length)])));
          }
        }
      } else {
        const fallbackPool = allQuestionsPool.filter(x => !selected.some(s => s.question === x.question));
        if (fallbackPool.length > 0) {
          selected.push(JSON.parse(JSON.stringify(shuffleArray(fallbackPool)[0])));
        } else {
          selected.push(JSON.parse(JSON.stringify(allQuestionsPool[Math.floor(Math.random() * allQuestionsPool.length)])));
        }
      }
      domainIdx++;
    }

    // Apply complexity and candidate context rewrites
    selected.forEach((q, idx) => {
      // 1. Complexity adjust
      if (targetSeniority === "junior") {
        q.question = simplifyQuestionText(q.question);
        q.answer = simplifyAnswerText(q.answer);
        q.good = "Explains basic terms, programming constructs, and standard database lookup methods.";
        q.exceptional = "Shows basic design pattern usage (singleton, factory) and clean code layout.";
        q.mistakes = "Confuses syntax or lacks knowledge of core database / REST concepts.";
      } else if (targetSeniority === "expert") {
        q.question = scaleUpQuestionText(q.question);
        q.answer = scaleUpAnswerText(q.answer);
      }
      
      // 2. Candidate resume weaving (for 40% of questions)
      const shouldWeave = idx < Math.ceil(count * 0.4);
      if (shouldWeave) {
        let matchedTech = cvData.tech.find(t => q.question.toLowerCase().includes(t.toLowerCase())) || cvData.tech[Math.floor(Math.random() * cvData.tech.length)] || firstTech;
        const randomCompany = cvData.companies[Math.floor(Math.random() * cvData.companies.length)] || company;
        
        const prefixes = [
          `I see from your CV that you worked with **${matchedTech}** at **${randomCompany}**. `,
          `Reflecting on your projects at **${randomCompany}** using **${matchedTech}**, `,
          `Given your hands-on implementation of **${matchedTech}** at **${randomCompany}**, `,
          `Regarding your experience at **${randomCompany}** with **${matchedTech}**: `
        ];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        q.question = prefix + q.question.charAt(0).toLowerCase() + q.question.slice(1);
      }
    });

    return selected;
  }

  // Construct sets based on seniority track mapping
  if (cvData.seniority === "junior") {
    kit.sets.standard.questions = buildSetQuestions(qCounts[0], "junior");
    kit.sets.advanced.questions = buildSetQuestions(qCounts[1], "junior");
    kit.sets.expert.questions = buildSetQuestions(qCounts[2], "intermediate");
  } else if (cvData.seniority === "expert") {
    kit.sets.standard.questions = buildSetQuestions(qCounts[0], "intermediate");
    kit.sets.advanced.questions = buildSetQuestions(qCounts[1], "expert");
    kit.sets.expert.questions = buildSetQuestions(qCounts[2], "expert");
  } else {
    // Intermediate
    kit.sets.standard.questions = buildSetQuestions(qCounts[0], "intermediate");
    kit.sets.advanced.questions = buildSetQuestions(qCounts[1], "intermediate");
    kit.sets.expert.questions = buildSetQuestions(qCounts[2], "expert");
  }

  // Fill gap analysis dynamically
  kit.summary = cvData.insightRationale;
  kit.gaps = [];
  
  match.matchedSkills.slice(0, 4).forEach(skill => {
    kit.gaps.push({
      skill: skill,
      status: "match",
      notes: `Matched required skill found explicitly in candidate's CV.`
    });
  });
  
  match.missingSkills.slice(0, 4).forEach(skill => {
    kit.gaps.push({
      skill: skill,
      status: "risk",
      notes: `Unmentioned or missing skill listed in JD requirements.`
    });
  });

  if (cvData.experienceYears < jdSeniority.yearsRequired) {
    kit.gaps.push({
      skill: "Experience Alignment",
      status: "risk",
      notes: `Candidate has ${cvData.experienceYears} years of experience; JD requires ${jdSeniority.yearsRequired}+ years.`
    });
  } else {
    kit.gaps.push({
      skill: "Experience Alignment",
      status: "match",
      notes: `Candidate has ${cvData.experienceYears} years of experience, meeting target of ${jdSeniority.yearsRequired}+ years.`
    });
  }

  // Customise Projects & Architecture scenarios
  Object.keys(kit.sets).forEach(setName => {
    const set = kit.sets[setName];
    if (set) {
      if (set.projects) {
        set.projects.forEach(p => {
          if (cvData.tech.length > 0) {
            p.stack = cvData.tech.slice(0, 5).join(", ") + ", AWS, Docker";
          }
          if (cvData.seniority === "junior") {
            p.name = "Component Refactoring for " + p.name;
            p.challenges = "Writing clean, unit-tested component code, database CRUD connectivity, and local error handling.";
          } else if (cvData.seniority === "expert") {
            p.name = "Sovereign Scaling of " + p.name;
            p.challenges = "Active-active multi-region replication, high concurrent load balancing, micro-second latency targets, and secure enclaves.";
          }
        });
      }
      if (set.architecture) {
        set.architecture.forEach(a => {
          if (cvData.seniority === "junior") {
            a.problem = "Refactor modules of: " + a.problem;
            a.scalability = "Scaled using standard load balancer and PostgreSQL read replicas.";
            a.security = "Standard OAuth2 authorization and session mapping.";
          } else if (cvData.seniority === "expert") {
            a.problem = "Redesign at High-Scale: " + a.problem;
            a.scalability = "Supports 500,000+ requests per second using multi-active regional caches, sharded tables, and Apache Flink aggregation streams.";
            a.security = "HIPAA/GDPR compliance, cell-level envelope encryption, Vault agent sidecars, and hypervisor-level Nitro Enclaves.";
          }
        });
      }
    }
  });

  return kit;
}
