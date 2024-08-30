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
        let result = `<div class="Property is-${type.toLowerCase()}">`;
        const componentsLabel =
          components.length > 1 ? "components" : "component";
        result += `<div class="Property__title">
<div><span class="Property__name">${name}</span> &mdash; <span class="Property__count">${count} ${componentsLabel}</span></div>

</span> <span class="Property__type is-${type.toLowerCase()}">${type}</span></div>`;
        result += `<div class="Property__details">`;
        if (values && values.length) {
          result += `<div class="Property__detail"><span class="Property__label">Values</span>: ${values.join(", ")}</div>`;
        }
        result += `<div class="Property__components">`;
        result += components
          .map(([componentName, componentId]) => {
            const url = `https://www.figma.com/file/${fileKey}?node-id=${encodeURIComponent(componentId)}`;
            return `<a href="${url}" target="_blank" class="Component">${componentName}</a>`;
          })
          .join("");
        result += `</div>`;
        result += `</div></div>`;
        return result;
      })
      .join("");
  }

  async onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.token = document.getElementById("token").value;
    this.fileKey = document.getElementById("fileKey").value;
    const resultDiv = document.getElementById("result");
    const loader = document.createElement("div");
    const controls = document.getElementById("controls");
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
      this.addPropertyClickListeners();
      controls.style.display = "block";
      loader.remove();
    } catch (error) {
      resultDiv.textContent = "Error: " + error.message;
      loader.remove();
    }
  }

  onDownload(e) {
    e.preventDefault();
    e.stopPropagation();

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

  addPropertyClickListeners() {
    const properties = document.querySelectorAll(".Property");
    properties.forEach((property) => {
      property.addEventListener("click", (e) => {
        // Prevent click on links from toggling the components
        if (e.target.tagName === "A") return;

        const componentsDiv = property.querySelector(".Property__components");
        if (componentsDiv) {
          componentsDiv.classList.toggle("is-open");
          property.classList.toggle("is-open");
        }
      });
    });
  }

  init() {
    this.loadFromLocalStorage();
    document
      .getElementById("apiForm")
      .addEventListener("submit", (e) => this.onSubmit(e));
    document
      .getElementById("downloadBtn")
      .addEventListener("click", (e) => this.onDownload(e));
  }
}

window.onload = () => {
  const analyzer = new FigmaAnalyzer();
  analyzer.init();
};
