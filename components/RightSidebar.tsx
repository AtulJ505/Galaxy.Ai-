"use client";

import { useWorkflowStore } from "@/lib/store";
import { X, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RightSidebar() {
  const {
    rightSidebarOpen,
    toggleRightSidebar,
    runs,
    selectedRun,
    setSelectedRun,
    workflowId,
    setRuns,
  } = useWorkflowStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "RUNNING":
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case "FULL":
        return "Full Workflow";
      case "PARTIAL":
        return "Selected Nodes";
      case "SINGLE":
        return "Single Node";
      default:
        return scope;
    }
  };

  useEffect(() => {
    let interval: any;
    const fetchRuns = async () => {
      if (!workflowId) return;
      try {
        const res = await fetch(`/api/workflows/${workflowId}/runs`);
        const data = await res.json();
        if (data.runs) {
          setRuns(data.runs);
        }
      } catch (e) {
        // ignore
      }
    };
    // Initial fetch
    fetchRuns();
    // Poll while sidebar open
    if (rightSidebarOpen && workflowId) {
      interval = setInterval(fetchRuns, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [workflowId, rightSidebarOpen, setRuns]);

  return (
    <div
      className={`${
        rightSidebarOpen ? "w-80" : "w-0"
      } bg-[#1a1a1a] border-l border-[#333] transition-all duration-300 flex flex-col h-screen overflow-hidden`}
    >
      {rightSidebarOpen && (
        <>
          <div className="p-4 border-b border-[#333] flex items-center justify-between">
            <h2 className="text-white font-semibold">Workflow History</h2>
            <button
              onClick={toggleRightSidebar}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedRun ? (
              <div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="mb-4 text-sm text-gray-400 hover:text-white"
                >
                  ← Back to runs
                </button>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-2">
                      Run #{selectedRun.id.slice(-6)} - {formatDate(selectedRun.startedAt)}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(selectedRun.status)}
                      <span className="text-sm text-gray-400">
                        {getScopeLabel(selectedRun.scope)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDuration(selectedRun.duration)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-white text-sm font-medium">Node Execution:</h4>
                    {selectedRun.nodeRuns?.map((nodeRun, idx) => (
                      <div key={nodeRun.id} className="bg-[#2a2a2a] p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(nodeRun.status)}
                          <span className="text-white text-sm font-medium">
                            {nodeRun.nodeType}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {formatDuration(nodeRun.duration)}
                          </span>
                        </div>
                        {nodeRun.outputs && (
                          <div className="mt-2 text-xs text-gray-400">
                            <div className="font-medium mb-1">Output:</div>
                            <div className="break-words">
                              {typeof nodeRun.outputs === "string"
                                ? nodeRun.outputs
                                : JSON.stringify(nodeRun.outputs, null, 2)}
                            </div>
                          </div>
                        )}
                        {nodeRun.error && (
                          <div className="mt-2 text-xs text-red-400">
                            <div className="font-medium mb-1">Error:</div>
                            <div>{nodeRun.error}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {runs.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-8">
                    No workflow runs yet
                  </div>
                ) : (
                  runs.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => setSelectedRun(run)}
                      className="w-full text-left bg-[#2a2a2a] hover:bg-[#333] p-3 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(run.status)}
                        <span className="text-white text-sm font-medium">
                          Run #{run.id.slice(-6)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(run.startedAt)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getScopeLabel(run.scope)} • {formatDuration(run.duration)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
