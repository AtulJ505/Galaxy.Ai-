"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { LLMNodeData } from "@/lib/types";
import { useWorkflowStore } from "@/lib/store";
import { Brain, Play, Loader2 } from "lucide-react";
import { useReactFlow } from "reactflow";

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

function LLMNode({ id, data }: NodeProps<LLMNodeData>) {
  const { updateNode, nodes, edges, workflowId } = useWorkflowStore();
  const { getNode } = useReactFlow();
  const [running, setRunning] = useState(false);

  // Check which handles are connected by examining edges
  const hasSystemPromptConnection = edges.some(
    (e) => e.target === id && e.targetHandle === "system_prompt"
  );
  const hasUserMessageConnection = edges.some(
    (e) => e.target === id && e.targetHandle === "user_message"
  );
  const hasImagesConnection = edges.some(
    (e) => e.target === id && e.targetHandle === "images"
  );

  const connected = {
    systemPrompt: hasSystemPromptConnection,
    userMessage: hasUserMessageConnection,
    images: hasImagesConnection,
  };

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNode(id, { model: e.target.value });
    },
    [id, updateNode]
  );

  const handleSystemPromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNode(id, { systemPrompt: e.target.value });
    },
    [id, updateNode]
  );

  const handleUserMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNode(id, { userMessage: e.target.value });
    },
    [id, updateNode]
  );

  const getInputValue = useCallback(
    (handleId: string) => {
      const edge = edges.find(
        (e) => e.target === id && e.targetHandle === handleId
      );
      if (!edge) return null;

      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return null;

      // Extract value from source node based on node type
      if (sourceNode.data.nodeType === "text") {
        return sourceNode.data.text;
      }
      if (sourceNode.data.nodeType === "uploadImage") {
        return sourceNode.data.imageUrl;
      }
      if (sourceNode.data.nodeType === "cropImage") {
        return sourceNode.data.outputUrl;
      }
      return null;
    },
    [edges, nodes, id]
  );

  const handleRun = useCallback(async () => {
    setRunning(true);
    updateNode(id, { running: true });

    try {
      // Collect inputs from connected nodes
      const systemPrompt = connected.systemPrompt
        ? getInputValue("system_prompt")
        : data.systemPrompt || "";
      const userMessage = connected.userMessage
        ? getInputValue("user_message")
        : data.userMessage || "";

      // Collect images from multiple connected nodes
      const imageEdges = edges.filter(
        (e) => e.target === id && e.targetHandle === "images"
      );
      const images: string[] = [];
      for (const edge of imageEdges) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          if (sourceNode.data.nodeType === "uploadImage") {
            if (sourceNode.data.imageUrl) images.push(sourceNode.data.imageUrl);
          }
          if (sourceNode.data.nodeType === "cropImage") {
            if (sourceNode.data.outputUrl) images.push(sourceNode.data.outputUrl);
          }
          if (sourceNode.data.nodeType === "extractFrame") {
            if (sourceNode.data.outputUrl) images.push(sourceNode.data.outputUrl);
          }
        }
      }

      // Call Trigger.dev task via API
      const response = await fetch("/api/execute/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: data.model || "gemini-1.5-flash",
          systemPrompt: systemPrompt || undefined,
          userMessage: userMessage,
          images: images.length > 0 ? images : undefined,
          workflowId: workflowId || undefined,
          nodeId: id,
        }),
      });

      const result = await response.json();
      if (result.success && result.output) {
        updateNode(id, {
          response: result.output,
          running: false,
        });
      } else {
        throw new Error(result.error || "Execution failed");
      }
    } catch (error: any) {
      updateNode(id, {
        response: `Error: ${error.message}`,
        running: false,
      });
    } finally {
      setRunning(false);
    }
  }, [id, data, connected, edges, nodes, getInputValue, updateNode, workflowId]);

  const isRunning = running || data.running;

  return (
    <div
      className={`bg-[#1a1a1a] border-2 ${
        isRunning ? "border-[#9333ea] node-running" : "border-[#333]"
      } rounded-lg p-4 min-w-[350px] shadow-lg`}
    >
      <div className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
        <Brain className="w-4 h-4" />
        Run Any LLM
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Model</label>
          <select
            value={data.model || "gemini-1.5-flash"}
            onChange={handleModelChange}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#9333ea]"
          >
            {GEMINI_MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <Handle
          type="target"
          position={Position.Top}
          id="system_prompt"
          className="w-3 h-3 bg-[#9333ea]"
        />

        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            System Prompt (Optional)
            {connected.systemPrompt && <span className="text-green-400 ml-1">● Connected</span>}
          </label>
          <textarea
            value={data.systemPrompt || ""}
            onChange={handleSystemPromptChange}
            disabled={connected.systemPrompt}
            placeholder="Optional system prompt..."
            className={`w-full h-20 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm resize-none ${
              connected.systemPrompt ? "opacity-50 cursor-not-allowed" : ""
            } focus:outline-none focus:border-[#9333ea]`}
          />
        </div>

        <Handle
          type="target"
          position={Position.Left}
          id="user_message"
          className="w-3 h-3 bg-[#9333ea]"
          style={{ top: 140 }}
        />

        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            User Message (Required)
            {connected.userMessage && <span className="text-green-400 ml-1">● Connected</span>}
          </label>
          <textarea
            value={data.userMessage || ""}
            onChange={handleUserMessageChange}
            disabled={connected.userMessage}
            placeholder="Enter user message..."
            className={`w-full h-24 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm resize-none ${
              connected.userMessage ? "opacity-50 cursor-not-allowed" : ""
            } focus:outline-none focus:border-[#9333ea]`}
          />
        </div>

        <Handle
          type="target"
          position={Position.Left}
          id="images"
          className="w-3 h-3 bg-[#9333ea]"
          style={{ top: 200 }}
        />

        {connected.images && (
          <div className="text-xs text-green-400">● Images Connected</div>
        )}

        <button
          onClick={handleRun}
          disabled={isRunning || (!data.userMessage && !connected.userMessage)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#9333ea] hover:bg-[#a855f7] disabled:bg-[#555] disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run
            </>
          )}
        </button>

        {data.response && (
          <div className="mt-3 p-3 bg-[#0a0a0a] border border-[#333] rounded">
            <div className="text-xs text-gray-400 mb-1">Response:</div>
            <div className="text-white text-sm whitespace-pre-wrap">
              {data.response}
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3 h-3 bg-[#9333ea]"
      />
    </div>
  );
}

export default memo(LLMNode);
