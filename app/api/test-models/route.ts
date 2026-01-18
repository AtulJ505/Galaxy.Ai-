import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    // Try to list available models
    const models: string[] = [];
    const errors: string[] = [];
    
    // Test different model name formats
    const testModels = [
      "gemini-1.5-flash",
      "models/gemini-1.5-flash",
      "gemini-1.5-pro",
      "models/gemini-1.5-pro",
      "gemini-pro",
      "models/gemini-pro",
      "gemini-1.0-pro",
      "models/gemini-1.0-pro",
    ];

    for (const modelName of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Try a simple generateContent call
        const result = await model.generateContent("test");
        await result.response;
        models.push(modelName);
      } catch (error: any) {
        errors.push(`${modelName}: ${error.message}`);
      }
    }

    return NextResponse.json({
      availableModels: models,
      errors: errors,
      apiKeyConfigured: !!process.env.GOOGLE_AI_API_KEY,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to test models" },
      { status: 500 }
    );
  }
}
