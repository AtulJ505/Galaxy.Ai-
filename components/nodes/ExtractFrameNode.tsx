"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ExtractFrameNodeData } from "@/lib/types";
import { useWorkflowStore } from "@/lib/store";
import { Film, Play, Loader2 } from "lucide-react";

function ExtractFrameNode({ id, data }: NodeProps<ExtractFrameNodeData>) {
  const { updateNode, nodes, edges } = useWorkflowStore();
  const [running, setRunning] = useState(false);

  const connected = {
    videoUrl: edges.some((e) => e.target === id && e.targetHandle === "video_url"),
    timestamp: edges.some((e) => e.target === id && e.targetHandle === "timestamp"),
  };

  const getInputValue = useCallback(
    (handleId: string) => {
      const edge = edges.find(
        (e) => e.target === id && e.targetHandle === handleId
      );
      if (!edge) return null;

      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return null;

      if (sourceNode.data.nodeType === "text") {
        return sourceNode.data.text;
      }
      if (sourceNode.data.nodeType === "uploadVideo") {
        return sourceNode.data.videoUrl;
      }
      return null;
    },
    [edges, nodes, id]
  );

  const handleVideoUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNode(id, { videoUrl: e.target.value });
    },
    [id, updateNode]
  );

  const handleTimestampChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNode(id, { timestamp: e.target.value });
    },
    [id, updateNode]
  );

  const handleRun = useCallback(async () => {
    setRunning(true);
    updateNode(id, { running: true });

    try {
      const videoUrl = connected.videoUrl ? getInputValue("video_url") : data.videoUrl;
      if (!videoUrl) throw new Error("Video URL is required");

      const tsInput = connected.timestamp ? (getInputValue("timestamp") ?? "0") : (data.timestamp ?? "0");
      const resp = await fetch("/api/execute/extract-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: String(videoUrl),
          timestamp: String(tsInput),
        }),
      });
      const result = await resp.json();
      if (!resp.ok || !result?.success) {
        throw new Error(result?.error || "Failed to extract frame");
      }
      updateNode(id, { outputUrl: result.outputUrl, running: false });
    } catch (error: any) {
      updateNode(id, {
        outputUrl: undefined,
        running: false,
      });
      alert(`Extract frame failed: ${error.message}`);
    } finally {
      setRunning(false);
    }
  }, [id, data, connected, edges, nodes, getInputValue, updateNode]);

  const isRunning = running || data.running;

  return (
    <div
      className={`bg-[#1a1a1a] border-2 ${
        isRunning ? "border-[#9333ea] node-running" : "border-[#333]"
      } rounded-lg p-4 min-w-[300px] shadow-lg`}
    >
      <div className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
        <Film className="w-4 h-4" />
        Extract Frame from Video
      </div>

      <div className="space-y-3">
        <Handle
          type="target"
          position={Position.Top}
          id="video_url"
          className="w-3 h-3 bg-[#9333ea]"
        />

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Video URL</label>
          <input
            type="text"
            value={data.videoUrl || ""}
            onChange={handleVideoUrlChange}
            disabled={connected.videoUrl}
            placeholder="Enter video URL..."
            className={`w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm ${
              connected.videoUrl ? "opacity-50 cursor-not-allowed" : ""
            } focus:outline-none focus:border-[#9333ea]`}
          />
        </div>

        <Handle
          type="target"
          position={Position.Left}
          id="timestamp"
          className="w-3 h-3 bg-[#9333ea]"
        />

        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            Timestamp (seconds or &quot;50%&quot;)
          </label>
          <input
            type="text"
            value={data.timestamp ?? ""}
            onChange={handleTimestampChange}
            disabled={connected.timestamp}
            placeholder="0 or 50%"
            className={`w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm ${
              connected.timestamp ? "opacity-50 cursor-not-allowed" : ""
            } focus:outline-none focus:border-[#9333ea]`}
          />
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning || (!data.videoUrl && !connected.videoUrl)}
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
              Extract Frame
            </>
          )}
        </button>

        {data.outputUrl && (
          <div className="mt-3 p-3 bg-[#0a0a0a] border border-[#333] rounded">
            <div className="text-xs text-gray-400 mb-1">Extracted Frame:</div>
            <img
              src={data.outputUrl}
              alt="Extracted frame"
              className="w-full rounded"
            />
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

export default memo(ExtractFrameNode);
