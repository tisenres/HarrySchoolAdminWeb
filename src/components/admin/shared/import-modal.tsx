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
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileUpload } from './file-upload'
import { 
  CheckCircle, 
  AlertCircle, 
  Download, 
  FileSpreadsheet,
  Users,
  GraduationCap,
  BookOpen
} from 'lucide-react'
import { ImportResult } from '@/lib/services/import-export-service'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  dataType: 'teachers' | 'groups' | 'students'
  onImport: (file: File) => Promise<ImportResult>
  onDownloadTemplate: () => void
  maxFileSize?: number
}

interface ImportStep {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export function ImportModal({
  isOpen,
  onClose,
  title,
  description,
  dataType,
  onImport,
  onDownloadTemplate,
  maxFileSize = 10
}: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const importSteps: ImportStep[] = [
    { id: 'upload', title: 'Upload File', status: 'pending' },
    { id: 'validate', title: 'Validate Data', status: 'pending' },
    { id: 'process', title: 'Import Data', status: 'pending' },
    { id: 'complete', title: 'Complete', status: 'pending' }
  ]

  const [steps, setSteps] = useState(importSteps)

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

  const updateStepStatus = useCallback((stepIndex: number, status: ImportStep['status']) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status } : step
    ))
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setImportResult(null)
    setSteps(importSteps)
    setCurrentStep(0)
  }, [])

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null)
    setImportResult(null)
    setSteps(importSteps)
    setCurrentStep(0)
  }, [])

  const handleImport = useCallback(async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setCurrentStep(0)

    try {
      // Step 1: Upload File
      updateStepStatus(0, 'processing')
      await new Promise(resolve => setTimeout(resolve, 500))
      updateStepStatus(0, 'completed')
      setCurrentStep(1)

      // Step 2: Validate Data
      updateStepStatus(1, 'processing')
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStepStatus(1, 'completed')
      setCurrentStep(2)

      // Step 3: Import Data
      updateStepStatus(2, 'processing')
      const result = await onImport(selectedFile)
      
      if (result.success || result.successRows > 0) {
        updateStepStatus(2, 'completed')
        setCurrentStep(3)
        updateStepStatus(3, 'completed')
      } else {
        updateStepStatus(2, 'error')
      }

      setImportResult(result)
    } catch (error) {
      console.error('Import failed:', error)
      updateStepStatus(currentStep, 'error')
      setImportResult({
        success: false,
        data: [],
        errors: [{ row: 0, message: 'Import failed: ' + (error.message || 'Unknown error') }],
        totalRows: 0,
        successRows: 0,
        errorRows: 0
      })
    } finally {
      setIsImporting(false)
    }
  }, [selectedFile, onImport, currentStep, updateStepStatus])

  const handleClose = useCallback(() => {
    if (!isImporting) {
      setSelectedFile(null)
      setImportResult(null)
      setSteps(importSteps)
      setCurrentStep(0)
      onClose()
    }
  }, [isImporting, onClose])

  const progressPercentage = steps.filter(step => step.status === 'completed').length * 25

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Need a template?
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Download the template file with the correct format and sample data.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadTemplate}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            maxSizeMB={maxFileSize}
            disabled={isImporting}
            placeholder={`Drop your ${dataType} file here or click to browse`}
          />

          {/* Import Progress */}
          {(selectedFile && isImporting) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Import Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      step.status === 'completed' ? 'bg-green-50' :
                      step.status === 'processing' ? 'bg-blue-50' :
                      step.status === 'error' ? 'bg-red-50' : 'bg-gray-50'
                    }`}
                  >
                    {step.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {step.status === 'processing' && (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                    {step.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    {step.status === 'pending' && (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                    
                    <span className={`text-sm ${
                      step.status === 'completed' ? 'text-green-900' :
                      step.status === 'processing' ? 'text-blue-900' :
                      step.status === 'error' ? 'text-red-900' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResult && !isImporting && (
            <div className="space-y-4">
              {importResult.success || importResult.successRows > 0 ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="font-medium mb-1">Import completed successfully!</div>
                    <div className="text-sm">
                      • Total rows processed: {importResult.totalRows}
                      <br />
                      • Successful imports: {importResult.successRows}
                      {importResult.errorRows > 0 && (
                        <>
                          <br />
                          • Rows with errors: {importResult.errorRows}
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="font-medium mb-1">Import failed</div>
                    <div className="text-sm">
                      Please check your file format and try again.
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {importResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-red-900 mb-2">
                    Import Errors ({importResult.errors.length})
                  </h4>
                  <div className="space-y-1">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-xs text-red-700">
                        Row {error.row}: {error.message}
                        {error.field && ` (Field: ${error.field})`}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <div className="text-xs text-red-600 font-medium">
                        ... and {importResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              {importResult?.success || importResult?.successRows > 0 ? 'Done' : 'Cancel'}
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}