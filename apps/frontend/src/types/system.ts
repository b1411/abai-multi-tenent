export interface SystemSettings {
  maintenance: boolean;
  debugMode: boolean;
  timezone: string;
  dateFormat: string;
  backupEnabled: boolean;
  backupFrequency: string;
  emailServer: string;
  emailPort: string;
  emailEncryption: 'none' | 'tls' | 'ssl';
  notificationsEnabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  sessionTimeout: number;
  maxUploadSize: number;
  defaultLanguage: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

export interface BrandingSettings {
  schoolName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  icon: string;
  lastSync?: string;
  apiKey?: string;
  webhookUrl?: string;
  autoSync?: boolean;
  errorNotifications?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  status?: 'active' | 'inactive';
}

export interface CreateRoleDto {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface CreateIntegrationDto {
  name: string;
  description: string;
  icon: string;
  apiKey?: string;
  webhookUrl?: string;
  autoSync?: boolean;
  errorNotifications?: boolean;
}

export interface UpdateIntegrationDto {
  name?: string;
  description?: string;
  icon?: string;
  apiKey?: string;
  webhookUrl?: string;
  autoSync?: boolean;
  errorNotifications?: boolean;
  status?: 'connected' | 'disconnected';
}
