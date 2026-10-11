import { format, startOfMonth } from 'date-fns';

export const isoDate = (d: Date) => format(d, 'yyyy-MM-dd');
export const todayIso = () => isoDate(new Date());
export const monthStartIso = () => isoDate(startOfMonth(new Date()));
