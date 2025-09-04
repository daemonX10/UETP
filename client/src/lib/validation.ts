export const validationRules = {
  email: {
    required: (value: string) => ({
      validate: (val: string) => val.trim().length > 0,
      message: 'Email is required'
    }),
    format: (value: string) => ({
      validate: (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      message: 'Please enter a valid email address'
    })
  },
  
  password: {
    required: (value: string) => ({
      validate: (val: string) => val.length > 0,
      message: 'Password is required'
    }),
    minLength: (min: number) => ({
      validate: (val: string) => val.length >= min,
      message: `Password must be at least ${min} characters long`
    }),
    strength: (value: string) => ({
      validate: (val: string) => {
        const hasLowerCase = /[a-z]/.test(val);
        const hasUpperCase = /[A-Z]/.test(val);
        const hasNumbers = /\d/.test(val);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        return hasLowerCase && hasUpperCase && hasNumbers && hasSpecialChar;
      },
      message: 'Password must contain uppercase, lowercase, number and special character'
    })
  },
  
  confirmPassword: (password: string) => ({
    validate: (val: string) => val === password,
    message: 'Passwords do not match'
  }),
  
  name: {
    required: (value: string) => ({
      validate: (val: string) => val.trim().length > 0,
      message: 'Name is required'
    }),
    minLength: (min: number) => ({
      validate: (val: string) => val.trim().length >= min,
      message: `Name must be at least ${min} characters long`
    })
  }
};

export const getEmailValidationRules = () => [
  validationRules.email.required(''),
  validationRules.email.format('')
];

export const getPasswordValidationRules = (isRegistration = false) => [
  validationRules.password.required(''),
  ...(isRegistration ? [
    validationRules.password.minLength(8),
    validationRules.password.strength('')
  ] : [])
];

export const getNameValidationRules = () => [
  validationRules.name.required(''),
  validationRules.name.minLength(2)
];
