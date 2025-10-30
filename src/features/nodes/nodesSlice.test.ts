/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import nodesReducer, { addNode, updateNode, deleteNode, deleteNodes, selectNode, toggleNodeSelection } from './nodesSlice';
import type { NodesState } from '../../types/redux';
import type { KedroNode } from '../../types/kedro';

describe('nodesSlice', () => {
  const initialState: NodesState = {
    byId: {},
    allIds: [],
    selected: [],
    hovered: null,
  };

  const mockNode: KedroNode = {
    id: 'node-1',
    name: 'test_node',
    type: 'data_processing',
    inputs: [],
    outputs: [],
    position: { x: 100, y: 200 },
  };

  describe('addNode', () => {
    it('should add node to empty state', () => {
      const state = nodesReducer(initialState, addNode(mockNode));

      expect(state.allIds).toHaveLength(1);
      expect(state.allIds).toContain('node-1');
      expect(state.byId['node-1']).toEqual(mockNode);
    });

    it('should add multiple nodes', () => {
      let state = nodesReducer(initialState, addNode(mockNode));
      const mockNode2 = { ...mockNode, id: 'node-2', name: 'node_2' };
      state = nodesReducer(state, addNode(mockNode2));

      expect(state.allIds).toHaveLength(2);
      expect(state.byId['node-1']).toBeDefined();
      expect(state.byId['node-2']).toBeDefined();
    });

    it('should not duplicate node IDs in allIds', () => {
      let state = nodesReducer(initialState, addNode(mockNode));
      state = nodesReducer(state, addNode(mockNode)); // Add same node again

      expect(state.allIds).toHaveLength(1);
      expect(state.allIds.filter((id) => id === 'node-1')).toHaveLength(1);
    });
  });

  describe('updateNode', () => {
    it('should update node properties', () => {
      const stateWithNode = {
        ...initialState,
        byId: { 'node-1': mockNode },
        allIds: ['node-1'],
      };

      const state = nodesReducer(
        stateWithNode,
        updateNode({ id: 'node-1', changes: { name: 'updated_name' } })
      );

      expect(state.byId['node-1'].name).toBe('updated_name');
      expect(state.byId['node-1'].type).toBe('data_processing'); // Other props unchanged
    });

    it('should handle updating non-existent node gracefully', () => {
      const state = nodesReducer(
        initialState,
        updateNode({ id: 'non-existent', changes: { name: 'test' } })
      );

      expect(state).toEqual(initialState);
    });
  });

  describe('deleteNode', () => {
    it('should remove node from state', () => {
      const stateWithNode = {
        ...initialState,
        byId: { 'node-1': mockNode },
        allIds: ['node-1'],
      };

      const state = nodesReducer(stateWithNode, deleteNode('node-1'));

      expect(state.allIds).toHaveLength(0);
      expect(state.byId['node-1']).toBeUndefined();
    });

    it('should remove node from selected array', () => {
      const stateWithNode = {
        ...initialState,
        byId: { 'node-1': mockNode },
        allIds: ['node-1'],
        selected: ['node-1'],
      };

      const state = nodesReducer(stateWithNode, deleteNode('node-1'));

      expect(state.selected).toHaveLength(0);
    });

    it('should clear hovered if deleted node was hovered', () => {
      const stateWithNode = {
        ...initialState,
        byId: { 'node-1': mockNode },
        allIds: ['node-1'],
        hovered: 'node-1',
      };

      const state = nodesReducer(stateWithNode, deleteNode('node-1'));

      expect(state.hovered).toBeNull();
    });
  });

  describe('deleteNodes', () => {
    it('should delete multiple nodes at once', () => {
      const stateWithNodes = {
        ...initialState,
        byId: {
          'node-1': mockNode,
          'node-2': { ...mockNode, id: 'node-2' },
          'node-3': { ...mockNode, id: 'node-3' },
        },
        allIds: ['node-1', 'node-2', 'node-3'],
      };

      const state = nodesReducer(stateWithNodes, deleteNodes(['node-1', 'node-3']));

      expect(state.allIds).toHaveLength(1);
      expect(state.allIds).toContain('node-2');
      expect(state.byId['node-1']).toBeUndefined();
      expect(state.byId['node-3']).toBeUndefined();
    });
  });

  describe('selectNode', () => {
    it('should select single node', () => {
      const state = nodesReducer(initialState, selectNode('node-1'));

      expect(state.selected).toEqual(['node-1']);
    });

    it('should replace previous selection', () => {
      const stateWithSelection = {
        ...initialState,
        selected: ['node-1', 'node-2'],
      };

      const state = nodesReducer(stateWithSelection, selectNode('node-3'));

      expect(state.selected).toEqual(['node-3']);
    });
  });

  describe('toggleNodeSelection', () => {
    it('should add node to selection if not selected', () => {
      const state = nodesReducer(initialState, toggleNodeSelection('node-1'));

      expect(state.selected).toContain('node-1');
    });

    it('should remove node from selection if already selected', () => {
      const stateWithSelection = {
        ...initialState,
        selected: ['node-1', 'node-2'],
      };

      const state = nodesReducer(stateWithSelection, toggleNodeSelection('node-1'));

      expect(state.selected).not.toContain('node-1');
      expect(state.selected).toContain('node-2');
    });

    it('should support multi-select', () => {
      let state = nodesReducer(initialState, toggleNodeSelection('node-1'));
      state = nodesReducer(state, toggleNodeSelection('node-2'));
      state = nodesReducer(state, toggleNodeSelection('node-3'));

      expect(state.selected).toHaveLength(3);
    });
  });

});

