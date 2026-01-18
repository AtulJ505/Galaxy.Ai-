"use client";

import { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { useWorkflowStore } from "@/lib/store";
import { validateConnection, checkForCycles } from "@/lib/utils";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import TextNode from "./nodes/TextNode";
import UploadImageNode from "./nodes/UploadImageNode";
import UploadVideoNode from "./nodes/UploadVideoNode";
import LLMNode from "./nodes/LLMNode";
import CropImageNode from "./nodes/CropImageNode";
import ExtractFrameNode from "./nodes/ExtractFrameNode";

const nodeTypes = {
  text: TextNode,
  uploadImage: UploadImageNode,
  uploadVideo: UploadVideoNode,
  llm: LLMNode,
  cropImage: CropImageNode,
  extractFrame: ExtractFrameNode,
};

export default function WorkflowCanvas() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    viewport,
    setNodes,
    setEdges,
    setViewport,
    addEdge: addEdgeToStore,
  } = useWorkflowStore();

  const [nodes, setNodesState, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState(storeEdges);

  useEffect(() => {
    setNodesState(storeNodes);
  }, [storeNodes, setNodesState]);

  useEffect(() => {
    setEdgesState(storeEdges);
  }, [storeEdges, setEdgesState]);

  const onNodesChangeWrapper = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      const updated = applyNodeChanges(changes, nodes);
      setNodes(updated as any);
    },
    [onNodesChange, nodes, setNodes]
  );

  const onEdgesChangeWrapper = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      const updated = applyEdgeChanges(changes, edges);
      setEdges(updated);
    },
    [onEdgesChange, edges, setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      if (!sourceNode || !targetNode) return;

      const sourceHandleType = (() => {
        if (params.sourceHandle) {
          if (
            sourceNode.data.outputTypes &&
            sourceNode.data.outputTypes[params.sourceHandle]
          ) {
            return sourceNode.data.outputTypes[params.sourceHandle];
          }
        }
        return sourceNode.data.outputType || "text";
      })();
      const targetHandleType = (() => {
        if (params.targetHandle) {
          if (
            targetNode.data.inputTypes &&
            targetNode.data.inputTypes[params.targetHandle]
          ) {
            return targetNode.data.inputTypes[params.targetHandle];
          }
          if (targetNode.type === "llm") {
            if (params.targetHandle === "images") return "image";
            if (params.targetHandle === "system_prompt") return "text";
            if (params.targetHandle === "user_message") return "text";
          }
        }
        return targetNode.data.inputType || "text";
      })();
      const validation = validateConnection(sourceHandleType, targetHandleType);
      if (!validation.isValid) {
        alert(validation.message);
        return;
      }
      if (checkForCycles(nodes, edges, params.source!, params.target!)) {
        alert("Cannot create circular dependencies");
        return;
      }
      const newEdge = addEdge(params, edges);
      setEdgesState(newEdge);
      addEdgeToStore(newEdge[newEdge.length - 1]);
    },
    [nodes, edges, setEdgesState, addEdgeToStore]
  );

  const onMove = useCallback(
    (_: any, vp: any) => {
      setViewport(vp);
    },
    [setViewport]
  );

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex">
        <LeftSidebar />
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeWrapper}
            onEdgesChange={onEdgesChangeWrapper}
            onConnect={onConnect}
            onMove={onMove}
            nodeTypes={nodeTypes}
            fitView
            className="dot-grid bg-[#0a0a0a]"
            defaultViewport={viewport}
            connectionLineStyle={{ stroke: "#9333ea", strokeWidth: 2 }}
            defaultEdgeOptions={{
              style: { stroke: "#9333ea", strokeWidth: 2 },
              animated: true,
            }}
          >
            <Background color="#333" gap={20} size={1} />
            <Controls className="bg-[#1a1a1a] border border-[#333]" />
            <MiniMap
              className="bg-[#1a1a1a] border border-[#333]"
              nodeColor="#9333ea"
            />
          </ReactFlow>
        </div>
        <RightSidebar />
      </div>
    </ReactFlowProvider>
  );
}
