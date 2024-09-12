class FigmaAnalyzer extends Base {
  constructor() {
    super();
    this.fullAnalysis = null;
    this.token = "";
    this.fileKey = "";
    this.templateData = {};
    this.$resultsHeader = null;
    this.$resultsContent = null;
    this.$loader = null;
    this.$filter = null;
    this.$sortSelect = null;
    this.currentSort = "count";
    this.$info = null;

    this.TYPES = {
      ALL: "All types",
      COMPONENT: "COMPONENT",
      INSTANCE: "INSTANCE",
      VARIANT: "VARIANT",
    };
    this.currentFilter = this.TYPES.ALL;
  }

  bindEvents() {
    document
      .getElementById("apiForm")
      .addEventListener("submit", (e) => this.onSubmit(e));
    document
      .getElementById("download")
      .addEventListener("click", (e) => this.onDownload(e));
  }

  template() {
    return `
      <div class="Form">
        <h2>Figma<br />Components<br />Analyzer</h2>
        <form id="apiForm">
          <input type="text" id="token" placeholder="Figma Personal Access Token" required>
          <input type="text" id="fileKey" placeholder="Figma File Key" required>
          <div class="Form__buttons">
            <button type="submit">Analyze</button>
            <button id="download" class="is-hidden is-secondary">Download analysis</button>
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

  createPropertyElements(analysis) {
    return analysis.map((propertyData) => {
      propertyData.values = propertyData.values.sort((a, b) =>
        a.localeCompare(b),
      );

      const property = new Property(propertyData, this.fileKey);
      return property.render();
    });
  }

  displayResultsContent() {
    this.$resultsContent.innerHTML = "";

    let filteredAnalysis =
      this.currentFilter === this.TYPES.ALL
        ? this.fullAnalysis
        : this.fullAnalysis.filter((prop) => prop.type === this.currentFilter);

    this.updateHeaderInfo(filteredAnalysis);

    filteredAnalysis = this.sortProperties(filteredAnalysis);

    const propertyElements = this.createPropertyElements(filteredAnalysis);
    propertyElements.forEach((element) => {
      this.$resultsContent.appendChild(element);
    });
  }

  sortProperties(properties) {
    if (this.currentSort === "alphabetical") {
      return properties.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return properties.sort((a, b) => b.count - a.count);
    }
  }

  createSortSelect() {
    const $select = this.createElement({
      elementType: "select",
      className: "Sort Select",
      id: "sort",
    });

    const options = [
      { value: "count", text: "Sort by count" },
      { value: "alphabetical", text: "Sort alphabetically" },
    ];

    options.forEach(({ value, text }) => {
      const $option = this.createElement({
        elementType: "option",
        value,
        text,
      });
      $select.appendChild($option);
    });

    $select.addEventListener("change", (e) => this.onSortChange(e));

    return $select;
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

    this.updateTokenAndFileKey();
    this.saveToLocalStorage(this.token, this.fileKey);

    this.resetUI();
    this.showLoader();

    try {
      await this.fetchAndAnalyzeComponents();
      this.displayResults();
    } catch (error) {
      this.displayError(error);
    }
  }

  updateTokenAndFileKey() {
    this.token = document.getElementById("token").value;
    this.fileKey = document.getElementById("fileKey").value;
  }

  resetUI() {
    this.$results.classList.remove("has-error");
    this.$resultsHeader.classList.remove("is-visible");
    this.$resultsHeader.innerHTML = "";
    this.$resultsContent.innerHTML = "";
    this.$download.classList.add("is-hidden");
  }

  showLoader() {
    this.$loader.classList.add("is-visible");
  }

  hideLoader() {
    this.$loader.classList.remove("is-visible");
  }

  async fetchAndAnalyzeComponents() {
    const library = new Library(this.token, this.fileKey);
    const document = await library.fetch();
    this.name = document.name;
    this.lastModified = document.lastModified;
    const analysis = library.analyzeComponentNames(document.properties);
    this.fullAnalysis = analysis.properties;
    this.inconsistencies = analysis.inconsistencies;
  }

  displayResults() {
    this.hideLoader();
    this.displayResultsHeader();
    this.displayResultsContent();
    this.displayInconsistencies();
    this.$download.classList.remove("is-hidden");
  }

  displayInconsistencies() {
    if (this.inconsistencies.length > 0) {
      const $inconsistencies = this.createElement({
        elementType: "div",
        className: "Inconsistencies",
      });

      const $header = this.createElement({
        elementType: "div",
        className: "Inconsistencies__header",
      });

      const $title = this.createElement({
        elementType: "h3",
        text: `${this.inconsistencies.length} possible inconsistencies found.`,
      });

      const $listWrapper = this.createElement({
        elementType: "div",
        className: "Inconsistencies__list-wrapper is-hidden",
      });

      const $list = this.createElement({
        elementType: "ul",
        className: "Inconsistencies__list",
      });

      this.inconsistencies.forEach((inconsistency) => {
        // Sort variants by number of components (descending order)
        inconsistency.variants.sort(
          (a, b) => b.components.length - a.components.length,
        );

        const $item = this.createElement({
          elementType: "li",
        });

        inconsistency.variants.forEach((variant, index) => {
          const $variantInfo = this.createElement({
            elementType: "div",
            className: "Inconsistencies__variant-info",
          });

          const $variantLink = this.createElement({
            elementType: "a",
            className: "Inconsistencies__variant-link",
            text: variant.name,
          });

          $variantLink.href = "#";
          $variantLink.addEventListener("click", (e) => {
            e.preventDefault();

            this.toggleInconsistencies($listWrapper, $header);
            this.scrollToVariant(variant.name);
          });

          const $variantCount = this.createElement({
            elementType: "span",
            className: "Inconsistencies__variant-count",
            text: variant.components.length,
          });

          $variantInfo.appendChild($variantLink);
          $variantInfo.appendChild($variantCount);

          const $componentList = this.createElement({
            elementType: "span",
            className: "Inconsistencies__component-list",
          });

          $variantInfo.appendChild($componentList);
          $item.appendChild($variantInfo);

          if (index < inconsistency.variants.length - 1) {
            $item.appendChild(document.createTextNode(" "));
          }
        });

        $list.appendChild($item);
      });

      $header.appendChild($title);
      $inconsistencies.appendChild($header);
      $listWrapper.appendChild($list);
      $inconsistencies.appendChild($listWrapper);

      $header.addEventListener("click", () =>
        this.toggleInconsistencies($listWrapper, $header),
      );

      this.$resultsHeader.insertAdjacentElement("afterend", $inconsistencies);
    }
  }

  scrollToVariant(variantName) {
    const $propertyElements =
      this.$resultsContent.querySelectorAll(".Property");

    for (const $property of $propertyElements) {
      const $propertyName = $property.querySelector(".Property__name");

      if ($propertyName && $propertyName.textContent.trim() === variantName) {
        const containerTop = this.$resultsContent.getBoundingClientRect().top;
        const elementTop = $property.getBoundingClientRect().top;
        const offset =
          elementTop - containerTop + this.$resultsContent.scrollTop - 20;

        this.$resultsContent.scrollTo({
          top: offset,
          behavior: "smooth",
        });

        $property.classList.add("highlight");

        setTimeout(() => {
          $property.classList.remove("highlight");
        }, 4000);
        break;
      }
    }
  }

  toggleInconsistencies($listWrapper, $header) {
    $header.classList.toggle("is-open");
    $listWrapper.classList.toggle("is-hidden");
  }

  displayResultsHeader() {
    this.$resultsHeader.classList.add("is-visible");

    const $title = this.createElement({
      elementType: "h2",
      className: "ResultsHeader__title",
      text: this.name,
    });

    this.$info = this.createElement({
      className: "ResultsHeader__info",
    });

    const $filter = this.createTypeFilter();
    const $sort = this.createSortSelect();

    const $resultsHeaderLeft = this.createElement({
      elementType: "div",
      className: "ResultsHeader__left",
    });

    const $resultsHeaderOptions = this.createElement({
      elementType: "div",
      className: "Results__headerOptions",
    });

    $resultsHeaderLeft.appendChild($title);
    $resultsHeaderLeft.appendChild(this.$info);

    if ($filter) {
      $resultsHeaderOptions.appendChild($filter);
    }

    if ($sort) {
      $resultsHeaderOptions.appendChild($sort);
    }

    this.$resultsHeader.appendChild($resultsHeaderLeft);
    this.$resultsHeader.appendChild($resultsHeaderOptions);

    this.updateHeaderInfo(this.fullAnalysis);
  }

  updateHeaderInfo(filteredAnalysis) {
    const propertyCount = filteredAnalysis.length;
    const componentCount = new Set(
      filteredAnalysis.flatMap((prop) =>
        prop.components.map((comp) => comp[1]),
      ),
    ).size;
    const propertyLabel = propertyCount === 1 ? "property" : "properties";
    const componentLabel = componentCount === 1 ? "component" : "components";

    this.$info.textContent = `${propertyCount} ${propertyLabel} found in ${componentCount} ${componentLabel}`;
  }

  createTypeFilter() {
    const types = [
      this.TYPES.ALL,
      ...new Set(this.fullAnalysis.map((prop) => prop.type)),
    ];

    if (types.length < 3) {
      return false;
    }

    const $select = this.createElement({
      elementType: "select",
      className: "Filter Select",
      id: "filter",
    });

    types.forEach((value) => {
      const text = value.replace(/_/g, " ");

      const $option = this.createElement({
        elementType: "option",
        value,
        text,
      });

      $select.appendChild($option);
    });

    $select.addEventListener("change", (e) => this.onTypeFilterChange(e));

    return $select;
  }

  onTypeFilterChange(e) {
    this.currentFilter = e.target.value;
    this.displayResultsContent();
  }

  onSortChange(e) {
    this.currentSort = e.target.value;
    this.displayResultsContent();
  }

  displayError(error) {
    this.hideLoader();
    this.$results.classList.add("has-error");
    this.$resultsContent.textContent = `Error: ${error.message}`;
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
    const properties = this.$el.querySelectorAll(".Property");
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
    this.bindEvents();
    this.loadFromLocalStorage();
  }

  render() {
    this.renderTemplate();
    this.$results = this.$el.querySelector(".js-results");
    this.$resultsHeader = this.$el.querySelector(".js-results-header");
    this.$resultsContent = this.$el.querySelector(".js-results-content");
    this.$loader = this.$el.querySelector(".js-results-loader");
    this.$download = this.$el.querySelector("#download");

    return this.$el;
  }
}

window.onload = () => {
  const analyzer = new FigmaAnalyzer();
  document.body.appendChild(analyzer.render());
  analyzer.init();
};
