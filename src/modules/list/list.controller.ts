import {ZodValidationPipe, createZodDto} from '@anatine/zod-nestjs'
import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common'
import {ApiTags} from '@nestjs/swagger'
import {List, ListType} from 'src/core/types/shelvd.types'
import {z} from 'zod'
import {ClerkService, GetUserByUsernameDTO} from '../clerk/clerk.service'
import {
  CreateListDTO,
  GetCreatedListDTO,
  ListService,
  UpdateListDTO,
} from './list.service'

const GetListByType = z.object({
  type: ListType,
})
class GetListByTypeDTO extends createZodDto(GetListByType) {}

@Controller('list')
@ApiTags('list')
@UsePipes(ZodValidationPipe)
export class ListController {
  constructor(
    private readonly listService: ListService,
    private readonly clerkService: ClerkService,
  ) {}

  @Get('/:type')
  async getListByType(
    @Param() param: GetListByTypeDTO,
    @Query() query: GetUserByUsernameDTO,
  ): Promise<List[]> {
    // Validate user
    const user = await this.clerkService.getUserByUsername(query)
    if (!user) return []

    switch (param.type) {
      case 'core': {
        return this.listService.getAllCoreLists(user)
      }
      case 'created': {
        return this.listService.getAllCreatedLists(user)
      }
      case 'following': {
        return this.listService.getAllCreatedLists(user)
      }
    }
  }

  @Post('/create')
  async createList(@Body() body: CreateListDTO) {
    // Validate user
    const userId = body.creator?.key ?? ''
    const user = await this.clerkService.client.users.getUser(userId)
    if (!user) return []

    return this.listService.createList(body)
  }

  @Put(`/${ListType.enum.created}/update`)
  async updateCreatedList(@Body() body: UpdateListDTO) {
    // Validate user
    const user = await this.clerkService.client.users.getUser(body.userId)
    if (!user) return []

    Logger.log(`ListController/updateCreatedList`, user, body)

    return this.listService.updateCreatedList(body)
  }

  @Put(`/${ListType.enum.created}/delete`)
  async deleteCreatedList(@Body() body: GetCreatedListDTO) {
    // Validate user
    const user = await this.clerkService.client.users.getUser(body.userId)
    if (!user) return []

    Logger.log(`ListController/deleteCreatedList`, user, body)

    return this.listService.deleteCreatedList(body)
  }
}
