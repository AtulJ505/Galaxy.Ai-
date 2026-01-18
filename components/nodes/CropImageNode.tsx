"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { CropImageNodeData } from "@/lib/types";
import { useWorkflowStore } from "@/lib/store";
import { Crop, Play, Loader2 } from "lucide-react";

function CropImageNode({ id, data }: NodeProps<CropImageNodeData>) {
  const { updateNode, nodes, edges } = useWorkflowStore();
  const [running, setRunning] = useState(false);

  const hasImageUrlConnection = edges.some(
    (e) => e.target === id && e.targetHandle === "image_url"
  );
  const hasXConnection = edges.some(
    (e) => e.target === id && e.targetHandle === "x_percent"
  );
  const hasYConnection = edges.some(
    (e) => e.target === id && e.targetHandle === "y_percent"
  );
  const hasWidthConnection = edges.some(
    (e) => e.target === id && e.targetHandle === "width_percent"
  );
  const hasHeightConnection = edges.some(
    (e) => e.target === id && e.targetHandle === "height_percent"
  );
  const connected = {
    imageUrl: hasImageUrlConnection,
    xPercent: hasXConnection,
    yPercent: hasYConnection,
    widthPercent: hasWidthConnection,
    heightPercent: hasHeightConnection,
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
        return parseFloat(sourceNode.data.text) || 0;
      }
      if (sourceNode.data.nodeType === "uploadImage") {
        return sourceNode.data.imageUrl;
      }
      return null;
    },
    [edges, nodes, id]
  );

  const handleImageUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNode(id, { imageUrl: e.target.value });
    },
    [id, updateNode]
  );

  const handleXChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        updateNode(id, { xPercent: undefined });
        return;
      }
      const value = parseFloat(raw);
      if (isNaN(value)) return;
      updateNode(id, { xPercent: Math.max(0, Math.min(100, value)) });
    },
    [id, updateNode]
  );

  const handleYChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        updateNode(id, { yPercent: undefined });
        return;
      }
      const value = parseFloat(raw);
      if (isNaN(value)) return;
      updateNode(id, { yPercent: Math.max(0, Math.min(100, value)) });
    },
    [id, updateNode]
  );

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        updateNode(id, { widthPercent: undefined });
        return;
      }
      const value = parseFloat(raw);
      if (isNaN(value)) return;
      updateNode(id, { widthPercent: Math.max(0, Math.min(100, value)) });
    },
    [id, updateNode]
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        updateNode(id, { heightPercent: undefined });
        return;
      }
      const value = parseFloat(raw);
      if (isNaN(value)) return;
      updateNode(id, { heightPercent: Math.max(0, Math.min(100, value)) });
    },
    [id, updateNode]
  );

  const handleRun = useCallback(async () => {
    setRunning(true);
    updateNode(id, { running: true });

    try {
      const imageUrl = connected.imageUrl ? getInputValue("image_url") : data.imageUrl;
      if (!imageUrl) throw new Error("Image URL is required");

      const xPercent = connected.xPercent ? (getInputValue("x_percent") ?? 0) : (data.xPercent ?? 0);
      const yPercent = connected.yPercent ? (getInputValue("y_percent") ?? 0) : (data.yPercent ?? 0);
      const widthPercent = connected.widthPercent ? (getInputValue("width_percent") ?? 100) : (data.widthPercent ?? 100);
      const heightPercent = connected.heightPercent ? (getInputValue("height_percent") ?? 100) : (data.heightPercent ?? 100);

      const resp = await fetch("/api/execute/crop-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: String(imageUrl),
          xPercent: Number(xPercent),
          yPercent: Number(yPercent),
          widthPercent: Number(widthPercent),
          heightPercent: Number(heightPercent),
        }),
      });
      const result = await resp.json();
      if (resp.ok && result?.success && result?.outputUrl) {
        updateNode(id, { outputUrl: result.outputUrl, running: false });
      } else {
        const srcUrl = String(imageUrl);
        const proxied =
          /^https?:\/\//.test(srcUrl) && !srcUrl.startsWith(window.location.origin)
            ? `/api/proxy/image?url=${encodeURIComponent(srcUrl)}`
            : srcUrl;
        const img = new Image();
        const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = proxied;
        });
        const iw = loaded.naturalWidth || loaded.width;
        const ih = loaded.naturalHeight || loaded.height;
        const sx = Math.max(0, Math.min(iw, Math.round((Number(xPercent) / 100) * iw)));
        const sy = Math.max(0, Math.min(ih, Math.round((Number(yPercent) / 100) * ih)));
        const sw = Math.max(1, Math.min(iw - sx, Math.round((Number(widthPercent) / 100) * iw)));
        const sh = Math.max(1, Math.min(ih - sy, Math.round((Number(heightPercent) / 100) * ih)));
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");
        ctx.drawImage(loaded, sx, sy, sw, sh, 0, 0, sw, sh);
        const outputDataUrl = canvas.toDataURL("image/png");
        updateNode(id, { outputUrl: outputDataUrl, running: false });
      }
    } catch (error: any) {
      updateNode(id, {
        outputUrl: undefined,
        running: false,
      });
      alert(`Crop failed: ${error.message}`);
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
        <Crop className="w-4 h-4" />
        Crop Image
      </div>

      <div className="space-y-3">
        <Handle
          type="target"
          position={Position.Top}
          id="image_url"
          className="w-3 h-3 bg-[#9333ea]"
        />

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Image URL</label>
          <input
            type="text"
            value={data.imageUrl || ""}
            onChange={handleImageUrlChange}
            disabled={connected.imageUrl}
            placeholder="Enter image URL..."
            className={`w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm ${
              connected.imageUrl ? "opacity-50 cursor-not-allowed" : ""
            } focus:outline-none focus:border-[#9333ea]`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Handle
              type="target"
              position={Position.Left}
              id="x_percent"
              className="w-3 h-3 bg-[#9333ea]"
            />
            <label className="text-xs text-gray-400 mb-1 block">X (%)</label>
            <input
              type="number"
              value={data.xPercent ?? ""}
              onChange={handleXChange}
              disabled={connected.xPercent}
              min={0}
              max={100}
              className={`w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm ${
                connected.xPercent ? "opacity-50 cursor-not-allowed" : ""
              } focus:outline-none focus:border-[#9333ea]`}
            />
          </div>

          <div>
            <Handle
              type="target"
              position={Position.Left}
              id="y_percent"
              className="w-3 h-3 bg-[#9333ea]"
            />
            <label className="text-xs text-gray-400 mb-1 block">Y (%)</label>
            <input
              type="number"
              value={data.yPercent ?? ""}
              onChange={handleYChange}
              disabled={connected.yPercent}
              min={0}
              max={100}
              className={`w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm ${
                connected.yPercent ? "opacity-50 cursor-not-allowed" : ""
              } focus:outline-none focus:border-[#9333ea]`}
            />
          </div>

          <div>
            <Handle
              type="target"
              position={Position.Left}
              id="width_percent"
              className="w-3 h-3 bg-[#9333ea]"
            />
            <label className="text-xs text-gray-400 mb-1 block">Width (%)</label>
            <input
              type="number"
              value={data.widthPercent ?? ""}
              onChange={handleWidthChange}
              disabled={connected.widthPercent}
              min={0}
              max={100}
              className={`w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm ${
                connected.widthPercent ? "opacity-50 cursor-not-allowed" : ""
              } focus:outline-none focus:border-[#9333ea]`}
            />
          </div>

          <div>
            <Handle
              type="target"
              position={Position.Left}
              id="height_percent"
              className="w-3 h-3 bg-[#9333ea]"
            />
            <label className="text-xs text-gray-400 mb-1 block">Height (%)</label>
            <input
              type="number"
              value={data.heightPercent ?? ""}
              onChange={handleHeightChange}
              disabled={connected.heightPercent}
              min={0}
              max={100}
              className={`w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white text-sm ${
                connected.heightPercent ? "opacity-50 cursor-not-allowed" : ""
              } focus:outline-none focus:border-[#9333ea]`}
            />
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={
            isRunning || (!connected.imageUrl && !data.imageUrl)
          }
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
              Crop
            </>
          )}
        </button>

        {data.outputUrl && (
          <div className="mt-3 p-3 bg-[#0a0a0a] border border-[#333] rounded">
            <div className="text-xs text-gray-400 mb-1">Cropped Image:</div>
            <img
              src={data.outputUrl}
              alt="Cropped"
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

export default memo(CropImageNode);
