import { google, admin_directory_v1 } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import 'dotenv/config'; // Load environment variables from .env file

interface GoogleDirectoryUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName?: string;
    familyName?: string;
  };
  suspended: boolean;
  orgUnitPath: string;
}

class GoogleDirectoryService {
  private admin: admin_directory_v1.Admin | null = null;
  private auth: JWT | null = null;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      // Check if we have Google service account configuration
      console.log('Initializing Google Directory API...');
      const serviceAccountKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
      const adminEmail = process.env.GOOGLE_ADMIN_IMPERSONATION_EMAIL;
      const workspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN;

      if(!serviceAccountKeyPath) {
        console.warn('GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable is not set.');
        return;
      }
      if(!adminEmail) {
        console.warn('GOOGLE_ADMIN_IMPERSONATION_EMAIL environment variable is not set.');
        return;
      }
      if(!workspaceDomain) {
        console.warn('GOOGLE_WORKSPACE_DOMAIN environment variable is not set.');
        return;
      }

      const keyPath = path.resolve(serviceAccountKeyPath);
      
      if (!fs.existsSync(keyPath)) {
        console.warn(`Google service account key file not found at: ${keyPath}`);
        return;
      }

      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      console.log('✅ Service account key loaded successfully:', serviceAccount.client_email);
      
      // Create JWT auth with proper constructor
      this.auth = new google.auth.JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ['https://www.googleapis.com/auth/admin.directory.user'],
        subject: adminEmail
      });

      // Initialize Admin SDK
      this.admin = google.admin({ version: 'directory_v1', auth: this.auth });
      
      console.log('✅ Google Directory API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Directory API:', error);
      this.admin = null;
    }
  }

  async searchUsers(query: string): Promise<GoogleDirectoryUser[]> {
    if (!this.admin) {
      throw new Error('Google Directory API not configured');
    }

    try {
      console.log(`🔍 Searching Google Directory for: "${query}"`);
      console.log(`📁 Domain: ${process.env.GOOGLE_WORKSPACE_DOMAIN}`);
      
      // Try multiple search strategies to find users
      let users: admin_directory_v1.Schema$User[] = [];
      
      // Strategy 1: Search by email prefix
      try {
        const emailResponse = await this.admin.users.list({
          domain: process.env.GOOGLE_WORKSPACE_DOMAIN,
          query: `email:${query}*`,
          maxResults: 20,
          projection: 'basic',
          orderBy: 'email'
        });
        users = emailResponse.data.users ?? [];
        console.log(`✅ Found ${users.length} users by email search`);
      } catch {
        console.log(`⚠️ Email search failed, trying name search...`);
        
        // Strategy 2: Search by name (if email search fails)
        try {
          const nameResponse = await this.admin.users.list({
            domain: process.env.GOOGLE_WORKSPACE_DOMAIN,
            query: `name:${query}*`,
            maxResults: 20,
            projection: 'basic',
            orderBy: 'email'
          });
          users = nameResponse.data.users ?? [];
          console.log(`✅ Found ${users.length} users by name search`);
        } catch {
          console.log(`⚠️ Name search also failed, trying general search...`);
          
          // Strategy 3: General search without specific field (fallback)
          const generalResponse = await this.admin.users.list({
            domain: process.env.GOOGLE_WORKSPACE_DOMAIN,
            maxResults: 20,
            projection: 'basic',
            orderBy: 'email'
          });
          const allUsers = generalResponse.data.users ?? [];
          
          // Filter results client-side if API search fails
          users = allUsers.filter(user => {
            const email = user.primaryEmail?.toLowerCase() ?? '';
            const fullName = user.name?.fullName?.toLowerCase() ?? '';
            const givenName = user.name?.givenName?.toLowerCase() ?? '';
            const familyName = user.name?.familyName?.toLowerCase() ?? '';
            const searchQuery = query.toLowerCase();
            
            return email.includes(searchQuery) ||
                   fullName.includes(searchQuery) ||
                   givenName.includes(searchQuery) ||
                   familyName.includes(searchQuery);
          });
          console.log(`✅ Found ${users.length} users by general search with client-side filtering`);
        }
      }
      
      // Map Google Schema$User to our GoogleDirectoryUser interface
      const mappedUsers: GoogleDirectoryUser[] = users.map(user => ({
        id: user.id ?? '',
        primaryEmail: user.primaryEmail ?? '',
        name: {
          fullName: user.name?.fullName ?? '',
          givenName: user.name?.givenName ?? undefined,
          familyName: user.name?.familyName ?? undefined
        },
        suspended: user.suspended ?? false,
        orgUnitPath: user.orgUnitPath ?? ''
      }));
      
      return mappedUsers;
    } catch (error: unknown) {
      // Type assertion for Google API error properties
      const apiError = error as {
        message: string;
        code?: number;
        status?: number;
        errors?: unknown[];
      };
      
      console.error('❌ Google Directory API Error Details:', {
        message: apiError.message,
        code: apiError.code,
        status: apiError.status,
        errors: apiError.errors,
        fullError: apiError
      });
      
      // Provide more specific error messages based on common issues
      if (apiError.code === 403) {
        throw new Error(`Access denied to Google Directory API. Please check: 1) Service account has domain-wide delegation enabled, 2) Admin SDK API is enabled, 3) Impersonation email (${process.env.GOOGLE_ADMIN_IMPERSONATION_EMAIL}) has admin privileges`);
      } else if (apiError.code === 400) {
        throw new Error(`Bad request to Google Directory API: ${apiError.message}`);
      } else if (apiError.code === 404) {
        throw new Error(`Domain ${process.env.GOOGLE_WORKSPACE_DOMAIN} not found or not accessible`);
      } else {
        throw new Error(`Google Directory API error: ${apiError.message} (Code: ${apiError.code ?? 'unknown'})`);
      }
    }
  }

  isConfigured(): boolean {
    return !!this.admin;
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    if (!this.admin) {
      return {
        success: false,
        message: 'Google Directory API not configured. Please check environment variables.',
        details: {
          serviceAccountKeyPath: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
          adminEmail: !!process.env.GOOGLE_ADMIN_IMPERSONATION_EMAIL,
          workspaceDomain: !!process.env.GOOGLE_WORKSPACE_DOMAIN
        }
      };
    }

    try {
      console.log('🧪 Testing Google Directory API connection...');
      
      // Try to list a single user to test the connection
      const response = await this.admin.users.list({
        domain: process.env.GOOGLE_WORKSPACE_DOMAIN,
        maxResults: 1,
        projection: 'basic'
      });

      const userCount = response.data.users?.length ?? 0;
      
      return {
        success: true,
        message: `Successfully connected to Google Directory API. Found domain with ${userCount} users (showing max 1).`,
        details: {
          domain: process.env.GOOGLE_WORKSPACE_DOMAIN,
          hasUsers: userCount > 0,
          userCount: userCount
        }
      };
    } catch (error: unknown) {
      const apiError = error as {
        message: string;
        code?: number;
        status?: number;
      };
      
      console.error('❌ Google Directory API connection test failed:', apiError);
      
      return {
        success: false,
        message: `Google Directory API connection failed: ${apiError.message}`,
        details: {
          code: apiError.code,
          status: apiError.status,
          domain: process.env.GOOGLE_WORKSPACE_DOMAIN,
          adminEmail: process.env.GOOGLE_ADMIN_IMPERSONATION_EMAIL
        }
      };
    }
  }
}

export const googleDirectoryService = new GoogleDirectoryService();
