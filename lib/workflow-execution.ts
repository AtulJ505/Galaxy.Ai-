import { Node, Edge } from "reactflow";
import { getTopologicalOrder, getNodeDependencies } from "./utils";

export interface ExecutionContext {
  nodeId: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
}

export interface ExecutionPlan {
  nodes: string[];
  dependencies: Map<string, string[]>;
  executionOrder: string[];
}

/**
 * Creates an execution plan for a workflow based on selected nodes
 */
export function createExecutionPlan(
  allNodes: Node[],
  allEdges: Edge[],
  selectedNodeIds?: string[]
): ExecutionPlan {
  // If no selection, execute all nodes
  const nodesToExecute = selectedNodeIds || allNodes.map((n) => n.id);
  const nodeSet = new Set(nodesToExecute);

  // Filter edges to only those connecting selected nodes
  const relevantEdges = allEdges.filter(
    (e) => nodeSet.has(e.source) && nodeSet.has(e.target)
  );

  // Build dependency map
  const dependencies = new Map<string, string[]>();
  for (const nodeId of nodesToExecute) {
    const deps = getNodeDependencies(nodeId, relevantEdges);
    dependencies.set(nodeId, deps.filter((d) => nodeSet.has(d)));
  }

  // Get topological order for execution
  const filteredNodes = allNodes.filter((n) => nodeSet.has(n.id));
  const executionOrder = getTopologicalOrder(filteredNodes, relevantEdges);

  return {
    nodes: nodesToExecute,
    dependencies,
    executionOrder,
  };
}

/**
 * Collects input values for a node from its connected sources
 */
export function collectNodeInputs(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  nodeOutputs?: Map<string, Record<string, any>>
): Record<string, any> {
  const inputs: Record<string, any> = {};
  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode) return inputs;

  // Get all edges targeting this node
  const incomingEdges = edges.filter((e) => e.target === nodeId);

  for (const edge of incomingEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) continue;

    const targetHandle = edge.targetHandle || "input";
    let value: any = null;

    // Extract value from source node based on node type
    switch (sourceNode.data.nodeType) {
      case "text":
        value = nodeOutputs?.get(sourceNode.id)?.output ?? sourceNode.data.text ?? "";
        break;
      case "uploadImage":
        value = nodeOutputs?.get(sourceNode.id)?.outputUrl ?? sourceNode.data.imageUrl ?? "";
        break;
      case "uploadVideo":
        value = nodeOutputs?.get(sourceNode.id)?.outputUrl ?? sourceNode.data.videoUrl ?? "";
        break;
      case "llm":
        value = nodeOutputs?.get(sourceNode.id)?.output ?? sourceNode.data.response ?? "";
        break;
      case "cropImage":
        value = nodeOutputs?.get(sourceNode.id)?.outputUrl ?? sourceNode.data.outputUrl ?? "";
        break;
      case "extractFrame":
        value = nodeOutputs?.get(sourceNode.id)?.outputUrl ?? sourceNode.data.outputUrl ?? "";
        break;
      default:
        value = nodeOutputs?.get(sourceNode.id)?.output ?? sourceNode.data.output ?? sourceNode.data;
    }

    // Handle multiple inputs of the same type (e.g., multiple images)
    if (inputs[targetHandle]) {
      if (Array.isArray(inputs[targetHandle])) {
        inputs[targetHandle].push(value);
      } else {
        inputs[targetHandle] = [inputs[targetHandle], value];
      }
    } else {
      inputs[targetHandle] = value;
    }
  }

  return inputs;
}

/**
 * Determines if a node is ready to execute (all dependencies satisfied)
 */
export function isNodeReady(
  nodeId: string,
  dependencies: string[],
  completedNodes: Set<string>
): boolean {
  if (dependencies.length === 0) return true;
  return dependencies.every((dep) => completedNodes.has(dep));
}
