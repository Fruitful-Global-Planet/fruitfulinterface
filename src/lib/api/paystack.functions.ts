import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Client-callable Paystack server functions. Verification runs server-side so
// the secret key never reaches the browser (see paystack.server.ts).

export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator(z.object({ reference: z.string().min(6).max(64) }))
  .handler(async ({ data }) => {
    try {
      const { paystackVerify } = await import("./paystack.server");
      const result = await paystackVerify(data.reference);
      const paid = result.status === true && result.data?.status === "success";
      return { ok: true as const, paid, data: result.data ?? null };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  });
