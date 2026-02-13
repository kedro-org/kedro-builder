import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { CustomNode } from './CustomNode';
import type { RootState } from '@/types/redux';

// Mock @xyflow/react -- we're testing our rendering logic, not ReactFlow internals
vi.mock('@xyflow/react', () => ({
  Handle: ({ id }: { id: string }) => <div data-testid={`handle-${id}`} />,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

/** Minimal ReactFlow NodeProps shape that CustomNode consumes */
const makeProps = (overrides: Record<string, unknown> = {}) => ({
  id: 'node-1',
  type: 'custom',
  data: {
    id: 'node-1',
    name: 'clean_data',
    type: 'data_processing',
    inputs: [],
    outputs: [],
    position: { x: 0, y: 0 },
    ...overrides,
  },
  selected: false,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  zIndex: 0,
  dragging: false,
  dragHandle: undefined,
  parentId: undefined,
  deletable: true,
  selectable: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

/** Default Redux state with no validation errors */
const cleanState: Partial<RootState> = {
  validation: { errors: [], warnings: [], isValid: true, lastChecked: null },
};

describe('CustomNode', () => {
  it('renders the node name', () => {
    renderWithProviders(<CustomNode {...makeProps()} />, {
      preloadedState: cleanState,
    });

    expect(screen.getByText('clean_data')).toBeInTheDocument();
  });

  it('shows "Unnamed Node" when name is empty', () => {
    renderWithProviders(<CustomNode {...makeProps({ name: '' })} />, {
      preloadedState: cleanState,
    });

    expect(screen.getByText('Unnamed Node')).toBeInTheDocument();
  });

  it('applies error class when validation has errors for this node', () => {
    const stateWithError: Partial<RootState> = {
      validation: {
        errors: [
          {
            id: 'err-1',
            severity: 'error' as const,
            componentId: 'node-1',
            componentType: 'node' as const,
            message: 'Empty name',
          },
        ],
        warnings: [],
        isValid: false,
        lastChecked: Date.now(),
      },
    };

    const { container } = renderWithProviders(
      <CustomNode {...makeProps()} />,
      { preloadedState: stateWithError }
    );

    const nodeDiv = container.querySelector('.custom-node');
    expect(nodeDiv).toHaveClass('custom-node--error');
  });
});
