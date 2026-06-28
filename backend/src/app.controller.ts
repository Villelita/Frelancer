import { Controller, Get, Header } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getAdminDashboard(): string {
    const htmlPath = path.join(process.cwd(), 'src', 'admin.html');
    return fs.readFileSync(htmlPath, 'utf8');
  }
}
