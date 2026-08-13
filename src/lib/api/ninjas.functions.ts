import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// API Ninjas integrations. All calls run server-side so the API key never
// reaches the browser.

export const generatePassword = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      length: z.number().int().min(6).max(64).default(16),
      excludeSpecialChars: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    const { ninjaJson } = await import("./ninjas.server");
    const qs = new URLSearchParams({
      length: String(data.length),
      exclude_special_chars: String(data.excludeSpecialChars),
    });
    return ninjaJson<{ random_password: string }>(`passwordgenerator?${qs}`);
  });

export const generateQrCode = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      data: z.string().min(1).max(500),
      fgColor: z.string().regex(/^[0-9a-fA-F]{6}$/).default("000000"),
      bgColor: z.string().regex(/^[0-9a-fA-F]{6}$/).default("ffffff"),
    }),
  )
  .handler(async ({ data }) => {
    const { ninjaImage } = await import("./ninjas.server");
    const qs = new URLSearchParams({
      data: data.data,
      format: "png",
      fg_color: data.fgColor,
      bg_color: data.bgColor,
    });
    return ninjaImage(`qrcode?${qs}`);
  });

export const generateBarcode = createServerFn({ method: "POST" })
  .inputValidator(z.object({ value: z.string().min(6).max(64) }))
  .handler(async ({ data }) => {
    const { ninjaImage } = await import("./ninjas.server");
    const qs = new URLSearchParams({ data: data.value, format: "png" });
    return ninjaImage(`barcode?${qs}`);
  });

export const validateVat = createServerFn({ method: "POST" })
  .inputValidator(z.object({ vat: z.string().min(4).max(32) }))
  .handler(async ({ data }) => {
    const { ninjaJson } = await import("./ninjas.server");
    const qs = new URLSearchParams({ vat: data.vat });
    return ninjaJson<Record<string, unknown>>(`vatvalidation?${qs}`);
  });

export const getUnemployment = createServerFn({ method: "POST" })
  .inputValidator(z.object({ country: z.string().min(2).max(64).default("south africa") }))
  .handler(async ({ data }) => {
    const { ninjaJson } = await import("./ninjas.server");
    const qs = new URLSearchParams({ country: data.country });
    return ninjaJson<Array<Record<string, unknown>>>(`unemployment?${qs}`);
  });

export const lookupIp = createServerFn({ method: "POST" })
  .inputValidator(z.object({ address: z.string().min(3).max(64) }))
  .handler(async ({ data }) => {
    const { ninjaJson } = await import("./ninjas.server");
    const qs = new URLSearchParams({ address: data.address });
    return ninjaJson<Record<string, unknown>>(`iplookup?${qs}`);
  });
