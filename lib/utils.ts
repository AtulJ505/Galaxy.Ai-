import { Node, Edge } from "reactflow";
import { HandleType, ConnectionValidation } from "./types";

export function validateConnection(
  sourceType: HandleType,
  targetType: HandleType
): ConnectionValidation {
  // Define valid connection rules
  const validConnections: Record<HandleType, HandleType[]> = {
    text: ["text", "number"], // Text can connect to text or number inputs
    image: ["image", "url"], // Image can connect to image or url inputs
    video: ["video", "url"], // Video can connect to video or url inputs
    number: ["number"], // Number can connect to number inputs
    url: ["url", "image", "video"], // URL can connect to url, image, or video inputs
  };

  const allowed = validConnections[sourceType]?.includes(targetType) ?? false;

  return {
    isValid: allowed,
    sourceType,
    targetType,
    message: allowed
      ? undefined
      : `Cannot connect ${sourceType} output to ${targetType} input`,
  };
}

export function checkForCycles(
  nodes: Node[],
  edges: Edge[],
  sourceId: string,
  targetId: string
): boolean {
  // Check if adding this edge would create a cycle
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // Cycle detected
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = edges
      .filter((e) => e.source === nodeId || (e.source === nodeId && e.target !== targetId))
      .map((e) => e.target);

    // Also check if we're creating a direct cycle
    if (nodeId === targetId && sourceId === targetId) {
      return true;
    }

    // Check if target would connect back to source
    if (nodeId === targetId) {
      const targetOutgoing = edges.filter((e) => e.source === targetId).map((e) => e.target);
      if (targetOutgoing.includes(sourceId)) {
        return true;
      }
    }

    for (const neighborId of outgoingEdges) {
      if (hasCycle(neighborId)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check if adding edge from source to target creates a cycle
  if (targetId === sourceId) {
    return true;
  }

  return hasCycle(targetId);
}

export function getNodeDependencies(
  nodeId: string,
  edges: Edge[]
): string[] {
  return edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => edge.source);
}

export function getTopologicalOrder(
  nodes: Node[],
  edges: Edge[]
): string[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  // Initialize
  for (const nodeId of nodeIds) {
    inDegree.set(nodeId, 0);
    graph.set(nodeId, []);
  }

  // Build graph and calculate in-degrees
  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      const neighbors = graph.get(edge.source) || [];
      neighbors.push(edge.target);
      graph.set(edge.source, neighbors);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighborId of neighbors) {
      const newDegree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, newDegree);
      if (newDegree === 0) {
        queue.push(neighborId);
      }
    }
  }

  return result;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
