// lib/inventory.js
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { program } from './index.js';
import { getContainersInfo } from './docker.js';


export function generateInventoryContent(containers) {
  const inventoryStructure = {
    all: {
      hosts: {}
    }
  };

  containers.forEach((container) => {
    const name = container.Name.replace(/^\//, '');
    const networks = container.NetworkSettings.Networks;
    const networkKeys = Object.keys(networks);

    if (networkKeys.length === 0) {
      console.log(chalk.yellow(`Skipping container ${name} - no networks found`));
      return;
    }

    const ip = networks[networkKeys[0]].IPAddress;
    if (!ip) {
      console.log(chalk.yellow(`Skipping container ${name} - no IP address found`));
      return;
    }

    inventoryStructure.all.hosts[name] = {
      ansible_host: ip
    };
  });

  return yaml.dump(inventoryStructure, { lineWidth: -1 });
}

export async function writeInventory(content) {
  try {
    await fs.promises.writeFile(program.opts().file, content); // Use options from index.js
    console.log(`Inventory updated at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    throw new Error(`Failed to write inventory: ${err.message}`);
  }
}

export async function updateInventory() {
  try {
    const containers = await getContainersInfo();
    const inventoryContent = generateInventoryContent(containers);
    await writeInventory(inventoryContent);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}