import { Injectable, inject } from '@angular/core';
import { Database, ref, set, update, remove, get, onValue, push, child, query, orderByChild, equalTo } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { 
  Need, 
  Task, 
  Volunteer, 
  Activity, 
  User, 
  UserRole, 
  InventoryItem, 
  InventoryTransaction, 
  Ngo, 
  NgoStatus, 
  NgoMembership, 
  NotificationPreferences, 
  DEFAULT_NOTIFICATION_PREFERENCES, 
  TaskAssignment, 
  TaskAssignmentStatus, 
  TaskContact 
} from '../../models';

@Injectable({ providedIn: 'root' })
export class RealtimeDatabaseService {
  private db = inject(Database, { optional: true });

  constructor() {
    this.checkAndSeedMinimalData();
  }

  private async checkAndSeedMinimalData() {
    if (!this.db) return;
    try {
      const needsSnapshot = await this.getItem<any>('needs');
      if (!needsSnapshot || Object.keys(needsSnapshot).length === 0) {
        console.log('[RTDB] Database empty, seeding minimal crisis grid mock data...');
        await this.seedMinimalMockData();
      }
    } catch (e) {
      console.warn('[RTDB] Auto-seed check skipped:', e);
    }
  }

  async seedMinimalMockData(): Promise<void> {
    if (!this.db) return;
    
    // 1. Needs
    const mockNeeds = {
      'need_1': {
        id: 'need_1',
        title: 'Potable Drinking Water Bowser Deployment',
        description: 'Severe clean water shortage due to pipeline rupture in 90 Feet Road sector. Immediate water distribution tanks needed for 400 households.',
        category: 'water',
        urgency: 'critical',
        lat: 19.0433,
        lng: 72.8550,
        locationName: 'Dharavi 90 Feet Road (Sector 5)',
        status: 'open',
        reportedAt: new Date(Date.now() - 3600000).toISOString(),
        reportedBy: 'Field Worker - Rahul S.',
        assignedVolunteers: []
      },
      'need_2': {
        id: 'need_2',
        title: 'Trauma First Aid & Insulin Cold-Storage',
        description: 'Urgent medical aid needed at Kurla depot clinic for minor injuries and emergency chronic supplies following flood surge.',
        category: 'medical',
        urgency: 'high',
        lat: 19.0688,
        lng: 72.8797,
        locationName: 'Kurla West Railway Colony Outpost',
        status: 'in_progress',
        reportedAt: new Date(Date.now() - 7200000).toISOString(),
        reportedBy: 'Coordinator - Dr. Aarav',
        assignedVolunteers: ['vol_1']
      },
      'need_3': {
        id: 'need_3',
        title: '500 Dry Ration & Food Meal Kits',
        description: 'Distribution of dry grain packs and essential baby formula for displaced transit families in Govandi camp.',
        category: 'food',
        urgency: 'medium',
        lat: 19.0560,
        lng: 72.9150,
        locationName: 'Govandi Transit Camp East',
        status: 'open',
        reportedAt: new Date(Date.now() - 10800000).toISOString(),
        reportedBy: 'Relief Volunteer - Sneha',
        assignedVolunteers: []
      },
      'need_4': {
        id: 'need_4',
        title: 'Heavy Waterproof Tarpaulin Sheets',
        description: 'Slope erosion risk near pipeline settlement. 150 weather-resistant tarpaulins needed to reinforce temporary hillside dwellings.',
        category: 'shelter',
        urgency: 'critical',
        lat: 19.1450,
        lng: 72.9360,
        locationName: 'Bhandup Pipeline Slopes',
        status: 'open',
        reportedAt: new Date(Date.now() - 14400000).toISOString(),
        reportedBy: 'Field Worker - Anil K.',
        assignedVolunteers: []
      }
    };

    // 2. Volunteers
    const mockVolunteers = {
      'vol_1': {
        id: 'vol_1',
        name: 'Dr. Aarav Mehta',
        phone: '+91 98201 11223',
        skills: ['Paramedic', 'First Aid', 'Triage', 'Emergency Medicine'],
        languages: ['English', 'Hindi', 'Marathi', 'Gujarati'],
        lat: 19.0450,
        lng: 72.8580,
        available: true,
        rating: 4.9,
        tasksCompleted: 28,
        totalHours: 140,
        active: true,
        badges: ['Medical Lead', 'Top Responder', 'Ward 4 First Responder']
      },
      'vol_2': {
        id: 'vol_2',
        name: 'Priya Sharma',
        phone: '+91 98202 22334',
        skills: ['Logistics', 'Heavy Vehicle Driver', 'Ration Distribution', 'Coordination'],
        languages: ['English', 'Hindi', 'Marathi'],
        lat: 19.0650,
        lng: 72.8750,
        available: true,
        rating: 4.8,
        tasksCompleted: 19,
        totalHours: 95,
        active: true,
        badges: ['Logistics Pro', 'Disaster Pilot']
      },
      'vol_3': {
        id: 'vol_3',
        name: 'Rohan Deshmukh',
        phone: '+91 98203 33445',
        skills: ['Search & Rescue', 'Boat Operations', 'Disaster Response', 'Flood Rescue'],
        languages: ['Marathi', 'Hindi', 'English'],
        lat: 19.0520,
        lng: 72.9100,
        available: true,
        rating: 5.0,
        tasksCompleted: 34,
        totalHours: 210,
        active: true,
        badges: ['Rescue Ace', 'Flood Commander']
      },
      'vol_4': {
        id: 'vol_4',
        name: 'Sneha Patil',
        phone: '+91 98204 44556',
        skills: ['Community Health', 'Child Care', 'Translation (Marathi/Hindi)', 'Counseling'],
        languages: ['Marathi', 'Hindi'],
        lat: 19.1400,
        lng: 72.9300,
        available: true,
        rating: 4.7,
        tasksCompleted: 15,
        totalHours: 68,
        active: true,
        badges: ['Community Champion']
      }
    };

    // 3. Tasks
    const mockTasks = {
      'task_1': {
        id: 'task_1',
        title: 'Dispatch 2000L Water Bowser to Sector 5',
        category: 'water',
        priority: 'critical',
        status: 'active',
        progress: 60,
        volunteerIds: ['vol_2'],
        locationName: 'Dharavi 90 Feet Road (Sector 5)',
        locationLat: 19.0433,
        locationLng: 72.8550,
        description: 'Coordinate water truck from Dadar depot to Dharavi distribution hub.',
        createdAt: new Date(Date.now() - 5400000).toISOString()
      },
      'task_2': {
        id: 'task_2',
        title: 'Deliver Medical Kits to Kurla Clinic',
        category: 'medical',
        priority: 'high',
        status: 'pending',
        progress: 15,
        volunteerIds: ['vol_1'],
        locationName: 'Kurla West Railway Colony',
        locationLat: 19.0688,
        locationLng: 72.8797,
        description: 'Transport 4 trauma kits and glucose packets to the ground medical post.',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      'task_3': {
        id: 'task_3',
        title: 'Shelter Kit Reinforcement at Bhandup Slopes',
        category: 'shelter',
        priority: 'critical',
        status: 'in_progress',
        progress: 40,
        volunteerIds: ['vol_3', 'vol_4'],
        locationName: 'Bhandup Pipeline Slopes',
        locationLat: 19.1450,
        locationLng: 72.9360,
        description: 'Erect temporary protective tarpaulins along erosion zone.',
        createdAt: new Date(Date.now() - 14400000).toISOString()
      }
    };

    // 4. Inventory Vault
    const mockInventory = {
      'inv_1': {
        id: 'inv_1',
        name: '20L Water Purifier Storage Cans',
        category: 'Water & Sanitation',
        quantity: 450,
        minimumThreshold: 100,
        status: 'optimal',
        unit: 'cans',
        location: 'Dharavi Hub A Storage',
        qrCode: 'VAULT-WTR-20L-001',
        lastUpdated: new Date().toISOString()
      },
      'inv_2': {
        id: 'inv_2',
        name: 'Trauma First Aid Emergency Kits',
        category: 'Medical',
        quantity: 85,
        minimumThreshold: 50,
        status: 'optimal',
        unit: 'kits',
        location: 'Kurla Central Vault',
        qrCode: 'VAULT-MED-FAK-002',
        lastUpdated: new Date().toISOString()
      },
      'inv_3': {
        id: 'inv_3',
        name: 'Tarpaulin Heavy Weather Sheets (12x18)',
        category: 'Shelter',
        quantity: 120,
        minimumThreshold: 150,
        status: 'low',
        unit: 'rolls',
        location: 'Bhandup Relief Outpost',
        qrCode: 'VAULT-SHL-TRP-003',
        lastUpdated: new Date().toISOString()
      },
      'inv_4': {
        id: 'inv_4',
        name: 'Ready-To-Eat Nutrient Meal Packs',
        category: 'Food',
        quantity: 1800,
        minimumThreshold: 500,
        status: 'optimal',
        unit: 'packets',
        location: 'Govandi Transit Store',
        qrCode: 'VAULT-FOD-RTE-004',
        lastUpdated: new Date().toISOString()
      }
    };

    // 5. NGOs
    const mockNgos = {
      'ngo_1': {
        id: 'ngo_1',
        name: 'Mumbai Disaster Relief Front',
        registrationNumber: 'NGO/MUM/2021/884',
        focusAreas: ['Disaster Response', 'Emergency Rescue', 'Supply Distribution'],
        status: 'active',
        volunteerCount: 142,
        activeMissionCount: 4,
        totalMissionsCompleted: 240,
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        contactEmail: 'operations@mdrf.org.in',
        contactPhone: '+91 22 2410 9900',
        darpanId: 'MH/2021/0284910',
        verified: true,
        createdAt: new Date().toISOString()
      },
      'ngo_2': {
        id: 'ngo_2',
        name: 'Dharavi Health & Sanitation Trust',
        registrationNumber: 'NGO/MUM/2019/312',
        focusAreas: ['Healthcare', 'Sanitation', 'First Aid Response'],
        status: 'active',
        volunteerCount: 88,
        activeMissionCount: 2,
        totalMissionsCompleted: 165,
        city: 'Mumbai',
        district: 'Mumbai City',
        contactEmail: 'contact@dharavihealth.org',
        contactPhone: '+91 22 2407 1122',
        darpanId: 'MH/2019/0192344',
        verified: true,
        createdAt: new Date().toISOString()
      }
    };

    // 6. Activities
    const mockActivities = {
      'act_1': {
        id: 'act_1',
        title: 'Emergency Medical Kit Dispatched',
        type: 'tasks',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        description: 'Dr. Aarav Mehta en route to Kurla West Clinic outpost.'
      },
      'act_2': {
        id: 'act_2',
        title: '3 Volunteer Medics On Standby',
        type: 'volunteers',
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        description: 'Ward 4 emergency medical response team registered and available.'
      },
      'act_3': {
        id: 'act_3',
        title: 'Critical Water Shortage Logged',
        type: 'needs',
        timestamp: new Date(Date.now() - 2700000).toISOString(),
        description: 'Dharavi Sector 5 reported 2000L urgent requirement.'
      }
    };

    await this.setItem('needs', mockNeeds);
    await this.setItem('volunteers', mockVolunteers);
    await this.setItem('tasks', mockTasks);
    await this.setItem('inventory', mockInventory);
    await this.setItem('ngos', mockNgos);
    await this.setItem('activities', mockActivities);

    console.log('[RTDB] Minimal mock data seeded successfully.');
  }

  private isDbAvailable(): boolean {
    return !!this.db;
  }

  // --- Helper: Observable from RTDB path ---
  listFromPath<T>(path: string): Observable<T[]> {
    return new Observable<T[]>((subscriber) => {
      if (!this.db) {
        subscriber.next([]);
        return;
      }
      const dbRef = ref(this.db, path);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          subscriber.next([]);
          return;
        }
        if (Array.isArray(val)) {
          subscriber.next(val.filter(Boolean));
          return;
        }
        const items = Object.entries(val).map(([key, item]) => {
          if (typeof item === 'object' && item !== null) {
            return { ...(item as Record<string, unknown>), id: (item as { id?: string }).id || key } as T;
          }
          return item as T;
        });
        subscriber.next(items);
      }, (error) => {
        console.warn(`[RTDB] Error listening on ${path}:`, error);
        subscriber.next([]);
      });

      return () => unsubscribe();
    });
  }

  objectFromPath<T>(path: string): Observable<T | undefined> {
    return new Observable<T | undefined>((subscriber) => {
      if (!this.db) {
        subscriber.next(undefined);
        return;
      }
      const dbRef = ref(this.db, path);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          subscriber.next(undefined);
          return;
        }
        subscriber.next(val as T);
      }, (error) => {
        console.warn(`[RTDB] Error listening on object ${path}:`, error);
        subscriber.next(undefined);
      });

      return () => unsubscribe();
    });
  }

  // --- Generic Set / Update / Remove ---
  async setItem<T>(path: string, data: T): Promise<void> {
    if (!this.db) return;
    try {
      await set(ref(this.db, path), data);
    } catch (e) {
      console.warn(`[RTDB] setItem failed on ${path}:`, e);
    }
  }

  async updateItem<T extends object>(path: string, data: Partial<T>): Promise<void> {
    if (!this.db) return;
    try {
      await update(ref(this.db, path), data);
    } catch (e) {
      console.warn(`[RTDB] updateItem failed on ${path}:`, e);
    }
  }

  async removeItem(path: string): Promise<void> {
    if (!this.db) return;
    try {
      await remove(ref(this.db, path));
    } catch (e) {
      console.warn(`[RTDB] removeItem failed on ${path}:`, e);
    }
  }

  async getItem<T>(path: string): Promise<T | undefined> {
    if (!this.db) return undefined;
    try {
      const snap = await get(ref(this.db, path));
      return snap.exists() ? (snap.val() as T) : undefined;
    } catch (e) {
      console.warn(`[RTDB] getItem failed on ${path}:`, e);
      return undefined;
    }
  }

  // --- Needs ---
  getOpenNeeds(): Observable<Need[]> {
    return this.listFromPath<Need>('needs');
  }

  getNeedById(id: string): Observable<Need | undefined> {
    return this.objectFromPath<Need>(`needs/${id}`);
  }

  async addNeed(need: Partial<Need>): Promise<string> {
    const id = need.id || (this.db ? push(child(ref(this.db), 'needs')).key : `need_${Date.now()}`) || `need_${Date.now()}`;
    const needWithId = {
      ...need,
      id,
      reportedAt: need.reportedAt || new Date().toISOString(),
      status: need.status || 'open',
      assignedVolunteers: need.assignedVolunteers || []
    };
    await this.setItem(`needs/${id}`, needWithId);
    return id;
  }

  async updateNeed(id: string, data: Partial<Need>): Promise<void> {
    await this.updateItem(`needs/${id}`, data);
  }

  // --- Tasks ---
  getActiveTasks(): Observable<Task[]> {
    return this.listFromPath<Task>('tasks');
  }

  getAllTasks(): Observable<Task[]> {
    return this.listFromPath<Task>('tasks');
  }

  async addTask(task: Partial<Task>): Promise<string> {
    const id = task.id || (this.db ? push(child(ref(this.db), 'tasks')).key : `task_${Date.now()}`) || `task_${Date.now()}`;
    const taskWithId = {
      ...task,
      id,
      createdAt: new Date().toISOString(),
      status: task.status || 'pending',
      progress: task.progress || 0,
      volunteerIds: task.volunteerIds || []
    };
    await this.setItem(`tasks/${id}`, taskWithId);
    return id;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<void> {
    await this.updateItem(`tasks/${id}`, data);
  }

  // --- Volunteers ---
  getAvailableVolunteers(): Observable<Volunteer[]> {
    return this.listFromPath<Volunteer>('volunteers');
  }

  getAllVolunteers(): Observable<Volunteer[]> {
    return this.listFromPath<Volunteer>('volunteers');
  }

  getVolunteerById(id: string): Observable<Volunteer | undefined> {
    return this.objectFromPath<Volunteer>(`volunteers/${id}`);
  }

  async addVolunteer(volunteer: Partial<Volunteer>): Promise<void> {
    const id = volunteer.id || (this.db ? push(child(ref(this.db), 'volunteers')).key : `vol_${Date.now()}`) || `vol_${Date.now()}`;
    const volWithId = {
      ...volunteer,
      id,
      active: true,
      available: volunteer.available !== undefined ? volunteer.available : true,
      skills: volunteer.skills || [],
      rating: volunteer.rating || 4.8,
      tasksCompleted: volunteer.tasksCompleted || 0,
      totalHours: volunteer.totalHours || 0
    };
    await this.setItem(`volunteers/${id}`, volWithId);
  }

  async updateVolunteer(id: string, data: Partial<Volunteer>): Promise<void> {
    await this.updateItem(`volunteers/${id}`, data);
  }

  // --- Inventory ---
  getInventoryItems(): Observable<InventoryItem[]> {
    return this.listFromPath<InventoryItem>('inventory');
  }

  async addInventoryItem(item: Partial<InventoryItem>): Promise<void> {
    const id = item.id || (this.db ? push(child(ref(this.db), 'inventory')).key : `inv_${Date.now()}`) || `inv_${Date.now()}`;
    const itemWithId = {
      ...item,
      id,
      lastUpdated: new Date().toISOString()
    };
    await this.setItem(`inventory/${id}`, itemWithId);
  }

  async updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<void> {
    await this.updateItem(`inventory/${id}`, {
      ...data,
      lastUpdated: new Date().toISOString()
    });
  }

  // --- NGOs ---
  getNgos(): Observable<Ngo[]> {
    return this.listFromPath<Ngo>('ngos');
  }

  async addNgo(ngo: Partial<Ngo>): Promise<string> {
    const id = ngo.id || (this.db ? push(child(ref(this.db), 'ngos')).key : `ngo_${Date.now()}`) || `ngo_${Date.now()}`;
    const ngoWithId = {
      ...ngo,
      id,
      status: 'pending_review' as NgoStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.setItem(`ngos/${id}`, ngoWithId);
    return id;
  }

  async updateNgo(id: string, data: Partial<Ngo>): Promise<void> {
    await this.updateItem(`ngos/${id}`, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  // --- Activities ---
  getRecentActivities(): Observable<Activity[]> {
    return this.listFromPath<Activity>('activities');
  }

  async logActivity(activity: Partial<Activity>): Promise<void> {
    const id = activity.id || (this.db ? push(child(ref(this.db), 'activities')).key : `act_${Date.now()}`) || `act_${Date.now()}`;
    const actWithId = {
      ...activity,
      id,
      timestamp: new Date().toISOString()
    };
    await this.setItem(`activities/${id}`, actWithId);
  }

  // --- Users & Profiles ---
  async getUserById(uid: string): Promise<User | undefined> {
    return this.getItem<User>(`users/${uid}`);
  }

  async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
    await this.updateItem(`users/${uid}`, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }
}
