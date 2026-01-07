import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Retrieve family preferences (requires family membership)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  // Get family preferences (without PIN hash)
  const { data: preferences, error } = await supabase
    .from('family_preferences')
    .select(`
      id,
      family_id,
      cultural_background,
      religious_tradition,
      religious_observance_level,
      dietary_preferences,
      celebrate_religious_holidays,
      celebrate_secular_holidays,
      specific_holidays,
      excluded_holidays,
      allow_magic_fantasy,
      allow_mythology,
      allow_talking_animals,
      allow_supernatural_elements,
      family_structure,
      custom_family_notes,
      gender_representation,
      conflict_level,
      allow_mild_peril,
      include_educational_content,
      educational_focus,
      modesty_level,
      allow_music_themes,
      allow_dance_themes,
      excluded_themes,
      excluded_elements,
      custom_guidelines,
      created_at,
      updated_at
    `)
    .eq('family_id', profile.family_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check if PIN is set
  const { data: pinCheck } = await supabase
    .from('family_preferences')
    .select('settings_pin_hash')
    .eq('family_id', profile.family_id)
    .single();

  return NextResponse.json({
    preferences,
    hasPinSet: !!pinCheck?.settings_pin_hash
  });
}

// PUT - Update family preferences (requires parent/admin role + PIN verification)
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { preferences, pin } = await request.json();

  // Get user's family and role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 404 });
  }

  // Check user's role
  const { data: member } = await supabase
    .from('family_members')
    .select('role, can_modify_settings')
    .eq('family_id', profile.family_id)
    .eq('user_id', user.id)
    .single();

  // If no member record, check if they're the family creator (admin by default)
  const isAdmin = !member || member.role === 'admin' || member.role === 'parent';
  const canModify = !member || member.can_modify_settings !== false;

  if (!isAdmin || !canModify) {
    return NextResponse.json({ 
      error: 'Permission denied. Only parents/admins can modify settings.' 
    }, { status: 403 });
  }

  // Verify PIN if one is set
  const { data: pinCheck } = await supabase
    .from('family_preferences')
    .select('settings_pin_hash')
    .eq('family_id', profile.family_id)
    .single();

  if (pinCheck?.settings_pin_hash) {
    if (!pin) {
      return NextResponse.json({ 
        error: 'PIN required to modify settings',
        requiresPin: true 
      }, { status: 401 });
    }

    // Verify PIN using database function
    const { data: pinValid } = await supabase.rpc('verify_settings_pin', {
      p_family_id: profile.family_id,
      p_pin: pin
    });

    if (!pinValid) {
      return NextResponse.json({ 
        error: 'Invalid PIN',
        requiresPin: true 
      }, { status: 401 });
    }
  }

  // Update preferences
  const { data, error } = await supabase
    .from('family_preferences')
    .update({
      ...preferences,
      updated_at: new Date().toISOString()
    })
    .eq('family_id', profile.family_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the change
  await supabase.from('parental_control_audit').insert({
    family_id: profile.family_id,
    user_id: user.id,
    action: 'settings_updated',
    details: { changed_fields: Object.keys(preferences) },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown'
  });

  return NextResponse.json({ success: true, preferences: data });
}
