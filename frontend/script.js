// Global variables
let currentFile = null;
let currentTranscript = "";
let currentSummary = "";

// API Configuration
const API_BASE_URL = "http://localhost:5000/api";

// DOM Elements
const elements = {
  uploadArea: document.getElementById("upload-area"),
  fileInput: document.getElementById("file-input"),
  fileInfo: document.getElementById("file-info"),
  fileName: document.getElementById("file-name"),
  removeFile: document.getElementById("remove-file"),
  instructionsSection: document.getElementById("instructions-section"),
  customInstruction: document.getElementById("custom-instruction"),
  generateSection: document.getElementById("generate-section"),
  generateBtn: document.getElementById("generate-btn"),
  loadingSpinner: document.getElementById("loading-spinner"),
  summarySection: document.getElementById("summary-section"),
  summaryText: document.getElementById("summary-text"),
  regenerateBtn: document.getElementById("regenerate-btn"),
  copyBtn: document.getElementById("copy-btn"),
  shareSection: document.getElementById("share-section"),
  emailForm: document.getElementById("email-form"),
  emailSubject: document.getElementById("email-subject"),
  emailRecipients: document.getElementById("email-recipients"),
  emailMessage: document.getElementById("email-message"),
  emailStatus: document.getElementById("email-status"),
  successModal: document.getElementById("success-modal"),
  successMessage: document.getElementById("success-message"),
  modalClose: document.getElementById("modal-close"),
};

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  setupDragAndDrop();
});

// Event Listeners
function initializeEventListeners() {
  // File upload
  elements.uploadArea.addEventListener("click", () =>
    elements.fileInput.click()
  );
  elements.fileInput.addEventListener("change", handleFileSelect);
  elements.removeFile.addEventListener("click", removeFile);

  // Custom instruction chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      elements.customInstruction.value = chip.dataset.instruction;
      elements.customInstruction.focus();
    });
  });

  // Generate summary
  elements.generateBtn.addEventListener("click", generateSummary);

  // Summary actions
  elements.regenerateBtn.addEventListener("click", generateSummary);
  elements.copyBtn.addEventListener("click", copySummary);

  // Email form
  elements.emailForm.addEventListener("submit", handleEmailSubmit);

  // Modal
  elements.modalClose.addEventListener("click", closeModal);
  elements.successModal.addEventListener("click", (e) => {
    if (e.target === elements.successModal) closeModal();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

// Drag and Drop functionality
function setupDragAndDrop() {
  elements.uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add("dragover");
  });

  elements.uploadArea.addEventListener("dragleave", () => {
    elements.uploadArea.classList.remove("dragover");
  });

  elements.uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });
}

// File handling
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
}

function handleFile(file) {
  // Validate file type
  if (!file.type.match("text/.*") && !file.name.endsWith(".md")) {
    showError("Please select a text file (.txt or .md)");
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError("File size must be less than 5MB");
    return;
  }

  currentFile = file;
  displayFileInfo(file);
  showSection(elements.instructionsSection);

  // Auto-fill email subject with filename
  const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
  elements.emailSubject.value = `Meeting Summary - ${fileName}`;
}

function displayFileInfo(file) {
  elements.fileName.textContent = file.name;
  elements.fileInfo.style.display = "block";
  elements.uploadArea.style.display = "none";
}

function removeFile() {
  currentFile = null;
  currentTranscript = "";
  elements.fileInfo.style.display = "none";
  elements.uploadArea.style.display = "block";
  elements.fileInput.value = "";
  hideSection(elements.instructionsSection);
  hideSection(elements.generateSection);
  hideSection(elements.summarySection);
  hideSection(elements.shareSection);
}

