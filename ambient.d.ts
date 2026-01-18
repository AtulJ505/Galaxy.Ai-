declare module "ffprobe-static" {
  const ffprobePath: { path: string };
  export default ffprobePath;
}

declare module "ffmpeg-static" {
  const ffmpegPath: string;
  export default ffmpegPath;
}

