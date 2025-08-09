'use client'

import React, { useCallback, useState } from 'react'
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  acceptedTypes?: string[]
  maxSizeMB?: number
  disabled?: boolean
  className?: string
  placeholder?: string
  showPreview?: boolean
}

interface FileValidationResult {
  valid: boolean
  error?: string
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  acceptedTypes = ['.xlsx', '.xls', '.csv'],
  maxSizeMB = 10,
  disabled = false,
  className,
  placeholder = 'Drop your file here or click to browse',
  showPreview = true
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const validateFile = useCallback((file: File): FileValidationResult => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
      }
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.some(type => type.toLowerCase() === fileExtension)) {
      return {
        valid: false,
        error: `File type "${fileExtension}" is not supported. Accepted types: ${acceptedTypes.join(', ')}`
      }
    }

    return { valid: true }
  }, [acceptedTypes, maxSizeMB])

  const handleFiles = useCallback((files: FileList) => {
    if (files.length === 0) return

    const file = files[0]
    const validation = validateFile(file)

    if (!validation.valid) {
      setValidationError(validation.error || '')
      return
    }

    setValidationError('')
    setSelectedFile(file)
    setIsProcessing(true)
    
    // Simulate processing delay
    setTimeout(() => {
      onFileSelect(file)
      setIsProcessing(false)
    }, 500)
  }, [validateFile, onFileSelect])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles, disabled])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return
    
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }, [handleFiles, disabled])

  const handleRemove = useCallback(() => {
    setSelectedFile(null)
    setValidationError('')
    setIsProcessing(false)
    if (onFileRemove) {
      onFileRemove()
    }
  }, [onFileRemove])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Area */}
      {!selectedFile && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed',
            'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleChange}
            accept={acceptedTypes.join(',')}
            disabled={disabled}
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {placeholder}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: {acceptedTypes.join(', ')} (max {maxSizeMB}MB)
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="pointer-events-none"
            >
              Choose File
            </Button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && showPreview && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {isProcessing ? (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : validationError ? (
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                  {isProcessing && ' • Processing...'}
                  {validationError && ' • Error'}
                  {!isProcessing && !validationError && ' • Ready'}
                </p>
              </div>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Specialized components for different data types
export function TeacherFileUpload(props: Omit<FileUploadProps, 'acceptedTypes'>) {
  return (
    <FileUpload
      {...props}
      acceptedTypes={['.xlsx', '.xls', '.csv']}
      placeholder="Upload teachers data file (Excel or CSV)"
    />
  )
}

export function GroupFileUpload(props: Omit<FileUploadProps, 'acceptedTypes'>) {
  return (
    <FileUpload
      {...props}
      acceptedTypes={['.xlsx', '.xls', '.csv']}
      placeholder="Upload groups data file (Excel or CSV)"
    />
  )
}

export function StudentFileUpload(props: Omit<FileUploadProps, 'acceptedTypes'>) {
  return (
    <FileUpload
      {...props}
      acceptedTypes={['.xlsx', '.xls', '.csv']}
      placeholder="Upload students data file (Excel or CSV)"
    />
  )
}