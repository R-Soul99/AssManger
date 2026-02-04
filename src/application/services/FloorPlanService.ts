import { v4 as uuidv4 } from 'uuid';
import { IFloorPlanRepository } from '@/infrastructure/repositories/interfaces';
import { FloorPlan } from '@/domain/entities';
import type { FloorPlanData } from '@/domain/validators';
import type { ServiceResult } from './AssetService';

export interface ImportFloorPlanDto {
  name?: string;
  locationId?: string;
  imageRelativePath: string;
  imageWidth: number;
  imageHeight: number;
}

export interface UpdateFloorPlanDto {
  name?: string;
  locationId?: string | null;
}

export class FloorPlanService {
  constructor(private floorPlanRepo: IFloorPlanRepository) {}

  async importFloorPlan(dto: ImportFloorPlanDto): Promise<ServiceResult<FloorPlan>> {
    try {
      const floorPlanData: FloorPlanData = {
        id: uuidv4(),
        name: dto.name || 'Untitled Floor Plan',
        locationId: dto.locationId ?? null,
        imageRelativePath: dto.imageRelativePath,
        imageWidth: dto.imageWidth,
        imageHeight: dto.imageHeight,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = FloorPlan.create(floorPlanData);
      if (!result.success) {
        return { success: false, error: result.errors.join(', ') };
      }

      await this.floorPlanRepo.save(floorPlanData);
      return { success: true, data: result.entity };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import floor plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async updateFloorPlan(id: string, dto: UpdateFloorPlanDto): Promise<ServiceResult> {
    try {
      const existing = await this.floorPlanRepo.findById(id);
      if (!existing) {
        return { success: false, error: `Floor plan not found: ${id}` };
      }

      await this.floorPlanRepo.update(id, {
        ...dto,
        updatedAt: new Date(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update floor plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async deleteFloorPlan(id: string): Promise<ServiceResult<{ hadMarkers: boolean }>> {
    try {
      const existing = await this.floorPlanRepo.findById(id);
      if (!existing) {
        return { success: false, error: `Floor plan not found: ${id}` };
      }

      const hadMarkers = await this.floorPlanRepo.hasMarkers(id);
      await this.floorPlanRepo.delete(id);

      return { success: true, data: { hadMarkers } };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete floor plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getFloorPlanById(id: string): Promise<ServiceResult<FloorPlan>> {
    try {
      const floorPlan = await this.floorPlanRepo.findById(id);
      if (!floorPlan) {
        return { success: false, error: `Floor plan not found: ${id}` };
      }
      return { success: true, data: floorPlan };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get floor plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getAllFloorPlans(): Promise<ServiceResult<FloorPlan[]>> {
    try {
      const floorPlans = await this.floorPlanRepo.findAll();
      return { success: true, data: floorPlans };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get floor plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getUnassignedFloorPlans(): Promise<ServiceResult<FloorPlan[]>> {
    try {
      const floorPlans = await this.floorPlanRepo.findUnassigned();
      return { success: true, data: floorPlans };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get unassigned floor plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async reorderFloorPlans(locationId: string, orderedIds: string[]): Promise<ServiceResult> {
    try {
      await this.floorPlanRepo.reorder(locationId, orderedIds);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reorder floor plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getMarkerCount(id: string): Promise<ServiceResult<number>> {
    try {
      const count = await this.floorPlanRepo.getMarkerCount(id);
      return { success: true, data: count };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get marker count: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async hasMarkers(id: string): Promise<ServiceResult<boolean>> {
    try {
      const hasMarkers = await this.floorPlanRepo.hasMarkers(id);
      return { success: true, data: hasMarkers };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check markers: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
