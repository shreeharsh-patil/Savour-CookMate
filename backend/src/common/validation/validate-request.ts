import { BadRequestException } from "@nestjs/common";
import { ZodSchema } from "zod";

/**
 * Validates untrusted request payloads against a Zod schema.
 * Throws a clean, structured BadRequestException (HTTP 400) if validation fails.
 */
export function validateRequest<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues?.[0];
    const path = firstIssue?.path && firstIssue.path.length > 0 ? `${firstIssue.path.join(".")}: ` : "";
    const message = firstIssue?.message || "Invalid request payload";
    throw new BadRequestException(`${path}${message}`);
  }
  return result.data;
}
