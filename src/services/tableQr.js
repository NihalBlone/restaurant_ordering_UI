export async function generateTableQr(customerUrl) {
  const url = new URL(customerUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("The customer link must use HTTP or HTTPS.");
  }
  const { default: QRCode } = await import("qrcode");
  return QRCode.toDataURL(url.href, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 720,
    color: { dark: "#000000ff", light: "#ffffffff" },
  });
}

export function isLocalCustomerUrl(customerUrl) {
  try {
    return ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(new URL(customerUrl).hostname);
  } catch {
    return false;
  }
}

function drawFittedText(context, text, y, size, weight = 400) {
  do {
    context.font = `${weight} ${size}px sans-serif`;
    size -= 1;
  } while (context.measureText(text).width > 720 && size > 12);
  context.fillText(text, 400, y);
}

export async function downloadTableQr({ qrImage, table, restaurantName }) {
  const image = new Image();
  image.src = qrImage;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 1080;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not create the QR image. Try another browser.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#182022";
  context.textAlign = "center";
  drawFittedText(context, restaurantName, 72, 28, 600);
  drawFittedText(context, `Table ${table.tableNumber}`, 145, 50, 700);
  drawFittedText(context, "Scan to explore the menu & order", 197, 23);
  context.drawImage(image, 40, 235, 720, 720);
  drawFittedText(context, "One table. One shared order session.", 1005, 22);
  drawFittedText(context, new URL(table.qrCodeUrl).host, 1044, 16);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not prepare the download. Please try again.");
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  const label = table.tableNumber.replace(/[^a-z0-9_-]+/gi, "-");
  link.download = `table-${label || table.id.slice(0, 8)}-qr.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Keep the URL alive until the browser has started consuming the download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}
