import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CheckOwnership } from '../../common/decorators/ownership.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GardenOwnershipGuard } from '../../common/guards/garden-ownership.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateGardenDto } from './dto/create-garden.dto';
import { UpdateGardenDto } from './dto/update-garden.dto';
import { GardensService } from './gardens.service';

@ApiTags('Gardens')
@ApiBearerAuth()
@Controller('gardens')
export class GardensController {
  constructor(private readonly gardensService: GardensService) {}

  @Post()
  @ApiOperation({ summary: 'Create a garden' })
  create(
    @Body() dto: CreateGardenDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.gardensService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get gardens' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.gardensService.findAll(user);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'param',
    key: 'id',
  })
  @Get(':id')
  @ApiOperation({ summary: 'Get garden detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gardensService.findOne(id);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'param',
    key: 'id',
  })
  @Put(':id')
  @ApiOperation({ summary: 'Update a garden' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGardenDto,
  ) {
    return this.gardensService.update(id, dto);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'param',
    key: 'id',
  })
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a garden' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gardensService.softDelete(id);
  }
}

