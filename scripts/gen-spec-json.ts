import yaml from 'yaml';
import fs from 'fs';
import path from 'path';

export const genSpecJson = () => {
  const yamlPath = path.resolve(__dirname, '../openapi.yaml');
  const fileContent = fs.readFileSync(yamlPath, 'utf8');
  const parsedYaml = yaml.parse(fileContent);
  const jsonPath = path.resolve(__dirname, '../openapi.json');
  fs.writeFileSync(jsonPath, JSON.stringify(parsedYaml), 'utf8');
};

if (import.meta.main) {
  genSpecJson();
}
