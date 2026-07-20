import { Department } from './department.model';
import { Specialization } from './specialization.model';
import { ApiError } from '../../errors/ApiError';

class SystemService {
  // --- Departments ---
  public async getDepartments(activeOnly: boolean = false) {
    const query = activeOnly ? { isActive: true } : {};
    return Department.find(query).sort({ name: 1 });
  }

  public async createDepartment(name: string) {
    const existing = await Department.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      throw new ApiError(409, 'Department already exists');
    }
    return Department.create({ name });
  }

  public async updateDepartment(id: string, updates: Partial<{ name: string; isActive: boolean }>) {
    if (updates.name) {
      const existing = await Department.findOne({ name: new RegExp(`^${updates.name}$`, 'i'), _id: { $ne: id } });
      if (existing) throw new ApiError(409, 'Department name already exists');
    }
    const dept = await Department.findByIdAndUpdate(id, updates, { new: true });
    if (!dept) throw new ApiError(404, 'Department not found');
    return dept;
  }

  public async deleteDepartment(id: string) {
    const dept = await Department.findByIdAndDelete(id);
    if (!dept) throw new ApiError(404, 'Department not found');
    return dept;
  }

  // --- Specializations ---
  public async getSpecializations(activeOnly: boolean = false) {
    const query = activeOnly ? { isActive: true } : {};
    return Specialization.find(query).sort({ name: 1 });
  }

  public async createSpecialization(name: string) {
    const existing = await Specialization.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      throw new ApiError(409, 'Specialization already exists');
    }
    return Specialization.create({ name });
  }

  public async updateSpecialization(id: string, updates: Partial<{ name: string; isActive: boolean }>) {
    if (updates.name) {
      const existing = await Specialization.findOne({ name: new RegExp(`^${updates.name}$`, 'i'), _id: { $ne: id } });
      if (existing) throw new ApiError(409, 'Specialization name already exists');
    }
    const spec = await Specialization.findByIdAndUpdate(id, updates, { new: true });
    if (!spec) throw new ApiError(404, 'Specialization not found');
    return spec;
  }

  public async deleteSpecialization(id: string) {
    const spec = await Specialization.findByIdAndDelete(id);
    if (!spec) throw new ApiError(404, 'Specialization not found');
    return spec;
  }
}

export const systemService = new SystemService();
