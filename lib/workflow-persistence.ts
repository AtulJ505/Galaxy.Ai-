import { Node, Edge, Viewport } from "reactflow";
import { WorkflowData } from "./types";

/**
 * Exports workflow to JSON format
 */
export function exportWorkflowToJSON(
  nodes: Node[],
  edges: Edge[],
  viewport?: Viewport,
  name?: string
): string {
  const workflow: WorkflowData & { name?: string } = {
    nodes,
    edges,
    viewport: viewport || { x: 0, y: 0, zoom: 1 },
    ...(name && { name }),
  };

  return JSON.stringify(workflow, null, 2);
}

/**
 * Imports workflow from JSON format
 */
export function importWorkflowFromJSON(json: string): WorkflowData {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error("Invalid workflow format: missing nodes array");
    }
    if (!parsed.edges || !Array.isArray(parsed.edges)) {
      throw new Error("Invalid workflow format: missing edges array");
    }

    const nodes: Node[] = parsed.nodes.map((n: any, idx: number) => {
      const id = typeof n.id === "string" ? n.id : "";
      const type = typeof n.type === "string" ? n.type : "";
      const position =
        n.position &&
        typeof n.position.x === "number" &&
        typeof n.position.y === "number"
          ? n.position
          : { x: 100 + idx * 20, y: 100 + idx * 20 };
      const data = typeof n.data === "object" && n.data !== null ? n.data : {};
      const nodeType = typeof data.nodeType === "string" ? data.nodeType : type;
      const label = typeof data.label === "string" ? data.label : type;
      if (!id || !type) {
        throw new Error("Invalid node: missing id or type");
      }
      return {
        id,
        type,
        position,
        data: { ...data, nodeType, label },
      } as Node;
    });

    const edges: Edge[] = parsed.edges.map((e: any, idx: number) => {
      const source = typeof e.source === "string" ? e.source : "";
      const target = typeof e.target === "string" ? e.target : "";
      if (!source || !target) {
        throw new Error(`Invalid edge at index ${idx}: missing source/target`);
      }
      const sourceHandle =
        typeof e.sourceHandle === "string" ? e.sourceHandle : undefined;
      const targetHandle =
        typeof e.targetHandle === "string" ? e.targetHandle : undefined;
      const id =
        typeof e.id === "string" && e.id.length > 0
          ? e.id
          : `${source}-${sourceHandle || "output"}-${target}-${targetHandle || "input"}-${idx}`;
      return {
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        animated: true,
        style: { stroke: "#9333ea", strokeWidth: 2 },
      } as Edge;
    });

    const viewport: Viewport =
      parsed.viewport &&
      typeof parsed.viewport.x === "number" &&
      typeof parsed.viewport.y === "number" &&
      typeof parsed.viewport.zoom === "number"
        ? parsed.viewport
        : { x: 0, y: 0, zoom: 1 };

    return { nodes, edges, viewport };
  } catch (error: any) {
    throw new Error(`Failed to parse workflow JSON: ${error.message}`);
  }
}

/**
 * Downloads workflow as JSON file
 */
export function downloadWorkflowJSON(
  nodes: Node[],
  edges: Edge[],
  viewport?: Viewport,
  filename = "workflow.json"
): void {
  const json = exportWorkflowToJSON(nodes, edges, viewport);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Loads workflow from uploaded JSON file
 */
export async function loadWorkflowFromFile(
  file: File
): Promise<WorkflowData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const workflow = importWorkflowFromJSON(json);
        resolve(workflow);
      } catch (error: any) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
