import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Observable, from, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Need, 
  Task, 
  Volunteer, 
  Activity, 
  User, 
  InventoryItem, 
  InventoryTransaction, 
  Ngo, 
  NgoMembership,
  TaskAssignment,
  TaskContact
} from '../../models';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  get supabase(): SupabaseClient {
    return this.client;
  }

  // ────────────────── NEEDS ──────────────────

  async getOpenNeeds(): Promise<Need[]> {
    const { data, error } = await this.client
      .from('needs')
      .select('*')
      .eq('status', 'open')
      .order('urgency', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapNeedFromDb);
  }

  async getNeedById(id: string): Promise<Need | null> {
    const { data, error } = await this.client
      .from('needs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? this.mapNeedFromDb(data) : null;
  }

  async addNeed(need: Partial<Need>): Promise<Need> {
    const payload = this.mapNeedToDb(need);
    const { data, error } = await this.client
      .from('needs')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return this.mapNeedFromDb(data);
  }

  async updateNeed(id: string, updates: Partial<Need>): Promise<void> {
    const payload = this.mapNeedToDb(updates);
    const { error } = await this.client
      .from('needs')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  // ────────────────── TASKS ──────────────────

  async getActiveTasks(): Promise<Task[]> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .in('status', ['pending', 'active', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapTaskFromDb);
  }

  async getAllTasks(): Promise<Task[]> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapTaskFromDb);
  }

  async addTask(task: Partial<Task>): Promise<Task> {
    const payload = this.mapTaskToDb(task);
    const { data, error } = await this.client
      .from('tasks')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return this.mapTaskFromDb(data);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const payload = this.mapTaskToDb(updates);
    const { error } = await this.client
      .from('tasks')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  // ────────────────── VOLUNTEERS ──────────────────

  async getAvailableVolunteers(): Promise<Volunteer[]> {
    const { data, error } = await this.client
      .from('volunteers')
      .select('*')
      .eq('available', true)
      .eq('active', true);

    if (error) throw error;
    return (data || []).map(this.mapVolunteerFromDb);
  }

  async getAllVolunteers(): Promise<Volunteer[]> {
    const { data, error } = await this.client
      .from('volunteers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapVolunteerFromDb);
  }

  async addVolunteer(volunteer: Partial<Volunteer>): Promise<void> {
    const payload = this.mapVolunteerToDb(volunteer);
    const { error } = await this.client
      .from('volunteers')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
  }

  async updateVolunteer(id: string, updates: Partial<Volunteer>): Promise<void> {
    const payload = this.mapVolunteerToDb(updates);
    const { error } = await this.client
      .from('volunteers')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  // ────────────────── USERS ──────────────────

  async getUserProfile(uid: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) return null;
    return data ? this.mapUserFromDb(data) : null;
  }

  async upsertUserProfile(user: Partial<User>): Promise<void> {
    const payload = this.mapUserToDb(user);
    const { error } = await this.client
      .from('users')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
  }

  // ────────────────── NGOS ──────────────────

  async getNgos(): Promise<Ngo[]> {
    const { data, error } = await this.client
      .from('ngos')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapNgoFromDb);
  }

  async addNgo(ngo: Partial<Ngo>): Promise<Ngo> {
    const payload = this.mapNgoToDb(ngo);
    const { data, error } = await this.client
      .from('ngos')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return this.mapNgoFromDb(data);
  }

  // ────────────────── INVENTORY ──────────────────

  async getInventoryItems(): Promise<InventoryItem[]> {
    const { data, error } = await this.client
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapInventoryFromDb);
  }

  async addInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const payload = this.mapInventoryToDb(item);
    const { data, error } = await this.client
      .from('inventory_items')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return this.mapInventoryFromDb(data);
  }

  // ────────────────── ACTIVITIES ──────────────────

  async getRecentActivities(limit: number = 15): Promise<Activity[]> {
    const { data, error } = await this.client
      .from('activities')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapActivityFromDb);
  }

  async logActivity(activity: Partial<Activity>): Promise<void> {
    const payload = {
      type: activity.type,
      text: activity.text,
      user_id: activity.userId,
      user_name: activity.userName,
      dot_class: activity.dotClass || 'bg-primary'
    };
    const { error } = await this.client
      .from('activities')
      .insert(payload);

    if (error) throw error;
  }

  // ────────────────── REALTIME SUBSCRIPTION HELPER ──────────────────

  subscribeToTable(table: string, callback: (payload: any) => void): RealtimeChannel {
    return this.client
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }

  // ────────────────── DATA MAPPERS ──────────────────

  private mapNeedFromDb(row: any): Need {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      urgency: row.urgency,
      lat: row.lat,
      lng: row.lng,
      locationName: row.location_name,
      reportedAt: row.reported_at as any,
      reportedBy: row.reported_by,
      status: row.status,
      assignedVolunteers: row.assigned_volunteers || [],
      photoUrl: row.photo_url,
      description: row.description,
      summary: row.summary,
      descriptionHindi: row.description_hindi
    };
  }

  private mapNeedToDb(need: Partial<Need>): any {
    const obj: any = {};
    if (need.id !== undefined) obj.id = need.id;
    if (need.title !== undefined) obj.title = need.title;
    if (need.category !== undefined) obj.category = need.category;
    if (need.urgency !== undefined) obj.urgency = need.urgency;
    if (need.lat !== undefined) obj.lat = need.lat;
    if (need.lng !== undefined) obj.lng = need.lng;
    if (need.locationName !== undefined) obj.location_name = need.locationName;
    if (need.reportedBy !== undefined) obj.reported_by = need.reportedBy;
    if (need.status !== undefined) obj.status = need.status;
    if (need.assignedVolunteers !== undefined) obj.assigned_volunteers = need.assignedVolunteers;
    if (need.photoUrl !== undefined) obj.photo_url = need.photoUrl;
    if (need.description !== undefined) obj.description = need.description;
    if (need.summary !== undefined) obj.summary = need.summary;
    if (need.descriptionHindi !== undefined) obj.description_hindi = need.descriptionHindi;
    return obj;
  }

  private mapTaskFromDb(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      needId: row.need_id,
      category: row.category,
      priority: row.priority,
      volunteerIds: row.volunteer_ids || [],
      status: row.status,
      progress: row.progress || 0,
      dueAt: row.due_at as any,
      createdBy: row.created_by,
      createdAt: row.created_at as any,
      completedAt: row.completed_at as any,
      recurring: row.recurring || false,
      frequency: row.frequency,
      attachmentUrls: row.attachment_urls || [],
      description: row.description,
      locationLat: row.location_lat,
      locationLng: row.location_lng,
      locationName: row.location_name
    };
  }

  private mapTaskToDb(task: Partial<Task>): any {
    const obj: any = {};
    if (task.id !== undefined) obj.id = task.id;
    if (task.title !== undefined) obj.title = task.title;
    if (task.needId !== undefined) obj.need_id = task.needId;
    if (task.category !== undefined) obj.category = task.category;
    if (task.priority !== undefined) obj.priority = task.priority;
    if (task.volunteerIds !== undefined) obj.volunteer_ids = task.volunteerIds;
    if (task.status !== undefined) obj.status = task.status;
    if (task.progress !== undefined) obj.progress = task.progress;
    if (task.dueAt !== undefined) obj.due_at = task.dueAt;
    if (task.createdBy !== undefined) obj.created_by = task.createdBy;
    if (task.completedAt !== undefined) obj.completed_at = task.completedAt;
    if (task.recurring !== undefined) obj.recurring = task.recurring;
    if (task.frequency !== undefined) obj.frequency = task.frequency;
    if (task.attachmentUrls !== undefined) obj.attachment_urls = task.attachmentUrls;
    if (task.description !== undefined) obj.description = task.description;
    if (task.locationLat !== undefined) obj.location_lat = task.locationLat;
    if (task.locationLng !== undefined) obj.location_lng = task.locationLng;
    if (task.locationName !== undefined) obj.location_name = task.locationName;
    return obj;
  }

  private mapVolunteerFromDb(row: any): Volunteer {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone || '',
      skills: row.skills || [],
      languages: row.languages || [],
      lat: row.lat,
      lng: row.lng,
      available: row.available,
      availabilitySchedule: row.availability_schedule || {},
      rating: Number(row.rating || 5),
      tasksCompleted: row.tasks_completed || 0,
      totalHours: Number(row.total_hours || 0),
      badges: row.badges || [],
      active: row.active,
      lastActive: row.last_active as any,
      region: row.region,
      locationName: row.location_name,
      faceVerified: row.face_verified || false
    };
  }

  private mapVolunteerToDb(vol: Partial<Volunteer>): any {
    const obj: any = {};
    if (vol.id !== undefined) obj.id = vol.id;
    if (vol.name !== undefined) obj.name = vol.name;
    if (vol.phone !== undefined) obj.phone = vol.phone;
    if (vol.skills !== undefined) obj.skills = vol.skills;
    if (vol.languages !== undefined) obj.languages = vol.languages;
    if (vol.lat !== undefined) obj.lat = vol.lat;
    if (vol.lng !== undefined) obj.lng = vol.lng;
    if (vol.available !== undefined) obj.available = vol.available;
    if (vol.availabilitySchedule !== undefined) obj.availability_schedule = vol.availabilitySchedule;
    if (vol.rating !== undefined) obj.rating = vol.rating;
    if (vol.tasksCompleted !== undefined) obj.tasks_completed = vol.tasksCompleted;
    if (vol.totalHours !== undefined) obj.total_hours = vol.totalHours;
    if (vol.badges !== undefined) obj.badges = vol.badges;
    if (vol.active !== undefined) obj.active = vol.active;
    if (vol.region !== undefined) obj.region = vol.region;
    if (vol.locationName !== undefined) obj.location_name = vol.locationName;
    if (vol.faceVerified !== undefined) obj.face_verified = vol.faceVerified;
    return obj;
  }

  private mapUserFromDb(row: any): User {
    return {
      uid: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      permissions: row.permissions || [],
      region: row.region,
      photoURL: row.photo_url,
      verificationStatus: row.verification_status,
      phone: row.phone,
      skills: row.skills || [],
      idProofUrl: row.id_proof_url,
      availability: row.availability,
      aadhaarNumber: row.aadhaar_number,
      faceVerified: row.face_verified,
      facePhotoUrl: row.face_photo_url,
      faceMatchConfidence: row.face_match_confidence,
      ocrConfidence: row.ocr_confidence,
      languages: row.languages || [],
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      address: row.address,
      ngoAffiliation: row.ngo_affiliation,
      ngoName: row.ngo_name,
      ngoEmail: row.ngo_email,
      ngoRegistrationNumber: row.ngo_registration_number,
      ngoLogoUrl: row.ngo_logo_url,
      ngoId: row.ngo_id,
      fcmToken: row.fcm_token,
      isRegistered: row.is_registered
    };
  }

  private mapUserToDb(user: Partial<User>): any {
    const obj: any = {};
    if (user.uid !== undefined) obj.id = user.uid;
    if (user.email !== undefined) obj.email = user.email;
    if (user.displayName !== undefined) obj.display_name = user.displayName;
    if (user.role !== undefined) obj.role = user.role;
    if (user.permissions !== undefined) obj.permissions = user.permissions;
    if (user.region !== undefined) obj.region = user.region;
    if (user.photoURL !== undefined) obj.photo_url = user.photoURL;
    if (user.verificationStatus !== undefined) obj.verification_status = user.verificationStatus;
    if (user.phone !== undefined) obj.phone = user.phone;
    if (user.skills !== undefined) obj.skills = user.skills;
    if (user.idProofUrl !== undefined) obj.id_proof_url = user.idProofUrl;
    if (user.availability !== undefined) obj.availability = user.availability;
    if (user.aadhaarNumber !== undefined) obj.aadhaar_number = user.aadhaarNumber;
    if (user.faceVerified !== undefined) obj.face_verified = user.faceVerified;
    if (user.facePhotoUrl !== undefined) obj.face_photo_url = user.facePhotoUrl;
    if (user.faceMatchConfidence !== undefined) obj.face_match_confidence = user.faceMatchConfidence;
    if (user.ocrConfidence !== undefined) obj.ocr_confidence = user.ocrConfidence;
    if (user.languages !== undefined) obj.languages = user.languages;
    if (user.dateOfBirth !== undefined) obj.date_of_birth = user.dateOfBirth;
    if (user.gender !== undefined) obj.gender = user.gender;
    if (user.address !== undefined) obj.address = user.address;
    if (user.ngoAffiliation !== undefined) obj.ngo_affiliation = user.ngoAffiliation;
    if (user.ngoName !== undefined) obj.ngo_name = user.ngoName;
    if (user.ngoEmail !== undefined) obj.ngo_email = user.ngoEmail;
    if (user.ngoRegistrationNumber !== undefined) obj.ngo_registration_number = user.ngoRegistrationNumber;
    if (user.ngoLogoUrl !== undefined) obj.ngo_logo_url = user.ngoLogoUrl;
    if (user.ngoId !== undefined) obj.ngo_id = user.ngoId;
    if (user.fcmToken !== undefined) obj.fcm_token = user.fcmToken;
    if (user.isRegistered !== undefined) obj.is_registered = user.isRegistered;
    return obj;
  }

  private mapNgoFromDb(row: any): Ngo {
    return {
      id: row.id,
      name: row.name,
      registrationNumber: row.registration_number,
      status: row.status,
      tier: row.tier,
      foundedYear: row.founded_year,
      focusAreas: row.focus_areas || [],
      sdgGoals: row.sdg_goals || [],
      primaryContact: row.primary_contact,
      secondaryContact: row.secondary_contact,
      address: row.address,
      operatingRegions: row.operating_regions || [],
      logoUrl: row.logo_url,
      website: row.website,
      description: row.description,
      documents: row.documents || [],
      founderId: row.founder_id,
      memberIds: row.member_ids || [],
      volunteerCount: row.volunteer_count || 0,
      activeMissionCount: row.active_mission_count || 0,
      totalMissionsCompleted: row.total_missions_completed || 0,
      impactScore: Number(row.impact_score || 0),
      responseTimeAvg: Number(row.response_time_avg || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapNgoToDb(ngo: Partial<Ngo>): any {
    const obj: any = {};
    if (ngo.id !== undefined) obj.id = ngo.id;
    if (ngo.name !== undefined) obj.name = ngo.name;
    if (ngo.registrationNumber !== undefined) obj.registration_number = ngo.registrationNumber;
    if (ngo.status !== undefined) obj.status = ngo.status;
    if (ngo.tier !== undefined) obj.tier = ngo.tier;
    if (ngo.foundedYear !== undefined) obj.founded_year = ngo.foundedYear;
    if (ngo.focusAreas !== undefined) obj.focus_areas = ngo.focusAreas;
    if (ngo.sdgGoals !== undefined) obj.sdg_goals = ngo.sdgGoals;
    if (ngo.primaryContact !== undefined) obj.primary_contact = ngo.primaryContact;
    if (ngo.secondaryContact !== undefined) obj.secondary_contact = ngo.secondaryContact;
    if (ngo.address !== undefined) obj.address = ngo.address;
    if (ngo.operatingRegions !== undefined) obj.operating_regions = ngo.operatingRegions;
    if (ngo.logoUrl !== undefined) obj.logo_url = ngo.logoUrl;
    if (ngo.website !== undefined) obj.website = ngo.website;
    if (ngo.description !== undefined) obj.description = ngo.description;
    if (ngo.documents !== undefined) obj.documents = ngo.documents;
    if (ngo.founderId !== undefined) obj.founder_id = ngo.founderId;
    if (ngo.memberIds !== undefined) obj.member_ids = ngo.memberIds;
    return obj;
  }

  private mapInventoryFromDb(row: any): InventoryItem {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      quantity: Number(row.quantity || 0),
      unit: row.unit,
      location: row.location,
      locationLat: row.location_lat,
      locationLng: row.location_lng,
      qrCode: row.qr_code,
      minimumThreshold: Number(row.minimum_threshold || 10),
      lastUpdated: row.last_updated,
      status: row.status
    };
  }

  private mapInventoryToDb(item: Partial<InventoryItem>): any {
    const obj: any = {};
    if (item.id !== undefined) obj.id = item.id;
    if (item.name !== undefined) obj.name = item.name;
    if (item.category !== undefined) obj.category = item.category;
    if (item.description !== undefined) obj.description = item.description;
    if (item.quantity !== undefined) obj.quantity = item.quantity;
    if (item.unit !== undefined) obj.unit = item.unit;
    if (item.location !== undefined) obj.location = item.location;
    if (item.locationLat !== undefined) obj.location_lat = item.locationLat;
    if (item.locationLng !== undefined) obj.location_lng = item.locationLng;
    if (item.qrCode !== undefined) obj.qr_code = item.qrCode;
    if (item.minimumThreshold !== undefined) obj.minimum_threshold = item.minimumThreshold;
    if (item.status !== undefined) obj.status = item.status;
    return obj;
  }
}
