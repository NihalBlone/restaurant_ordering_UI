import assert from "node:assert/strict";
import test from "node:test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { generateTableQr, isLocalCustomerUrl } from "../src/services/tableQr.js";

test("QR PNG decodes to the exact table customer link", async () => {
  const url = "https://order.example.com/menu?tableId=229a2a1c-1ba4-457c-8c4e-66bc3e5691e9";
  const dataUrl = await generateTableQr(url);
  assert.ok(dataUrl.startsWith("data:image/png;base64,"));
  const png = PNG.sync.read(Buffer.from(dataUrl.split(",")[1], "base64"));
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  assert.equal(decoded?.data, url);
  assert.equal(png.width, 720);
  assert.equal(png.height, 720);
  assert.deepEqual([...png.data.subarray(0, 4)], [255, 255, 255, 255]);
});

test("rejects unsafe and missing QR URLs", async () => {
  await assert.rejects(generateTableQr("javascript:alert(1)"), /HTTP or HTTPS/);
  await assert.rejects(generateTableQr(""));
});

test("warns for loopback links but not usable LAN or public links", () => {
  assert.equal(isLocalCustomerUrl("http://localhost:5173/menu"), true);
  assert.equal(isLocalCustomerUrl("http://127.0.0.1:5173/menu"), true);
  assert.equal(isLocalCustomerUrl("http://[::1]:5173/menu"), true);
  assert.equal(isLocalCustomerUrl("http://192.168.1.20:5173/menu"), false);
  assert.equal(isLocalCustomerUrl("https://order.example.com/menu"), false);
  assert.equal(isLocalCustomerUrl("invalid"), false);
});
