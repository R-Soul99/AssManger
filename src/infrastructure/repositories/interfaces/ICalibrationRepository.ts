import { Calibration } from '@/domain/entities';
import { CalibrationData } from '@/domain/validators';

export interface ICalibrationRepository {
  findByFloorPlan(floorPlanId: string): Promise<Calibration | null>;
  save(calibration: CalibrationData): Promise<void>;
  update(id: string, data: Partial<CalibrationData>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByFloorPlan(floorPlanId: string): Promise<void>;
  isFloorPlanCalibrated(floorPlanId: string): Promise<boolean>;
}
