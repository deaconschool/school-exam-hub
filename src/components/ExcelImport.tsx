import { useState, useEffect } from 'react';
import { AdminService } from '@/services/adminService';
import { SupabaseService } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, AlertCircle, CheckCircle, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExcelImportProps {
  onImportComplete?: () => void;
}

interface ExcelStudent {
  name: string;
  code: string;
  class?: string;
  stage?: string;
  level?: number;
}

interface DatabaseStudent {
  id: string;
  code: string;
  name: string;
  class_name?: string;
  stage_name?: string;
  level?: number;
}

const ExcelImport = ({ onImportComplete }: ExcelImportProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [importData, setImportData] = useState<ExcelStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<ExcelStudent[]>([]);
  const [existingStudents, setExistingStudents] = useState<DatabaseStudent[]>([]);
  const [stageClasses, setStageClasses] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [stages, setStages] = useState<Array<{ name: string; level: number }>>([]);
  const [stageClassesMap, setStageClassesMap] = useState<Record<string, string[]>>({});

  // Force LTR direction permanently for admin import - never restore RTL
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');

    // Also ensure it stays LTR even if other components try to change it
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
          const currentDir = document.documentElement.getAttribute('dir');
          if (currentDir !== 'ltr') {
            document.documentElement.setAttribute('dir', 'ltr');
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load existing students on mount
  useEffect(() => {
    loadExistingStudents();
    loadStagesAndClasses();
  }, []);

  const loadStagesAndClasses = async () => {
    try {
      const response = await SupabaseService.getStagesAndClasses();
      if (response.success && response.data) {
        setStages(response.data.stages);
        setStageClassesMap(response.data.stageClasses);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const loadExistingStudents = async () => {
    setIsLoadingData(true);
    try {
      const response = await AdminService.getAllStudents({ limit: 1000 });
      if (response.success) {
        setExistingStudents(response.data.students || []);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handle stage change
  const handleStageChange = (stageName: string) => {
    setSelectedStage(stageName);
    setSelectedClass(''); // Reset class when stage changes

    // Load classes for selected stage
    if (stageName && stageName !== 'all') {
      const classes = stageClassesMap[stageName] || [];
      setStageClasses(classes);
    } else {
      setStageClasses([]);
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
      setError('');
      processExcelFile(file);
    } else {
      setError('Please select a valid Excel file (.xlsx or .xls)');
    }
  };

  // Process Excel file
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Process data starting from row 2 (index 1)
        const students: ExcelStudent[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any;
          if (row[0] && row[1]) { // Name and code are required
            students.push({
              name: row[0]?.toString().trim(),
              code: row[1]?.toString().trim(),
              class: row[2]?.toString().trim() || '',
              stage: row[3]?.toString().trim() || '',
              level: row[4] ? parseInt(row[4].toString()) : undefined
            });
          }
        }

        if (students.length === 0) {
          setError('No student data found in file');
          setPreviewData([]);
        } else {
          setPreviewData(students.slice(0, 5)); // Show first 5 for preview
          setImportData(students);
          setError('');
        }
      } catch (err) {
        setError('Error reading Excel file');
        setPreviewData([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Import students to database
  const handleImport = async () => {
    if (!selectedStage || !selectedClass) {
      setError('Please select both stage and class');
      return;
    }

    if (importData.length === 0) {
      setError('No data to import');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Find the selected stage to get its level
      const selectedStageData = stages.find(s =>
        s.name_en === selectedStage || s.name_ar === selectedStage
      );

      // Map stage level (0-4) to database constraint (1-12) by adding 1
      const mappedLevel = (selectedStageData?.level || 0) + 1;

      for (const student of importData) {
        try {
          // Check if student code already exists
          const response = await AdminService.getAllStudents({ limit: 1000 });
          let existingStudent = null;

          if (response.success && response.data.students) {
            existingStudent = response.data.students.find(s => s.code === student.code);
          }

          if (existingStudent) {
            errors.push(`Student ${student.name} (${student.code}) already exists`);
            errorCount++;
          } else {
            // Create new student using AdminService
            const createResponse = await AdminService.createStudent({
              name: student.name,
              code: student.code,
              class: student.class || selectedClass,
              level: student.level || mappedLevel,
              stage: student.stage || selectedStageData?.name_en || selectedStage,
              imported_from_excel: true,
              import_batch_id: `batch_${Date.now()}`,
              import_date: new Date().toISOString()
            });

            if (createResponse.success) {
              successCount++;
            } else {
              errors.push(`Error importing ${student.name} (${student.code}): ${createResponse.error}`);
              errorCount++;
            }
          }
        } catch (err) {
          errors.push(`Error processing ${student.name} (${student.code})`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully imported ${successCount} students`);
        if (errorCount > 0) {
          setError(`Warning: ${errorCount} failed imports: ${errors.slice(0, 3).join(', ')}`);
        }
        onImportComplete?.();
      } else {
        setError('Failed to import any students: ' + errors.join(', '));
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  
  // Download sample Excel template
  const downloadTemplate = () => {
    const templateData = [
      ['Student Name', 'Code', 'Class (Optional)', 'Stage (Optional)'],
      ['Ahmed Mohammed Ali', '11111', '5A', 'Primary Stage'],
      ['Fatima Hassan Ibrahim', '22222', '5B', 'Primary Stage'],
      ['Mohammed Abdullah Khaled', '33333', '3C', 'Primary Stage']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    const sheetName = 'Student Import Template';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = 'Student_Import_Template.xlsx';
    saveAs(blob, fileName);
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-green-600" />
          </div>
          Import Student Data from Excel
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Import Instructions
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Column A: Student name (starting from cell A2)</li>
            <li>• Column B: Student code (starting from cell B2)</li>
            <li>• Column C: Class (optional)</li>
            <li>• Column D: Stage (optional)</li>
            <li>• You can download a template below</li>
          </ul>
        </div>

        {/* Download Template Button */}
        <Button onClick={downloadTemplate} variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download Excel Template
        </Button>

        {/* Stage and Class Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stage-select">Stage</Label>
            <Select value={selectedStage} onValueChange={handleStageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.name} value={stage.name}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-select">Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={stageClasses.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={stageClasses.length === 0 ? "Select stage first" : "Select class"} />
              </SelectTrigger>
              <SelectContent>
                {stageClasses.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select Excel File</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>

        {/* Preview Data */}
        {previewData.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              Data Preview (First 5 students)
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left border-b">Name</th>
                    <th className="p-2 text-left border-b">Code</th>
                    <th className="p-2 text-left border-b">Class</th>
                    <th className="p-2 text-left border-b">Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((student, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{student.name}</td>
                      <td className="p-2 font-mono">{student.code}</td>
                      <td className="p-2">{student.class || selectedClass}</td>
                      <td className="p-2">{student.stage || selectedStage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 5 && (
              <p className="text-sm text-gray-600">
                and {previewData.length - 5} more students
              </p>
            )}
          </div>
        )}

        {/* Import Button */}
        {previewData.length > 0 && (
          <Button
            onClick={() => setImportData(importData)}
            variant="outline"
            className="w-full"
          >
            Confirm Data ({importData.length} students)
          </Button>
        )}

        {/* Final Import Button */}
        {importData.length > 0 && (
          <Button
            onClick={handleImport}
            disabled={isProcessing || !selectedClass || !selectedStage}
            className="w-full"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            Import Students
          </Button>
        )}

        {/* Messages */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelImport;