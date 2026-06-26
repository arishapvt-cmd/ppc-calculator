/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocFromServer, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import { SavedCampaign, PlatformType } from '../types.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Successfully validated Firestore connection.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client is offline.");
    }
  }
}

// Call testConnection right away on load
testConnection();

// Create or update user profile in Firestore
export async function syncUserProfile(uid: string, email: string) {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      email,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Get user's saved campaigns
export async function fetchCampaignsFromFirestore(userId: string): Promise<SavedCampaign[]> {
  const path = 'campaigns';
  try {
    const campaignsRef = collection(db, 'campaigns');
    const q = query(
      campaignsRef, 
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const results: SavedCampaign[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Handle timestamp conversion safely
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt;
      const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt;
      
      results.push({
        id: docSnap.id,
        name: data.name,
        platform: data.platform,
        adSpend: data.adSpend,
        cpc: data.cpc,
        conversionRate: data.conversionRate,
        avgOrderValue: data.avgOrderValue,
        profitMargin: data.profitMargin,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString(),
      });
    });
    
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Save a campaign (create or update) to Firestore
export async function saveCampaignToFirestore(
  userId: string,
  variables: {
    id?: string | number;
    name: string;
    platform: PlatformType;
    adSpend: number;
    cpc: number;
    conversionRate: number;
    avgOrderValue: number;
    profitMargin: number;
  }
) {
  const path = 'campaigns';
  try {
    const campaignsRef = collection(db, 'campaigns');
    
    if (variables.id && typeof variables.id === 'string' && variables.id.length > 0) {
      // Update
      const docRef = doc(db, 'campaigns', variables.id);
      await setDoc(docRef, {
        userId,
        name: variables.name,
        platform: variables.platform,
        adSpend: variables.adSpend,
        cpc: variables.cpc,
        conversionRate: variables.conversionRate,
        avgOrderValue: variables.avgOrderValue,
        profitMargin: variables.profitMargin,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return { id: variables.id, status: 'updated' };
    } else {
      // Create
      const newDocRef = doc(campaignsRef); // generates a secure secure auto-ID
      await setDoc(newDocRef, {
        userId,
        name: variables.name,
        platform: variables.platform,
        adSpend: variables.adSpend,
        cpc: variables.cpc,
        conversionRate: variables.conversionRate,
        avgOrderValue: variables.avgOrderValue,
        profitMargin: variables.profitMargin,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: newDocRef.id, status: 'created' };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a campaign from Firestore
export async function deleteCampaignFromFirestore(campaignId: string) {
  const path = `campaigns/${campaignId}`;
  try {
    const docRef = doc(db, 'campaigns', campaignId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
