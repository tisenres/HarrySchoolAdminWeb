import { createServerClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import JSZip from 'jszip'

export interface BackupOptions {
  includeProfiles?: boolean
  includeTeachers?: boolean
  includeStudents?: boolean
  includeGroups?: boolean
  includeOrganizationSettings?: boolean
  includeSystemSettings?: boolean
  includeNotifications?: boolean
  compression?: boolean
}

export interface BackupMetadata {
  id: string
  organizationId: string
  createdBy: string
  createdAt: string
  name: string
  description?: string
  size: number
  checksum: string
  tables: string[]
  recordCounts: Record<string, number>
  version: string
}

/**
 * Create a full database backup for the current organization
 */
export async function createBackup(options: BackupOptions = {}, name?: string, description?: string): Promise<{
  metadata: BackupMetadata
  data: ArrayBuffer
}> {
  const profile = await getCurrentProfile()
  if (!profile) {
    throw new Error('User profile not found')
  }

  const supabase = await createServerClient()

  // Default options - include everything
  const backupOptions: Required<BackupOptions> = {
    includeProfiles: options.includeProfiles ?? true,
    includeTeachers: options.includeTeachers ?? true,
    includeStudents: options.includeStudents ?? true,
    includeGroups: options.includeGroups ?? true,
    includeOrganizationSettings: options.includeOrganizationSettings ?? true,
    includeSystemSettings: options.includeSystemSettings ?? true,
    includeNotifications: options.includeNotifications ?? true,
    compression: options.compression ?? true
  }

  const backupId = crypto.randomUUID()
  const timestamp = new Date().toISOString()
  const tables: string[] = []
  const recordCounts: Record<string, number> = {}
  
  // Create backup data structure
  const backupData: Record<string, any[]> = {}

  // Export profiles
  if (backupOptions.includeProfiles) {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', profile.organization_id)

    if (error) throw new Error(`Failed to export profiles: ${error.message}`)
    
    backupData.profiles = profiles || []
    tables.push('profiles')
    recordCounts.profiles = (profiles || []).length
  }

  // Export teachers
  if (backupOptions.includeTeachers) {
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('organization_id', profile.organization_id)

    if (error) throw new Error(`Failed to export teachers: ${error.message}`)
    
    backupData.teachers = teachers || []
    tables.push('teachers')
    recordCounts.teachers = (teachers || []).length
  }

  // Export students
  if (backupOptions.includeStudents) {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('organization_id', profile.organization_id)

    if (error) throw new Error(`Failed to export students: ${error.message}`)
    
    backupData.students = students || []
    tables.push('students')
    recordCounts.students = (students || []).length
  }

  // Export groups
  if (backupOptions.includeGroups) {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .eq('organization_id', profile.organization_id)

    if (error) throw new Error(`Failed to export groups: ${error.message}`)
    
    backupData.groups = groups || []
    tables.push('groups')
    recordCounts.groups = (groups || []).length
  }

  // Export organization settings
  if (backupOptions.includeOrganizationSettings) {
    const { data: orgSettings, error } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', profile.organization_id)

    if (error) throw new Error(`Failed to export organization settings: ${error.message}`)
    
    backupData.organization_settings = orgSettings || []
    tables.push('organization_settings')
    recordCounts.organization_settings = (orgSettings || []).length
  }

  // Export system settings
  if (backupOptions.includeSystemSettings) {
    const { data: systemSettings, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('organization_id', profile.organization_id)

    if (!error || error.code === 'PGRST116') {
      backupData.system_settings = systemSettings || []
      tables.push('system_settings')
      recordCounts.system_settings = (systemSettings || []).length
    }
  }

  // Create metadata
  const metadata: BackupMetadata = {
    id: backupId,
    organizationId: profile.organization_id,
    createdBy: profile.id,
    createdAt: timestamp,
    name: name || `Backup ${new Date().toLocaleDateString()}`,
    description,
    size: 0, // Will be set after compression
    checksum: '',
    tables,
    recordCounts,
    version: '1.0.0'
  }

  // Create backup structure
  const backup = {
    metadata,
    data: backupData,
    created_at: timestamp,
    format_version: '1.0.0'
  }

  // Convert to JSON
  const jsonData = JSON.stringify(backup, null, 2)
  const jsonBuffer = new TextEncoder().encode(jsonData)

  if (backupOptions.compression) {
    // Create ZIP file
    const zip = new JSZip()
    zip.file(`backup_${backupId}.json`, jsonData)
    
    const zipBuffer = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    // Calculate checksum (simple hash for demo)
    const checksum = await calculateChecksum(zipBuffer)
    metadata.size = zipBuffer.byteLength
    metadata.checksum = checksum

    return {
      metadata,
      data: zipBuffer
    }
  } else {
    // Return uncompressed JSON
    const checksum = await calculateChecksum(jsonBuffer)
    metadata.size = jsonBuffer.byteLength
    metadata.checksum = checksum

    return {
      metadata,
      data: jsonBuffer
    }
  }
}

/**
 * Restore a backup from ArrayBuffer data
 */
export async function restoreBackup(backupData: ArrayBuffer, options: { 
  overwriteExisting?: boolean; 
  selectiveTables?: string[] 
} = {}): Promise<{ success: boolean; restoredTables: string[]; recordCounts: Record<string, number> }> {
  const supabase = await createServerClient()
  const profile = await getCurrentProfile()
  
  if (!profile) {
    throw new Error('User profile not found')
  }

  try {
    let backupJson: string

    // Try to extract from ZIP first
    try {
      const zip = new JSZip()
      const zipContents = await zip.loadAsync(backupData)
      const files = Object.keys(zipContents.files)
      
      if (files.length === 0) {
        throw new Error('No files found in backup archive')
      }
      
      // Get the first JSON file
      const jsonFile = files.find(f => f.endsWith('.json'))
      if (!jsonFile) {
        throw new Error('No JSON backup file found in archive')
      }
      
      backupJson = await zipContents.files[jsonFile].async('text')
    } catch {
      // If ZIP extraction fails, treat as raw JSON
      backupJson = new TextDecoder().decode(backupData)
    }

    // Parse backup data
    const backup = JSON.parse(backupJson)
    
    if (!backup.data || !backup.metadata) {
      throw new Error('Invalid backup format - missing data or metadata')
    }

    const restoredTables: string[] = []
    const recordCounts: Record<string, number> = {}

    // Restore each table
    for (const [tableName, records] of Object.entries(backup.data)) {
      if (!Array.isArray(records)) continue
      
      // Skip if selective restore and table not included
      if (options.selectiveTables && !options.selectiveTables.includes(tableName)) {
        continue
      }

      try {
        if (options.overwriteExisting) {
          // Delete existing records for this organization first
          await supabase
            .from(tableName)
            .delete()
            .eq('organization_id', profile.organization_id)
        }

        if (records.length > 0) {
          // Insert records in batches of 100
          const batchSize = 100
          let totalInserted = 0
          
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize)
            const { error } = await supabase
              .from(tableName)
              .insert(batch)

            if (error) {
              console.error(`Error inserting batch for ${tableName}:`, error)
              continue // Skip failed batches but continue with others
            }
            
            totalInserted += batch.length
          }

          recordCounts[tableName] = totalInserted
          restoredTables.push(tableName)
        }
      } catch (error) {
        console.error(`Failed to restore table ${tableName}:`, error)
        // Continue with other tables
      }
    }

    return {
      success: restoredTables.length > 0,
      restoredTables,
      recordCounts
    }

  } catch (error) {
    console.error('Backup restoration failed:', error)
    throw error
  }
}

/**
 * Get backup history for the current organization
 */
export async function getBackupHistory(limit: number = 10): Promise<any[]> {
  const supabase = await createServerClient()
  const { data: backups, error } = await supabase
    .from('backup_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return backups || []
}

/**
 * Simple checksum calculation for demo purposes
 */
async function calculateChecksum(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

// Create singleton instance for export
export const backupService = {
  createBackup,
  restoreBackup,
  getBackupHistory
}