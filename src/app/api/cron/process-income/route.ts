import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateCpf } from '@/lib/cpfCalculations';
import { calculateShgDeduction, Race } from '@/lib/shgCalculations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Missing Supabase Service Keys.' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const authHeader = request.headers.get('Authorization');
        const expectedSecret = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;

        if (expectedSecret && authHeader !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const todayDateNum = today.getDate();

        // 1. Fetch user settings
        const { data: settings, error: fetchError } = await supabase
            .from('user_settings')
            .select('*')
            .limit(1)
            .single();

        if (fetchError || !settings) {
            return NextResponse.json({ message: 'No user settings found or error fetching' }, { status: 500 });
        }

        let salaryProcessed = false;
        let cpfProcessed = false;
        let mortgageProcessed = false;

        // Helper function to check if an action was already processed this month
        const isProcessedThisMonth = (lastStr: string | null) => {
            if (!lastStr) return false;
            return lastStr.startsWith(currentYearMonth);
        };

        // ============================================
        // SALARY PROCESSING
        // ============================================
        if (settings.basic_salary > 0 && settings.salary_pay_day && todayDateNum >= settings.salary_pay_day && !isProcessedThisMonth(settings.last_salary_processed_date)) {
            const grossPay = Number(settings.basic_salary);
            const bonus = Number(settings.basic_bonus || 0);

            // Calculate exact CPF base
            const shg = calculateShgDeduction(grossPay, (settings.race as Race) || 'None');
            let employeeCpf = 0;
            let employerCpf = 0;
            let netPay = grossPay + bonus - shg;

            if (settings.date_of_birth) {
                 const cpfResult = calculateCpf({
                    grossPay,
                    bonus,
                    dateOfBirth: new Date(settings.date_of_birth),
                    currentDate: today
                });
                employeeCpf = cpfResult.employeeContribution;
                employerCpf = cpfResult.employerContribution;
                netPay = grossPay + bonus - employeeCpf - shg;
            }

            // Insert memory record
            const { error: insertError } = await supabase.from('income_records').upsert({
                month: `${currentYearMonth}-01`, // Use first day of month as identifier
                gross_pay: grossPay,
                bonus: bonus,
                employee_cpf: employeeCpf,
                employer_cpf: employerCpf,
                shg_deduction: shg,
                net_pay: netPay
            }, { onConflict: 'month' });

            if (!insertError) {
                await supabase.from('user_settings').update({ last_salary_processed_date: today.toISOString().split('T')[0] }).eq('id', settings.id);
                salaryProcessed = true;
            } else {
                console.error("Salary insert error:", insertError);
            }
        }

        // ============================================
        // CPF ALLOCATION PROCESSING (Fund Injection)
        // ============================================
        if (settings.basic_salary > 0 && settings.date_of_birth && settings.cpf_pay_day && todayDateNum >= settings.cpf_pay_day && !isProcessedThisMonth(settings.last_cpf_processed_date)) {
            const cpfResult = calculateCpf({
                grossPay: Number(settings.basic_salary),
                bonus: Number(settings.basic_bonus || 0),
                dateOfBirth: new Date(settings.date_of_birth),
                currentDate: today
            });

            // Isolate scope to prevent variable leaking
            {
                const { data: cpfCategory } = await supabase.from('asset_categories').select('id').eq('name', 'CPF').single();
                if (cpfCategory) {
                    const { data: cpfAssets } = await supabase.from('assets').select('id, name, current_value').eq('category_id', cpfCategory.id);
                    if (cpfAssets) {
                        const oaAsset = cpfAssets.find((a: { id: string; name: string; current_value: number }) => a.name.toUpperCase().includes('ORDINARY') || a.name.toUpperCase().includes('OA'));
                        const saAsset = cpfAssets.find((a: { id: string; name: string; current_value: number }) => a.name.toUpperCase().includes('SPECIAL') || a.name.toUpperCase().includes('SA'));
                        const maAsset = cpfAssets.find((a: { id: string; name: string; current_value: number }) => a.name.toUpperCase().includes('MEDISAVE') || a.name.toUpperCase().includes('MA'));

                        if (oaAsset && saAsset && maAsset) {
                            const updates = [
                                supabase.from('assets').update({ current_value: Number(oaAsset.current_value) + cpfResult.allocations.oa }).eq('id', oaAsset.id),
                                supabase.from('assets').update({ current_value: Number(saAsset.current_value) + cpfResult.allocations.sa }).eq('id', saAsset.id),
                                supabase.from('assets').update({ current_value: Number(maAsset.current_value) + cpfResult.allocations.ma }).eq('id', maAsset.id)
                            ];
                            const results = await Promise.all(updates);
                            const errors = results.filter((r: { error: unknown }) => r.error).map((r: { error: unknown }) => r.error);
                            if (errors.length === 0) {
                                await supabase.from('user_settings').update({ last_cpf_processed_date: today.toISOString().split('T')[0] }).eq('id', settings.id);
                                cpfProcessed = true;
                            }
                        }
                    }
                }
            }
        }

        // ============================================
        // MORTGAGE DEDUCTION PROCESSING
        // ============================================
        if (settings.monthly_mortgage > 0 && settings.mortgage_pay_day && todayDateNum >= settings.mortgage_pay_day && !isProcessedThisMonth(settings.last_mortgage_processed_date)) {
             {
                 const { data: cpfCategory } = await supabase.from('asset_categories').select('id').eq('name', 'CPF').single();
                 if (cpfCategory) {
                     const { data: cpfAssets } = await supabase.from('assets').select('id, name, current_value').eq('category_id', cpfCategory.id);
                     if (cpfAssets) {
                         const oaAsset = cpfAssets.find((a: { id: string; name: string; current_value: number }) => a.name.toUpperCase().includes('ORDINARY') || a.name.toUpperCase().includes('OA'));
                         if (oaAsset) {
                             const { error: oaUpdateError } = await supabase.from('assets')
                                    .update({ current_value: Number(oaAsset.current_value) - settings.monthly_mortgage })
                                    .eq('id', oaAsset.id);
                                    
                             if (!oaUpdateError) {
                                const newHomeLoanTotal = Math.max(0, Number(settings.home_loan_total || 0) - settings.monthly_mortgage);

                                await supabase.from('user_settings').update({ 
                                    last_mortgage_processed_date: today.toISOString().split('T')[0],
                                    home_loan_total: newHomeLoanTotal
                                }).eq('id', settings.id);
                                
                                mortgageProcessed = true;
                             }
                         }
                     }
                 }
             }
        }

        return NextResponse.json({
            success: true,
            processed: {
                salary: salaryProcessed,
                cpf: cpfProcessed,
                mortgage: mortgageProcessed
            }
        });

    } catch (error) {
        console.error('Error processing income/cpf:', error);
        return NextResponse.json(
            { error: 'Failed to process automation' },
            { status: 500 }
        );
    }
}
