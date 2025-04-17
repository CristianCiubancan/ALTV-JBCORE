import fs from 'fs';
import { PLUGIN_IMPORTS } from '../src/config/plugins'; // Ensure the import path is correct
import path from 'path';
import { execSync } from 'child_process';

// Define paths
const PLUGINS_DIR = path.join(process.cwd(), 'src', 'altv', 'plugins');
const CONFIG_PLUGINS_PATH = path.join(
  process.cwd(),
  'src',
  'config',
  'plugins.ts'
);
const PAGES_INDEX_PATH = path.join(
  process.cwd(),
  'src',
  'pages',
  'index.astro'
);

// Interface for webview information
interface WebviewInfo {
  pluginName: string;
  webviewName: string;
  webviewPath: string;
  importPath: string;
}

/**
 * Scans the plugins directory to find all webviews
 * @returns Array of webview information
 */
function scanPluginsForWebviews(): WebviewInfo[] {
  const webviews: WebviewInfo[] = [];

  // Check if plugins directory exists
  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`Plugins directory not found: ${PLUGINS_DIR}`);
    return webviews;
  }

  // Get all plugin directories
  const pluginDirs = fs
    .readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // Scan each plugin directory for webviews
  for (const pluginDir of pluginDirs) {
    // For testing purposes, we'll include example plugins that start with '['
    // In production, you might want to skip these with: if (pluginDir.startsWith('[')) continue;

    const pluginPath = path.join(PLUGINS_DIR, pluginDir);
    const pluginNameClean = pluginDir.replace(/[\[\]]/g, ''); // Remove brackets for clean naming
    const webviewsInPlugin = findWebviewsInPlugin(pluginPath, pluginNameClean);
    webviews.push(...webviewsInPlugin);
  }

  return webviews;
}

/**
 * Finds all webviews in a specific plugin directory
 * @param pluginPath Path to the plugin directory
 * @param pluginName Name of the plugin
 * @returns Array of webview information for this plugin
 */
function findWebviewsInPlugin(
  pluginPath: string,
  pluginName: string
): WebviewInfo[] {
  const webviews: WebviewInfo[] = [];

  // Check if the plugin has a webview directory
  const webviewDirs = findWebviewDirectories(pluginPath);

  for (const webviewDir of webviewDirs) {
    // Get the parent directory name to make the webview name more specific
    const parentDir = path.basename(path.dirname(webviewDir));
    const webviewName =
      parentDir !== pluginName ? `${parentDir}Webview` : 'webview';
    const indexPath = path.join(webviewDir, 'index.astro');

    // Check if index.astro exists
    if (fs.existsSync(indexPath)) {
      // Calculate the import path relative to src/pages/index.astro
      const relativePath = path
        .relative(path.dirname(PAGES_INDEX_PATH), indexPath)
        .replace(/\\/g, '/');

      webviews.push({
        pluginName,
        webviewName,
        webviewPath: indexPath,
        importPath: relativePath,
      });
    }
  }

  return webviews;
}

/**
 * Recursively finds all directories named 'webview' in a plugin
 * @param dir Directory to search in
 * @returns Array of paths to webview directories
 */
function findWebviewDirectories(dir: string): string[] {
  const results: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'webview') {
        results.push(fullPath);
      } else {
        // Recursively search subdirectories
        results.push(...findWebviewDirectories(fullPath));
      }
    }
  }

  return results;
}

/**
 * Generates the plugins.ts file with the discovered webviews
 * @param webviews Array of webview information
 */
function generatePluginsFile(webviews: WebviewInfo[]): void {
  // Create the PLUGIN_IMPORTS object
  const imports: Record<string, string> = {};

  for (const webview of webviews) {
    const key = `${capitalizeFirstLetter(
      webview.pluginName
    )}${capitalizeFirstLetter(webview.webviewName)}`;
    // Use alias for altv plugins
    const aliasPath = webview.importPath.replace(/^\.\.\/altv/, '@altv');
    imports[key] = aliasPath;
  }

  // Generate the file content
  const fileContent = `//@ts-nocheck
// THIS FILE IS AUTOMATICALLY GENERATED. DO NOT MODIFY CONTENTS

export const PLUGIN_IMPORTS = ${JSON.stringify(imports, null, 2)};
`;

  // Write to the file
  fs.writeFileSync(CONFIG_PLUGINS_PATH, fileContent);
  console.log(`Generated plugins file: ${CONFIG_PLUGINS_PATH}`);
}

/**
 * Generates the src/pages/index.astro file with imports for all webviews
 * @param webviews Array of webview information
 */
function generatePagesIndexFile(webviews: WebviewInfo[]): void {
  // Generate import statements
  const imports = webviews
    .map((webview) => {
      const componentName = `${capitalizeFirstLetter(
        webview.pluginName
      )}${capitalizeFirstLetter(webview.webviewName)}`;
      // Use alias for altv plugins
      const aliasPath = webview.importPath.replace(/^\.\.\/altv/, '@altv');
      return `import ${componentName} from '${aliasPath}'`;
    })
    .join('\n');

  // Generate component usage
  const components = webviews
    .map((webview) => {
      const componentName = `${capitalizeFirstLetter(
        webview.pluginName
      )}${capitalizeFirstLetter(webview.webviewName)}`;
      return `<ResourceLayout>\n  <${componentName} />\n</ResourceLayout>`;
    })
    .join('\n');

  // Generate the file content
  const fileContent = `---
import '../styles/global.css';
import ResourceLayout from '../layouts/resource-layout.astro';
// will be automatically populated
${imports}
---
<!-- will be automatically populated -->
${components}`;

  // Write to the file
  fs.writeFileSync(PAGES_INDEX_PATH, fileContent);
  console.log(`Generated pages index file: ${PAGES_INDEX_PATH}`);
}

/**
 * Capitalizes the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Runs the Astro build command
 */
function runAstroBuild(): void {
  console.log('Running Astro build...');
  try {
    execSync('astro build', { stdio: 'inherit' });
    console.log('Astro build completed successfully');
  } catch (error) {
    console.error('Error running Astro build:', error);
    process.exit(1);
  }
}

/**
 * Main function to execute the build process
 */
async function main() {
  console.log('Starting webview build process...');

  // Scan plugins for webviews
  const webviews = scanPluginsForWebviews();
  console.log(`Found ${webviews.length} webviews:`);
  webviews.forEach((webview) => {
    console.log(`- ${webview.pluginName}/${webview.webviewName}`);
  });

  // Generate plugins.ts file
  generatePluginsFile(webviews);

  // Generate pages/index.astro file
  generatePagesIndexFile(webviews);

  // Run Astro build
  runAstroBuild();

  console.log('Webview build process completed');
}

// Execute the main function
main().catch((error) => {
  console.error('Error in webview build process:', error);
  process.exit(1);
});
