/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { eq, and } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import { users, campaigns } from './src/db/schema.ts';
import { getOrCreateUser } from './src/db/users-helper.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON body parser
  app.use(express.json());

  // --- API ROUTES FIRST ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
  });

  // Synchronize or create user on sign-in
  app.post('/api/register', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || 'anonymous@ppccalculator.internal';
      
      const dbUser = await getOrCreateUser(uid, email);
      res.json({ status: 'ok', user: dbUser });
    } catch (error: any) {
      console.error('Error in /api/register:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // Get saved campaigns for the active user
  app.get('/api/campaigns', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      
      // Look up user first
      const dbUsers = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (dbUsers.length === 0) {
        return res.status(404).json({ error: 'User account not synchronized in database' });
      }
      
      const activeUser = dbUsers[0];
      const savedCampaigns = await db.select().from(campaigns).where(eq(campaigns.userId, activeUser.id));
      
      res.json(savedCampaigns);
    } catch (error: any) {
      console.error('Error in GET /api/campaigns:', error);
      res.status(500).json({ error: error.message || 'Failed to load campaigns' });
    }
  });

  // Save (create or update) a campaign calculation
  app.post('/api/campaigns', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const { id, name, platform, adSpend, cpc, conversionRate, avgOrderValue, profitMargin } = req.body;

      if (!name || !platform) {
        return res.status(400).json({ error: 'Name and platform are required fields' });
      }

      // Look up user first
      const dbUsers = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (dbUsers.length === 0) {
        return res.status(404).json({ error: 'User account not synchronized in database' });
      }
      const activeUser = dbUsers[0];

      if (id) {
        // Update scenario - ensure ownership
        const existing = await db
          .select()
          .from(campaigns)
          .where(and(eq(campaigns.id, id), eq(campaigns.userId, activeUser.id)))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({ error: 'Campaign scenario not found or access denied' });
        }

        const updated = await db
          .update(campaigns)
          .set({
            name,
            platform,
            adSpend: parseFloat(adSpend) || 0,
            cpc: parseFloat(cpc) || 0,
            conversionRate: parseFloat(conversionRate) || 0,
            avgOrderValue: parseFloat(avgOrderValue) || 0,
            profitMargin: parseFloat(profitMargin) || 0,
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, id))
          .returning();

        return res.json({ status: 'updated', campaign: updated[0] });
      } else {
        // Insert scenario
        const inserted = await db
          .insert(campaigns)
          .values({
            userId: activeUser.id,
            name,
            platform,
            adSpend: parseFloat(adSpend) || 0,
            cpc: parseFloat(cpc) || 0,
            conversionRate: parseFloat(conversionRate) || 0,
            avgOrderValue: parseFloat(avgOrderValue) || 0,
            profitMargin: parseFloat(profitMargin) || 0,
          })
          .returning();

        return res.json({ status: 'created', campaign: inserted[0] });
      }
    } catch (error: any) {
      console.error('Error in POST /api/campaigns:', error);
      res.status(500).json({ error: error.message || 'Failed to save campaign' });
    }
  });

  // Delete a campaign
  app.delete('/api/campaigns/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const campaignId = parseInt(req.params.id);

      if (isNaN(campaignId)) {
        return res.status(400).json({ error: 'Invalid campaign ID format' });
      }

      // Look up user first
      const dbUsers = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (dbUsers.length === 0) {
        return res.status(404).json({ error: 'User account not synchronized' });
      }
      const activeUser = dbUsers[0];

      // Ensure ownership before deleting
      const existing = await db
        .select()
        .from(campaigns)
        .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, activeUser.id)))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Campaign scenario not found or access denied' });
      }

      await db.delete(campaigns).where(eq(campaigns.id, campaignId));
      res.json({ status: 'deleted', id: campaignId });
    } catch (error: any) {
      console.error('Error in DELETE /api/campaigns:', error);
      res.status(500).json({ error: error.message || 'Failed to delete campaign' });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
}

startServer();
