export const FIELD_LABELS = {
  id: 'ID',
  employee_id: 'Employee ID',
  first_name: 'First Name',
  last_name: 'Last Name',
  full_name: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  date_of_birth: 'Date of Birth',
  gender: 'Gender',
  hire_date: 'Hire Date',
  employment_status: 'Employment Status',
  contract_type: 'Contract Type',
  salary_amount: 'Salary Amount',
  salary_currency: 'Salary Currency',
  specializations: 'Specializations',
  qualifications: 'Qualifications',
  languages_spoken: 'Languages Spoken',
  address_street: 'Street Address',
  address_city: 'City',
  address_state: 'State',
  address_postal_code: 'Postal Code',
  address_country: 'Country',
  address_full: 'Full Address',
  emergency_contact_name: 'Emergency Contact Name',
  emergency_contact_phone: 'Emergency Contact Phone',
  emergency_contact_relationship: 'Emergency Contact Relationship',
  emergency_contact_info: 'Emergency Contact Info',
  is_active: 'Is Active',
  notes: 'Notes',
  created_at: 'Created At',
  updated_at: 'Updated At',
  created_by_name: 'Created By',
  updated_by_name: 'Updated By'
}

export const getAvailableFields = (): Array<{ key: string; label: string; category: string }> => {
  return [
    // Basic Information
    { key: 'full_name', label: FIELD_LABELS.full_name, category: 'Basic Information' },
    { key: 'first_name', label: FIELD_LABELS.first_name, category: 'Basic Information' },
    { key: 'last_name', label: FIELD_LABELS.last_name, category: 'Basic Information' },
    { key: 'email', label: FIELD_LABELS.email, category: 'Basic Information' },
    { key: 'phone', label: FIELD_LABELS.phone, category: 'Basic Information' },
    { key: 'date_of_birth', label: FIELD_LABELS.date_of_birth, category: 'Basic Information' },
    { key: 'gender', label: FIELD_LABELS.gender, category: 'Basic Information' },

    // Employment
    { key: 'employee_id', label: FIELD_LABELS.employee_id, category: 'Employment' },
    { key: 'hire_date', label: FIELD_LABELS.hire_date, category: 'Employment' },
    { key: 'employment_status', label: FIELD_LABELS.employment_status, category: 'Employment' },
    { key: 'contract_type', label: FIELD_LABELS.contract_type, category: 'Employment' },
    { key: 'salary_amount', label: FIELD_LABELS.salary_amount, category: 'Employment' },
    { key: 'salary_currency', label: FIELD_LABELS.salary_currency, category: 'Employment' },
    { key: 'is_active', label: FIELD_LABELS.is_active, category: 'Employment' },

    // Professional
    { key: 'specializations', label: FIELD_LABELS.specializations, category: 'Professional' },
    { key: 'qualifications', label: FIELD_LABELS.qualifications, category: 'Professional' },
    { key: 'languages_spoken', label: FIELD_LABELS.languages_spoken, category: 'Professional' },

    // Contact & Address
    { key: 'address_street', label: FIELD_LABELS.address_street, category: 'Contact & Address' },
    { key: 'address_city', label: FIELD_LABELS.address_city, category: 'Contact & Address' },
    { key: 'address_state', label: FIELD_LABELS.address_state, category: 'Contact & Address' },
    { key: 'address_postal_code', label: FIELD_LABELS.address_postal_code, category: 'Contact & Address' },
    { key: 'address_country', label: FIELD_LABELS.address_country, category: 'Contact & Address' },
    { key: 'address_full', label: FIELD_LABELS.address_full, category: 'Contact & Address' },

    // Emergency Contact
    { key: 'emergency_contact_name', label: FIELD_LABELS.emergency_contact_name, category: 'Emergency Contact' },
    { key: 'emergency_contact_phone', label: FIELD_LABELS.emergency_contact_phone, category: 'Emergency Contact' },
    { key: 'emergency_contact_relationship', label: FIELD_LABELS.emergency_contact_relationship, category: 'Emergency Contact' },
    { key: 'emergency_contact_info', label: FIELD_LABELS.emergency_contact_info, category: 'Emergency Contact' },

    // Additional
    { key: 'notes', label: FIELD_LABELS.notes, category: 'Additional' },

    // System
    { key: 'id', label: FIELD_LABELS.id, category: 'System' },
    { key: 'created_at', label: FIELD_LABELS.created_at, category: 'System' },
    { key: 'updated_at', label: FIELD_LABELS.updated_at, category: 'System' },
    { key: 'created_by_name', label: FIELD_LABELS.created_by_name, category: 'System' },
    { key: 'updated_by_name', label: FIELD_LABELS.updated_by_name, category: 'System' }
  ]
}