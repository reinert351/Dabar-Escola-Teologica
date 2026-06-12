export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => {
      if (typeof cell === 'string') {
        // Escape quotes and wrap in quotes to handle semicolons/commas in data
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(';'))
  ].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if ((navigator as any).msSaveBlob) { // IE 10+
    (navigator as any).msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
