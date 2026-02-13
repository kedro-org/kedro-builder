/**
 * Re-export cycle detection from the domain layer.
 * The canonical implementation lives in PipelineGraph.ts.
 */
export { wouldCreateCycle } from '@/domain/PipelineGraph';
