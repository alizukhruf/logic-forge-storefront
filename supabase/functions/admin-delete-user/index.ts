import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return jsonResponse({ error: 'Sign in is required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error('Supabase Edge Function environment is missing required credentials.');
    return jsonResponse({ error: 'Account deletion is not configured on the server.' }, 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.warn('Admin delete-user request had invalid JSON.', error);
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }

  if (typeof body !== 'object' || body === null || !('userId' in body) || typeof body.userId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.userId)) {
    return jsonResponse({ error: 'A valid user ID is required.' }, 400);
  }

  const callerClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const accessToken = authorization.slice('Bearer '.length);
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser(accessToken);
  if (authError || !caller) return jsonResponse({ error: 'Your session is invalid or expired. Sign in again.' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .maybeSingle();
  if (profileError) {
    console.error('Failed to verify the administrator profile.', profileError);
    return jsonResponse({ error: 'Could not verify administrator permissions.' }, 500);
  }
  if (profile?.role !== 'admin') return jsonResponse({ error: 'Administrator access is required.' }, 403);
  if (caller.id === body.userId) return jsonResponse({ error: 'You cannot delete your own administrator account.' }, 400);

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(body.userId);
  if (deleteError) {
    console.error('Failed to delete the selected Auth user.', deleteError);
    return jsonResponse({ error: 'The account could not be deleted.' }, 500);
  }

  return jsonResponse({ success: true });
});
