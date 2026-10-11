import { estate } from './seed';

const latency = () => 200 + Math.random() * 200;
const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), latency()));

export const getEstate = () => delay(estate);
