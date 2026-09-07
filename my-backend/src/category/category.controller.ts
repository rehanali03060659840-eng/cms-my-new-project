import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@UseGuards(JwtAuthGuard)

@Controller('category')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN, )
export class CategoryController {
    constructor(private readonly categoryService: CategoryService){}
 
    @Post()
    create(@Body() data:any){
        return this.categoryService.create(data);
    }


    @Get()
    findAll() {
        return this.categoryService.findAll();
    }


    @Get(':id')
    findOne(@Param('id') id:string){
        return this.categoryService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() data: any
    ){
        return this.categoryService.update(id, data)
    }


    @Delete(':id')
    remove(@Param('id') id: string){
        return this.categoryService.remove(id)
        }
}


