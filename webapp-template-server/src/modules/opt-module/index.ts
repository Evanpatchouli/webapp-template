import { Module } from '@nestjs/common';
import { OPTController } from './opt.controller';
import OPTService from './opt.service';

@Module({
  imports: [],
  controllers: [OPTController],
  providers: [OPTService],
  exports: [OPTService],
})
export class OPTModule {}
