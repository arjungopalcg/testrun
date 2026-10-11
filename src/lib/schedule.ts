import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Field, TappingTask } from '@/types';

const EPOCH = parseISO('2020-01-01');
const interval = (system: Field['tappingSystem']) => (system === 'S/2 d3' ? 3 : system === 'S/2 d2' ? 2 : 1);
const taskNumber = (task: TappingTask) => Number(task.id.replace(/\D/g, '')) || 0;

/** Whether a task is due for tapping on a date, given its field's tapping system. */
export function isTaskDue(task: TappingTask, field: Field, date: string) {
  if (field.status !== 'tapping') return false;
  return (differenceInCalendarDays(parseISO(date), EPOCH) + taskNumber(task)) % interval(field.tappingSystem) === 0;
}
