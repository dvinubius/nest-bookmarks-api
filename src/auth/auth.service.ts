import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cfg: ConfigService,
  ) {}

  async signup(dto: AuthDto): Promise<Tokens> {
    const hash = await argon.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });
      const tokens = await this._tokenPayload(user.id, dto.email);
      this._updateRtHash(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
        throw error;
      }
    }
  }

  async signin(dto: AuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }
    const match = await argon.verify(user.hash, dto.password);
    if (!match) {
      throw new ForbiddenException('Credentials incorrect');
    }
    const tokens = await this._tokenPayload(user.id, dto.email);
    this._updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: number) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        rtHash: {
          not: null,
        },
      },
      data: {
        rtHash: null,
      },
    });
  }

  async refreshTokens(userId: number, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
    });
    // user should exist since userId is extracted from the bearer token in the request
    const matches = await argon.verify(user.rtHash, rt);
    if (!matches) {
      throw new UnauthorizedException('Refreshtoken invalid');
    }
    const tokens = this._tokenPayload(userId, user.email);
    this._updateRtHash(userId, (await tokens).refresh_token);
    return tokens;
  }

  private async _updateRtHash(userId: number, rt: string) {
    const rtHash = await argon.hash(rt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { rtHash },
    });
  }

  private async _tokenPayload(userId: number, email: string): Promise<Tokens> {
    const data = { sub: userId, email };
    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(data, {
        expiresIn: '15m',
        secret: this.cfg.get('AT_SECRET'),
      }),
      this.jwt.signAsync(data, {
        expiresIn: '7d',
        secret: this.cfg.get('RT_SECRET'),
      }),
    ]);
    return {
      access_token,
      refresh_token,
    };
  }
}
