'use server'

import { createStudentAuth, getStudentCredentials } from '@/lib/utils/auth-generator'
import type { Student } from '@/types/database'

/**
 * Server action to create student with authentication
 */
export async function createStudentWithAuth(
  firstName: string,
  lastName: string,
  dateOfBirth: string,
  studentId: string,
  organizationId: string,
  createdBy: string
): Promise<{ authId: string; credentials: { username: string; password: string } }> {
  const { authId, credentials } = await createStudentAuth(
    firstName,
    lastName,
    dateOfBirth,
    studentId,
    organizationId,
    createdBy
  )

  return { authId, credentials }
}

/**
 * Server action to get student credentials
 */
export async function getStudentCredentialsAction(
  studentId: string
): Promise<{ username: string; password: string } | null> {
  return await getStudentCredentials(studentId)
}