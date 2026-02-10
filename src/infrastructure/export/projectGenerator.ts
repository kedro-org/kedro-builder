/**
 * Main orchestrator for generating complete Kedro project
 */

import type { RootState } from '../../types/redux';
import type { ProjectMetadata } from './staticFilesGenerator';
import { buildKedroProject } from './KedroProjectBuilder';

/**
 * Generate complete Kedro project as ZIP file
 */
export async function generateKedroProject(
  state: RootState,
  metadata: ProjectMetadata
): Promise<Blob> {
  // Keep this function as the public API and delegate to the builder
  // so there is only one project-generation implementation.
  return buildKedroProject(state, metadata);
}

/**
 * Trigger browser download of the ZIP file
 */
export function downloadProject(blob: Blob, projectName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
