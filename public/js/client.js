class FigmaAnalyzer {
  constructor() {
    this.fullAnalysis = null;
    this.token = "";
    this.fileKey = "";
  }

  saveToLocalStorage(token, fileKey) {
    localStorage.setItem("figmaToken", token);
    localStorage.setItem("figmaFileKey", fileKey);
  }

  loadFromLocalStorage() {
    this.token = localStorage.getItem("figmaToken") || "";
    this.fileKey = localStorage.getItem("figmaFileKey") || "";
    document.getElementById("token").value = this.token;
    document.getElementById("fileKey").value = this.fileKey;
  }

  formatAnalysisResults(analysis, fileKey) {
    return analysis
      .map(({ name, type, count, values, components }) => {
        let result = `<div class="Property">`;
        result += `<div class="Property__title"><span class="Property__name">${name}</span> <span class="Property__type is-${type.toLowerCase()}">${type}</span></div>`;
        result += `<div class="Property__details">`;
        if (values && values.length) {
          result += `<div class="Property__detail"><span class="Property__label">Value</span>: ${values.join(", ")}</div>`;
        }
        result += `<div class="Property__detail"><span class="Property__label">Components (${count})</span>: ${components
          .map(
            ([componentName, componentId]) =>
              `<a href="https://www.figma.com/file/${fileKey}?node-id=${encodeURIComponent(componentId)}" 
                      target="_blank" class="component-link">${componentName}</a>`,
          )
          .join(", ")}</div>`;
        result += `</div></div>`;
        return result;
      })
      .join("");
  }

  async onSubmit(e) {
    e.preventDefault();
    this.token = document.getElementById("token").value;
    this.fileKey = document.getElementById("fileKey").value;
    const resultDiv = document.getElementById("result");
    const controls = document.getElementById("controls");
    const loader = document.createElement("div");
    resultDiv.innerHTML = "";
    loader.className = "Loader";
    loader.textContent = "Analyzing...";
    resultDiv.appendChild(loader);
    this.saveToLocalStorage(this.token, this.fileKey);
    controls.style.display = "none";
    try {
      const library = new Library(this.token, this.fileKey);
      const variantProperties = await library.fetch();
      this.fullAnalysis = library.analyzeComponentNames(variantProperties);
      resultDiv.innerHTML = this.formatAnalysisResults(
        this.fullAnalysis,
        this.fileKey,
      );
      controls.style.display = "flex";
      loader.remove();
    } catch (error) {
      resultDiv.textContent = "Error: " + error.message;
      loader.remove();
    }
  }

  onDownload() {
    if (this.fullAnalysis) {
      const blob = new Blob([JSON.stringify(this.fullAnalysis, null, 2)], {
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
  }

  init() {
    this.loadFromLocalStorage();
    document
      .getElementById("apiForm")
      .addEventListener("submit", (e) => this.onSubmit(e));
    document
      .getElementById("downloadBtn")
      .addEventListener("click", () => this.onDownload());
  }
}

window.onload = () => {
  const analyzer = new FigmaAnalyzer();
  analyzer.init();
};
