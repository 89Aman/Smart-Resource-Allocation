import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, docData, collectionData, query, where, orderBy, setDoc, updateDoc, deleteDoc, getDoc, limit, writeBatch, arrayUnion } from '@angular/fire/firestore';
import { Observable, map, of, catchError } from 'rxjs';
import { Need, Task, Volunteer, Activity, User, UserRole, InventoryItem, InventoryTransaction, Ngo, NgoStatus, NgoMembership, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES, TaskAssignment, TaskAssignmentStatus, TaskContact } from '../../models';
import { RealtimeDatabaseService } from './realtime-database.service';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);
  private rtdb = inject(RealtimeDatabaseService, { optional: true });

  private assignmentId(taskId: string, volunteerId: string): string {
    return `${taskId}_${volunteerId}`;
  }

  // --- Needs ---
  getOpenNeeds(): Observable<Need[]> {
    const needsRef = collection(this.firestore, 'needs');
    const q = query(needsRef, where('status', '==', 'open'), orderBy('urgency', 'desc'));
    return (collectionData(q, { idField: 'id' }) as Observable<Need[]>).pipe(
      catchError((err) => {
        console.warn('[Firestore] Error on getOpenNeeds, switching to Realtime Database fallback:', err);
        return this.rtdb ? this.rtdb.getOpenNeeds() : of([] as Need[]);
      })
    );
  }

  getNeedById(id: string): Observable<Need | undefined> {
    const needDoc = doc(this.firestore, `needs/${id}`);
    return (docData(needDoc, { idField: 'id' }) as Observable<Need | undefined>).pipe(
      catchError(() => this.rtdb ? this.rtdb.getNeedById(id) : of(undefined))
    );
  }

  async addNeed(need: Partial<Need>): Promise<void> {
    const newDocRef = doc(collection(this.firestore, 'needs'));
    const needWithId = { ...need, id: newDocRef.id };
    await setDoc(newDocRef, needWithId);
    if (this.rtdb) {
      await this.rtdb.addNeed(needWithId);
    }
  }

  async updateNeed(id: string, data: Partial<Need>): Promise<void> {
    const needDoc = doc(this.firestore, `needs/${id}`);
    await updateDoc(needDoc, data);
    if (this.rtdb) {
      await this.rtdb.updateNeed(id, data);
    }
  }

  // --- Tasks ---
  getActiveTasks(): Observable<Task[]> {
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef, where('status', 'in', ['pending', 'active']));
    return (collectionData(q, { idField: 'id' }) as Observable<Task[]>).pipe(
      catchError((err) => {
        console.warn('[Firestore] Error on getActiveTasks, switching to RTDB fallback:', err);
        return this.rtdb ? this.rtdb.getActiveTasks() : of([] as Task[]);
      })
    );
  }

  getAllTasks(): Observable<Task[]> {
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    return (collectionData(q, { idField: 'id' }) as Observable<Task[]>).pipe(
      catchError(() => this.rtdb ? this.rtdb.getAllTasks() : of([] as Task[]))
    );
  }

  getTasksByIds(ids: string[]): Observable<Task[]> {
    if (ids.length === 0) return of([] as Task[]);
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef, where('id', 'in', ids));
    return collectionData(q, { idField: 'id' }) as Observable<Task[]>;
  }

  async addTask(task: Partial<Task>): Promise<string> {
    const newDocRef = doc(collection(this.firestore, 'tasks'));
    const taskWithId = { 
      ...task, 
      id: newDocRef.id,
      createdAt: new Date(),
      status: task.status || 'pending',
      progress: task.progress || 0
    };
    await setDoc(newDocRef, taskWithId);
    if (this.rtdb) {
      await this.rtdb.addTask(taskWithId as any);
    }
    return newDocRef.id;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<void> {
    const taskDoc = doc(this.firestore, `tasks/${id}`);
    await updateDoc(taskDoc, data);
    if (this.rtdb) {
      await this.rtdb.updateTask(id, data);
    }
  }

  // --- Task Assignments (Requests + Accept/Decline) ---
  getTaskAssignmentsForTask(taskId: string): Observable<TaskAssignment[]> {
    const assignmentsRef = collection(this.firestore, 'taskAssignments');
    const q = query(assignmentsRef, where('taskId', '==', taskId), orderBy('requestedAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<TaskAssignment[]>;
  }

  getTaskAssignment(taskId: string, volunteerId: string): Observable<TaskAssignment | undefined> {
    const id = this.assignmentId(taskId, volunteerId);
    const ref = doc(this.firestore, `taskAssignments/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<TaskAssignment | undefined>;
  }

  getVolunteerTaskAssignments(volunteerId: string, statuses?: TaskAssignmentStatus[]): Observable<TaskAssignment[]> {
    const assignmentsRef = collection(this.firestore, 'taskAssignments');
    const q = statuses && statuses.length > 0
      ? query(assignmentsRef, where('volunteerId', '==', volunteerId), where('status', 'in', statuses), orderBy('requestedAt', 'desc'))
      : query(assignmentsRef, where('volunteerId', '==', volunteerId), orderBy('requestedAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<TaskAssignment[]>;
  }

  async createTaskAssignmentRequests(params: {
    taskId: string;
    volunteerIds: string[];
    requestedBy: string;
    region?: string;
  }): Promise<void> {
    const now = new Date();

    for (const volunteerId of params.volunteerIds) {
      const id = this.assignmentId(params.taskId, volunteerId);
      const ref = doc(this.firestore, `taskAssignments/${id}`);
      const existing = await getDoc(ref);
      if (existing.exists()) continue;

      const assignment: TaskAssignment = {
        id,
        taskId: params.taskId,
        volunteerId,
        status: 'pending',
        requestedBy: params.requestedBy,
        requestedAt: now,
        region: params.region,
      };

      await setDoc(ref, assignment);
    }
  }

  async addVolunteerToTask(taskId: string, volunteerId: string): Promise<void> {
    const taskDoc = doc(this.firestore, `tasks/${taskId}`);
    await updateDoc(taskDoc, {
      volunteerIds: arrayUnion(volunteerId),
    });
  }

  async respondToTaskAssignment(params: {
    taskId: string;
    volunteerId: string;
    status: Exclude<TaskAssignmentStatus, 'pending' | 'cancelled'>;
  }): Promise<void> {
    const id = this.assignmentId(params.taskId, params.volunteerId);
    const ref = doc(this.firestore, `taskAssignments/${id}`);
    await updateDoc(ref, {
      status: params.status,
      respondedAt: new Date(),
    });
  }

  async cancelTaskAssignment(params: {
    taskId: string;
    volunteerId: string;
  }): Promise<void> {
    const id = this.assignmentId(params.taskId, params.volunteerId);
    const ref = doc(this.firestore, `taskAssignments/${id}`);
    await updateDoc(ref, {
      status: 'cancelled',
      respondedAt: new Date(),
    });
  }

  // --- Task Contacts (unlocked after acceptance) ---
  getTaskContact(taskId: string): Observable<TaskContact | undefined> {
    const ref = doc(this.firestore, `taskContacts/${taskId}`);
    return docData(ref, { idField: 'id' }) as Observable<TaskContact | undefined>;
  }

  async upsertTaskContact(contact: TaskContact): Promise<void> {
    const ref = doc(this.firestore, `taskContacts/${contact.taskId}`);
    await setDoc(ref, contact, { merge: true });
  }

  // --- Volunteers ---
  getAvailableVolunteers(): Observable<Volunteer[]> {
    const volunteersRef = collection(this.firestore, 'volunteers');
    const q = query(volunteersRef, where('available', '==', true));
    return (collectionData(q, { idField: 'id' }) as Observable<Volunteer[]>).pipe(
      catchError((err) => {
        console.warn('[Firestore] Error on getAvailableVolunteers, switching to RTDB fallback:', err);
        return this.rtdb ? this.rtdb.getAvailableVolunteers() : of([] as Volunteer[]);
      })
    );
  }

  getAllVolunteers(): Observable<Volunteer[]> {
    const volunteersRef = collection(this.firestore, 'volunteers');
    return (collectionData(volunteersRef, { idField: 'id' }) as Observable<Volunteer[]>).pipe(
      catchError(() => this.rtdb ? this.rtdb.getAllVolunteers() : of([] as Volunteer[]))
    );
  }

  getVolunteerById(id: string): Observable<Volunteer | undefined> {
    const volunteerDoc = doc(this.firestore, `volunteers/${id}`);
    return (docData(volunteerDoc, { idField: 'id' }) as Observable<Volunteer | undefined>).pipe(
      catchError(() => this.rtdb ? this.rtdb.getVolunteerById(id) : of(undefined))
    );
  }

  async updateVolunteer(id: string, data: Partial<Volunteer>): Promise<void> {
    const volunteerDoc = doc(this.firestore, `volunteers/${id}`);
    await updateDoc(volunteerDoc, data);
    if (this.rtdb) {
      await this.rtdb.updateVolunteer(id, data);
    }
  }

  async addVolunteer(volunteer: Partial<Volunteer>): Promise<void> {
    const id = volunteer.id || doc(collection(this.firestore, 'volunteers')).id;
    const volWithId = { 
      ...volunteer, 
      id: id,
      rating: volunteer.rating || 0,
      tasksCompleted: volunteer.tasksCompleted || 0,
      totalHours: volunteer.totalHours || 0,
      active: true,
      available: true
    };
    await setDoc(doc(this.firestore, `volunteers/${id}`), volWithId);
    if (this.rtdb) {
      await this.rtdb.addVolunteer(volWithId);
    }
  }

  async semanticSearch(queryStr: string): Promise<Need[]> {
    console.log('Semantic search requested for:', queryStr);
    return [];
  }

  // --- Users & Onboarding ---
  getApplicants(): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('role', '==', 'applicant'), orderBy('displayName', 'asc'));
    return collectionData(q, { idField: 'uid' }) as Observable<User[]>;
  }

  getUsersByRole(role: UserRole): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('role', '==', role), orderBy('displayName', 'asc'));
    return collectionData(q, { idField: 'uid' }) as Observable<User[]>;
  }

  async updateUserRole(uid: string, role: UserRole, status: User['verificationStatus']): Promise<void> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    await updateDoc(userDoc, { 
      role, 
      verificationStatus: status,
      updatedAt: new Date()
    });
    
    if (role === 'volunteer' && status === 'approved') {
      const userData = await this.getUserById(uid);
      if (userData) {
        await this.addVolunteer({
          id: uid,
          name: userData.displayName,
          phone: userData.phone || '',
          skills: userData.skills || [],
          active: true,
          available: true
        });
      }
    }
  }

  async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    await updateDoc(userDoc, {
      ...data,
      updatedAt: new Date()
    });
    if (this.rtdb) {
      await this.rtdb.updateUserProfile(uid, data);
    }
  }

  async getUserById(uid: string): Promise<User | undefined> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    const snapshot = await getDoc(userDoc);
    if (snapshot.exists()) return snapshot.data() as User;
    if (this.rtdb) {
      return this.rtdb.getUserById(uid);
    }
    return undefined;
  }

  // --- Activities ---
  getRecentActivities(limitCount: number = 10): Observable<Activity[]> {
    const activitiesRef = collection(this.firestore, 'activities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'));
    return (collectionData(q, { idField: 'id' }) as Observable<Activity[]>).pipe(
      catchError(() => this.rtdb ? this.rtdb.getRecentActivities() : of([] as Activity[]))
    );
  }

  async logActivity(activity: Partial<Activity>): Promise<void> {
    const activitiesRef = collection(this.firestore, 'activities');
    const newDocRef = doc(activitiesRef);
    const actWithId = {
      ...activity,
      id: newDocRef.id,
      timestamp: new Date()
    };
    await setDoc(newDocRef, actWithId);
    if (this.rtdb) {
      await this.rtdb.logActivity(actWithId);
    }
  }

  getVolunteerActivities(volunteerId: string): Observable<Activity[]> {
    const activitiesRef = collection(this.firestore, 'activities');
    const q = query(activitiesRef, where('userId', '==', volunteerId), orderBy('timestamp', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Activity[]>;
  }

  // --- Inventory ---
  getInventoryItems(): Observable<InventoryItem[]> {
    const inventoryRef = collection(this.firestore, 'inventory');
    const q = query(inventoryRef, orderBy('name', 'asc'));
    return (collectionData(q, { idField: 'id' }) as Observable<InventoryItem[]>).pipe(
      catchError(() => this.rtdb ? this.rtdb.getInventoryItems() : of([] as InventoryItem[]))
    );
  }

  getInventoryItemById(id: string): Observable<InventoryItem | undefined> {
    const itemDoc = doc(this.firestore, `inventory/${id}`);
    return docData(itemDoc, { idField: 'id' }) as Observable<InventoryItem | undefined>;
  }

  async addInventoryItem(item: Partial<InventoryItem>): Promise<void> {
    const newDocRef = doc(collection(this.firestore, 'inventory'));
    const itemWithId = {
      ...item,
      id: newDocRef.id,
      lastUpdated: new Date()
    };
    await setDoc(newDocRef, itemWithId);
    if (this.rtdb) {
      await this.rtdb.addInventoryItem(itemWithId);
    }
  }

  async updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<void> {
    const itemDoc = doc(this.firestore, `inventory/${id}`);
    await updateDoc(itemDoc, {
      ...data,
      lastUpdated: new Date()
    });
    if (this.rtdb) {
      await this.rtdb.updateInventoryItem(id, data);
    }
  }

  getInventoryTransactions(itemId?: string): Observable<InventoryTransaction[]> {
    const transactionsRef = collection(this.firestore, 'inventory_transactions');
    let q = query(transactionsRef, orderBy('timestamp', 'desc'));
    if (itemId) {
      q = query(transactionsRef, where('itemId', '==', itemId), orderBy('timestamp', 'desc'));
    }
    return collectionData(q, { idField: 'id' }) as Observable<InventoryTransaction[]>;
  }

  async logInventoryTransaction(transaction: Partial<InventoryTransaction>): Promise<void> {
    const transactionsRef = collection(this.firestore, 'inventory_transactions');
    const newDocRef = doc(transactionsRef);
    const tx = {
      ...transaction,
      id: newDocRef.id,
      timestamp: new Date()
    };
    await setDoc(newDocRef, tx);

    // Automatically adjust inventory quantity
    if (tx.itemId && tx.quantity) {
      const itemSnapshot = await getDoc(doc(this.firestore, `inventory/${tx.itemId}`));
      if (itemSnapshot.exists()) {
        const currentData = itemSnapshot.data() as InventoryItem;
        let newQuantity = currentData.quantity;
        
        if (tx.type === 'inbound') {
          newQuantity += tx.quantity;
        } else if (tx.type === 'outbound') {
          newQuantity -= tx.quantity;
        } else if (tx.type === 'adjustment') {
          newQuantity = tx.quantity; // Adjust to an exact quantity
        }

        // Determine new status
        let newStatus: InventoryItem['status'] = 'optimal';
        if (newQuantity <= 0) newStatus = 'out_of_stock';
        else if (newQuantity <= currentData.minimumThreshold / 2) newStatus = 'critical';
        else if (newQuantity <= currentData.minimumThreshold) newStatus = 'low';

        await this.updateInventoryItem(tx.itemId, {
          quantity: newQuantity,
          status: newStatus
        });
      }
    }
  }

  async getInventoryItemByQRCode(qrCode: string): Promise<InventoryItem | undefined> {
    const inventoryRef = collection(this.firestore, 'inventory');
    const q = query(inventoryRef, where('qrCode', '==', qrCode));
    // Actual implementation of finding by query
    return new Promise((resolve) => {
      // we need getDocs, so we will import getDocs if needed, but to avoid extra imports we can just do a query using collectionData 
      const sub = collectionData(q, { idField: 'id' }).subscribe(items => {
        sub.unsubscribe();
        resolve(items.length > 0 ? items[0] as InventoryItem : undefined);
      });
    });
  }

  // --- NGO Registry ---
  getNgos(): Observable<Ngo[]> {
    const ngosRef = collection(this.firestore, 'ngos');
    const q = query(ngosRef, orderBy('name', 'asc'));
    return (collectionData(q, { idField: 'id' }) as Observable<Ngo[]>).pipe(
      catchError(() => this.rtdb ? this.rtdb.getNgos() : of([] as Ngo[]))
    );
  }

  getActiveNgos(): Observable<Ngo[]> {
    const ngosRef = collection(this.firestore, 'ngos');
    const q = query(ngosRef, where('status', '==', 'active'), orderBy('name', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Ngo[]>;
  }

  getNgosByStatus(status: NgoStatus): Observable<Ngo[]> {
    const ngosRef = collection(this.firestore, 'ngos');
    const q = query(ngosRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Ngo[]>;
  }

  getNgoById(id: string): Observable<Ngo | undefined> {
    const ngoDoc = doc(this.firestore, `ngos/${id}`);
    return docData(ngoDoc, { idField: 'id' }) as Observable<Ngo | undefined>;
  }

  async addNgo(ngo: Partial<Ngo>): Promise<string> {
    const newDocRef = doc(collection(this.firestore, 'ngos'));
    const ngoWithId = {
      ...ngo,
      id: newDocRef.id,
      status: 'pending_review' as NgoStatus,
      volunteerCount: 0,
      activeMissionCount: 0,
      totalMissionsCompleted: 0,
      memberIds: ngo.founderId ? [ngo.founderId] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await setDoc(newDocRef, ngoWithId);
    if (this.rtdb) {
      await this.rtdb.addNgo(ngoWithId);
    }
    return newDocRef.id;
  }

  async updateNgo(id: string, data: Partial<Ngo>): Promise<void> {
    const ngoDoc = doc(this.firestore, `ngos/${id}`);
    await updateDoc(ngoDoc, {
      ...data,
      updatedAt: new Date()
    });
    if (this.rtdb) {
      await this.rtdb.updateNgo(id, data);
    }
  }

  async approveNgo(id: string, approvedByUid: string): Promise<void> {
    const ngoDoc = doc(this.firestore, `ngos/${id}`);
    await updateDoc(ngoDoc, {
      status: 'active',
      approvedAt: new Date(),
      approvedBy: approvedByUid,
      updatedAt: new Date()
    });
  }

  async suspendNgo(id: string): Promise<void> {
    await this.updateNgo(id, { status: 'suspended' });
  }

  // --- NGO Membership ---
  getNgoMembers(ngoId: string): Observable<NgoMembership[]> {
    const membershipsRef = collection(this.firestore, 'ngo_memberships');
    const q = query(membershipsRef, where('ngoId', '==', ngoId), where('isActive', '==', true));
    return collectionData(q, { idField: 'id' }) as Observable<NgoMembership[]>;
  }

  async addNgoMember(membership: Partial<NgoMembership>): Promise<void> {
    const newDocRef = doc(collection(this.firestore, 'ngo_memberships'));
    await setDoc(newDocRef, {
      ...membership,
      joinedAt: new Date(),
      isActive: true
    });
  }

  // --- Notification Preferences ---
  getNotificationPreferences(uid: string): Observable<NotificationPreferences> {
    const prefsDoc = doc(this.firestore, `notification_preferences/${uid}`);
    return docData(prefsDoc).pipe(
      map((data: any) => {
        if (!data) return DEFAULT_NOTIFICATION_PREFERENCES;
        return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...data } as NotificationPreferences;
      })
    );
  }

  async saveNotificationPreferences(uid: string, prefs: Partial<NotificationPreferences>): Promise<void> {
    const prefsDoc = doc(this.firestore, `notification_preferences/${uid}`);
    await setDoc(prefsDoc, prefs, { merge: true });
  }

  // --- Dashboard Aggregations ---
  getRecentNeedsByRegion(region: string): Observable<Need[]> {
    const needsRef = collection(this.firestore, 'needs');
    const q = query(
      needsRef,
      where('locationName', '==', region),
      where('status', '==', 'open'),
      orderBy('reportedAt', 'desc'),
      limit(20)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Need[]>;
  }

  getTasksByVolunteer(volunteerId: string): Observable<Task[]> {
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef, where('volunteerIds', 'array-contains', volunteerId));
    return collectionData(q, { idField: 'id' }) as Observable<Task[]>;
  }
}

