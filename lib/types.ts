import { Node, Edge, Viewport } from "reactflow";

export interface WorkflowNode extends Node {
  data: {
    label: string;
    nodeType: NodeType;
    [key: string]: any; // For node-specific data
  };
}

export type NodeType =
  | "text"
  | "uploadImage"
  | "uploadVideo"
  | "llm"
  | "cropImage"
  | "extractFrame";

export interface WorkflowData {
  nodes: WorkflowNode[];
  edges: Edge[];
  viewport?: Viewport;
}

export interface NodeTypeConfig {
  type: NodeType;
  label: string;
  icon: string;
  inputs: InputHandle[];
  outputs: OutputHandle[];
}

export interface InputHandle {
  id: string;
  label: string;
  type: HandleType;
  required?: boolean;
  defaultValue?: any;
}

export interface OutputHandle {
  id: string;
  label: string;
  type: HandleType;
}

export type HandleType = "text" | "image" | "video" | "number" | "url";

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  scope: "FULL" | "PARTIAL" | "SINGLE";
  selectedNodes?: string[];
  duration?: number;
  startedAt: Date;
  completedAt?: Date;
  nodeRuns: NodeRun[];
}

export interface NodeRun {
  id: string;
  nodeId: string;
  nodeType: NodeType;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  duration?: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface ConnectionValidation {
  isValid: boolean;
  sourceType: HandleType;
  targetType: HandleType;
  message?: string;
}

// Node-specific data types
export interface TextNodeData {
  text: string;
  connected?: boolean;
}

export interface UploadImageNodeData {
  imageUrl?: string;
  fileName?: string;
  connected?: boolean;
}

export interface UploadVideoNodeData {
  videoUrl?: string;
  fileName?: string;
  connected?: boolean;
}

export interface LLMNodeData {
  model: string;
  systemPrompt?: string;
  userMessage?: string;
  images?: string[];
  response?: string;
  running?: boolean;
  connected?: {
    systemPrompt: boolean;
    userMessage: boolean;
    images: boolean;
  };
}

export interface CropImageNodeData {
  imageUrl?: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  outputUrl?: string;
  running?: boolean;
  connected?: {
    imageUrl: boolean;
    xPercent: boolean;
    yPercent: boolean;
    widthPercent: boolean;
    heightPercent: boolean;
  };
}

export interface ExtractFrameNodeData {
  videoUrl?: string;
  timestamp: string;
  outputUrl?: string;
  running?: boolean;
  connected?: {
    videoUrl: boolean;
    timestamp: boolean;
  };
}
