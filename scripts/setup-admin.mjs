#!/usr/bin/env node
/**
 * Server-Side Administrator Account Provisioning Script
 * 
 * Sets up the initial administrator for Xidaa Discount Calculator securely.
 * Credentials are passed exclusively via environment variables or prompt.
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/setup-admin.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@xidaamoto.com';
const adminPassword = process.env.ADMIN_PASSWORD;

console.log('----------------------------------------------------');
console.log(' Xidaa Moto — Secure Admin Provisioning Tool');
console.log('----------------------------------------------------');

if (!supabaseUrl) {
  console.error('ERROR: SUPABASE_URL (or VITE_SUPABASE_URL) is required.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is required.');
  console.error('Please find your service_role secret key in Supabase Dashboard -> Project Settings -> API.');
  process.exit(1);
}

if (!adminPassword) {
  console.error('ERROR: ADMIN_PASSWORD environment variable is required.');
  console.error('Example: ADMIN_PASSWORD="SecureTempPassword#2026" node scripts/setup-admin.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function provisionAdmin() {
  console.log(`Target Supabase URL: ${supabaseUrl}`);
  console.log(`Admin Email: ${adminEmail}`);
  console.log('Provisioning administrator account...');

  try {
    // 1. Check if user already exists
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }

    const existingUser = userList.users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

    let userId;
    if (existingUser) {
      console.log(`User ${adminEmail} already exists (${existingUser.id}). Updating password and admin role...`);
      const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          username: 'admin',
          full_name: 'Xidaa Chief Administrator',
          must_change_password: true,
        },
      });
      if (updateError) throw updateError;
      userId = updated.user.id;
      console.log('✓ Successfully updated existing user password.');
    } else {
      console.log(`Creating new administrator account for ${adminEmail}...`);
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          username: 'admin',
          full_name: 'Xidaa Chief Administrator',
          must_change_password: true,
        },
      });
      if (createError) throw createError;
      userId = created.user.id;
      console.log('✓ Successfully created administrator account.');
    }

    // 2. Ensure Profile Record has admin role and must_change_password flag
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: 'admin',
        full_name: 'Xidaa Chief Administrator',
        role: 'admin',
        must_change_password: true,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.warn('Note: Profile table upsert returned note (table might be migrating):', profileError.message);
    } else {
      console.log('✓ Verified public.profiles admin role & must_change_password=true.');
    }

    // 3. Log into audit_history
    await supabase.from('audit_history').insert({
      entity_type: 'USER',
      entity_id: userId,
      action: 'ADMIN_PROVISIONED',
      new_values: { email: adminEmail, role: 'admin', must_change_password: true },
    }).then(() => {}).catch(() => {});

    console.log('\n====================================================');
    console.log(' SUCCESS: Administrator configured successfully!');
    console.log(` Email: ${adminEmail}`);
    console.log(' Policy: Administrator MUST change password on first login.');
    console.log('====================================================\n');
  } catch (err) {
    console.error('FAILED to provision administrator:', err);
    process.exit(1);
  }
}

provisionAdmin();
