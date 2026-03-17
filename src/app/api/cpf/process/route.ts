import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Auth Check (if applicable, though we're mostly anon single-user)
    // const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { month, cpfAllocations, mortgageAmount } = body;

    if (!month || !cpfAllocations) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { oa, sa, ma } = cpfAllocations;

    // 1. Find the CPF Category
    const { data: cpfCategory, error: categoryError } = await supabase
      .from('asset_categories')
      .select('id')
      .eq('name', 'CPF')
      .single();

    if (categoryError || !cpfCategory) {
       return NextResponse.json({ message: 'CPF category not found' }, { status: 404 });
    }

    // 2. Fetch all assets under that category
    const { data: cpfAssets, error: assetsError } = await supabase
      .from('assets')
      .select('id, name, current_value')
      .eq('category_id', cpfCategory.id);

    if (assetsError || !cpfAssets) {
       return NextResponse.json({ message: 'CPF assets not found' }, { status: 404 });
    }

    // 3. Match 'OA', 'SA', 'MA' (or similar names) in the fetched assets
    const oaAsset = cpfAssets.find((a: { name: string, id: string, current_value: number }) => a.name.toUpperCase().includes('ORDINARY') || a.name.toUpperCase().includes('OA'));
    const saAsset = cpfAssets.find((a: { name: string, id: string, current_value: number }) => a.name.toUpperCase().includes('SPECIAL') || a.name.toUpperCase().includes('SA'));
    const maAsset = cpfAssets.find((a: { name: string, id: string, current_value: number }) => a.name.toUpperCase().includes('MEDISAVE') || a.name.toUpperCase().includes('MA'));

    if (!oaAsset || !saAsset || !maAsset) {
      return NextResponse.json({ message: 'Could not match all 3 CPF Accounts (OA, SA, MA) in DB' }, { status: 400 });
    }

    // 4. Update the balances
    const updates = [
      supabase.from('assets').update({ current_value: Number(oaAsset.current_value) + oa - mortgageAmount }).eq('id', oaAsset.id),
      supabase.from('assets').update({ current_value: Number(saAsset.current_value) + sa }).eq('id', saAsset.id),
      supabase.from('assets').update({ current_value: Number(maAsset.current_value) + ma }).eq('id', maAsset.id)
    ];

    const results = await Promise.all(updates);
    
    const errors = results.filter(r => r.error).map(r => r.error);
    if (errors.length > 0) {
      console.error('Errors updating CPF assets:', errors);
      throw new Error('Failed to update one or more CPF accounts');
    }

    return NextResponse.json({ success: true, message: 'CPF balances updated successfully' });

  } catch (error) {
    console.error('Error in /api/cpf/process:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
