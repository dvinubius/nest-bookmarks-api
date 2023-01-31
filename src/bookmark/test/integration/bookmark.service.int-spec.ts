import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthDto } from '../../../auth/dto';
import * as argon from 'argon2';
import { BookmarkService } from '../../bookmark.service';
import { CreateBookmarkDto } from '../../dto/create-bookmark.dto';
import { AuthService } from '../../../auth/auth.service';
import { EditBookmarkDto } from '../../dto/edit-bookmark.dto';
import { Bookmark } from '@prisma/client';
import { assert } from 'console';
import { HttpStatus } from '@nestjs/common';

describe('BookmarkService', () => {
  let prisma: PrismaService;
  let authService: AuthService;
  let bookmarkService: BookmarkService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    bookmarkService = moduleRef.get(BookmarkService);
    authService = moduleRef.get(AuthService);
    await prisma.cleanDb();
  });

  const createUserDto: AuthDto = {
    email: 'dinu@dinu.com',
    password: '1234',
  };
  const createUserDto2: AuthDto = {
    email: 'dinu2@dinu.com',
    password: '1234',
  };
  const createDtos = [createUserDto, createUserDto2];
  const createBookmarkDto: CreateBookmarkDto = {
    title: 'titleCreate1',
    description: 'descriptionCreate1',
    link: 'http://linkcreate1.com',
  };
  const editBookmarkDto: EditBookmarkDto = {
    title: 'titleCreate2',
    description: 'descriptionCreate2',
    link: 'http://linkcreate2.com',
  };

  let userId: number;
  let userId2: number;
  let bookmark: Bookmark;

  const createUser = async (idx: number) => {
    const dto = createDtos[idx];
    await authService.signup(dto);
    const user = await prisma.user.findFirst({
      where: { email: dto.email },
    });
    return user.id;
  };

  describe('create bookmark', () => {
    let userId: number;

    it('should create a user', async () => {
      userId = await createUser(0);
    });

    it('should create bookmark', async () => {
      bookmark = await bookmarkService.createBookmark(
        userId,
        createBookmarkDto,
      );
      expect(bookmark).toBeDefined();
      expect(bookmark.title).toBe(createBookmarkDto.title);
      expect(bookmark.description).toBe(createBookmarkDto.description);
      expect(bookmark.link).toBe(createBookmarkDto.link);
      expect(bookmark.userId).toBe(userId);
    });
  });

  describe('update bookmark', () => {
    it('should update a bookmark by id', async () => {
      const updated = await bookmarkService.editBookmarkById(
        userId,
        bookmark.id,
        editBookmarkDto,
      );
      expect(updated).toBeDefined();
      expect(updated.id).toBe(bookmark.id);
      expect(updated.title).toBe(editBookmarkDto.title);
      expect(updated.description).toBe(editBookmarkDto.description);
      expect(updated.link).toBe(editBookmarkDto.link);
    });

    it('should throw if caller is not the owner of bookmark', async () => {
      // create second user
      userId2 = await createUser(1);
      // user exists, bookmark exists but does not belong to this user
      bookmarkService
        .editBookmarkById(userId2, bookmark.id, editBookmarkDto)
        .then((bm) => expect(bm).toBeUndefined())
        .catch((error) => expect(error.status).toBe(HttpStatus.BAD_REQUEST));
    });

    it('should throw if bookmark does not exist by id', async () => {
      const otherId = bookmark.id + 1;
      assert(
        !(await prisma.bookmark.findFirst({ where: { id: otherId } })),
        'there should be no result',
      );
      // user exists, but bookmark id doesn't
      bookmarkService
        .editBookmarkById(userId, otherId, editBookmarkDto)
        .then((bn) => expect(bn).toBeUndefined())
        .catch((error) => expect(error.status).toBe(HttpStatus.BAD_REQUEST));
    });
  });

  describe('delete bookmark', () => {
    it('should throw if caller is not the owner of bookmark', async () => {
      // attempt delete via second user
      bookmarkService
        .deleteBookmarkById(userId2, bookmark.id)
        .then((bm) => expect(bm).toBeUndefined())
        .catch((error) => expect(error.status).toBe(HttpStatus.BAD_REQUEST));
    });

    it('should throw if bookmark does not exist by id', async () => {
      const otherId = bookmark.id + 1;
      assert(
        !(await prisma.bookmark.findFirst({ where: { id: otherId } })),
        'there should be no result',
      );
      // user exists, but bookmark id doesn't
      bookmarkService
        .deleteBookmarkById(userId, otherId)
        .then((bm) => expect(bm).toBeUndefined())
        .catch((error) => expect(error.status).toBe(HttpStatus.BAD_REQUEST));
    });

    it('should delete a bookmark by id', async () => {
      const deleted = await bookmarkService.deleteBookmarkById(
        userId,
        bookmark.id,
      );
      expect(deleted).toBeDefined();
      const bm = await prisma.bookmark.findFirst({ where: { id: deleted.id } });
      expect(bm).toBeNull();
    });
  });
});
