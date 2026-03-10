const CAMERA_CONSTRAINT_CANDIDATES: MediaStreamConstraints[] = [
  {
    video: {
      facingMode: { exact: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  },
  {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  },
  {
    video: true,
    audio: false,
  },
];

export async function requestCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera API unavailable");
  }

  let lastError: unknown = null;
  for (const constraints of CAMERA_CONSTRAINT_CANDIDATES) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to access camera stream");
}

export async function attachStreamToVideo(
  video: HTMLVideoElement,
  stream: MediaStream
): Promise<void> {
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;

  if (video.readyState < 1) {
    await new Promise<void>((resolve) => {
      let settled = false;

      const finalize = () => {
        if (settled) return;
        settled = true;
        video.removeEventListener("loadedmetadata", finalize);
        window.clearTimeout(timeoutId);
        resolve();
      };

      const timeoutId = window.setTimeout(finalize, 900);
      video.addEventListener("loadedmetadata", finalize, { once: true });
    });
  }

  await video.play();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function captureVideoFrame(
  video: HTMLVideoElement,
  guideElement?: HTMLElement | null,
  quality = 0.9
): string | null {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight) return null;

  let sourceX = 0;
  let sourceY = 0;
  let sourceCropWidth = sourceWidth;
  let sourceCropHeight = sourceHeight;

  if (guideElement) {
    const videoRect = video.getBoundingClientRect();
    const guideRect = guideElement.getBoundingClientRect();

    const displayWidth = videoRect.width;
    const displayHeight = videoRect.height;

    if (displayWidth > 0 && displayHeight > 0) {
      // object-fit: cover scaling from source frame to viewport
      const coverScale = Math.max(
        displayWidth / sourceWidth,
        displayHeight / sourceHeight
      );
      const renderedWidth = sourceWidth * coverScale;
      const renderedHeight = sourceHeight * coverScale;
      const offsetX = (displayWidth - renderedWidth) / 2;
      const offsetY = (displayHeight - renderedHeight) / 2;

      const frameXInVideo = guideRect.left - videoRect.left;
      const frameYInVideo = guideRect.top - videoRect.top;
      const frameWidth = guideRect.width;
      const frameHeight = guideRect.height;

      const rawSourceX = (frameXInVideo - offsetX) / coverScale;
      const rawSourceY = (frameYInVideo - offsetY) / coverScale;
      const rawSourceWidth = frameWidth / coverScale;
      const rawSourceHeight = frameHeight / coverScale;

      sourceX = clamp(rawSourceX, 0, sourceWidth - 1);
      sourceY = clamp(rawSourceY, 0, sourceHeight - 1);
      sourceCropWidth = clamp(rawSourceWidth, 1, sourceWidth - sourceX);
      sourceCropHeight = clamp(rawSourceHeight, 1, sourceHeight - sourceY);
    }
  }

  const canvas = document.createElement("canvas");
  const targetWidth = Math.max(1, Math.round(sourceCropWidth));
  const targetHeight = Math.max(1, Math.round(sourceCropHeight));
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceCropWidth,
    sourceCropHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas.toDataURL("image/jpeg", quality);
}
