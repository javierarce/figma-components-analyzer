let fullAnalysis = null;

const saveToLocalStorage = (token, fileKey) => {
  localStorage.setItem("figmaToken", token);
  localStorage.setItem("figmaFileKey", fileKey);
};

const loadFromLocalStorage = () => {
  const token = localStorage.getItem("figmaToken") || "";
  const fileKey = localStorage.getItem("figmaFileKey") || "";
  document.getElementById("token").value = token;
  document.getElementById("fileKey").value = fileKey;
};

const onsubmit = async (e) => {
  e.preventDefault();

  const token = document.getElementById("token").value;
  const fileKey = document.getElementById("fileKey").value;
  const resultDiv = document.getElementById("result");
  const controls = document.getElementById("controls");

  saveToLocalStorage(token, fileKey);

  resultDiv.textContent = "Analyzing...";
  controls.style.display = "none";

  try {
    const library = new Library(token, fileKey);
    const variantProperties = await library.fetch();
    fullAnalysis = library.analyzeComponentNames(variantProperties);

    resultDiv.textContent = JSON.stringify(fullAnalysis.slice(0, 10), null, 2);
    controls.style.display = "flex";
  } catch (error) {
    resultDiv.textContent = "Error: " + error.message;
  }
};

const onDownload = () => {
  if (fullAnalysis) {
    const blob = new Blob([JSON.stringify(fullAnalysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "figma_analysis.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

window.onload = () => {
  loadFromLocalStorage();
  document.getElementById("apiForm").addEventListener("submit", onsubmit);
  document.getElementById("downloadBtn").addEventListener("click", onDownload);
};
