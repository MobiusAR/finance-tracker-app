'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Calculator, ArrowRight, Shield, Calendar } from 'lucide-react';
import { useUserSettings, useIncomeRecords } from '@/hooks/useIncomeAndCPF';
import { calculateCpf, CpfCalculationResult } from '@/lib/cpfCalculations';
import { calculateShgDeduction, Race } from '@/lib/shgCalculations';
import { format, startOfMonth } from 'date-fns';

export default function IncomePage() {
  const { settings, loading: settingsLoading, updateSettings } = useUserSettings();
  const { saveRecord } = useIncomeRecords();

  // Settings State
  const [dob, setDob] = useState<string>('');
  const [race, setRace] = useState<Race>('None');
  const [mortgage, setMortgage] = useState<string>('0');
  const [savingSettings, setSavingSettings] = useState(false);

  // Income Form State
  const [selectedMonth, setSelectedMonth] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [grossPay, setGrossPay] = useState<string>('');
  const [bonus, setBonus] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview State
  const [preview, setPreview] = useState<{
    cpf: CpfCalculationResult | null;
    shg: number;
    net: number;
  }>({ cpf: null, shg: 0, net: 0 });

  // Load settings into state
  useEffect(() => {
    if (settings && !settingsLoading) {
      if (settings.date_of_birth) setDob(settings.date_of_birth);
      if (settings.race) setRace(settings.race as Race);
      if (settings.monthly_mortgage) setMortgage(settings.monthly_mortgage.toString());
    }
  }, [settings, settingsLoading]);

  // Real-time calculation preview
  useEffect(() => {
    const grossNum = parseFloat(grossPay) || 0;
    const bonusNum = parseFloat(bonus) || 0;

    if (grossNum > 0 && dob) {
      const shg = calculateShgDeduction(grossNum, race);
      const cpfResult = calculateCpf({
        grossPay: grossNum,
        bonus: bonusNum,
        dateOfBirth: new Date(dob),
        currentDate: new Date(selectedMonth) // Calculate age based on the month being processed
      });

      const net = grossNum + bonusNum - cpfResult.employeeContribution - shg;

      setPreview({
        cpf: cpfResult,
        shg,
        net
      });
    } else {
      setPreview({ cpf: null, shg: 0, net: 0 });
    }
  }, [grossPay, bonus, dob, race, selectedMonth]);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await updateSettings({
        date_of_birth: dob,
        race: race,
        monthly_mortgage: parseFloat(mortgage) || 0
      });
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleProcessMonth = async () => {
    if (!preview.cpf) {
      toast.error('Please fill in required fields first');
      return;
    }

    try {
      setIsProcessing(true);
      
      const grossNum = parseFloat(grossPay) || 0;
      const bonusNum = parseFloat(bonus) || 0;

      // 1. Save the Income Record
      await saveRecord({
        month: selectedMonth,
        gross_pay: grossNum,
        bonus: bonusNum,
        employee_cpf: preview.cpf.employeeContribution,
        employer_cpf: preview.cpf.employerContribution,
        shg_deduction: preview.shg,
        net_pay: preview.net
      });

      // 2. Trigger the backend API to handle the Asset Value Updates (CPF balances & Mortgage Deductions)
      const res = await fetch('/api/cpf/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          cpfAllocations: preview.cpf.allocations,
          mortgageAmount: parseFloat(mortgage) || 0
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update asset balances');
      }

      toast.success('Month processed successfully! CPF balances and mortgage deducted.');
      
      // Reset form but keep month (maybe advance it to next month ideally)
      setGrossPay('');
      setBonus('0');

    } catch (error) {
       toast.error(error instanceof Error ? error.message : 'An error occurred processing the month');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pb-20">
      <Header
        title="Income & CPF"
        description="Automate your monthly CPF allocations and mortgage deductions"
      />

      <div className="grid gap-6 px-4 md:grid-cols-2 md:px-0">
        
        {/* SETTINGS CARD */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Configure these once to accurately calculate your age-based CPF rates and Community deductions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input 
                  id="dob" 
                  type="date" 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                />
                <p className="text-xs text-muted-foreground">Required to determine your exact CPF contribution limit and rates.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="race">Community (SHG)</Label>
                <Select value={race} onValueChange={(val: Race) => setRace(val)}>
                  <SelectTrigger id="race">
                    <SelectValue placeholder="Select community" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chinese">Chinese (CDAC)</SelectItem>
                    <SelectItem value="Indian">Indian (SINDA)</SelectItem>
                    <SelectItem value="Malay">Malay (MBMF)</SelectItem>
                    <SelectItem value="Others">Eurasian/Others (ECF)</SelectItem>
                    <SelectItem value="None">None / Opt-out</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Automatically calculates CDAC/SINDA/MBMF/ECF monthly deductions.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mortgage">Monthly Mortgage (From OA)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input 
                    id="mortgage" 
                    type="number" 
                    className="pl-7" 
                    placeholder="0.00"
                    value={mortgage}
                    onChange={(e) => setMortgage(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">This amount will be automatically deducted from your OA balance when you process a month.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveSettings} disabled={savingSettings || settingsLoading} className="w-full sm:w-auto">
                {savingSettings ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* MONTHLY ENTRY CARD */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-sm overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Monthly Entry
              </CardTitle>
              <CardDescription>
                Input your gross salary to automatically distribute CPF to your assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="month">Month</Label>
                  <Input 
                    id="month" 
                    type="date"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="gross">Gross Pay (OW)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input 
                      id="gross" 
                      type="number" 
                      className="pl-7" 
                      placeholder="0.00"
                      value={grossPay}
                      onChange={(e) => setGrossPay(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="bonus">Bonus (AW)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input 
                      id="bonus" 
                      type="number" 
                      className="pl-7" 
                      placeholder="0.00"
                      value={bonus}
                      onChange={(e) => setBonus(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW AREA */}
              {preview.cpf ? (
                <div className="mt-6 rounded-lg border bg-muted/40 p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
                    <Calculator className="h-4 w-4" />
                    Estimation Preview
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Employee CPF:</span>
                      <p className="font-semibold text-destructive">-{formatCurrency(preview.cpf.employeeContribution)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Employer CPF:</span>
                      <p className="font-semibold text-sage">{formatCurrency(preview.cpf.employerContribution)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SHG Deduction:</span>
                      <p className="font-semibold text-destructive">-{formatCurrency(preview.shg)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. Take Home:</span>
                      <p className="font-semibold text-primary">{formatCurrency(preview.net)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Asset Allocations</span>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded bg-background p-2 border">
                        <div className="text-xs text-muted-foreground mb-1">OA (+Mortgage)</div>
                        <div className="font-semibold">{formatCurrency(preview.cpf.allocations.oa)}</div>
                      </div>
                      <div className="rounded bg-background p-2 border">
                        <div className="text-xs text-muted-foreground mb-1">SA</div>
                        <div className="font-semibold">{formatCurrency(preview.cpf.allocations.sa)}</div>
                      </div>
                      <div className="rounded bg-background p-2 border">
                        <div className="text-xs text-muted-foreground mb-1">MA</div>
                        <div className="font-semibold">{formatCurrency(preview.cpf.allocations.ma)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Enter your Date of Birth and Gross Pay to see the CPF estimation preview.
                </div>
              )}

            </CardContent>
            <CardFooter className="bg-muted/20 border-t px-6 py-4">
              <Button 
                onClick={handleProcessMonth} 
                disabled={!preview.cpf || isProcessing || !dob} 
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isProcessing ? 'Processing & Updating...' : 'Process Month & Update Assets'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
