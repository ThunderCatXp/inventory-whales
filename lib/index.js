import { updateInventory } from './inventory.js';
import {Command} from 'commander'
import { docker } from './docker.js';

export const program = new Command();

program
  .requiredOption('-f, --file <file>', 'Path to the Ansible inventory file')
  .option('-w, --watch', 'Watch for container changes')
  .parse(process.argv);

const options = program.opts();


async function setupWatcher() {
  let debounceTimer;
  
  try {
    const eventStream = await docker.getEvents({
      filters: {
        type: ['container'],
        event: ['start', 'stop', 'die', 'create', 'destroy']
      }
    });

    eventStream.on('data', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('\nDetected container change...');
        updateInventory();
      }, 500);
    });

    eventStream.on('error', (err) => {
      console.error(`Event stream error: ${err.message}`);
      process.exit(1);
    });

    console.log('Watching for container changes...');
  } catch (err) {
    console.error(`Failed to start event stream: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  try {
    await updateInventory();
    
    if (options.watch) {
      setupWatcher();
      
      setInterval(() => {}, 1000);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main();