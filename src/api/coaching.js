// ── Coaching Module API ─────────────────────────────────────────────
import { _fetch, cachedCall, writeCall } from './_base.js';

// Auth
export const coaching_register      = (p) => _fetch({ action: 'coaching_register', ...p });
export const coaching_login         = (p) => _fetch({ action: 'coaching_login', ...p });
export const coaching_student_login = (p) => _fetch({ action: 'coaching_student_login', ...p });
export const coaching_getMyDashboard = () => _fetch({ action: 'coaching_getMyDashboard' });

// Students
export const coaching_getStudents     = (p={}) => cachedCall('coaching_getStudents', p);
export const coaching_addStudent      = (p)    => writeCall('coaching_addStudent', p);
export const coaching_updateStudent   = (p)    => writeCall('coaching_updateStudent', p);

// Batches
export const coaching_getBatches      = (p={}) => cachedCall('coaching_getBatches', p);
export const coaching_addBatch        = (p)    => writeCall('coaching_addBatch', p);
export const coaching_updateBatch     = (p)    => writeCall('coaching_updateBatch', p);
export const coaching_assignStudents  = (p)    => writeCall('coaching_assignStudents', p);
export const coaching_assignFaculty   = (p)    => writeCall('coaching_assignFaculty', p);

// Fees
export const coaching_getFees         = (p={}) => cachedCall('coaching_getFees', p);
export const coaching_collectFee      = (p)    => writeCall('coaching_collectFee', p);

// Tests
export const coaching_getTests        = (p={}) => cachedCall('coaching_getTests', p);
export const coaching_addTest         = (p)    => writeCall('coaching_addTest', p);

// Attendance (always fresh — no cache)
export const coaching_getAttendance   = (p)    => _fetch({ action: 'coaching_getAttendance', ...p });
export const coaching_markAttendance  = (p)    => writeCall('coaching_markAttendance', p);

// Dashboard & Performance
export const coaching_getDashboard    = ()     => cachedCall('coaching_getDashboard');
export const coaching_getStudentPerformance = (p) => _fetch({ action: 'coaching_getStudentPerformance', ...p });
