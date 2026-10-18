import { Router } from 'express';
import {
  AgencyLoginSchema, ClientOtpRequestSchema, ClientOtpVerifySchema, RefreshSchema,
} from '@lmms/contracts';
import * as authService from '../services/auth.service';
import { authRateLimit } from '../middleware/authRateLimit';

export const authRouter = Router();

authRouter.post('/agency/login', authRateLimit, async (req, res, next) => {
  try {
    const input = AgencyLoginSchema.parse(req.body);
    res.json(await authService.agencyLogin(input.email, input.password));
  } catch (e) { next(e); }
});

authRouter.post('/client/otp/request', authRateLimit, async (req, res, next) => {
  try {
    const input = ClientOtpRequestSchema.parse(req.body);
    res.json(await authService.requestOtp(input.phone));
  } catch (e) { next(e); }
});

authRouter.post('/client/otp/verify', authRateLimit, async (req, res, next) => {
  try {
    const input = ClientOtpVerifySchema.parse(req.body);
    res.json(await authService.verifyOtpAndLogin(input.phone, input.otp));
  } catch (e) { next(e); }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const input = RefreshSchema.parse(req.body);
    res.json(await authService.refresh(input.refreshToken));
  } catch (e) { next(e); }
});
