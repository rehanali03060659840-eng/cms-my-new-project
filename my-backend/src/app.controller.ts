import { Controller, Get } from '@nestjs/common';
@Controller()
export class AppController {
  @Get('api/test')
  getTest() {
    return { message: 'Sussfully conected backed into fronted' };
  }
  // @Get('api/products')
  // getAllproducts() {
  //   return this.productServices.getAllproducts();
  // }
}
