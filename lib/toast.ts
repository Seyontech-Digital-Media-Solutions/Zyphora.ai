type ToastType = "info" | "success" | "error";

let toastHandler: ((message: string, type?: ToastType) => void) | null = null;

export function registerToastHandler(
  handler: (message: string, type?: ToastType) => void
) {
  toastHandler = handler;
}

export function toast(message: string, type: ToastType = "info") {
  if (toastHandler) {
    toastHandler(message, type);
  } else {
    console.log(`[${type}] ${message}`);
  }
}
