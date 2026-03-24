import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
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
import { SetPriceDto } from './dto/set-price.dto';
import { CreateVegetableDto } from './dto/create-vegetable.dto';
import { UpdateVegetableDto } from './dto/update-vegetable.dto';
import { VegetablesQueryDto } from './dto/vegetables-query.dto';
import { PriceService } from './price.service';
import { VegetablesService } from './vegetables.service';

@ApiTags('Vegetables')
@ApiBearerAuth()
@Controller('vegetables')
export class VegetablesController {
  constructor(
    private readonly vegetablesService: VegetablesService,
    private readonly priceService: PriceService,
  ) {}

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'body',
    key: 'gardenId',
  })
  @Post()
  @ApiOperation({ summary: 'Create a vegetable' })
  create(@Body() dto: CreateVegetableDto) {
    return this.vegetablesService.create(dto);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'garden',
    source: 'query',
    key: 'gardenId',
  })
  @Get()
  @ApiOperation({ summary: 'Get vegetables by garden' })
  findAll(
    @Query() query: VegetablesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vegetablesService.findAll(query.gardenId, user);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'vegetable',
    source: 'param',
    key: 'id',
  })
  @Put(':id')
  @ApiOperation({ summary: 'Update a vegetable' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVegetableDto,
  ) {
    return this.vegetablesService.update(id, dto);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'vegetable',
    source: 'param',
    key: 'id',
  })
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a vegetable' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vegetablesService.softDelete(id);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'vegetable',
    source: 'param',
    key: 'id',
  })
  @Post(':id/price')
  @ApiOperation({ summary: 'Set price for a vegetable' })
  createPrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetPriceDto,
  ) {
    return this.priceService.createPrice(id, dto);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'vegetable',
    source: 'param',
    key: 'id',
  })
  @Put(':id/price')
  @ApiOperation({ summary: 'Update price for a vegetable' })
  updatePrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetPriceDto,
  ) {
    return this.priceService.updatePrice(id, dto);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'vegetable',
    source: 'param',
    key: 'id',
  })
  @Delete(':id/price')
  @ApiOperation({ summary: 'Delete price for a vegetable' })
  deletePrice(@Param('id', ParseIntPipe) id: number) {
    return this.priceService.deletePrice(id);
  }

  @UseGuards(GardenOwnershipGuard)
  @CheckOwnership({
    resource: 'vegetable',
    source: 'param',
    key: 'id',
  })
  @Get(':id/price')
  @ApiOperation({ summary: 'Get current price of a vegetable' })
  getPrice(@Param('id', ParseIntPipe) id: number) {
    return this.priceService.getPrice(id);
  }
}

