import { create } from "zustand";
import { Node, Edge, Viewport } from "reactflow";
import { WorkflowNode, WorkflowRun } from "./types";

interface WorkflowState {
  // Workflow data
  nodes: WorkflowNode[];
  edges: Edge[];
  viewport: Viewport;
  workflowId: string | null;
  
  // UI state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  selectedNodes: string[];
  
  // History
  runs: WorkflowRun[];
  selectedRun: WorkflowRun | null;
  
  // Actions
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (viewport: Viewport) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNode["data"]>) => void;
  deleteNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (edgeId: string) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  setWorkflowId: (id: string | null) => void;
  setRuns: (runs: WorkflowRun[]) => void;
  addRun: (run: WorkflowRun) => void;
  setSelectedRun: (run: WorkflowRun | null) => void;
  reset: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  workflowId: null,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  selectedNodes: [],
  runs: [],
  selectedRun: null,
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
  ...initialState,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setViewport: (viewport) => set({ viewport }),
  
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  
  updateNode: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    })),
  
  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    })),
  
  addEdge: (edge) =>
    set((state) => {
      // Check if edge already exists
      const exists = state.edges.some(
        (e) => e.source === edge.source && e.target === edge.target
      );
      if (exists) return state;
      return { edges: [...state.edges, edge] };
    }),
  
  deleteEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    })),
  
  toggleLeftSidebar: () =>
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  
  toggleRightSidebar: () =>
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  
  setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),
  
  setWorkflowId: (id) => set({ workflowId: id }),
  
  setRuns: (runs) => set({ runs }),
  
  addRun: (run) => set((state) => ({ runs: [run, ...state.runs] })),
  
  setSelectedRun: (run) => set({ selectedRun: run }),
  
  reset: () => set(initialState),
}));
