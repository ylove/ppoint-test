import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'This page is not meant to be viewed. Please contact your system administrator.'
  }
}
