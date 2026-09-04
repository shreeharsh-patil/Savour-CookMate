import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ENV } from "../../config/env.config";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

let isFirebaseInitialized = false;

function initFirebaseAdmin() {
  if (!isFirebaseInitialized && ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
    try {
      if (getApps().length === 0) {
        initializeApp({
          credential: cert({
            projectId: ENV.FIREBASE_PROJECT_ID,
            clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
            privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
        });
      }
      isFirebaseInitialized = true;
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (err) {
      console.warn("Firebase Admin init warning:", err);
    }
  }
}

initFirebaseAdmin();

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  isGuest: boolean;
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"] || request.headers["Authorization"];

    if (!authHeader) {
      if (isPublic) {
        request.user = {
          userId: "guest_anonymous",
          displayName: "Guest Chef",
          isGuest: true,
        } as AuthenticatedUser;
        return true;
      }
      throw new UnauthorizedException("Authentication token is missing.");
    }

    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : String(authHeader).trim();

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException("Empty bearer token provided.");
    }

    // Handle guest sessions
    if (token.startsWith("guest_") || token === "guest") {
      request.user = {
        userId: token === "guest" ? "guest_default" : token,
        displayName: "Guest Chef",
        isGuest: true,
      } as AuthenticatedUser;
      return true;
    }

    // Verify Firebase token if initialized
    if (isFirebaseInitialized) {
      try {
        const decoded = await getAuth().verifyIdToken(token);
        request.user = {
          userId: decoded.uid,
          email: decoded.email,
          displayName: decoded.name || decoded.email?.split("@")[0] || "Chef",
          avatar: decoded.picture,
          isGuest: false,
        } as AuthenticatedUser;
        return true;
      } catch (err) {
        if (isPublic) {
          request.user = { userId: "guest_anonymous", isGuest: true };
          return true;
        }
        throw new UnauthorizedException("Invalid or expired authentication token.");
      }
    } else {
      request.user = {
        userId: token.startsWith("usr_") ? token : `usr_${token.slice(0, 16)}`,
        displayName: "Home Cook",
        isGuest: false,
      } as AuthenticatedUser;
      return true;
    }
  }
}
