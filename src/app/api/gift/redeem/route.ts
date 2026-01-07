import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Check gift code validity (no auth required)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ error: 'Gift code required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch gift code details (limited info for unauthenticated users)
  const { data: giftCode, error } = await supabase
    .from('gift_codes')
    .select('tier, duration_months, status, expires_at, recipient_name, gift_message, occasion')
    .eq('code', code)
    .single();

  if (error || !giftCode) {
    return NextResponse.json({ 
      valid: false, 
      error: 'Invalid gift code' 
    }, { status: 404 });
  }

  if (giftCode.status !== 'active') {
    return NextResponse.json({ 
      valid: false, 
      error: `This gift code has already been ${giftCode.status}`,
      status: giftCode.status,
    });
  }

  if (new Date(giftCode.expires_at) < new Date()) {
    return NextResponse.json({ 
      valid: false, 
      error: 'This gift code has expired',
      status: 'expired',
    });
  }

  // Return gift details for display
  const tierNames: Record<string, string> = {
    starter: 'Starter',
    family: 'Family', 
    premium: 'Premium',
  };

  return NextResponse.json({
    valid: true,
    tier: giftCode.tier,
    tierName: tierNames[giftCode.tier] || giftCode.tier,
    durationMonths: giftCode.duration_months,
    recipientName: giftCode.recipient_name,
    giftMessage: giftCode.gift_message,
    occasion: giftCode.occasion,
    expiresAt: giftCode.expires_at,
  });
}

// POST - Redeem gift code (auth required)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ 
      error: 'Please sign in or create an account to redeem your gift',
      requiresAuth: true,
    }, { status: 401 });
  }

  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: 'Gift code required' }, { status: 400 });
  }

  const normalizedCode = code.toUpperCase().trim();

  // Get user's family
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  let familyId = profile?.family_id;

  // If user doesn't have a family yet, create one
  if (!familyId) {
    const { data: newFamily, error: familyError } = await supabase
      .from('families')
      .insert({
        name: `${user.email?.split('@')[0]}'s Family`,
        preferred_language: 'en',
      })
      .select()
      .single();

    if (familyError || !newFamily) {
      return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });
    }

    familyId = newFamily.id;

    // Link user to family
    await supabase
      .from('user_profiles')
      .update({ family_id: familyId })
      .eq('id', user.id);

    // Create family member record
    await supabase
      .from('family_members')
      .insert({
        family_id: familyId,
        user_id: user.id,
        role: 'admin',
        status: 'active',
        can_create_books: true,
        can_modify_children: true,
        can_modify_settings: true,
        can_manage_subscription: true,
        can_invite_members: true,
      });

    // Create default family preferences
    await supabase
      .from('family_preferences')
      .insert({ family_id: familyId });
  }

  // Call the redemption function
  const { data: result, error } = await supabase.rpc('redeem_gift_code', {
    p_code: normalizedCode,
    p_user_id: user.id,
    p_family_id: familyId,
  });

  if (error) {
    console.error('Redemption error:', error);
    return NextResponse.json({ error: 'Failed to redeem gift code' }, { status: 500 });
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Log the redemption
  await supabase.from('parental_control_audit').insert({
    family_id: familyId,
    user_id: user.id,
    action: 'gift_redeemed',
    details: {
      code: normalizedCode,
      tier: result.tier,
      duration_months: result.duration_months,
      valid_until: result.valid_until,
    },
  });

  const tierNames: Record<string, string> = {
    starter: 'Starter',
    family: 'Family',
    premium: 'Premium',
  };

  return NextResponse.json({
    success: true,
    message: `🎉 Congratulations! Your ${tierNames[result.tier]} subscription is now active!`,
    tier: result.tier,
    tierName: tierNames[result.tier],
    durationMonths: result.duration_months,
    validUntil: result.valid_until,
    subscriptionId: result.subscription_id,
  });
}
