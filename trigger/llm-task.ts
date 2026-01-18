import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runLLMTask = task({
  id: "run-llm",
  run: async (payload: {
    model: string;
    systemPrompt?: string;
    userMessage: string;
    images?: string[];
  }, { ctx }) => {
    const startTime = Date.now();
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: payload.model });

      // Build parts array for multimodal input
      const parts: any[] = [];

      // Add text prompts
      if (payload.systemPrompt) {
        parts.push({ text: `System: ${payload.systemPrompt}\n\n` });
      }
      parts.push({ text: payload.userMessage });

      // Add images if provided
      if (payload.images && payload.images.length > 0) {
        for (const imageUrl of payload.images) {
          try {
            // Fetch image and convert to base64
            const imageResponse = await fetch(imageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString("base64");
            const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

            parts.push({
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            });
          } catch (error) {
            console.error(`Error processing image ${imageUrl}:`, error);
            // Continue with other images
          }
        }
      }

      const result = await model.generateContent({ contents: [{ role: "user", parts }] });
      const response = await result.response;
      const text = response.text();

      const duration = Date.now() - startTime;

      return {
        success: true,
        output: text,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message || "Unknown error occurred",
        duration,
      };
    }
  },
});
