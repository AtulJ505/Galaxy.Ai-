import { Node, Edge } from "reactflow";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates the pre-built sample workflow demonstrating all features
 * This is the "Product Marketing Kit Generator" workflow
 */
export function createSampleWorkflow(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Helper to create a node
  const createNode = (
    type: string,
    position: { x: number; y: number },
    data: any
  ) => {
    const node: Node = {
      id: uuidv4(),
      type,
      position,
      data: {
        label: data.label || type,
        nodeType: type,
        ...data,
      },
    };
    nodes.push(node);
    return node.id;
  };

  // Helper to create an edge
  const createEdge = (sourceId: string, targetId: string, sourceHandle?: string, targetHandle?: string) => {
    const edge: Edge = {
      id: `edge-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      sourceHandle: sourceHandle || "output",
      targetHandle: targetHandle || "input",
      animated: true,
      style: { stroke: "#9333ea", strokeWidth: 2 },
    };
    edges.push(edge);
  };

  // Branch A: Image Processing + Product Description
  // Upload Image Node
  const uploadImageId = createNode("uploadImage", { x: 100, y: 100 }, {
    label: "Upload Product Image",
    outputType: "image",
  });

  // Crop Image Node
  const cropImageId = createNode("cropImage", { x: 100, y: 300 }, {
    label: "Crop Image",
    xPercent: 10,
    yPercent: 10,
    widthPercent: 80,
    heightPercent: 80,
    outputType: "image",
    inputType: "image",
  });
  createEdge(uploadImageId, cropImageId, "output", "image_url");

  // Text Node #1 (System Prompt)
  const textSystemPromptId = createNode("text", { x: 400, y: 100 }, {
    label: "System Prompt",
    text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description.",
    outputType: "text",
  });

  // Text Node #2 (Product Details)
  const textProductDetailsId = createNode("text", { x: 400, y: 250 }, {
    label: "Product Details",
    text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
    outputType: "text",
  });

  // LLM Node #1
  const llmNode1Id = createNode("llm", { x: 400, y: 450 }, {
    label: "Generate Product Description",
    model: "gemini-1.5-flash",
    outputType: "text",
    inputType: "text",
  });
  createEdge(textSystemPromptId, llmNode1Id, "output", "system_prompt");
  createEdge(textProductDetailsId, llmNode1Id, "output", "user_message");
  createEdge(cropImageId, llmNode1Id, "output", "images");

  // Branch B: Video Frame Extraction
  // Upload Video Node
  const uploadVideoId = createNode("uploadVideo", { x: 700, y: 100 }, {
    label: "Upload Product Video",
    outputType: "video",
  });

  // Extract Frame Node
  const extractFrameId = createNode("extractFrame", { x: 700, y: 300 }, {
    label: "Extract Frame",
    timestamp: "50%",
    outputType: "image",
    inputType: "video",
  });
  createEdge(uploadVideoId, extractFrameId, "output", "video_url");

  // Convergence Point: Final Marketing Summary
  // Text Node #3 (System Prompt for Final LLM)
  const textFinalSystemId = createNode("text", { x: 550, y: 650 }, {
    label: "Final System Prompt",
    text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.",
    outputType: "text",
  });

  // LLM Node #2 (Final convergence node)
  const llmNode2Id = createNode("llm", { x: 550, y: 800 }, {
    label: "Final Marketing Summary",
    model: "gemini-1.5-flash",
    outputType: "text",
    inputType: "text",
  });
  createEdge(textFinalSystemId, llmNode2Id, "output", "system_prompt");
  createEdge(llmNode1Id, llmNode2Id, "output", "user_message");
  createEdge(cropImageId, llmNode2Id, "output", "images");
  createEdge(extractFrameId, llmNode2Id, "output", "images");

  return { nodes, edges };
}
