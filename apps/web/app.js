const ownerInput = document.getElementById("owner");
const repoInput = document.getElementById("repo");
const branchInput = document.getElementById("branch");
const ingestOutput = document.getElementById("ingestOutput");
const ingestBtn = document.getElementById("ingestBtn");

const repoIdInput = document.getElementById("repoId");
const questionInput = document.getElementById("question");
const chatOutput = document.getElementById("chatOutput");
const chatBtn = document.getElementById("chatBtn");

function apiBase() {
  const base = window.__API_BASE_URL__ || "http://localhost:3001";
  return base.replace(/\/$/, "");
}

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

async function ingest() {
  ingestOutput.textContent = "Ingesting...";
  const payload = {
    owner: ownerInput.value.trim(),
    name: repoInput.value.trim(),
  };
  if (branchInput.value.trim()) {
    payload.branch = branchInput.value.trim();
  }

  const response = await fetch(`${apiBase()}/repos/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  ingestOutput.textContent = pretty(data);
  if (data.repoId) {
    repoIdInput.value = data.repoId;
  }
}

async function chat() {
  chatOutput.textContent = "Asking...";
  const response = await fetch(`${apiBase()}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repoId: repoIdInput.value.trim(),
      question: questionInput.value.trim(),
    }),
  });
  const data = await response.json();
  chatOutput.textContent = pretty(data);
}

ingestBtn.addEventListener("click", ingest);
chatBtn.addEventListener("click", chat);
