import React from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

export default function ExportButtons({ data, columns, filename, title }) {
  const handleExcelExport = () => {
    exportToExcel(data, filename);
  };

  const handlePdfExport = () => {
    exportToPdf(data, columns, filename, title);
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleExcelExport}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all shadow-sm"
        title="Export to Excel"
      >
        <FileSpreadsheet size={14} /> Excel
      </button>
      <button 
        onClick={handlePdfExport}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all shadow-sm"
        title="Export to PDF"
      >
        <FileText size={14} /> PDF
      </button>
    </div>
  );
}