// File upload to backend
async function uploadFile() {
  if (!currentFile) return null;

  const formData = new FormData();
  formData.append("transcript", currentFile);

  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    currentTranscript = result.transcript;
    return result;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// Generate summary
async function generateSummary() {
  if (!currentFile || !elements.customInstruction.value.trim()) {
    showError("Please upload a file and provide custom instructions");
    return;
  }

  try {
    // Show loading state
    elements.generateBtn.style.display = "none";
    elements.loadingSpinner.style.display = "block";

    // Upload file first
    await uploadFile();

    // Generate summary
    const response = await fetch(`${API_BASE_URL}/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript: currentTranscript,
        customInstruction: elements.customInstruction.value.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || "Failed to generate summary");
    }

    const result = await response.json();
    currentSummary = result.summary;

    // Display summary
    elements.summaryText.value = currentSummary;
    showSection(elements.summarySection);
    showSection(elements.shareSection);

    // Show success message
    showSuccess("Summary generated successfully!");
  } catch (error) {
    console.error("Summary generation error:", error);
    showError(error.message);
  } finally {
    // Hide loading state
    elements.generateBtn.style.display = "inline-flex";
    elements.loadingSpinner.style.display = "none";
  }
}

// Copy summary to clipboard
async function copySummary() {
  try {
    await navigator.clipboard.writeText(elements.summaryText.value);
    showSuccess("Summary copied to clipboard!");
  } catch (error) {
    console.error("Copy failed:", error);
    showError("Failed to copy summary");
  }
}

// Handle email submission
async function handleEmailSubmit(e) {
  e.preventDefault();

  const recipients = elements.emailRecipients.value
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email);
  const subject = elements.emailSubject.value.trim();
  const summary = elements.summaryText.value.trim();

  if (!recipients.length || !subject || !summary) {
    showError("Please fill in all required fields");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipients,
        subject,
        summary,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send email");
    }

    const result = await response.json();

    // Show success
    showSuccess(
      `Email sent successfully to ${result.recipients.length} recipient(s)!`
    );

    // Reset form
    elements.emailForm.reset();
    elements.emailSubject.value = `Meeting Summary - ${currentFile.name.replace(
      /\.[^/.]+$/,
      ""
    )}`;
  } catch (error) {
    console.error("Email sending error:", error);
    showError(error.message);
  }
}

// UI State Management
function showSection(section) {
  section.style.display = "block";
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideSection(section) {
  section.style.display = "none";
}

// Success and Error handling
function showSuccess(message) {
  elements.successMessage.textContent = message;
  elements.successModal.style.display = "block";
}

function showError(message) {
  elements.emailStatus.textContent = message;
  elements.emailStatus.className = "email-status error";
  elements.emailStatus.style.display = "block";

  // Auto-hide after 5 seconds
  setTimeout(() => {
    elements.emailStatus.style.display = "none";
  }, 5000);
}

function closeModal() {
  elements.successModal.style.display = "none";
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + Enter to generate summary
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    if (elements.generateSection.style.display !== "none") {
      e.preventDefault();
      generateSummary();
    }
  }

  // Escape to close modal
  if (e.key === "Escape") {
    closeModal();
  }
}

// Utility functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Auto-advance sections based on user input
elements.customInstruction.addEventListener("input", function () {
  if (this.value.trim() && currentFile) {
    showSection(elements.generateSection);
  } else {
    hideSection(elements.generateSection);
  }
});

// Add some helpful UI enhancements
document.addEventListener("DOMContentLoaded", function () {
  // Add tooltips to example chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.title = `Click to use: "${chip.dataset.instruction}"`;
  });

  // Add character count to custom instruction
  const instructionCounter = document.createElement("div");
  instructionCounter.className = "char-counter";
  instructionCounter.style.cssText =
    "text-align: right; color: #999; font-size: 0.8rem; margin-top: 5px;";
  elements.customInstruction.parentNode.appendChild(instructionCounter);

  elements.customInstruction.addEventListener("input", function () {
    const remaining = 500 - this.value.length;
    instructionCounter.textContent = `${remaining} characters remaining`;
    instructionCounter.style.color = remaining < 50 ? "#ff6b6b" : "#999";
  });
});
