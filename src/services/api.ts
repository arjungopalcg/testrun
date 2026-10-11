// The only module screens may import data from. Today it delegates to the mock
// layer; swapping to a real backend later means changing this file alone.
import * as mock from '@/mocks/service';
import type { Estate } from '@/types';

export const getEstate = (): Promise<Estate> => mock.getEstate();
