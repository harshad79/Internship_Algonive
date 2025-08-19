// data.js

// Initialize storage if empty
if (!readLS(LS_KEYS.USERS)) writeLS(LS_KEYS.USERS, []);
if (!readLS(LS_KEYS.TASKS)) writeLS(LS_KEYS.TASKS, []);

// Status labels
const STATUS_LABEL = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed'
};
