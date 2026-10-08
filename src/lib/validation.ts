import { z } from "zod";
import { getAirport } from "@/lib/catalog/airports";
import { isIsoDate } from "@/lib/dates";

/** Shared Zod schemas for forms, server actions and API routes. */

export const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(200),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(80),
  email,
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(200)
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/\d/, "Include at least one number"),
  homeAirport: z.string().trim().toUpperCase().refine((c) => !!getAirport(c), "Choose an airport").optional(),
});

export const iataCode = z
  .string()
  .trim()
  .toUpperCase()
  .refine((c) => !!getAirport(c), "Unknown airport");

export const dealIdSchema = z.string().trim().min(5).max(80).regex(/^[A-Za-z0-9-]+$/, "Invalid deal id");

export const favoriteSchema = z.object({ dealId: dealIdSchema });

export const ALERT_FLEXIBILITY = ["EXACT", "PLUS_MINUS_3", "ANY"] as const;
export const ALERT_DURATIONS = ["ANY", "WEEKEND", "SHORT", "WEEK", "TWO_WEEKS"] as const;
export const ALERT_CABINS = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"] as const;

export const alertSchema = z
  .object({
    origin: iataCode,
    destination: z.union([iataCode, z.literal("ANYWHERE")]).nullable().optional(),
    maxPrice: z.coerce.number().int("Whole dollars only").min(20, "Minimum is $20").max(20_000, "Maximum is $20,000"),
    dateFlexibility: z.enum(ALERT_FLEXIBILITY).default("ANY"),
    departureDate: z
      .string()
      .refine(isIsoDate, "Choose a valid date")
      .nullable()
      .optional(),
    tripDuration: z.enum(ALERT_DURATIONS).default("ANY"),
    maxStops: z.coerce.number().int().min(0).max(2).nullable().optional(),
    cabin: z.enum(ALERT_CABINS).default("ECONOMY"),
  })
  .superRefine((value, ctx) => {
    if (value.destination && value.destination !== "ANYWHERE" && value.destination === value.origin) {
      ctx.addIssue({ code: "custom", path: ["destination"], message: "Destination must differ from origin" });
    }
    if (value.dateFlexibility !== "ANY" && !value.departureDate) {
      ctx.addIssue({ code: "custom", path: ["departureDate"], message: "Pick a departure date or choose “Any time”" });
    }
  });

export type AlertInput = z.infer<typeof alertSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  homeAirport: iataCode,
});

/** Flatten Zod issues into { field: message } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
