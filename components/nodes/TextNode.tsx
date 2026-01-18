"use client";

import { memo, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { TextNodeData } from "@/lib/types";
import { useWorkflowStore } from "@/lib/store";

function TextNode({ id, data }: NodeProps<TextNodeData>) {
  const { updateNode } = useWorkflowStore();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNode(id, { text: e.target.value });
    },
    [id, updateNode]
  );

  const isConnected = data.connected;

  return (
    <div className="bg-[#1a1a1a] border-2 border-[#333] rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="text-white font-semibold mb-2 text-sm">Text Node</div>
      <textarea
        value={data.text || ""}
        onChange={handleChange}
        disabled={isConnected}
        placeholder="Enter text..."
        className={`w-full h-24 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm resize-none ${
          isConnected ? "opacity-50 cursor-not-allowed" : ""
        } focus:outline-none focus:border-[#9333ea]`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3 h-3 bg-[#9333ea]"
      />
    </div>
  );
}

export default memo(TextNode);
