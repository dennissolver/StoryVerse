export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Set or update PIN
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { currentPin, newPin } = await request.json();

  // Validate new PIN format (4-6 digits)
  if (!newPin || !/^\d{4,6}$/.test(newPin)) {
    return NextResponse.json({ 
      error: 'PIN must be 4-6 digits' 
    }, { status: 400 });
  }

  // Get user's family
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 404 });
  }

  // Check if PIN already exists
  const { data: existing } = await supabase
    .from('family_preferences')
    .select('settings_pin_hash')
    .eq('family_id', profile.family_id)
    .single();

  // If PIN exists, verify current PIN first
  if (existing?.settings_pin_hash) {
    if (!currentPin) {
      return NextResponse.json({ 
        error: 'Current PIN required to change PIN',
        requiresCurrentPin: true 
      }, { status: 401 });
    }

    const { data: pinValid } = await supabase.rpc('verify_settings_pin', {
      p_family_id: profile.family_id,
      p_pin: currentPin
    });

    if (!pinValid) {
      return NextResponse.json({ 
        error: 'Current PIN is incorrect' 
      }, { status: 401 });
    }
  }

  // Set new PIN
  const { data: success } = await supabase.rpc('set_settings_pin', {
    p_family_id: profile.family_id,
    p_pin: newPin
  });

  if (!success) {
    return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 });
  }

  // Log the change
  await supabase.from('parental_control_audit').insert({
    family_id: profile.family_id,
    user_id: user.id,
    action: 'pin_changed',
    details: { action: existing?.settings_pin_hash ? 'changed' : 'created' },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown'
  });

  return NextResponse.json({ 
    success: true, 
    message: existing?.settings_pin_hash ? 'PIN updated' : 'PIN created' 
  });
}

// DELETE - Remove PIN (requires current PIN)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { currentPin } = await request.json();

  // Get user's family
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 404 });
  }

  // Verify current PIN
  if (!currentPin) {
    return NextResponse.json({ 
      error: 'Current PIN required to remove PIN' 
    }, { status: 401 });
  }

  const { data: pinValid } = await supabase.rpc('verify_settings_pin', {
    p_family_id: profile.family_id,
    p_pin: currentPin
  });

  if (!pinValid) {
    return NextResponse.json({ 
      error: 'Current PIN is incorrect' 
    }, { status: 401 });
  }

  // Remove PIN
  const { error } = await supabase
    .from('family_preferences')
    .update({ 
      settings_pin_hash: null,
      pin_attempts: 0,
      pin_locked_until: null
    })
    .eq('family_id', profile.family_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the change
  await supabase.from('parental_control_audit').insert({
    family_id: profile.family_id,
    user_id: user.id,
    action: 'pin_changed',
    details: { action: 'removed' },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown'
  });

  return NextResponse.json({ success: true, message: 'PIN removed' });
}
