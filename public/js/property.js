class Property extends Base {
  constructor(data, fileKey) {
    super();
    this.data = data;
    this.fileKey = fileKey;
    this.valueMap = new Map();
  }

  template() {
    return `
      <div class="Property__title">
        <div>
          <span class="Property__name"><%= name %></span> &mdash; 
          <span class="Property__count"><%= count %> <%= count > 1 ? 'components' : 'component' %></span>
        </div>
        <span class="Property__type is-<%= type.toLowerCase() %>"><%= type %></span>
      </div>
      <div class="Property__details">
        <% if (values && values.length) { %>
          <div class="Property__detail">
            <span class="Property__label">Values</span>: 
            <span class="Property__values">
              <% values.forEach((value, index) => { %>
                <span class="Property__value" data-value="<%= value %>"><%= value %></span><%= index < values.length - 1 ? ', ' : '' %>
              <% }); %>
            </span>
          </div>
        <% } %>
        <div class="Property__components">
          <% components.forEach(([componentName, componentId, componentValues]) => { %>
            <a href="https://www.figma.com/file/<%= fileKey %>?node-id=<%= encodeURIComponent(componentId) %>" 
               target="_blank" class="Component" data-component-id="<%= componentId %>"><%= componentName %></a>
          <% }); %>
        </div>
      </div>
    `;
  }

  render() {
    this.templateData = { ...this.data, fileKey: this.fileKey };
    super.render();
    this.$el.classList.add(`is-${this.data.type.toLowerCase()}`);

    this.$el.addEventListener("click", this.handleClick.bind(this));

    const componentLinks = this.$el.querySelectorAll(".Component");
    componentLinks.forEach((link) => {
      link.addEventListener("mouseenter", this.handleComponentHover.bind(this));
      link.addEventListener("mouseleave", this.handleComponentLeave.bind(this));
    });

    this.createValueMap();

    return this.$el;
  }

  createValueMap() {
    this.data.components.forEach(
      ([componentName, componentId, componentValues]) => {
        if (componentValues && componentValues.length) {
          this.valueMap.set(componentId, componentValues);
        } else {
          // If no specific values are provided for this component, use all available values
          this.valueMap.set(componentId, this.data.values || []);
        }
      },
    );
  }

  handleComponentHover(e) {
    const componentId = e.target.dataset.componentId;
    const values = this.valueMap.get(componentId);

    values = values.sort((a, b) => a.localeCompare(b));
    this.$el.classList.add("is-hover");

    if (values && values.length) {
      values.forEach((value) => {
        const valueSpan = this.$el.querySelector(
          `.Property__value[data-value="${value}"]`,
        );

        if (valueSpan) {
          valueSpan.classList.add("is-highlighted");
        }
      });
    }
  }

  handleComponentLeave(_e) {
    this.$el.classList.remove("is-hover");
    const valueSpans = this.$el.querySelectorAll(".Property__value");
    valueSpans.forEach((span) => span.classList.remove("is-highlighted"));
  }

  handleClick(e) {
    if (e.target.tagName === "A") {
      return;
    }
    this.$el.classList.toggle("is-open");
  }
}
