import { DoctorSchedule } from '../appointments/doctor-schedule.model';
import { User, Role } from '../users/user.model';
import { Doctor } from '../users/doctor.model';
import { Receptionist } from '../users/receptionist.model';
import { hashPassword } from '../../utils/password.util';
import { ApiError } from '../../errors/ApiError';

class AdminService {
  public async createDoctor(data: any, adminId: string) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);

    const user = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: Role.DOCTOR,
      mobile: data.mobile,
      createdBy: adminId,
    });

    await user.save();

    const doctor = new Doctor({
      user: user._id,
      specialization: data.specialization,
      experienceYears: data.experienceYears,
      qualifications: data.qualifications,
      department: data.department,
      consultationFee: data.consultationFee,
    });

    await doctor.save();

    // Remove sensitive fields before returning
    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;

    return {
      user: userResponse,
      profile: doctor,
    };
  }

  public async createReceptionist(data: any, adminId: string) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);

    const user = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: Role.RECEPTIONIST,
      mobile: data.mobile,
      createdBy: adminId,
    });

    await user.save();

    const receptionist = new Receptionist({
      user: user._id,
      shiftTimings: data.shiftTimings,
      languagesSpoken: data.languagesSpoken,
      deskNumber: data.deskNumber,
      emergencyContact: data.emergencyContact,
    });

    await receptionist.save();

    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;

    return {
      user: userResponse,
      profile: receptionist,
    };
  }

  public async getDoctorSchedule(doctorId: string) {
    const schedules = await DoctorSchedule.find({ doctor: doctorId });
    return schedules;
  }

  public async updateDoctorSchedule(doctorId: string, schedules: any[]) {
    // 1. Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new ApiError(404, 'Doctor not found');
    }

    const updatedSchedules = [];

    // 2. Upsert each schedule
    for (const sched of schedules) {
      const { dayOfWeek, slotDuration, sessions } = sched;

      const updated = await DoctorSchedule.findOneAndUpdate(
        { doctor: doctorId, dayOfWeek },
        { sessions, slotDuration },
        { new: true, upsert: true }
      );
      updatedSchedules.push(updated);
    }

    return updatedSchedules;
  }

  public async updateUserPermissions(userId: string, permissions?: string[]) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.permissions = permissions; // can be undefined to reset
    await user.save();

    return {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions
      }
    };
  }

  public async getDoctors(query: { page?: number; limit?: number; search?: string; includeInactive?: boolean }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' }
    ];

    if (!query.includeInactive) {
      pipeline.push({ $match: { 'userData.isActive': true } });
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { specialization: { $regex: searchRegex } },
            { 'userData.firstName': { $regex: searchRegex } },
            { 'userData.lastName': { $regex: searchRegex } }
          ]
        }
      });
    }

    // Count total documents for pagination before applying skip/limit
    const countPipeline = [...pipeline, { $count: 'total' }];
    
    // Sort, skip, limit
    pipeline.push({ $sort: { 'userData.firstName': 1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    // Project only necessary fields
    pipeline.push({
      $project: {
        _id: 1,
        specialization: 1,
        department: 1,
        experienceYears: 1,
        qualifications: 1,
        consultationFee: 1,
        'user': {
          _id: '$userData._id',
          firstName: '$userData.firstName',
          lastName: '$userData.lastName',
          email: '$userData.email',
          employeeID: '$userData.employeeID',
          mobile: '$userData.mobile',
          isActive: '$userData.isActive'
        }
      }
    });

    const [doctors, countResult] = await Promise.all([
      Doctor.aggregate(pipeline),
      Doctor.aggregate(countPipeline)
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;

    return {
      doctors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  public async updateDoctor(doctorId: string, data: any) {
    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor || !doctor.user) {
      throw new ApiError(404, 'Doctor not found');
    }

    const user = doctor.user as any;

    if (data.email && data.email !== user.email) {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new ApiError(409, 'User with this email already exists');
      }
    }

    // Update User fields
    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.email) user.email = data.email;
    if (data.mobile !== undefined) user.mobile = data.mobile;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    await user.save();

    // Update Doctor fields
    if (data.specialization) doctor.specialization = data.specialization;
    if (data.experienceYears !== undefined) doctor.experienceYears = data.experienceYears;
    if (data.qualifications) doctor.qualifications = data.qualifications;
    if (data.department) doctor.department = data.department;
    if (data.consultationFee !== undefined) doctor.consultationFee = data.consultationFee;
    await doctor.save();

    return {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile
      },
      profile: doctor
    };
  }

  public async deleteDoctor(doctorId: string) {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new ApiError(404, 'Doctor not found');
    }

    const user = await User.findById(doctor.user);
    if (user) {
      user.isActive = false;
      await user.save();
    }

    return { success: true };
  }

  public async getReceptionists(query: { page?: number; limit?: number; search?: string; includeInactive?: boolean }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' }
    ];

    if (!query.includeInactive) {
      pipeline.push({ $match: { 'userData.isActive': true } });
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'userData.firstName': searchRegex },
            { 'userData.lastName': searchRegex },
            { 'userData.email': searchRegex },
            { 'userData.employeeID': searchRegex },
            { deskNumber: searchRegex }
          ]
        }
      });
    }

    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Receptionist.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          shiftTimings: 1,
          deskNumber: 1,
          languagesSpoken: 1,
          emergencyContact: 1,
          'user': {
            _id: '$userData._id',
            firstName: '$userData.firstName',
            lastName: '$userData.lastName',
            email: '$userData.email',
            employeeID: '$userData.employeeID',
            mobile: '$userData.mobile',
            isActive: '$userData.isActive'
          }
        }
      }
    );

    const receptionists = await Receptionist.aggregate(pipeline);

    return {
      receptionists,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  public async updateReceptionist(receptionistId: string, data: any) {
    const receptionist = await Receptionist.findById(receptionistId);
    if (!receptionist) {
      throw new ApiError(404, 'Receptionist profile not found');
    }

    const user = await User.findById(receptionist.user);
    if (!user) {
      throw new ApiError(404, 'Associated user not found');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== user.email) {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new ApiError(400, 'Email is already in use');
      }
    }

    // Update User fields
    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.email) user.email = data.email;
    if (data.mobile !== undefined) user.mobile = data.mobile;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    await user.save();

    // Update Receptionist fields
    if (data.shiftTimings) receptionist.shiftTimings = data.shiftTimings;
    if (data.deskNumber !== undefined) receptionist.deskNumber = data.deskNumber;
    if (data.languagesSpoken) receptionist.languagesSpoken = data.languagesSpoken;
    if (data.emergencyContact !== undefined) receptionist.emergencyContact = data.emergencyContact;
    await receptionist.save();

    return {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        employeeID: user.employeeID,
        isActive: user.isActive
      },
      profile: receptionist
    };
  }

  public async deleteReceptionist(receptionistId: string) {
    const receptionist = await Receptionist.findById(receptionistId);
    if (!receptionist) {
      throw new ApiError(404, 'Receptionist profile not found');
    }

    const user = await User.findById(receptionist.user);
    if (user) {
      user.isActive = false;
      await user.save();
    }

    return { success: true };
  }
}

export const adminService = new AdminService();
