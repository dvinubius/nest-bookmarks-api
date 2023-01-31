import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto/auth.dto';
import { CreateBookmarkDto } from '../src/bookmark/dto/create-bookmark.dto';
import { EditBookmarkDto } from '../src/bookmark/dto/edit-bookmark.dto';

describe('App e2e', () => {
  let app: NestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);
    prisma = app.get(PrismaService);

    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  const authDto: AuthDto = {
    email: 'dinu@dinu.com',
    password: '123',
  };
  describe('Auth', () => {
    describe('Signup', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: authDto.password,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: authDto.email,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(authDto)
          .expectStatus(HttpStatus.CREATED)
          .expectBodyContains('access_token')
          .expectBodyContains('refresh_token');
      });
    });
    describe('Signin', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: authDto.password,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: authDto.email,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw if wrong credentials', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: authDto.email,
            password: authDto.password + 'x',
          })
          .expectStatus(HttpStatus.FORBIDDEN);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(authDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('access_token')
          .expectBodyContains('refresh_token')
          .stores('userAT', 'access_token')
          .stores('userRT', 'refresh_token');
      });
    });

    describe('refresh tokens', () => {
      it('should return new access and refresh token on refresh with current refresh token', async () => {
        return pactum
          .spec()
          .post('/auth/refresh')
          .withHeaders({
            Authorization: 'Bearer $S{userRT}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('access_token')
          .expectBodyContains('refresh_token')
          .stores('userAT', 'access_token')
          .stores('userRT', 'refresh_token');
      });

      it('should throw on refresh attempt with access token', async () => {
        return pactum
          .spec()
          .post('/auth/refresh')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should throw on refresh without any token', async () => {
        return pactum
          .spec()
          .post('/auth/refresh')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('log out', () => {
      it('should be able to log out', () => {
        return pactum
          .spec()
          .post('/auth/logout')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.OK);
      });

      it('should throw on attempt to refresh token after logout', () => {
        return pactum
          .spec()
          .post('/auth/refresh')
          .withHeaders({
            Authorization: 'Bearer $S{userRT}',
          })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });
  describe('Users', () => {
    describe('Get me', () => {
      it('should sign in again', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(authDto)
          .stores('userAT', 'access_token')
          .stores('userRT', 'refresh_token');
      });

      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.OK)
          .stores('userId', 'id');
      });

      it('should only get user info if logged in', () => {
        return pactum
          .spec()
          .get('/users/me')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
    describe('Edit user', () => {
      it('should edit user', () => {
        const dto = {
          lastName: 'B',
          email: 'dinu222@dinu.com',
        };
        return pactum
          .spec()
          .patch('/users/{id}')
          .withPathParams('id', '$S{userId}')
          .withBody(dto)
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(dto.lastName)
          .expectBodyContains(dto.email);
      });

      it('should only edit user if logged in', () => {
        return pactum
          .spec()
          .patch('/users/{id}')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });
  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'titleCreate1',
        description: 'descriptionCreate1',
        link: 'http://linkcreate1.com',
      };
      it('should create a bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBody(dto)
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.CREATED)
          .stores('bookmarkId', 'id');
      });
      it('should only create a bookmark if logged in', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });

      it('should only get bookmarks if logged in', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}');
      });

      it('should only get bookmark by id if logged in', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'titleEdit1',
        description: 'descriptionEdit1',
        link: 'http://linkedit1.com',
      };
      it('should edit a bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonLike({
            ...dto,
          });
      });
      it('should only edit bookmark by id if logged in', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
    describe('Delete bookmark by id', () => {
      it('should delete a bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should only delete bookmark by id if logged in', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
