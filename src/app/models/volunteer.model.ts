import { Timestamp } from '@angular/fire/firestore';

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  skills: string[];
  languages: string[];
  lat: number;
  lng: number;
  available: boolean;
  availabilitySchedule: Record<string, string[]>;
  rating: number;
  tasksCompleted: number;
  totalHours: number;
  badges: string[];
  active: boolean;
  lastActive?: Timestamp;
  region?: string;
  locationName?: string;
  faceVerified?: boolean;
}
