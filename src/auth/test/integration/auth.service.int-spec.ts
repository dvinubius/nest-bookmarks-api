import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthDto } from '../../dto';
import { AuthService } from '../../auth.service';
import { HttpStatus } from '@nestjs/common';

describe('AuthService', () => {
  let prisma: PrismaService;
  let authService: AuthService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    authService = moduleRef.get(AuthService);
    await prisma.cleanDb();
  });

  describe('create user', () => {
    const createUserDto: AuthDto = {
      email: 'dinu@dinu.com',
      password: '1234',
    };
    it('should create user', async () => {
      await authService.signup(createUserDto);
      const user = await prisma.user.findFirst({
        where: { email: createUserDto.email },
      });
      expect(user).toBeDefined();
    });

    it('should throw if email not unique', async () => {
      // attempt to create once more with same email
      try {
        await authService.signup(createUserDto);
      } catch (error) {
        expect(error.status).toBe(HttpStatus.FORBIDDEN);
      }
    });
  });
});
