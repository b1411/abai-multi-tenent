export interface SecurityAlert {
  id: string;
  type: 'fight' | 'fire' | 'weapon' | 'unknown_face' | 'crowd' | 'suspicious_behavior';
  timestamp: string;
  camera: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  screenshot: string;
  resolved: boolean;
  assignedTo?: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  streamUrl?: string;
  aiEnabled: boolean;
  detections: AIDetection[];
  lastActivity: string;
}

export interface AIDetection {
  type: 'person' | 'weapon' | 'fire' | 'suspicious_object';
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: string;
}

export interface FaceIDEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  type: 'entry' | 'exit';
  turnstileId: string;
  turnstileName: string;
  photo: string;
  authorized: boolean;
}

export interface SecurityGuard {
  id: string;
  name: string;
  surname: string;
  shiftStart: string;
  shiftEnd: string;
  post: string;
  status: 'present' | 'absent' | 'on_break';
  photo: string;
  lastSeen: string;
  comments?: string;
}

export interface EmergencyCall {
  id: string;
  type: 'police' | 'ambulance' | 'fire_department';
  timestamp: string;
  initiatedBy: string;
  status: 'initiated' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface SecurityMetrics {
  totalPeopleInBuilding: number;
  activeThreatLevel: 'low' | 'medium' | 'high' | 'critical';
  todayEntries: number;
  todayExits: number;
  activeAlerts: number;
  camerasOnline: number;
  camerasTotal: number;
  guardsPresent: number;
  guardsTotal: number;
  lastIncident: string;
}

export interface SchoolMapLocation {
  id: string;
  name: string;
  type: 'camera' | 'guard' | 'alert' | 'turnstile' | 'emergency_exit';
  x: number; // координата на карте
  y: number; // координата на карте
  status: 'normal' | 'warning' | 'critical';
  data?: Camera | SecurityGuard | SecurityAlert;
}

export interface SecurityJournalEntry {
  id: string;
  timestamp: string;
  type: 'alert' | 'entry' | 'guard_action' | 'emergency_call' | 'system_event';
  description: string;
  source: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actionTaken?: string;
  resolvedBy?: string;
}

export interface AIAnalyticsData {
  detector: 'fire' | 'crowd' | 'fight' | 'weapon' | 'unknown_face';
  enabled: boolean;
  sensitivity: number;
  todayDetections: number;
  falsePositives: number;
  accuracy: number;
  lastDetection?: string;
}

export interface SoundAnalytics {
  enabled: boolean;
  microphoneId: string;
  location: string;
  detectedEvents: {
    type: 'scream' | 'glass_break' | 'loud_noise' | 'alarm';
    timestamp: string;
    confidence: number;
  }[];
}

export interface SecurityRole {
  role: 'guard' | 'deputy' | 'director' | 'tech';
  permissions: {
    viewCameras: boolean;
    controlCameras: boolean;
    viewAlerts: boolean;
    resolveAlerts: boolean;
    emergencyCalls: boolean;
    manageGuards: boolean;
    systemSettings: boolean;
    exportData: boolean;
  };
}
