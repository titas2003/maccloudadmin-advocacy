import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports an array of objects to an Excel (XLSX) file.
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename without extension
 */
export const exportToExcel = (data, filename = 'export') => {
  if (!data || !data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Exports an array of objects to a PDF file using jspdf-autotable.
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column headers (strings)
 * @param {string} filename - Output filename without extension
 * @param {string} title - Title text to print at the top of the PDF
 */
export const exportToPdf = (data, columns, filename = 'export', title = 'Report') => {
  if (!data || !data.length) return;
  
  const doc = new jsPDF('landscape');
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  // Map data objects to arrays respecting column order
  // Assuming keys in the data objects match the column names exactly or we map sequentially
  const tableData = data.map(item => columns.map(col => item[col] || ''));

  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [26, 43, 75], textColor: [255, 255, 255], fontStyle: 'bold' }
  });

  doc.save(`${filename}.pdf`);
};
