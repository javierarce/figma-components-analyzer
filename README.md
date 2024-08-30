# Figma Components Analyzer

This project provides a tool to analyze component variants in a Figma file. It
extracts information about component properties, their types, possible values,
and usage across different components.

The goal of this tool is to help design teams identify inconsistencies and
potential improvements in the naming, structure, and usage of component
variants. This information is valuable for ensuring consistency and
predictability in the design system.

## Features

- Fetches component data from a specified Figma file
- Analyzes variant properties across all components
- Provides insights on property types, possible values, and component usage
- Generates a detailed analysis report in both console output and JSON format

## Prerequisites

- A Figma account and a personal access token
- A Figma file ID that you want to analyze

## Installation

1. Clone this repository:

   ```
   git clone https://github.com/javierarce/figma-components-analyzer.git
   cd figma-components-analyzer
   ```

2. Install dependencies:

   `npm install` or `yarn`

3. Create a `.env` file in the root directory with the following content:
   ```
   FIGMA_TOKEN=your_figma_personal_access_token
   FIGMA_FILE=your_figma_file_id
   ```
   Replace `your_figma_personal_access_token` with your Figma personal access
   token and `your_figma_file_id` with the ID of the Figma file you want to
   analyze.

## Usage

Run the analysis script:

`node index.js` or `yarn start`

This will output the analysis to the console and also save it as `analysis.json` in the project directory.

## Output

The analysis provides the following information for each property:

- Property name
- Number of times the property is used
- Property type (e.g., `BOOLEAN`, `VARIANT`, `INSTANCE_SWAP`)
- Possible values for the property
- List of components that use the property

## Example Output

```
Variant property analysis

State (15)
  Type: VARIANT
  Values: Default, Hover, Pressed, Disabled
  Used in: Button, Checkbox, Radio Button

Size (12)
  Type: VARIANT
  Values: Small, Medium, Large
  Used in: Button, Input Field, Dropdown

Show icon (4)
  Type: BOOLEAN
  Used in: Button, Checkbox

...
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request.
