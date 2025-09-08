'use server'

import { createTeacherAuth, getTeacherCredentials } from '@/lib/utils/auth-generator'
import type { Teacher } from '@/types/database'

/**
 * Server action to create teacher with authentication
 */
export async function createTeacherWithAuth(
  teacherData: Teacher,
  organizationId: string,
  createdBy: string
): Promise<{ authId: string; credentials: { username: string; password: string } }> {
  const { authId, credentials } = await createTeacherAuth(
    teacherData.first_name,
    teacherData.last_name,
    teacherData.id,
    organizationId,
    createdBy
  )

  return { authId, credentials }
}

/**
 * Server action to get teacher credentials
 */
export async function getTeacherCredentialsAction(
  teacherId: string
): Promise<{ username: string; password: string } | null> {
  return await getTeacherCredentials(teacherId)
}