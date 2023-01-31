import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthDto } from '../../../auth/dto';
import { AuthService } from '../../../auth/auth.service';
import { Bookmark } from '@prisma/client';
import { assert } from 'console';
import { HttpStatus } from '@nestjs/common';
import { UserService } from '../../user.service';
import { EditUserDto } from '../../dto/edit-user.dto';

describe('UserService', () => {
  let prisma: PrismaService;
  let authService: AuthService;
  let userService: UserService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    userService = moduleRef.get(UserService);
    authService = moduleRef.get(AuthService);
    await prisma.cleanDb();
  });

  const createUserDto: AuthDto = {
    email: 'dinu@dinu.com',
    password: '1234',
  };
  const editUserDto: EditUserDto = {
    email: 'dinu2@dinu.com',
    firstName: 'First',
    lastName: 'Last',
  };

  const createUser = async () => {
    const dto = createUserDto;
    await authService.signup(dto);
    const user = await prisma.user.findFirst({
      where: { email: dto.email },
    });
    return user.id;
  };

  describe('edit a user', () => {
    let userId: number;

    it('should create a user', async () => {
      userId = await createUser();
    });

    it('should edit user', async () => {
      const edited = await userService.editUser(userId, editUserDto);
      expect(edited).toBeDefined();
      expect(edited.email).toBe(editUserDto.email);
      expect(edited.firstName).toBe(editUserDto.firstName);
      expect(edited.lastName).toBe(editUserDto.lastName);
    });

    // TODO email no duplicate
  });
});
