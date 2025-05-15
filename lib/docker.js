import Docker from 'dockerode'

export const docker = new Docker();

export async function getContainersInfo() {
  try {
    const containers = await docker.listContainers();
    return await Promise.all(
      containers.map(async (container) => {
        const containerInstance = docker.getContainer(container.Id);
        const inspectData = await containerInstance.inspect();
        return inspectData;
      })
    );
  } catch (err) {
    throw new Error(`Failed to get container info: ${err.message}`);
  }
}