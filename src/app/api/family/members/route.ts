import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List family members
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

  // Get all family members with their profiles
  const { data: members, error } = await supabase
    .from('family_members')
    .select(`
      id,
      user_id,
      role,
      relationship,
      can_create_books,
      can_modify_children,
      can_modify_settings,
      can_manage_subscription,
      can_invite_members,
      verified_adult,
      status,
      created_at,
      user_profiles!family_members_user_id_fkey (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('family_id', profile.family_id)
    .order('created_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members });
}

// POST - Invite new family member
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email, role, relationship, permissions, pin } = await request.json();

  // Validate role
  const validRoles = ['parent', 'caregiver', 'viewer', 'child'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
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

  // Check if current user can invite
  const { data: currentMember } = await supabase
    .from('family_members')
    .select('role, can_invite_members')
    .eq('family_id', profile.family_id)
    .eq('user_id', user.id)
    .single();

  // Only admins/parents with invite permission can add members
  if (currentMember && !currentMember.can_invite_members && currentMember.role !== 'admin') {
    return NextResponse.json({ 
      error: 'You do not have permission to invite members' 
    }, { status: 403 });
  }

  // Verify PIN for adding parents/admins
  if (role === 'parent' || role === 'admin') {
    const { data: pinCheck } = await supabase
      .from('family_preferences')
      .select('settings_pin_hash')
      .eq('family_id', profile.family_id)
      .single();

    if (pinCheck?.settings_pin_hash) {
      if (!pin) {
        return NextResponse.json({ 
          error: 'PIN required to add parent/admin members',
          requiresPin: true 
        }, { status: 401 });
      }

      const { data: pinValid } = await supabase.rpc('verify_settings_pin', {
        p_family_id: profile.family_id,
        p_pin: pin
      });

      if (!pinValid) {
        return NextResponse.json({ 
          error: 'Invalid PIN' 
        }, { status: 401 });
      }
    }
  }

  // Create invitation in family_invites table
  const token = crypto.randomUUID();
  const { error: inviteError } = await supabase
    .from('family_invites')
    .insert({
      family_id: profile.family_id,
      email,
      role,
      token,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  // Log the invitation
  await supabase.from('parental_control_audit').insert({
    family_id: profile.family_id,
    user_id: user.id,
    action: 'member_invited',
    details: { email, role, relationship },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown'
  });

  // TODO: Send invitation email
  // await sendInvitationEmail(email, token, profile.family_id);

  return NextResponse.json({ 
    success: true, 
    message: `Invitation sent to ${email}`,
    inviteToken: token // In production, don't expose this - send via email
  });
}

// PUT - Update member permissions
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { memberId, updates, pin } = await request.json();

  // Get user's family
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 404 });
  }

  // Check if current user is admin
  const { data: currentMember } = await supabase
    .from('family_members')
    .select('role')
    .eq('family_id', profile.family_id)
    .eq('user_id', user.id)
    .single();

  if (currentMember?.role !== 'admin') {
    return NextResponse.json({ 
      error: 'Only admins can modify member permissions' 
    }, { status: 403 });
  }

  // Verify PIN for permission changes
  const { data: pinCheck } = await supabase
    .from('family_preferences')
    .select('settings_pin_hash')
    .eq('family_id', profile.family_id)
    .single();

  if (pinCheck?.settings_pin_hash) {
    if (!pin) {
      return NextResponse.json({ 
        error: 'PIN required to modify permissions',
        requiresPin: true 
      }, { status: 401 });
    }

    const { data: pinValid } = await supabase.rpc('verify_settings_pin', {
      p_family_id: profile.family_id,
      p_pin: pin
    });

    if (!pinValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }
  }

  // Update member
  const { data, error } = await supabase
    .from('family_members')
    .update(updates)
    .eq('id', memberId)
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
    action: 'permissions_changed',
    details: { member_id: memberId, changes: updates },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown'
  });

  return NextResponse.json({ success: true, member: data });
}

// DELETE - Remove family member
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { memberId, pin } = await request.json();

  // Get user's family
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 404 });
  }

  // Check if current user is admin
  const { data: currentMember } = await supabase
    .from('family_members')
    .select('role')
    .eq('family_id', profile.family_id)
    .eq('user_id', user.id)
    .single();

  if (currentMember?.role !== 'admin') {
    return NextResponse.json({ 
      error: 'Only admins can remove members' 
    }, { status: 403 });
  }

  // Prevent removing self
  const { data: targetMember } = await supabase
    .from('family_members')
    .select('user_id')
    .eq('id', memberId)
    .single();

  if (targetMember?.user_id === user.id) {
    return NextResponse.json({ 
      error: 'Cannot remove yourself from the family' 
    }, { status: 400 });
  }

  // Verify PIN
  const { data: pinCheck } = await supabase
    .from('family_preferences')
    .select('settings_pin_hash')
    .eq('family_id', profile.family_id)
    .single();

  if (pinCheck?.settings_pin_hash) {
    if (!pin) {
      return NextResponse.json({ 
        error: 'PIN required to remove members',
        requiresPin: true 
      }, { status: 401 });
    }

    const { data: pinValid } = await supabase.rpc('verify_settings_pin', {
      p_family_id: profile.family_id,
      p_pin: pin
    });

    if (!pinValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }
  }

  // Remove member
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', memberId)
    .eq('family_id', profile.family_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the change
  await supabase.from('parental_control_audit').insert({
    family_id: profile.family_id,
    user_id: user.id,
    action: 'member_removed',
    details: { member_id: memberId },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown'
  });

  return NextResponse.json({ success: true });
}
