"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { UploadImageNodeData } from "@/lib/types";
import { useWorkflowStore } from "@/lib/store";
import { Image as ImageIcon, Upload } from "lucide-react";
import Image from "next/image";

function UploadImageNode({ id, data }: NodeProps<UploadImageNodeData>) {
  const { updateNode } = useWorkflowStore();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        alert("Invalid file type. Please upload jpg, jpeg, png, webp, or gif");
        return;
      }

      setUploading(true);
      try {
        // Convert file to base64 for upload
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;

          // Upload to Transloadit via API
          const response = await fetch("/api/transloadit/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: base64Data,
              fileType: "image",
            }),
          });

          const result = await response.json();
          if (result.url) {
            updateNode(id, {
              imageUrl: result.url,
              fileName: file.name,
            });
          } else {
            throw new Error("Upload failed");
          }
        };
        reader.readAsDataURL(file);
      } catch (error: any) {
        alert(`Upload failed: ${error.message}`);
      } finally {
        setUploading(false);
      }
    },
    [id, updateNode]
  );

  const isConnected = data.connected;

  return (
    <div className="bg-[#1a1a1a] border-2 border-[#333] rounded-lg p-4 min-w-[250px] shadow-lg">
      <div className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        Upload Image
      </div>
      
      {data.imageUrl ? (
        <div className="space-y-2">
          <div className="relative w-full h-32 bg-[#0a0a0a] rounded border border-[#333] overflow-hidden">
            <Image
              src={data.imageUrl}
              alt={data.fileName || "Uploaded image"}
              fill
              className="object-contain"
            />
          </div>
          {data.fileName && (
            <div className="text-xs text-gray-400 truncate">{data.fileName}</div>
          )}
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#333] rounded-lg cursor-pointer hover:border-[#9333ea] transition-colors ${
            uploading || isConnected ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            disabled={uploading || isConnected}
            className="hidden"
          />
          <Upload className="w-6 h-6 text-gray-400 mb-2" />
          <span className="text-xs text-gray-400">
            {uploading ? "Uploading..." : "Click to upload"}
          </span>
        </label>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3 h-3 bg-[#9333ea]"
      />
    </div>
  );
}

export default memo(UploadImageNode);
