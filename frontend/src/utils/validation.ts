export interface DoctorProfileData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password?: string;
  department: string;
  specialization: string;
  experienceYears: string | number;
  consultationFee?: string | number;
  qualifications: string;
}

export const validateDoctorProfile = (data: DoctorProfileData) => {
  const errors: Partial<Record<keyof DoctorProfileData, string>> = {};

  if (!data.firstName || data.firstName.trim().replace(/^Dr\.\s*/, '').length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.mobile || !/^[6-9]\d{9}$/.test(data.mobile)) {
    errors.mobile = 'Must be a valid 10-digit Indian mobile number';
  }

  if (data.password !== undefined && !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}/.test(data.password)) {
    errors.password = 'Min 6 chars, uppercase, lowercase, number, special character';
  }

  if (!data.department) {
    errors.department = 'Department is required';
  }

  if (!data.specialization) {
    errors.specialization = 'Specialization is required';
  }

  if (!data.qualifications || data.qualifications.trim().length < 2) {
    errors.qualifications = 'Please enter at least one qualification';
  }

  if (data.experienceYears === undefined || data.experienceYears === '' || Number(data.experienceYears) < 0) {
    errors.experienceYears = 'Valid experience years required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
