import { UserProfile } from '../types';

export const USERS: UserProfile[] = [
  {
    id: 'user-alex',
    name: 'Alex Chen',
    email: 'alex.chen@campus.edu',
    role: 'student',
    roleTitle: 'Student Coordinator',
    department: 'School of Engineering (Robotics Club)',
    avatarUrl: '/src/assets/images/avatar_student_alex_1794423328398.jpg'
  },
  {
    id: 'user-sarah',
    name: 'Dr. Sarah Jenkins',
    email: 's.jenkins@campus.edu',
    role: 'admin',
    roleTitle: 'Department Administrator',
    department: 'Department of Computer Science',
    avatarUrl: '/src/assets/images/avatar_admin_sarah_1794423327891.jpg'
  },
  {
    id: 'user-marcus',
    name: 'Marcus Vance',
    email: 'm.vance@campus.edu',
    role: 'manager',
    roleTitle: 'Campus Resource Manager',
    department: 'Facilities & Logistics Operations',
    avatarUrl: '/src/assets/images/avatar_manager_marcus_1794423327569.jpg'
  }
];
