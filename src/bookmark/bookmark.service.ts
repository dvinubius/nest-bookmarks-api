import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookmarkDto } from './dto';
import { EditBookmarkDto } from './dto/edit-bookmark.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  createBookmark(userId: number, dto: CreateBookmarkDto) {
    return this.prisma.bookmark.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
      },
    });
  }

  getBookmarkById(userId: number, bookmarkId: number) {
    return this.prisma.bookmark.findFirst({
      where: {
        userId,
        id: bookmarkId,
      },
    });
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: EditBookmarkDto,
  ) {
    let bookmark = await this.prisma.bookmark.findFirst({
      where: { userId, id: bookmarkId },
    });
    if (!bookmark) {
      throw new BadRequestException('Bookmark not found for this user');
    }
    bookmark = await this.prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { ...dto },
    });
    return bookmark;
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    let bookmark = await this.prisma.bookmark.findFirst({
      where: { userId, id: bookmarkId },
    });
    if (!bookmark) {
      throw new BadRequestException('Bookmark not found for this user');
    }
    bookmark = await this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
    return bookmark;
  }
}
