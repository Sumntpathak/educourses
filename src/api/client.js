export { getToken, setToken, clearToken, getStaff } from './_base.js';
export { default as DBCache } from '../cache/db.js';

// Auth
export { login as apiLogin, logout, verifySession } from './_base.js';

// Coaching APIs
export {
  coaching_register, coaching_login, coaching_student_login, coaching_getMyDashboard,
  coaching_getStudents, coaching_addStudent, coaching_updateStudent,
  coaching_getBatches, coaching_addBatch, coaching_updateBatch,
  coaching_assignStudents, coaching_assignFaculty,
  coaching_getFees, coaching_collectFee,
  coaching_getTests, coaching_addTest,
  coaching_getAttendance, coaching_markAttendance,
  coaching_getDashboard, coaching_getStudentPerformance,
} from './coaching.js';
