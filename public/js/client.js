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

const formatAnalysisResults = (analysis, fileKey) => {
  return analysis
    .map(({ name, type, count, values, components }) => {
      let result = `<div class="property">`;
      result += `<div class="property-title">
<span class="property-name">${name}</span>
<span class="property-type is-${type.toLowerCase()}">${type}</span> <span class="property-count">${count}</span></div>`;
      result += `<div class="property-details">`;
      if (values && values.length) {
        result += `Values: ${values.join(", ")}<br>`;
      }
      result += `Used in: ${components
        .map(
          ([componentName, componentId]) =>
            `<a href="https://www.figma.com/file/${fileKey}?node-id=${encodeURIComponent(componentId)}" 
                    target="_blank" class="component-link">${componentName}</a>`,
        )
        .join(", ")}`;
      result += `</div></div>`;
      return result;
    })
    .join("");
};

const onSubmit = async (e) => {
  e.preventDefault();
  const token = document.getElementById("token").value;
  const fileKey = document.getElementById("fileKey").value;
  const resultDiv = document.getElementById("result");
  const controls = document.getElementById("controls");
  const loader = document.createElement("div");

  resultDiv.innerHTML = "";
  loader.className = "Loader";
  loader.textContent = "Analyzing...";
  resultDiv.appendChild(loader);

  saveToLocalStorage(token, fileKey);
  controls.style.display = "none";

  try {
    const library = new Library(token, fileKey);
    const variantProperties = await library.fetch();
    fullAnalysis = library.analyzeComponentNames(variantProperties);
    resultDiv.innerHTML = formatAnalysisResults(fullAnalysis, fileKey);
    controls.style.display = "flex";
    loader.remove();
  } catch (error) {
    resultDiv.textContent = "Error: " + error.message;
    loader.remove();
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
  document.getElementById("apiForm").addEventListener("submit", onSubmit);
  document.getElementById("downloadBtn").addEventListener("click", onDownload);
};
