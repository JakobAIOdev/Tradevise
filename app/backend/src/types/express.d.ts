import { AccessJwtPayload } from 'src/auth/guards/access-token.guard';

declare global {
  namespace Express {
    interface Request {
      user?: AccessJwtPayload;
      cookies?: Record<string, string>;
    }
  }
}
