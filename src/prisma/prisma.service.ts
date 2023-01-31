import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private cfg: ConfigService) {
    super({
      datasources: {
        db: {
          url: cfg.get('DATABASE_URL'),
        },
      },
    });
  }

  cleanDb() {
    if (process.env.NODE_ENV === 'production') return Promise.resolve();
    return this.$transaction([
      this.bookmark.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
