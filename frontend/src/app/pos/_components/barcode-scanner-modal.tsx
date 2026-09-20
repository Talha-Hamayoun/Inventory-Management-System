"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  prepareZXingModule,
  readBarcodes,
  type ReaderOptions,
} from "zxing-wasm/reader";
import { Modal } from "@/src/components/ui/modal";
import { Button } from "@/src/components/ui/button";
import { AlertTriangle, CameraOff, Loader2, SwitchCamera, X } from "lucide-react";

interface VideoDevice {
  deviceId: string;
  label: string;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Return true when the product was added to cart successfully. */
  onScan: (code: string) => Promise<boolean>;
}

const READER_OPTIONS: ReaderOptions = {
  tryHarder: true,
  // EAN for valid product labels; Code39 for older/invalid labels rendered as Code39
  formats: ["EAN-13", "EAN-8", "UPC-A", "UPC-E", "Code128", "Code39"],
  maxNumberOfSymbols: 1,
};

const DECODE_INTERVAL_MS = 130; // ~8 fps decode
const SAME_VALUE_DEBOUNCE_MS = 2500;
/** Pause after a successful decode before closing / next scan */
const SUCCESS_HOLD_MS = 1700;
/** Extra pause after a failed lookup before camera resumes */
const FAIL_RESUME_MS = 1200;

let scanToneAudio: HTMLAudioElement | null = null;

function getScanToneAudio(): HTMLAudioElement {
  if (!scanToneAudio) {
    scanToneAudio = new Audio("/freesound.mp3");
    scanToneAudio.preload = "auto";
  }
  return scanToneAudio;
}

