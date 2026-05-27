/**
 * Shared types used across all service functions.
 *
 * Services receive an already-authenticated user object from the route layer.
 * They never call requireRole() or getAuthSession() themselves.
 */

export type AuthUser = {
  id: string;
  organizationId: string;
  role: string;
};
