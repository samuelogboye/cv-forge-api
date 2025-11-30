import { Module } from '@nestjs/common';
import { CVController } from './cv.controller';
import { CVService } from './cv.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CVController],
  providers: [CVService],
  exports: [CVService],
})
export class CVModule {}
