import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Agents')
@Controller('agents')
export class AgentsController {}
