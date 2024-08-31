class FigmaAnalyzer extends Base {
  constructor() {
    super();
    this.fullAnalysis = null;
    this.token = "";
    this.fileKey = "";
    this.templateData = {};
  }

  template() {
    return `

<div class="Form">
<h2>Figma<br />Components<br />Analyzer</h2>

<form id="apiForm">
<input type="text" id="token" placeholder="Figma Personal Access Token" required>
<input type="text" id="fileKey" placeholder="Figma File Key" required>
<button type="submit">Analyze</button>

<div class="Download" id="download" style="display: none;">
<button id="downloadBtn">Download analysis</button>
</div>
</form>

</div>
<div class="Results js-results">
<div class="Results__header js-results-header"></div>
<div class="Results__content js-results-content"></div>
<div class="Results__loader js-results-loader">Analyzing…</div>
</div>

    `;
  }

  render() {
    this.renderTemplate();

    return this.$el;
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

  formatAnalysisResults(analysis) {
    return analysis
      .map((propertyData) => {
        const property = new Property(propertyData, this.fileKey);
        return property.render().outerHTML;
      })
      .join("");
  }

  async onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    this.token = document.getElementById("token").value;
    this.fileKey = document.getElementById("fileKey").value;

    this.saveToLocalStorage(this.token, this.fileKey);

    const $resultsHeader = document.querySelector(".js-results-header");
    const $resultsContent = document.querySelector(".js-results-content");
    const $loader = document.querySelector(".js-results-loader");
    const $download = document.getElementById("download");
    const $resultsHeaderTitle = document.createElement("h2");
    $resultsHeaderTitle.className = "ResultsHeader__title";
    $resultsHeaderTitle.textContent = "Results";

    $resultsHeader.classList.remove("is-visible");
    $resultsHeader.innerHTML = "";
    $resultsContent.innerHTML = "";
    $loader.classList.add("is-visible");

    $download.style.display = "none";

    try {
      const library = new Library(this.token, this.fileKey);
      const components = await library.fetch();

      this.fullAnalysis = library.analyzeComponentNames(components);
      $resultsHeader.classList.add("is-visible");

      const componentsList = Object.values(components);
      const componentsLabel =
        componentsList.length > 1 ? "components" : "component";

      const $info = document.createElement("div");
      $info.className = "Info";
      $info.textContent = `${this.fullAnalysis.length} properties found in ${componentsList.length} ${componentsLabel}`;
      $resultsHeader.appendChild($resultsHeaderTitle);
      $resultsHeader.appendChild($info);

      $resultsContent.innerHTML = this.formatAnalysisResults(
        this.fullAnalysis,
        this.fileKey,
      );

      this.addPropertyClickListeners();

      $loader.classList.remove("is-visible");
      $download.style.display = "block";
    } catch (error) {
      $loader.classList.remove("is-visible");
      $resultsContent.textContent = "Error: " + error.message;
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
        if (e.target.tagName === "A") {
          return;
        }

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
  document.body.appendChild(analyzer.render());
  analyzer.init();
};
