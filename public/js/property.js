class Property extends Base {
  constructor(data, fileKey) {
    super();
    this.data = data;
    this.fileKey = fileKey;
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
              <span class="Property__label">Values</span>: <%= values.join(", ") %>
            </div>
          <% } %>
          <div class="Property__components">
            <% components.forEach(([componentName, componentId]) => { %>
              <a href="https://www.figma.com/file/<%= fileKey %>?node-id=<%= encodeURIComponent(componentId) %>" 
                 target="_blank" class="Component"><%= componentName %></a>
            <% }); %>
          </div>
        </div>
    `;
  }

  render() {
    this.templateData = { ...this.data, fileKey: this.fileKey };
    super.render();
    this.$el.classList.add(`is-${this.data.type.toLowerCase()}`);
    return this.$el;
  }
}
