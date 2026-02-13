/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import connectionsReducer, {
  addConnection,
  deleteConnection,
  clearConnections,
} from './connectionsSlice';
import type { ConnectionsState } from '../../types/redux';
import type { KedroConnection } from '../../types/kedro';

describe('connectionsSlice', () => {
  const initialState: ConnectionsState = {
    byId: {},
    allIds: [],
    selected: [],
  };

  const mockConnection: KedroConnection = {
    id: 'conn-1',
    source: 'node-1',
    target: 'node-2',
    sourceHandle: 'output-0',
    targetHandle: 'input-0',
  };

  it('should add connection and not duplicate IDs on re-add', () => {
    let state = connectionsReducer(initialState, addConnection(mockConnection));
    expect(state.allIds).toHaveLength(1);
    expect(state.byId['conn-1']).toEqual(mockConnection);

    // Re-adding same ID must not duplicate in allIds
    state = connectionsReducer(state, addConnection(mockConnection));
    expect(state.allIds).toHaveLength(1);
  });

  it('should remove connection from byId, allIds, AND selected on delete', () => {
    const stateWithSelected: ConnectionsState = {
      byId: { 'conn-1': mockConnection },
      allIds: ['conn-1'],
      selected: ['conn-1'],
    };

    const state = connectionsReducer(stateWithSelected, deleteConnection('conn-1'));

    expect(state.byId['conn-1']).toBeUndefined();
    expect(state.allIds).toHaveLength(0);
    expect(state.selected).toHaveLength(0);
  });

  it('should clear all connections', () => {
    const populated: ConnectionsState = {
      byId: { 'conn-1': mockConnection },
      allIds: ['conn-1'],
      selected: ['conn-1'],
    };

    const state = connectionsReducer(populated, clearConnections());

    expect(state.byId).toEqual({});
    expect(state.allIds).toEqual([]);
    expect(state.selected).toEqual([]);
  });
});
