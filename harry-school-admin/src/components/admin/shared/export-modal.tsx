'use client'

import React, { useState, useCallback } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Users,
  GraduationCap,
  BookOpen,
  Settings
} from 'lucide-react'

interface ExportField {
  key: string
  label: string
  required?: boolean
  category?: string
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  dataType: 'teachers' | 'groups' | 'students'
  totalRecords: number
  filteredRecords?: number
  availableFields: ExportField[]
  onExport: (options: ExportOptions) => Promise<void>
  isExporting?: boolean
}

interface ExportOptions {
  format: 'xlsx' | 'csv'
  fields: string[]
  filename: string
  includeHeaders: boolean
  useFilters: boolean
  customFilters?: Record<string, any>
}

const DEFAULT_FIELDS = {
  teachers: [
    'full_name',
    'email',
    'phone',
    'employment_status',
    'specializations',
    'hire_date'
  ],
  groups: [
    'name',
    'group_code',
    'subject',
    'level',
    'teacher_name',
    'current_enrollment',
    'max_students',
    'status',
    'start_date'
  ],
  students: [
    'full_name',
    'student_id',
    'phone',
    'parent_name',
    'parent_phone',
    'status',
    'current_level',
    'enrollment_date'
  ]
}

export function ExportModal({
  isOpen,
  onClose,
  title,
  description,
  dataType,
  totalRecords,
  filteredRecords,
  availableFields,
  onExport,
  isExporting = false
}: ExportModalProps) {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx')
  const [selectedFields, setSelectedFields] = useState<string[]>(
    DEFAULT_FIELDS[dataType] || availableFields.slice(0, 6).map(f => f.key)
  )
  const [filename, setFilename] = useState(() => {
    const date = new Date().toISOString().split('T')[0]
    return `${dataType}_export_${date}`
  })
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [useFilters, setUseFilters] = useState(true)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)

  const getDataTypeIcon = () => {
    switch (dataType) {
      case 'teachers':
        return <Users className="w-5 h-5" />
      case 'groups':
        return <BookOpen className="w-5 h-5" />
      case 'students':
        return <GraduationCap className="w-5 h-5" />
      default:
        return <FileSpreadsheet className="w-5 h-5" />
    }
  }

  const getFormatIcon = (fmt: string) => {
    return fmt === 'xlsx' ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />
  }

  const groupedFields = availableFields.reduce((groups, field) => {
    const category = field.category || 'General'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(field)
    return groups
  }, {} as Record<string, ExportField[]>)

  const handleFieldToggle = useCallback((fieldKey: string, checked: boolean) => {
    setSelectedFields(prev => {
      const field = availableFields.find(f => f.key === fieldKey)
      if (field?.required) return prev // Can't deselect required fields
      
      if (checked) {
        return [...prev, fieldKey]
      } else {
        return prev.filter(key => key !== fieldKey)
      }
    })
  }, [availableFields])

  const handleSelectAll = useCallback(() => {
    setSelectedFields(availableFields.map(f => f.key))
  }, [availableFields])

  const handleSelectDefaults = useCallback(() => {
    setSelectedFields(DEFAULT_FIELDS[dataType] || availableFields.slice(0, 6).map(f => f.key))
  }, [dataType, availableFields])

  const handleClearAll = useCallback(() => {
    const requiredFields = availableFields.filter(f => f.required).map(f => f.key)
    setSelectedFields(requiredFields)
  }, [availableFields])

  const handleExport = useCallback(async () => {
    const options: ExportOptions = {
      format,
      fields: selectedFields,
      filename,
      includeHeaders,
      useFilters
    }

    try {
      await onExport(options)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [format, selectedFields, filename, includeHeaders, useFilters, onExport])

  const recordsToExport = useFilters && filteredRecords !== undefined 
    ? filteredRecords 
    : totalRecords

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDataTypeIcon()}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Export Summary
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  {recordsToExport} records will be exported
                  {useFilters && filteredRecords !== undefined && filteredRecords !== totalRecords && 
                    ` (filtered from ${totalRecords} total)`
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-900">{recordsToExport}</p>
                <p className="text-xs text-blue-600">records</p>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: 'xlsx' | 'csv') => setFormat(value)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="flex items-center gap-2 cursor-pointer">
                  {getFormatIcon('xlsx')}
                  <div>
                    <div className="font-medium">Excel (.xlsx)</div>
                    <div className="text-xs text-gray-500">
                      Rich formatting, multiple sheets, best for analysis
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  {getFormatIcon('csv')}
                  <div>
                    <div className="font-medium">CSV (.csv)</div>
                    <div className="text-xs text-gray-500">
                      Simple format, compatible with all systems
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Fields to Export ({selectedFields.length} selected)
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {isAdvancedMode ? 'Simple' : 'Advanced'}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectDefaults}>
                Defaults
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>

            {/* Field Grid */}
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              {isAdvancedMode ? (
                // Advanced mode - grouped by category
                <div className="space-y-4">
                  {Object.entries(groupedFields).map(([category, fields]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 border-b pb-1">
                        {category}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {fields.map((field) => (
                          <div key={field.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={field.key}
                              checked={selectedFields.includes(field.key)}
                              onCheckedChange={(checked) => 
                                handleFieldToggle(field.key, checked as boolean)
                              }
                              disabled={field.required}
                            />
                            <Label 
                              htmlFor={field.key} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Simple mode - flat list
                <div className="grid grid-cols-2 gap-2">
                  {availableFields.map((field) => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={(checked) => 
                          handleFieldToggle(field.key, checked as boolean)
                        }
                        disabled={field.required}
                      />
                      <Label 
                        htmlFor={field.key} 
                        className="text-sm cursor-pointer flex-1"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Export Options</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="headers"
                  checked={includeHeaders}
                  onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
                />
                <Label htmlFor="headers" className="text-sm">
                  Include column headers
                </Label>
              </div>

              {filteredRecords !== undefined && filteredRecords !== totalRecords && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filters"
                    checked={useFilters}
                    onCheckedChange={(checked) => setUseFilters(checked as boolean)}
                  />
                  <Label htmlFor="filters" className="text-sm">
                    Use current table filters ({filteredRecords} of {totalRecords} records)
                  </Label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="filename" className="text-sm font-medium">
                Filename
              </Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename (without extension)"
              />
            </div>
          </div>

          {/* Validation */}
          {selectedFields.length === 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800">
                Please select at least one field to export.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={selectedFields.length === 0 || !filename.trim() || isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}