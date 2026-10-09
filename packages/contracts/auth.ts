import { z } from 'zod';

export const AgencyLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type AgencyLoginInput = z.infer<typeof AgencyLoginSchema>;

export const ClientOtpRequestSchema = z.object({
  phone: z.string().min(8).max(20),
});
export type ClientOtpRequestInput = z.infer<typeof ClientOtpRequestSchema>;

export const ClientOtpVerifySchema = z.object({
  phone: z.string().min(8).max(20),
  otp: z.string().length(6),
});
export type ClientOtpVerifyInput = z.infer<typeof ClientOtpVerifySchema>;

export const RefreshSchema = z.object({
  refreshToken: z.string().min(20),
});
export type RefreshInput = z.infer<typeof RefreshSchema>;
