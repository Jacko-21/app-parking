import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import type { TenantContext } from "@bingoz/domain";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { IncidentService } from "./incident.service";
import {
  type CreateIncidentDto,
  type ListIncidentsDto,
  type UpdateIncidentDto,
} from "./dto/incident.dto";

@Roles("admin", "gestionnaire", "agent")
@Controller("incidents")
export class IncidentController {
  constructor(private readonly incidents: IncidentService) {}

  @Post()
  create(@CurrentTenant() context: TenantContext, @Body() body: CreateIncidentDto) {
    return this.incidents.createIncident(context, body);
  }

  @Get()
  list(@CurrentTenant() context: TenantContext, @Query() query: ListIncidentsDto) {
    return this.incidents.listIncidents(context, query);
  }

  @Patch(":incidentId")
  update(
    @CurrentTenant() context: TenantContext,
    @Param("incidentId") incidentId: string,
    @Body() body: UpdateIncidentDto,
  ) {
    return this.incidents.updateIncident(context, incidentId, body);
  }
}
