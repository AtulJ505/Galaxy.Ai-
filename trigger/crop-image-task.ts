import { task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fs } from "fs";

export const cropImageTask = task({
  id: "crop-image",
  run: async (payload: {
    imageUrl: string;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
  }, { ctx }) => {
    const startTime = Date.now();
    
    try {
      ffmpeg.setFfmpegPath(ffmpegPath as string);
      ffmpeg.setFfprobePath(ffprobePath.path);

      const inFile = join(tmpdir(), `crop-input-${Date.now()}.jpg`);
      const outFile = join(tmpdir(), `crop-output-${Date.now()}.png`);

      // Download input image
      const imageResponse = await fetch(payload.imageUrl);
      if (!imageResponse.ok) throw new Error(`Failed to fetch image`);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      await fs.writeFile(inFile, imageBuffer);

      // Probe dimensions
      const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        ffmpeg.ffprobe(inFile, (err, data) => {
          if (err) return reject(err);
          const stream = (data.streams || []).find((s: any) => s.width && s.height);
          const width = stream?.width || 0;
          const height = stream?.height || 0;
          if (!width || !height) return reject(new Error("Invalid image dimensions"));
          resolve({ width, height });
        });
      });

      // Compute pixel crop from percentages
      const sx = Math.max(0, Math.min(dims.width, Math.round((payload.xPercent / 100) * dims.width)));
      const sy = Math.max(0, Math.min(dims.height, Math.round((payload.yPercent / 100) * dims.height)));
      const sw = Math.max(1, Math.min(dims.width - sx, Math.round((payload.widthPercent / 100) * dims.width)));
      const sh = Math.max(1, Math.min(dims.height - sy, Math.round((payload.heightPercent / 100) * dims.height)));

      // Run ffmpeg crop filter
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inFile)
          .outputOptions([`-vf crop=${sw}:${sh}:${sx}:${sy}`])
          .output(outFile)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });

      const outBuffer = await fs.readFile(outFile);
      const base64 = outBuffer.toString("base64");
      const outputUrl = `data:image/png;base64,${base64}`;

      const duration = Date.now() - startTime;

      await Promise.allSettled([fs.unlink(inFile), fs.unlink(outFile)]);

      return {
        success: true,
        outputUrl,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message || "Failed to crop image",
        duration,
      };
    }
  },
});

export async function cropImageFF(payload: {
  imageUrl: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}): Promise<{ success: boolean; outputUrl?: string; error?: string; duration: number }> {
  const startTime = Date.now();
  try {
    ffmpeg.setFfmpegPath(ffmpegPath as string);
    ffmpeg.setFfprobePath(ffprobePath.path);
    const inFile = join(tmpdir(), `crop-input-${Date.now()}.jpg`);
    const outFile = join(tmpdir(), `crop-output-${Date.now()}.png`);
    const imageResponse = await fetch(payload.imageUrl);
    if (!imageResponse.ok) throw new Error(`Failed to fetch image`);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    await fs.writeFile(inFile, imageBuffer);
    const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      ffmpeg.ffprobe(inFile, (err, data) => {
        if (err) return reject(err);
        const stream = (data.streams || []).find((s: any) => s.width && s.height);
        const width = stream?.width || 0;
        const height = stream?.height || 0;
        if (!width || !height) return reject(new Error("Invalid image dimensions"));
        resolve({ width, height });
      });
    });
    const sx = Math.max(0, Math.min(dims.width, Math.round((payload.xPercent / 100) * dims.width)));
    const sy = Math.max(0, Math.min(dims.height, Math.round((payload.yPercent / 100) * dims.height)));
    const sw = Math.max(1, Math.min(dims.width - sx, Math.round((payload.widthPercent / 100) * dims.width)));
    const sh = Math.max(1, Math.min(dims.height - sy, Math.round((payload.heightPercent / 100) * dims.height)));
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inFile)
        .outputOptions([`-vf crop=${sw}:${sh}:${sx}:${sy}`])
        .output(outFile)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
    const outBuffer = await fs.readFile(outFile);
    const base64 = outBuffer.toString("base64");
    const outputUrl = `data:image/png;base64,${base64}`;
    const duration = Date.now() - startTime;
    await Promise.allSettled([fs.unlink(inFile), fs.unlink(outFile)]);
    return { success: true, outputUrl, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return { success: false, error: error?.message || "Failed to crop image", duration };
  }
}
