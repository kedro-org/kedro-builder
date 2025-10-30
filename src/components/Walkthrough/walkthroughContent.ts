/**
 * Walkthrough step definitions
 * Interactive tour pointing to actual UI elements
 */

export interface WalkthroughStep {
  id: number;
  title: string;
  description: string;
  target: string | null; // data-walkthrough attribute value, null for center modal
  position: 'top' | 'right' | 'bottom' | 'left' | 'center';
}

export const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 1,
    title: 'Kedro Project Structure and Best Practices',
    description:
      "This tool follows Kedro's core principles, including the product directory structure. Create a new project to get started.",
    target: 'create-project-button',
    position: 'top',
  },
  {
    id: 2,
    title: 'Add and connect nodes to build pipelines',
    description:
      'Drag and drop nodes and connect them visually to build a pipeline without worrying about syntax.',
    target: 'dataset-button',
    position: 'right',
  },
  {
    id: 3,
    title: 'View generated Kedro code',
    description:
      'See the equivalent Kedro starter code generated from your visual pipeline.',
    target: 'view-code-button',
    position: 'bottom',
  },
  {
    id: 4,
    title: 'Export your project',
    description:
      'Export the Kedro code for your pipeline and continue building your project.',
    target: 'export-button',
    position: 'bottom',
  },
];
