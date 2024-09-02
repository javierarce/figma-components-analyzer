class Library {
  constructor(personalAccessToken, fileID) {
    this.personalAccessToken = personalAccessToken;
    this.fileID = fileID;
  }

  normalizePropName(name) {
    return name
      .toLowerCase()
      .replace(/[_\s-]+/g, "") // Remove underscores, spaces, and hyphens
      .replace(/[?!]+/g, "") // Remove question marks and exclamation points
      .replace(/^is/, "") // Remove leading "is"
      .replace(/^has/, ""); // Remove leading "has"
  }

  detectNamingInconsistencies(variantProperties) {
    const propertyGroups = {};
    const inconsistencies = [];

    for (const [componentName, componentData] of Object.entries(
      variantProperties,
    )) {
      for (const propName in componentData.properties) {
        const normalizedName = this.normalizePropName(propName);
        if (!propertyGroups[normalizedName]) {
          propertyGroups[normalizedName] = new Set();
        }
        propertyGroups[normalizedName].add(propName);
      }
    }

    for (const [normalizedName, variants] of Object.entries(propertyGroups)) {
      if (variants.size > 1) {
        inconsistencies.push({
          normalizedName,
          variants: Array.from(variants),
        });
      }
    }

    return inconsistencies;
  }

  async fetch() {
    try {
      const response = await fetch(
        `https://api.figma.com/v1/files/${this.fileID}`,
        {
          headers: {
            "X-FIGMA-TOKEN": this.personalAccessToken,
          },
        },
      );

      const file = await response.json();
      const components = this.getAllComponents(file.document);
      const properties = this.getVariantPropertiesAndValues(components);
      const name = file.name;
      const lastModified = file.lastModified;
      return { name, lastModified, properties };
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
        variantProperties[component.name] = {
          properties: properties,
          id: component.id, // Store the component ID
        };
      }
    }
    return variantProperties;
  }

  cleanPropertyName(name) {
    return name.replace(/#\d+:\d+$/, "");
  }

  analyzeComponentNames(variantProperties) {
    const propertyAnalysis = {};
    for (const [componentName, componentData] of Object.entries(
      variantProperties,
    )) {
      const properties = componentData.properties;
      for (const propName in properties) {
        const propType = properties[propName].type;
        const key = `${propName}:${propType}`;
        if (!propertyAnalysis[key]) {
          propertyAnalysis[key] = {
            name: propName,
            type: propType,
            count: 1,
            values: new Set(),
            components: new Set(),
          };
        } else {
          propertyAnalysis[key].count++;
        }
        if (properties[propName].values) {
          properties[propName].values.forEach((value) =>
            propertyAnalysis[key].values.add(value),
          );
        }
        propertyAnalysis[key].components.add([
          componentName,
          componentData.id,
          properties[propName].values || [],
        ]);
      }
    }

    const sortedProperties = Object.values(propertyAnalysis)
      .map(({ name, type, count, values, components }) => ({
        name,
        type,
        count,
        values: Array.from(values),
        components: Array.from(components),
      }))
      .sort((a, b) => b.count - a.count);
    const inconsistencies = this.detectNamingInconsistencies(variantProperties);

    return {
      properties: sortedProperties,
      inconsistencies: inconsistencies,
    };
  }
}
