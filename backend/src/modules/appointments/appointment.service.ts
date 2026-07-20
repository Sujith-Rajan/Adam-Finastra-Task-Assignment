import mongoose from 'mongoose';
import { Appointment, AppointmentStatus } from './appointment.model';
import { DoctorSchedule } from './doctor-schedule.model';
import { Patient } from '../patients/patient.model';
import { ApiError } from '../../errors/ApiError';

class AppointmentService {
  /**
   * Helper function to generate time slots between a start and end time
   * Format of time strings must be "HH:mm"
   */
  private generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = [];
    
    // Convert string to minutes since midnight
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let currentMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    while (currentMins + durationMinutes <= endMins) {
      const nextMins = currentMins + durationMinutes;
      
      const sH = Math.floor(currentMins / 60).toString().padStart(2, '0');
      const sM = (currentMins % 60).toString().padStart(2, '0');
      
      const eH = Math.floor(nextMins / 60).toString().padStart(2, '0');
      const eM = (nextMins % 60).toString().padStart(2, '0');
      
      slots.push({
        start: `${sH}:${sM}`,
        end: `${eH}:${eM}`
      });
      
      currentMins = nextMins;
    }
    
    return slots;
  }

  public async getAvailableSlots(doctorId: string, dateString: string) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new ApiError(400, 'Invalid date format');
    
    // Get day of week (0 = Sunday, 1 = Monday, etc)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[date.getUTCDay()];

    const schedule = await DoctorSchedule.findOne({ doctor: doctorId, dayOfWeek });
    if (!schedule) {
      return []; // No schedule found, no slots available
    }

    // Generate all theoretical slots
    let allSlots: { start: string; end: string }[] = [];
    for (const session of schedule.sessions) {
      const sessionSlots = this.generateTimeSlots(session.startTime, session.endTime, schedule.slotDuration);
      allSlots = allSlots.concat(sessionSlots);
    }

    // Fetch existing appointments for this doctor on this date
    // Normalize date to start of day for accurate comparison
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: AppointmentStatus.CANCELLED }
    });

    // Create a set of booked start times for O(1) lookup
    const bookedStarts = new Set(existingAppointments.map(app => app.slotStartTime));

    // Filter out booked slots
    const slotsWithAvailability = allSlots.map(slot => ({
      ...slot,
      isAvailable: !bookedStarts.has(slot.start)
    }));

    return slotsWithAvailability;
  }

  public async bookAppointment(data: any) {
    const { 
      doctorId, appointmentDate, slotStartTime, patientId,
      firstName, lastName, phoneNumber, dob, gender,
      email, bloodGroup, maritalStatus, allergies, medicalHistory, emergencyContact, address 
    } = data;

    let patient;

    // 1. Find or Create Patient
    if (patientId) {
      patient = await Patient.findById(patientId);
      if (!patient) throw new ApiError(404, 'Patient not found');
    } else {
      patient = await Patient.findOne({ phoneNumber });
      if (!patient) {
        patient = new Patient({
          firstName,
          lastName,
          gender,
          phoneNumber,
          email,
          bloodGroup,
          maritalStatus,
          allergies,
          medicalHistory,
          emergencyContact,
          dob: new Date(dob),
          address
        });
        await patient.save();
      }
    }



    // 2. Validate Slot & Get slotEndTime
    const date = new Date(appointmentDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[date.getUTCDay()];

    const schedule = await DoctorSchedule.findOne({ doctor: doctorId, dayOfWeek });
    if (!schedule) {
      throw new ApiError(400, 'Doctor does not work on this date');
    }

    // We can calculate the slotEndTime directly based on the schedule's duration
    const [startH, startM] = slotStartTime.split(':').map(Number);
    const endMins = (startH * 60 + startM) + schedule.slotDuration;
    const eH = Math.floor(endMins / 60).toString().padStart(2, '0');
    const eM = (endMins % 60).toString().padStart(2, '0');
    const slotEndTime = `${eH}:${eM}`;

    // Normalize date to start of day
    const normalizedDate = new Date(appointmentDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(normalizedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 1.5 Prevent multiple active bookings with the same doctor ON THE SAME DAY
    const existingActiveAppointment = await Appointment.findOne({
      patient: patient._id,
      doctor: doctorId,
      appointmentDate: { $gte: normalizedDate, $lte: endOfDay },
      status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.ARRIVED] }
    });

    if (existingActiveAppointment) {
      throw new ApiError(409, 'Patient already has an active appointment with this doctor on the same day');
    }

    // 2.5 Check Patient Overlaps
    const patientAppointments = await Appointment.find({
      patient: patient._id,
      appointmentDate: { $gte: normalizedDate, $lte: endOfDay },
      status: { $ne: AppointmentStatus.CANCELLED }
    });

    const timeToMins = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const newStartMins = timeToMins(slotStartTime);
    const newEndMins = timeToMins(slotEndTime);

    for (const app of patientAppointments) {
      const existingStart = timeToMins(app.slotStartTime);
      const existingEnd = timeToMins(app.slotEndTime);
      
      if (newStartMins < existingEnd && newEndMins > existingStart) {
        throw new ApiError(409, 'Patient already has an overlapping appointment during this time');
      }
    }

    // 3. Create Appointment
    try {
      const appointment = new Appointment({
        doctor: doctorId,
        patient: patient._id,
        appointmentDate: normalizedDate,
        slotStartTime,
        slotEndTime,
        status: AppointmentStatus.SCHEDULED,
      });

      await appointment.save();
      
      // Emit real-time event
      if ((global as any).io) {
        (global as any).io.emit('appointment_created', appointment);
      }
      
      return { appointment, patient };
    } catch (error: any) {
      // Catch MongoDB Duplicate Key Error (E11000) for our compound unique index
      if (error.code === 11000) {
        throw new ApiError(409, 'This slot has already been booked by another patient');
      }
      throw error;
    }
  }

  public async getAppointments(query: any = {}) {
    const { page = 1, limit = 10, search, doctorId, dateStart, dateEnd, status, departmentId, sort } = query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const matchStage: any = {};
    if (doctorId) matchStage.doctor = new mongoose.Types.ObjectId(doctorId as string);
    if (status) matchStage.status = status;
    if (query.patientId) matchStage.patient = new mongoose.Types.ObjectId(query.patientId as string);
    
    if (dateStart || dateEnd) {
      matchStage.appointmentDate = {};
      if (dateStart) {
        const dStart = new Date(dateStart);
        dStart.setUTCHours(0, 0, 0, 0);
        matchStage.appointmentDate.$gte = dStart;
      }
      if (dateEnd) {
        const dEnd = new Date(dateEnd);
        dEnd.setUTCHours(23, 59, 59, 999);
        matchStage.appointmentDate.$lte = dEnd;
      }
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorRole'
        }
      },
      { $unwind: { path: '$doctorRole', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'doctorRole.user',
          foreignField: '_id',
          as: 'doctorObj'
        }
      },
      { $unwind: { path: '$doctorObj', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'patients',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientObj'
        }
      },
      { $unwind: { path: '$patientObj', preserveNullAndEmptyArrays: true } }
    ];

    if (departmentId) {
      pipeline.push({
        $match: {
          'doctorRole.department': new mongoose.Types.ObjectId(departmentId as string)
        }
      });
    }

    if (search) {
      // search across patient first/last/phone or doctor first/last
      pipeline.push({
        $match: {
          $or: [
            { 'patientObj.firstName': { $regex: search, $options: 'i' } },
            { 'patientObj.lastName': { $regex: search, $options: 'i' } },
            { 'patientObj.phoneNumber': { $regex: search, $options: 'i' } },
            { 'doctorObj.firstName': { $regex: search, $options: 'i' } },
            { 'doctorObj.lastName': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    let sortObj: any = { appointmentDate: -1, slotStartTime: -1 };
    if (sort === 'dateAsc') sortObj = { appointmentDate: 1, slotStartTime: 1 };
    pipeline.push({ $sort: sortObj });

    const countPipeline = [...pipeline, { $count: 'total' }];
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const [appointments, countResult] = await Promise.all([
      Appointment.aggregate(pipeline),
      Appointment.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;

    return {
      appointments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  public async updateAppointment(id: string, updateData: any) {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }

    if (updateData.status) {
      appointment.status = updateData.status;
    }
    if (updateData.purpose !== undefined) {
      appointment.purpose = updateData.purpose;
    }
    if (updateData.notes !== undefined) {
      appointment.notes = updateData.notes;
    }
    if (updateData.prescription !== undefined) {
      appointment.prescription = updateData.prescription;
    }

    await appointment.save();
    
    // Emit real-time event
    if ((global as any).io) {
      if (updateData.status === 'CANCELLED') {
        (global as any).io.emit('appointment_cancelled', appointment);
      } else {
        (global as any).io.emit('appointment_updated', appointment);
      }
    }
    
    return appointment;
  }

  public async getAppointmentById(id: string) {
    const pipeline: any[] = [
      { $match: { _id: new (require('mongoose').Types.ObjectId)(id) } },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorRole'
        }
      },
      { $unwind: { path: '$doctorRole', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'doctorRole.user',
          foreignField: '_id',
          as: 'doctorObj'
        }
      },
      { $unwind: { path: '$doctorObj', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'specializations',
          localField: 'doctorRole.specialization',
          foreignField: '_id',
          as: 'doctorSpecialization'
        }
      },
      { $unwind: { path: '$doctorSpecialization', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'patients',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientObj'
        }
      },
      { $unwind: { path: '$patientObj', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          'doctorObj.specialization': '$doctorSpecialization'
        }
      }
    ];

    const results = await Appointment.aggregate(pipeline);
    if (!results || results.length === 0) {
      throw new ApiError(404, 'Appointment not found');
    }
    return results[0];
  }
}

export const appointmentService = new AppointmentService();
