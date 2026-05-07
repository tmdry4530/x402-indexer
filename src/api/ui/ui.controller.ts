import { Controller, Get, Redirect } from '@nestjs/common';
import { API_ROUTES } from '../routes.js';

@Controller()
export class UiController {
  @Get(API_ROUTES.ui.root)
  @Redirect(API_ROUTES.ui.target)
  public root(): void {}

  @Get(API_ROUTES.ui.redirect)
  @Redirect(API_ROUTES.ui.target)
  public ui(): void {}
}
