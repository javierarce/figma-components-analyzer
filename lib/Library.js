const Figma = require("figma-js");

class Library {
  constructor(personalAccessToken, fileID) {
    this.personalAccessToken = personalAccessToken;
    this.fileID = fileID;
    this.client = Figma.Client({
      personalAccessToken,
    });
  }

  async fetch() {
    try {
      const file = await this.client.file(this.fileID);
      const components = this.getAllComponents(file.data.document);
      const variantProperties = this.getVariantPropertiesAndValues(components);
      return variantProperties;
    } catch (error) {
      console.error("Error fetching Figma file:", error);
      throw error;
    }
  }

  getAllComponents(node) {
    let components = [];
    if (node.type === "COMPONENT_SET") {
      components.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        components = components.concat(this.getAllComponents(child));
      }
    }
    return components;
  }

  getVariantPropertiesAndValues(components) {
    const variantProperties = {};
    for (const component of components) {
      if (component.type === "COMPONENT_SET") {
        const properties = {};
        if (component.componentPropertyDefinitions) {
          for (const [key, value] of Object.entries(
            component.componentPropertyDefinitions,
          )) {
            const cleanKey = this.cleanPropertyName(key);
            properties[cleanKey] = {
              type: value.type,
              values: new Set(),
            };
          }
        }
        if (component.children) {
          for (const variant of component.children) {
            if (variant.name) {
              const variantProperties = variant.name.split(", ");
              for (const prop of variantProperties) {
                const [key, value] = prop.split("=");
                const cleanKey = this.cleanPropertyName(key);
                if (properties[cleanKey]) {
                  properties[cleanKey].values.add(value);
                }
              }
            }
          }
        }
        for (const prop in properties) {
          const values = Array.from(properties[prop].values);
          if (values && values.length) {
            properties[prop].values = values;
          } else {
            delete properties[prop].values;
          }
        }
        variantProperties[component.name] = properties;
      }
    }
    return variantProperties;
  }

  cleanPropertyName(name) {
    return name.replace(/#\d+:\d+$/, "");
  }

  analyzeComponentNames(variantProperties) {
    const propertyAnalysis = {};

    // Iterate through all components and their properties
    for (const componentName in variantProperties) {
      const properties = variantProperties[componentName];
      for (const propName in properties) {
        if (!propertyAnalysis[propName]) {
          propertyAnalysis[propName] = {
            count: 1,
            type: properties[propName].type,
            values: new Set(),
            components: new Set([componentName]),
          };
        } else {
          propertyAnalysis[propName].count++;
          propertyAnalysis[propName].components.add(componentName);
        }

        if (properties[propName].values) {
          properties[propName].values.forEach((value) =>
            propertyAnalysis[propName].values.add(value),
          );
        }
      }
    }

    // Convert to array, sort by frequency, and convert Sets to Arrays
    const sortedProperties = Object.entries(propertyAnalysis)
      .map(([name, { count, type, values, components }]) => ({
        name,
        count,
        type,
        values: Array.from(values),
        components: Array.from(components),
      }))
      .sort((a, b) => b.count - a.count);

    return sortedProperties;
  }
}

module.exports = Library;
