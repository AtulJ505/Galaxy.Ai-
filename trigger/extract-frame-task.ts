import { task } from "@trigger.dev/sdk/v3";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fs } from "fs";
import { spawn } from "child_process";
import { access } from "fs/promises";

async function resolveFfmpegCmd(): Promise<string> {
  async function valid(cmd: string): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
      try {
        const p = spawn(cmd, ["-version"]);
        p.on("error", () => resolve(false));
        p.on("close", (code) => resolve(code === 0));
      } catch {
        resolve(false);
      }
    });
  }
  const envPath = process.env.FFMPEG_PATH;
  const candidates: string[] = [];
  if (envPath) candidates.push(envPath);
  try {
    const mod: any = await import("ffmpeg-static");
    const p: string | undefined = mod?.default;
    if (p) candidates.push(p);
  } catch {}
  candidates.push(
    join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"),
    join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg")
  );
  for (const c of candidates) {
    try {
      if (c !== "ffmpeg") await access(c);
      if (await valid(c)) return c;
    } catch {}
  }
  if (await valid("ffmpeg")) return "ffmpeg";
  throw new Error("FFmpeg not found. Install ffmpeg or set FFMPEG_PATH");
}

async function getDurationSeconds(inFile: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    (async () => {
      const ffmpegCmd = await resolveFfmpegCmd();
      const args = ["-hide_banner", "-i", inFile, "-f", "null", "-"];
      const ff = spawn(ffmpegCmd, args);
      let stderr = "";
      ff.stderr.on("data", (d) => {
        try {
          stderr += d.toString();
        } catch {}
      });
      ff.on("error", (err) => reject(err));
      ff.on("close", () => {
        const match = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/);
        if (!match) return reject(new Error("Failed to read duration"));
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseFloat(match[3]);
        const total = hours * 3600 + minutes * 60 + seconds;
        resolve(total);
      });
    })().catch(reject);
  });
}

export const extractFrameTask = task({
  id: "extract-frame",
  run: async (payload: {
    videoUrl: string;
    timestamp: string; // Can be seconds (number) or percentage (e.g., "50%")
  }, { ctx }) => {
    const startTime = Date.now();
    
    try {
      const inFile = join(tmpdir(), `frame-input-${Date.now()}.mp4`);
      const outFile = join(tmpdir(), `frame-output-${Date.now()}.png`);

      // Download or decode input video
      let videoBuffer: Buffer;
      if (payload.videoUrl.startsWith("data:video/")) {
        const commaIdx = payload.videoUrl.indexOf(",");
        if (commaIdx === -1) throw new Error("Invalid data URL for video");
        const base64 = payload.videoUrl.slice(commaIdx + 1);
        videoBuffer = Buffer.from(base64, "base64");
      } else {
        const videoResp = await fetch(payload.videoUrl, {
          headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*" },
        });
        if (!videoResp.ok) throw new Error("Failed to fetch video");
        videoBuffer = Buffer.from(await videoResp.arrayBuffer());
      }
      await fs.writeFile(inFile, videoBuffer);

      // Determine timestamp (seconds)
      let timestampSeconds = 0;
      if (typeof payload.timestamp === "string" && payload.timestamp.includes("%")) {
        const pct = Math.max(0, Math.min(100, parseFloat(payload.timestamp.replace("%", "")) || 0));
        const durationSec = await getDurationSeconds(inFile);
        timestampSeconds = (pct / 100) * durationSec;
      } else {
        timestampSeconds = Math.max(0, parseFloat(String(payload.timestamp)) || 0);
      }

      // Extract frame using ffmpeg at timestamp
      await new Promise<void>((resolve, reject) => {
        (async () => {
          const ffmpegCmd = await resolveFfmpegCmd();
          const args = [
            "-hide_banner",
            "-loglevel", "error",
            "-ss", String(timestampSeconds),
            "-i", inFile,
            "-frames:v", "1",
            "-f", "image2",
            "-y", outFile,
          ];
          const ff = spawn(ffmpegCmd, args);
          let err = "";
          ff.stderr.on("data", (d) => {
            try { err += d.toString(); } catch {}
          });
          ff.on("error", (err) => reject(err));
          ff.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`ffmpeg exited with code ${code}${err ? `: ${err}` : ""}`));
          });
        })().catch(reject);
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
    const inFile = join(tmpdir(), `frame-input-${Date.now()}.mp4`);
    const outFile = join(tmpdir(), `frame-output-${Date.now()}.png`);
    let videoBuffer: Buffer;
    if (payload.videoUrl.startsWith("data:video/")) {
      const commaIdx = payload.videoUrl.indexOf(",");
      if (commaIdx === -1) throw new Error("Invalid data URL for video");
      const base64 = payload.videoUrl.slice(commaIdx + 1);
      videoBuffer = Buffer.from(base64, "base64");
    } else {
      const videoResp = await fetch(payload.videoUrl, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*" },
      });
      if (!videoResp.ok) throw new Error("Failed to fetch video");
      videoBuffer = Buffer.from(await videoResp.arrayBuffer());
    }
    await fs.writeFile(inFile, videoBuffer);
    let timestampSeconds = 0;
    if (typeof payload.timestamp === "string" && payload.timestamp.includes("%")) {
      const pct = Math.max(0, Math.min(100, parseFloat(payload.timestamp.replace("%", "")) || 0));
      const durationSec = await getDurationSeconds(inFile);
      timestampSeconds = (pct / 100) * durationSec;
    } else {
      timestampSeconds = Math.max(0, parseFloat(String(payload.timestamp)) || 0);
    }
    await new Promise<void>((resolve, reject) => {
      (async () => {
        const ffmpegCmd = await resolveFfmpegCmd();
        const args = [
          "-hide_banner",
          "-loglevel", "error",
          "-ss", String(timestampSeconds),
          "-i", inFile,
          "-frames:v", "1",
          "-f", "image2",
          "-y", outFile,
        ];
        const ff = spawn(ffmpegCmd, args);
        let err = "";
        ff.stderr.on("data", (d) => {
          try { err += d.toString(); } catch {}
        });
        ff.on("error", (err) => reject(err));
        ff.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg exited with code ${code}${err ? `: ${err}` : ""}`));
        });
      })().catch(reject);
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
