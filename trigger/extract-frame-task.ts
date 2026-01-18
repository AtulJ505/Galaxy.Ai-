import { task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fs } from "fs";

export const extractFrameTask = task({
  id: "extract-frame",
  run: async (payload: {
    videoUrl: string;
    timestamp: string; // Can be seconds (number) or percentage (e.g., "50%")
  }, { ctx }) => {
    const startTime = Date.now();
    
    try {
      ffmpeg.setFfmpegPath(ffmpegPath as string);
      ffmpeg.setFfprobePath(ffprobePath.path);

      const inFile = join(tmpdir(), `frame-input-${Date.now()}.mp4`);
      const outFile = join(tmpdir(), `frame-output-${Date.now()}.png`);

      // Download input video
      const videoResp = await fetch(payload.videoUrl, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*" },
      });
      if (!videoResp.ok) throw new Error("Failed to fetch video");
      const videoBuffer = Buffer.from(await videoResp.arrayBuffer());
      await fs.writeFile(inFile, videoBuffer);

      // Probe duration
      const durationSec = await new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(inFile, (err, data) => {
          if (err) return reject(err);
          const format = data.format || {};
          const dur = Number(format.duration) || 0;
          resolve(dur);
        });
      });

      // Parse timestamp
      let timestampSeconds = 0;
      if (typeof payload.timestamp === "string" && payload.timestamp.includes("%")) {
        const pct = Math.max(0, Math.min(100, parseFloat(payload.timestamp.replace("%", "")) || 0));
        timestampSeconds = (pct / 100) * durationSec;
      } else {
        timestampSeconds = Math.max(0, Math.min(durationSec, parseFloat(String(payload.timestamp)) || 0));
      }

      // Extract frame using ffmpeg at timestamp
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inFile)
          .seekInput(timestampSeconds)
          .frames(1)
          .outputOptions(["-f image2"])
          .output(outFile)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });

      const outBuffer = await fs.readFile(outFile);
      const base64 = outBuffer.toString("base64");
      const frameImageUrl = `data:image/png;base64,${base64}`;

      const duration = Date.now() - startTime;

      await Promise.allSettled([fs.unlink(inFile), fs.unlink(outFile)]);

      return {
        success: true,
        outputUrl: frameImageUrl,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message || "Failed to extract frame",
        duration,
      };
    }
  },
});

export async function extractFrameFF(payload: {
  videoUrl: string;
  timestamp: string;
}): Promise<{ success: boolean; outputUrl?: string; error?: string; duration: number }> {
  const startTime = Date.now();
  try {
    ffmpeg.setFfmpegPath(ffmpegPath as string);
    ffmpeg.setFfprobePath(ffprobePath.path);
    const inFile = join(tmpdir(), `frame-input-${Date.now()}.mp4`);
    const outFile = join(tmpdir(), `frame-output-${Date.now()}.png`);
    const videoResp = await fetch(payload.videoUrl, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*" },
    });
    if (!videoResp.ok) throw new Error("Failed to fetch video");
    const videoBuffer = Buffer.from(await videoResp.arrayBuffer());
    await fs.writeFile(inFile, videoBuffer);
    const durationSec = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(inFile, (err, data) => {
        if (err) return reject(err);
        const format = data.format || {};
        const dur = Number(format.duration) || 0;
        resolve(dur);
      });
    });
    let timestampSeconds = 0;
    if (typeof payload.timestamp === "string" && payload.timestamp.includes("%")) {
      const pct = Math.max(0, Math.min(100, parseFloat(payload.timestamp.replace("%", "")) || 0));
      timestampSeconds = (pct / 100) * durationSec;
    } else {
      timestampSeconds = Math.max(0, Math.min(durationSec, parseFloat(String(payload.timestamp)) || 0));
    }
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inFile)
        .seekInput(timestampSeconds)
        .frames(1)
        .outputOptions(["-f image2"])
        .output(outFile)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
    const outBuffer = await fs.readFile(outFile);
    const base64 = outBuffer.toString("base64");
    const frameImageUrl = `data:image/png;base64,${base64}`;
    const duration = Date.now() - startTime;
    await Promise.allSettled([fs.unlink(inFile), fs.unlink(outFile)]);
    return { success: true, outputUrl: frameImageUrl, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return { success: false, error: error?.message || "Failed to extract frame", duration };
  }
}
