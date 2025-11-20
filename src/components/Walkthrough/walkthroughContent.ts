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
    title: 'Kedro Project Template and Best Practices',
    description:
      "This tool follows Kedro's core principles, including the product template. Create a new project to get started.",
    target: 'create-project-button',
    position: 'top',
  },
  {
    id: 2,
    title: 'Add and connect nodes to build pipelines',
    description:
      'Drag and drop nodes and connect them visually to build a pipeline without worrying about syntax.',
    target: 'component-palette-list',
    position: 'right',
  },
  {
    id: 3,
    title: 'View generated Kedro code',
    description:
      'See the equivalent <a href="https://docs.kedro.org/en/stable/tutorials/test_a_project/" target="_blank" rel="noopener noreferrer">Kedro starter code</a> generated from your visual pipeline.',
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
