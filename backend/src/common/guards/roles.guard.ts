import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthenticatedUser } from "./firebase-auth.guard";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user || user.isGuest) {
      throw new ForbiddenException("Administrative access required.");
    }

    const hasRole = requiredRoles.includes(user.role || "");
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient privileges. Required role: ${requiredRoles.join(", ")}`
      );
    }

    return true;
  }
}
