import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { JwtGuard } from './guard/jwt.guard';
import { User } from '@prisma/client';
import { GetUser } from './decorator/get-user.decorator';
import { Tokens } from './types/tokens';
import { JwtRefreshGuard } from './guard';

@Controller('auth')
export class AuthController {
  constructor(private authSvc: AuthService) {}

  @Post('signup')
  signup(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authSvc.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authSvc.signin(dto);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@GetUser('id') userId: number) {
    return this.authSvc.logout(userId);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetUser('id') userId: number,
    @GetUser('refreshToken') rt: any,
  ) {
    return this.authSvc.refreshTokens(userId, rt);
  }
}
