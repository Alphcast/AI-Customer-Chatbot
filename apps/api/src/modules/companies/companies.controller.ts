import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {}
