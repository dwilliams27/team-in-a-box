export interface AuthenticatedRequest extends Request {
  token?: string;
}
