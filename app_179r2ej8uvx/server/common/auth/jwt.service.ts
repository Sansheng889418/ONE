import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtAuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
