import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
  });
}

export function parseTenureToSingleYears(tenureStr: string): string[] {
  if (!tenureStr) return [];
  
  // If it's already a comma-separated list of single years, split them
  if (tenureStr.includes(',')) {
    return tenureStr.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  // Match range format like YYYY-YY (e.g., 2023-26 or 2024-25)
  const rangeMatch = tenureStr.match(/^(\d{4})-(\d{2})$/);
  if (rangeMatch) {
    const startYear = parseInt(rangeMatch[1], 10);
    const endYearShort = parseInt(rangeMatch[2], 10);
    
    // convert endYearShort to 4-digit (e.g. 25 -> 2025)
    const endYear = 2000 + endYearShort; 
    
    if (endYear > startYear) {
      const result: string[] = [];
      for (let y = startYear; y < endYear; y++) {
        const nextYShort = (y + 1) % 100;
        const nextYStr = nextYShort.toString().padStart(2, '0');
        result.push(`${y}-${nextYStr}`);
      }
      return result;
    }
  }
  
  return [tenureStr];
}

export function formatTenureDisplayTags(tenureStr: string): string {
  const singleYears = parseTenureToSingleYears(tenureStr);
  if (singleYears.length === 1) {
    return singleYears[0]; // e.g. "2025-26"
  } else if (singleYears.length > 1) {
    // If multiple, format as "YYYY-YYYY, YYYY-YYYY" e.g. "2025-2026, 2026-2027"
    return singleYears.map(sy => {
      const parts = sy.split('-');
      if (parts.length === 2) {
        const start = parts[0];
        const startNum = parseInt(start, 10);
        const endFull = (startNum + 1).toString();
        return `${start}-${endFull}`;
      }
      return sy;
    }).join(', ');
  }
  return tenureStr;
}

