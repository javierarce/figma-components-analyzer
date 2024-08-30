"use strict";

const fs = require("fs");
require("dotenv").config();

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE = process.env.FIGMA_FILE;

const Library = require("./lib/Library");

async function analyzeLibrary() {
  const library = new Library(FIGMA_TOKEN, FIGMA_FILE);
  try {
    const variantProperties = await library.fetch();
    const propertyAnalysis = library.analyzeComponentNames(variantProperties);

    console.log("Variant property analysis\n");

    propertyAnalysis.forEach(({ name, count, type, values, components }) => {
      console.log(`${name} (${count})`);
      console.log(`  Type: ${type}`);
      if (values && values.length) {
        console.log(`  Values: ${values.join(", ")}`);
      }
      console.log(`  Used in: ${components.join(", ")}\n`);
    });
    fs.writeFileSync(
      "analysis.json",
      JSON.stringify(propertyAnalysis, null, 2),
    );
  } catch (error) {
    console.error("Error analyzing library:", error);
  }
}

analyzeLibrary();

async function main() {
  try {
    analyzeLibrary();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
