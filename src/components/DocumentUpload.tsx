import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DocumentUploadProps {
  onFileUpload: (file: File) => void
  isProcessing: boolean
}

export function DocumentUpload({ onFileUpload, isProcessing }: DocumentUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError(null)
    
    if (rejectedFiles.length > 0) {
      setUploadError('Please upload a valid PDF file (max 10MB)')
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB')
        return
      }
      onFileUpload(file)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer ${
              isDragActive ? 'bg-blue-50' : ''
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              {isDragActive ? (
                <Upload className="h-12 w-12 text-blue-500" />
              ) : (
                <FileText className="h-12 w-12 text-gray-400" />
              )}
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive
                    ? 'Drop your bond indenture here'
                    : 'Upload Bond Indenture PDF'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop your PDF file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supports PDF files up to 10MB
                </p>
              </div>
              {!isProcessing && (
                <Button variant="outline" className="mt-4">
                  Choose File
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}