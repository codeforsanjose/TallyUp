import type { Element } from '../types';
import { renderElement } from './render-element';

export const boilerplate = (entry: Element): string => /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tally Up</title>
  <script src="https://unpkg.com/htmx.org@2.0.4" integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+" crossorigin="anonymous" defer></script>
  <script src="main.js" type="module" defer></script>
</head>
<body>
  ${renderElement(entry)}
</body>
</html>
`;
