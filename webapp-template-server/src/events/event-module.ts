import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserEventsListener } from './user.login.event.listener';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [UserEventsListener],
  exports: [EventEmitterModule],
})
export class EventModule {}
