// Domain types. The full data model (PRD "Data model") lands in Milestone 2.
export type ID = string;

export interface Estate {
  id: ID;
  name: string;
  location: string;
  totalAreaAcres: number;
  ownerName: string;
}
