"use client";

import { useWorkflowStore } from "@/lib/store";
import { Save, Download, Upload, Play, FileText } from "lucide-react";
import { useCallback, useRef } from "react";
import { exportWorkflowToJSON, downloadWorkflowJSON, loadWorkflowFromFile } from "@/lib/workflow-persistence";
import { createSampleWorkflow } from "@/lib/sample-workflow";
export default function WorkflowToolbar() {
  const {
    nodes,
    edges,
    viewport,
    workflowId,
    setNodes,
    setEdges,
    setViewport,
    setWorkflowId,
    setRuns,
  } = useWorkflowStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(async () => {
    try {
      const response = workflowId
        ? await fetch(`/api/workflows/${workflowId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nodes,
              edges,
              viewport,
            }),
          })
        : await fetch("/api/workflows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nodes,
              edges,
              viewport,
            }),
          });

      if (!response.ok) {
        let msg = "Failed to save workflow";
        try {
          const err = await response.json();
          if (err?.error) msg = typeof err.error === "string" ? err.error : "Validation error";
        } catch {}
        alert(msg);
        return;
      }

      const data = await response.json();
      if (data?.workflow?.id) {
        setWorkflowId(data.workflow.id);
        alert("Workflow saved successfully!");
      } else {
        alert("Save succeeded but workflow ID is missing");
      }
    } catch (error: any) {
      alert(`Failed to save workflow: ${error.message}`);
    }
  }, [nodes, edges, viewport, workflowId, setWorkflowId]);

  const handleExport = useCallback(() => {
    downloadWorkflowJSON(nodes, edges, viewport, `workflow-${Date.now()}.json`);
  }, [nodes, edges, viewport]);

  const handleImport = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const workflow = await loadWorkflowFromFile(file);
        setNodes(workflow.nodes);
        setEdges(workflow.edges);
        if (workflow.viewport) {
          setViewport(workflow.viewport);
        }
        setWorkflowId(null); // Reset workflow ID on import
        alert("Workflow imported successfully!");
      } catch (error: any) {
        alert(`Failed to import workflow: ${error.message}`);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [setNodes, setEdges, setViewport, setWorkflowId]
  );

  const handleLoadSample = useCallback(() => {
    if (
      confirm(
        "Loading the sample workflow will replace your current workflow. Continue?"
      )
    ) {
      const sample = createSampleWorkflow();
      setNodes(sample.nodes);
      setEdges(sample.edges);
      setWorkflowId(null);
      alert("Sample workflow loaded!");
    }
  }, [setNodes, setEdges, setWorkflowId]);

  const handleRun = useCallback(async () => {
    if (!workflowId) {
      alert("Please save the workflow first before running.");
      return;
    }

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
        }),
      });

      const data = await response.json();
      if (data.runId) {
        alert(`Workflow execution started! Run ID: ${data.runId}`);
        // Fetch latest runs after starting
        try {
          const res = await fetch(`/api/workflows/${workflowId}/runs`);
          const runsData = await res.json();
          if (runsData.runs) {
            setRuns(runsData.runs);
          }
        } catch {}
      }
    } catch (error: any) {
      alert(`Failed to execute workflow: ${error.message}`);
    }
  }, [workflowId, setRuns]);

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-4 py-2 bg-[#9333ea] hover:bg-[#a855f7] text-white rounded-lg transition-colors text-sm"
      >
        <Save className="w-4 h-4" />
        Save
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-lg transition-colors text-sm border border-[#333]"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      <button
        onClick={handleImport}
        className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-lg transition-colors text-sm border border-[#333]"
      >
        <Upload className="w-4 h-4" />
        Import
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleLoadSample}
        className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-lg transition-colors text-sm border border-[#333]"
      >
        <FileText className="w-4 h-4" />
        Load Sample
      </button>

      <button
        onClick={handleRun}
        disabled={!workflowId}
        className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] disabled:bg-[#555] disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
      >
        <Play className="w-4 h-4" />
        Run Workflow
      </button>
    </div>
  );
}
