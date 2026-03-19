import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { DatasetNode } from './DatasetNode';
import type { RootState } from '@/store';

// Mock @xyflow/react
vi.mock('@xyflow/react', () => ({
  Handle: ({ id }: { id: string }) => <div data-testid={`handle-${id}`} />,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

// Mock lucide-react icons to simple spans so we can test without SVG complexity
vi.mock('lucide-react', () => {
  const Icon = ({ size, ...props }: { size?: number; [key: string]: unknown }) => (
    <span data-testid="dataset-icon" data-size={size} {...props} />
  );
  return {
    Database: Icon,
    FileSpreadsheet: Icon,
    Sheet: Icon,
    Braces: Icon,
    FileCode: Icon,
    Archive: Icon,
    FileText: Icon,
    Feather: Icon,
    Image: Icon,
    Video: Icon,
    Cpu: Icon,
    Globe: Icon,
    LineChart: Icon,
    BarChart3: Icon,
    Map: Icon,
  };
});

/** Minimal ReactFlow NodeProps shape */
const makeProps = (overrides: Record<string, unknown> = {}) => ({
  id: 'ds-1',
  type: 'dataset',
  data: {
    id: 'ds-1',
    name: 'raw_companies',
    type: 'csv',
    filepath: 'data/01_raw/companies.csv',
    layer: '01_raw',
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

const cleanState: Partial<RootState> = {
  validation: { errors: [], warnings: [], isValid: true, lastChecked: null },
};

describe('DatasetNode', () => {
  it('renders dataset name and extension label', () => {
    renderWithProviders(<DatasetNode {...makeProps()} />, {
      preloadedState: cleanState,
    });

    expect(screen.getByText('raw_companies')).toBeInTheDocument();
    expect(screen.getByText('csv')).toBeInTheDocument(); // extension label
  });

  it('shows "Unnamed Dataset" when name is empty', () => {
    renderWithProviders(<DatasetNode {...makeProps({ name: '' })} />, {
      preloadedState: cleanState,
    });

    expect(screen.getByText('Unnamed Dataset')).toBeInTheDocument();
  });

  it('applies error class when validation has errors for this dataset', () => {
    const stateWithError: Partial<RootState> = {
      validation: {
        errors: [
          {
            id: 'err-1',
            code: 'missing-config' as const,
            severity: 'error' as const,
            componentId: 'ds-1',
            componentType: 'dataset' as const,
            message: 'Missing filepath',
          },
        ],
        warnings: [],
        isValid: false,
        lastChecked: Date.now(),
      },
    };

    const { container } = renderWithProviders(
      <DatasetNode {...makeProps()} />,
      { preloadedState: stateWithError }
    );

    const nodeDiv = container.querySelector('.dataset-node');
    expect(nodeDiv).toHaveClass('dataset-node--error');
  });
});
