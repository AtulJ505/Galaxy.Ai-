"use client";

import { useWorkflowStore } from "@/lib/store";
import { Plus, FileText, Image, Video, Brain, Crop, Film } from "lucide-react";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Node } from "reactflow";
import { WorkflowNode } from "@/lib/types";

export default function LeftSidebar() {
  const { leftSidebarOpen, toggleLeftSidebar, addNode, nodes } = useWorkflowStore();

  const createNode = useCallback(
    (type: string, label: string, data: any) => {
      const newNode: WorkflowNode = {
        id: uuidv4(),
        type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          label,
          nodeType: type,
          ...data,
        },
      };
      addNode(newNode);
    },
    [addNode]
  );

  const nodeButtons = [
    {
      type: "text",
      label: "Text Node",
      icon: FileText,
      onClick: () =>
        createNode("text", "Text Node", {
          text: "",
          outputType: "text",
          outputTypes: { output: "text" },
        }),
    },
    {
      type: "uploadImage",
      label: "Upload Image",
      icon: Image,
      onClick: () =>
        createNode("uploadImage", "Upload Image", {
          outputType: "image",
          outputTypes: { output: "image" },
        }),
    },
    {
      type: "uploadVideo",
      label: "Upload Video",
      icon: Video,
      onClick: () =>
        createNode("uploadVideo", "Upload Video", {
          outputType: "video",
          outputTypes: { output: "video" },
        }),
    },
    {
      type: "llm",
      label: "Run Any LLM",
      icon: Brain,
      onClick: () =>
        createNode("llm", "Run Any LLM", {
          model: "gemini-1.5-flash",
          outputType: "text",
          outputTypes: { output: "text" },
          inputType: "text",
          inputTypes: {
            system_prompt: "text",
            user_message: "text",
            images: "image",
          },
        }),
    },
    {
      type: "cropImage",
      label: "Crop Image",
      icon: Crop,
      onClick: () =>
        createNode("cropImage", "Crop Image", {
          xPercent: 0,
          yPercent: 0,
          widthPercent: 100,
          heightPercent: 100,
          outputType: "image",
          outputTypes: { output: "image" },
          inputType: "image",
        }),
    },
    {
      type: "extractFrame",
      label: "Extract Frame",
      icon: Film,
      onClick: () =>
        createNode("extractFrame", "Extract Frame", {
          timestamp: "0",
          outputType: "image",
          outputTypes: { output: "image" },
          inputType: "video",
        }),
    },
  ];

  return (
    <div
      className={`${
        leftSidebarOpen ? "w-64" : "w-12"
      } bg-[#1a1a1a] border-r border-[#333] transition-all duration-300 flex flex-col h-screen`}
    >
      <div className="p-4 border-b border-[#333] flex items-center justify-between">
        {leftSidebarOpen && (
          <h2 className="text-white font-semibold">Quick Access</h2>
        )}
        <button
          onClick={toggleLeftSidebar}
          className="text-gray-400 hover:text-white p-1"
        >
          <Plus className={`w-5 h-5 ${leftSidebarOpen ? "rotate-45" : ""}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {nodeButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.type}
              onClick={btn.onClick}
              className="w-full flex items-center gap-3 px-3 py-2 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-lg transition-colors"
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {leftSidebarOpen && <span className="text-sm">{btn.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
