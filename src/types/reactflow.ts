/**
 * ReactFlow custom type definitions
 */

import type { Node, Edge } from '@xyflow/react';
import type { KedroNode, KedroConnection } from './kedro';

export type CustomNodeData = KedroNode;

export type CustomNode = Node<CustomNodeData>;

export type CustomEdgeData = KedroConnection;

export type CustomEdge = Edge<CustomEdgeData>;