/** Play scan success tone from public/freesound.mp3 */
function playScanTone() {
  try {
    const audio = getScanToneAudio();
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
    void audio.play().catch(() => {
      try {
        const fallback = new Audio("/freesound.mp3");
        void fallback.play().catch(() => undefined);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore audio failures
  }
}

function mapCameraError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const name = err instanceof Error ? err.name : "";
  const lower = `${name} ${message}`.toLowerCase();
  if (lower.includes("notallowed") || lower.includes("permission") || lower.includes("denied")) {
    return "Camera permission denied. Allow camera access (HTTPS or localhost), then try again.";
  }
  if (lower.includes("notfound") || lower.includes("no camera") || lower.includes("devices not found")) {
    return "No camera found on this device.";
  }
  if (lower.includes("secure")) {
    return "Camera requires HTTPS or localhost.";
  }
  return message || "Unable to start camera.";
}

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const decodingRef = useRef(false);
  const lastDecodeAtRef = useRef(0);
  const lastScannedRef = useRef("");
  const lastScanTimeRef = useRef(0);
  const cooldownRef = useRef(false);
  const lockRef = useRef(false);
  const openRef = useRef(isOpen);
  const onScanRef = useRef(onScan);
  const scanLineYRef = useRef(0);
  const scanDirectionRef = useRef<1 | -1>(1);

  const [errorMsg, setErrorMsg] = useState("");
  const [starting, setStarting] = useState(false);
  const [cameras, setCameras] = useState<VideoDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [lastDecoded, setLastDecoded] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    openRef.current = isOpen;
    if (isOpen) {
      // Unlock / preload tone on the same user gesture that opened the modal
      const audio = getScanToneAudio();
      audio.load();
      void audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => undefined);
    }
  }, [isOpen]);

  const stopCurrentStream = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCooldown = useCallback((seconds = 0.5) => {
    cooldownRef.current = true;
    setCooldownRemaining(seconds);
    const start = Date.now();
    const tick = () => {
      if (!openRef.current) return;
      const remaining = Math.max(0, seconds - (Date.now() - start) / 1000);
      setCooldownRemaining(remaining);
      if (remaining > 0) {
        requestAnimationFrame(tick);
      } else {
        cooldownRef.current = false;
        setCooldownRemaining(0);
      }
    };
    requestAnimationFrame(tick);
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      stopCurrentStream();
      setErrorMsg("");
      setStarting(true);
      lockRef.current = false;
      cooldownRef.current = false;
      setCooldownRemaining(0);
      lastScannedRef.current = "";
      lastScanTimeRef.current = 0;

      try {
        await prepareZXingModule({
          overrides: {
            locateFile: (path: string, prefix: string) =>
              path.endsWith(".wasm") ? "/zxing_reader.wasm" : `${prefix}${path}`,
          },
          fireImmediately: true,
        });

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            ...(deviceId
              ? { deviceId: { exact: deviceId } }
              : { facingMode: { ideal: "environment" } }),
            width: { ideal: 1280 },
            height: { ideal: 720 },
            // @ts-expect-error non-standard hint for continuous autofocus
            focusMode: "continuous",
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!openRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        setStarting(false);

        // Refresh labels after permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((d) => d.kind === "videoinput" && d.deviceId)
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${i + 1}`,
          }));
        setCameras(videoDevices);
        const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId;
        if (activeId) setSelectedCameraId(activeId);
      } catch (err) {
        setStarting(false);
        setErrorMsg(mapCameraError(err));
      }
    },
    [stopCurrentStream]
  );

  // Decode loop (TradeApp CameraStream pattern)
  useEffect(() => {
    if (!isOpen || starting || errorMsg || !streamRef.current) return;

    const video = videoRef.current;
    const processingCanvas = processingCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!video || !processingCanvas || !overlayCanvas) return;

    const procCtx = processingCanvas.getContext("2d", { willReadFrequently: true });
    const overlayCtx = overlayCanvas.getContext("2d");
    if (!procCtx || !overlayCtx) {
      setErrorMsg("Failed to get canvas context");
      return;
    }

    let cancelled = false;

    const processFrame = async () => {
      if (cancelled || !openRef.current) return;

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        processingCanvas.width = video.videoWidth;
        processingCanvas.height = video.videoHeight;
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;

        procCtx.drawImage(video, 0, 0, processingCanvas.width, processingCanvas.height);
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        // Centre scan box: 60% × 50% (guide §4.2)
        const scanWidth = video.videoWidth * 0.6;
        const scanHeight = video.videoHeight * 0.5;
        const scanX = (video.videoWidth - scanWidth) / 2;
        const scanY = (video.videoHeight - scanHeight) / 2;

        if (scanLineYRef.current === 0) {
          scanLineYRef.current = scanY + scanHeight / 2;
        }

        const paused = cooldownRef.current;
        overlayCtx.strokeStyle = paused ? "#f44" : "#3b82f6";
        overlayCtx.lineWidth = 3;
        overlayCtx.strokeRect(scanX, scanY, scanWidth, scanHeight);

        // Animated scan line
        const beamY = scanLineYRef.current;
        overlayCtx.strokeStyle = paused ? "#f88" : "#60a5fa";
        overlayCtx.lineWidth = 2;
        overlayCtx.beginPath();
        overlayCtx.moveTo(scanX, beamY);
        overlayCtx.lineTo(scanX + scanWidth, beamY);
        overlayCtx.stroke();

        scanLineYRef.current += scanDirectionRef.current * 4;
        if (
          scanLineYRef.current >= scanY + scanHeight ||
          scanLineYRef.current <= scanY
        ) {
          scanDirectionRef.current *= -1;
        }

        if (paused) {
          overlayCtx.font = "bold 18px Arial";
          overlayCtx.fillStyle = "#f44";
          overlayCtx.textAlign = "center";
          overlayCtx.fillText("Scanning paused", overlayCanvas.width / 2, scanY - 12);
        } else if (!decodingRef.current && !lockRef.current) {
          const now = Date.now();
          if (now - lastDecodeAtRef.current >= DECODE_INTERVAL_MS) {
            lastDecodeAtRef.current = now;
            decodingRef.current = true;
            try {
              const cropped = procCtx.getImageData(scanX, scanY, scanWidth, scanHeight);
              const results = await readBarcodes(cropped, READER_OPTIONS);
              if (
                !cancelled &&
                openRef.current &&
                results.length > 0 &&
                results[0]?.text &&
                !lockRef.current
              ) {
                const scannedValue = results[0].text.trim();
                const timeSinceLast = now - lastScanTimeRef.current;
                const isNewValue = scannedValue !== lastScannedRef.current;

                if (
                  scannedValue &&
                  (isNewValue || timeSinceLast > SAME_VALUE_DEBOUNCE_MS)
                ) {
                  lastScannedRef.current = scannedValue;
                  lastScanTimeRef.current = now;
                  lockRef.current = true;
                  setLastDecoded(scannedValue);
                  playScanTone();

                  overlayCtx.fillStyle = "rgba(0,255,0,0.22)";
                  overlayCtx.fillRect(scanX, scanY, scanWidth, scanHeight);
                  overlayCtx.strokeStyle = "#22c55e";
                  overlayCtx.lineWidth = 4;
                  overlayCtx.strokeRect(scanX, scanY, scanWidth, scanHeight);
                  overlayCtx.font = "bold 20px Arial";
                  overlayCtx.fillStyle = "#22c55e";
                  overlayCtx.textAlign = "center";
                  overlayCtx.fillText(
                    scannedValue,
                    overlayCanvas.width / 2,
                    scanY + scanHeight + 28
                  );

                  // Brief delay so the tone + highlight are noticeable before lookup
                  startCooldown(SUCCESS_HOLD_MS / 1000);
                  await new Promise((r) => window.setTimeout(r, 350));

                  const ok = await onScanRef.current(scannedValue);
                  if (!openRef.current) return;

                  if (ok) {
                    window.setTimeout(() => {
                      if (!openRef.current) return;
                      stopCurrentStream();
                      onClose();
                    }, SUCCESS_HOLD_MS);
                  } else {
                    // Keep pause a bit longer on miss, then resume scanning
                    startCooldown(FAIL_RESUME_MS / 1000);
                    window.setTimeout(() => {
                      if (!openRef.current) return;
                      lockRef.current = false;
                      cooldownRef.current = false;
                      setCooldownRemaining(0);
                    }, FAIL_RESUME_MS);
                  }
                }
              }
            } catch (err) {
              console.error("Error processing barcode:", err);
            } finally {
              decodingRef.current = false;
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(() => {
        void processFrame();
      });
    };

    rafRef.current = requestAnimationFrame(() => {
      void processFrame();
    });

    return () => {
      cancelled = true;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isOpen, starting, errorMsg, startCooldown, stopCurrentStream, onClose, selectedCameraId]);

  // Open / close lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopCurrentStream();
      setErrorMsg("");
      setStarting(false);
      setLastDecoded("");
      setCameras([]);
      setSelectedCameraId(undefined);
      lockRef.current = false;
      cooldownRef.current = false;
      return;
    }

    void (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${i + 1}`,
          }));
        setCameras(videoDevices);
        const preferred =
          videoDevices.find((d) =>
            /back|rear|environment/i.test(d.label)
          ) || videoDevices[0];
        await startCamera(preferred?.deviceId);
      } catch (err) {
        setErrorMsg(mapCameraError(err));
      }
    })();

    return () => {
      stopCurrentStream();
    };
  }, [isOpen, startCamera, stopCurrentStream]);

  const handleClose = () => {
    lockRef.current = true;
    stopCurrentStream();
    onClose();
  };

  const switchCamera = () => {
    if (cameras.length < 2 || lockRef.current) return;
    const idx = Math.max(
      0,
      cameras.findIndex((c) => c.deviceId === selectedCameraId)
    );
    const next = cameras[(idx + 1) % cameras.length];
    if (!next) return;
    setSelectedCameraId(next.deviceId);
    void startCamera(next.deviceId);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Scan Product Barcode</h2>
            <p className="text-xs text-gray-500">
              Camera scanner · zxing-wasm · EAN / Code128 / Code39
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {cameras.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                disabled={starting || !!errorMsg || lockRef.current}
                onClick={switchCamera}
              >
                <SwitchCamera className="h-4 w-4" />
                <span className="hidden sm:inline">Switch Camera</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Close scanner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div
            className="relative mx-auto w-full max-w-[800px] overflow-hidden rounded-2xl border border-gray-200 bg-black"
            style={{ height: 320 }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={processingCanvasRef} className="hidden" />
            <canvas
              ref={overlayCanvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />

            {starting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-sm">Starting camera…</p>
              </div>
            )}

            {cooldownRemaining > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex items-center rounded-lg bg-white px-5 py-3 shadow-lg">
                  <div className="mr-3 h-3.5 w-3.5 animate-pulse rounded-full bg-orange-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {lastDecoded
                      ? `Scanned ${lastDecoded}`
                      : `Scanner paused for ${cooldownRemaining.toFixed(1)}s`}
                  </span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-4">
                <div className="max-w-sm rounded-xl bg-white p-4 shadow-lg">
                  <div className="mb-2 flex items-center gap-2 text-rose-600">
                    {errorMsg.toLowerCase().includes("permission") ||
                    errorMsg.toLowerCase().includes("no camera") ? (
                      <CameraOff className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                    <span className="font-medium">Camera Error</span>
                  </div>
                  <p className="text-sm text-gray-700">{errorMsg}</p>
                  <Button
                    type="button"
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => void startCamera(selectedCameraId)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!errorMsg && (
            <p className="text-center text-sm text-gray-600">
              Point the camera at the product barcode
            </p>
          )}

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
