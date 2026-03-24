export const fmt = (n) => {
  const num = parseFloat(n) || 0;
  return num.toLocaleString('en-IN');
};

export const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const iso = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${iso[3]} ${M[+iso[2]-1]} ${iso[1]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr);
    return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  } catch { return String(dateStr); }
};

export const currency = (n) =>
  new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);

export const feeColor = (k) => ({
  'Hostel Fee':'var(--hostel)',
  'School Fee':'var(--accent3)',
  'Admission Fee':'var(--accent)',
  'Tuition Fee':'var(--accent2)'
}[k]||'var(--muted)');

export const CLS_LIST = ['Nursery','LKG','UKG','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

// Normalize class to DB format: "10" → "10th", "lkg" → "LKG", "10th-A" → "10th"
export const normalizeClass = (cls) => {
  if (!cls) return cls;
  // Strip section suffix like "-A" or " A"
  let c = String(cls).trim().replace(/[-\s][A-Za-z]$/, '');
  // Named classes
  if (/^nursery$/i.test(c)) return 'Nursery';
  if (/^lkg$/i.test(c)) return 'LKG';
  if (/^ukg$/i.test(c)) return 'UKG';
  // Already correct format (e.g. "10th")
  if (/^\d+(st|nd|rd|th)$/i.test(c)) {
    const n = parseInt(c);
    return CLS_LIST.find(x => x.startsWith(String(n))) || c;
  }
  // Plain number: 1 → "1st", 2 → "2nd", 3 → "3rd", 4-20 → "Nth"
  const n = parseInt(c);
  if (!isNaN(n) && n >= 1 && n <= 12) {
    const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
    return `${n}${suffix}`;
  }
  return c;
};

export const classOrd = (a, b) => {
  const order = ['Nursery','LKG','UKG','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
  return (order.indexOf(a)||0) - (order.indexOf(b)||0);
};

// Convert number to Indian English words (e.g., 12500 → "Twelve Thousand Five Hundred Rupees Only")
export function amountInWords(num) {
  const n = Math.round(parseFloat(num) || 0);
  if (n === 0) return 'Zero Rupees Only';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function twoDigit(x) {
    if (x < 20) return ones[x];
    return tens[Math.floor(x/10)] + (x%10 ? ' ' + ones[x%10] : '');
  }
  function threeDigit(x) {
    if (x >= 100) return ones[Math.floor(x/100)] + ' Hundred' + (x%100 ? ' ' + twoDigit(x%100) : '');
    return twoDigit(x);
  }
  let str = '';
  const crore = Math.floor(n / 10000000);
  const lakh  = Math.floor((n % 10000000) / 100000);
  const thou  = Math.floor((n % 100000) / 1000);
  const rest  = n % 1000;
  if (crore) str += threeDigit(crore) + ' Crore ';
  if (lakh)  str += twoDigit(lakh) + ' Lakh ';
  if (thou)  str += twoDigit(thou) + ' Thousand ';
  if (rest)  str += threeDigit(rest);
  return (str.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export const getGrade = (obtained, max) => {
  if (obtained === null || obtained === undefined || max === 0) return 'N/A';
  const pct = (obtained / max) * 100;
  if (pct >= 91) return 'O';
  if (pct >= 71) return 'A';
  if (pct >= 56) return 'B';
  if (pct >= 41) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
};

export const getGradeLabel = (grade) => ({
  O:'Outstanding', A:'Excellent', B:'Good', C:'Average', D:'Pass', F:'Fail', 'N/A':'Not Applicable'
}[grade] || grade);

export const initials = (name='') =>
  name.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();

export const safeNum = (val, def=0) => {
  if (val === null || val === undefined || val === '') return def;
  const n = parseFloat(String(val).trim());
  return isNaN(n) ? def : n;
};

export const safeStr = (val, def='') => {
  if (val === null || val === undefined) return def;
  return String(val).trim() || def;
};

export const getClassGroup = (cls) => {
  const n = parseInt(cls);
  if (!n || n <= 2)  return 'primary';
  if (n <= 5)        return 'upper_primary';
  if (n <= 8)        return 'middle';
  if (n <= 10)       return 'secondary';
  return 'senior';
};
