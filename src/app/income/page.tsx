'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, Home, Briefcase, Settings } from 'lucide-react';
import { useUserSettings } from '@/hooks/useIncomeAndCPF';
import { Race } from '@/lib/shgCalculations';

export default function IncomeAutomationPage() {
  const { settings, loading: settingsLoading, updateSettings } = useUserSettings();

  // Settings State
  const [dob, setDob] = useState<string>('');
  const [race, setRace] = useState<Race>('None');
  
  // Salary State
  const [basicSalary, setBasicSalary] = useState<string>('0');
  const [basicBonus, setBasicBonus] = useState<string>('0');
  const [salaryPayDay, setSalaryPayDay] = useState<string>('25');
  const [cpfPayDay, setCpfPayDay] = useState<string>('14');

  // Home Loan State
  const [mortgage, setMortgage] = useState<string>('0');
  const [mortgagePayDay, setMortgagePayDay] = useState<string>('15');
  const [homeLoanTotal, setHomeLoanTotal] = useState<string>('0');

  const [savingSettings, setSavingSettings] = useState(false);

  // Load settings into state
  useEffect(() => {
    if (settings && !settingsLoading) {
      if (settings.date_of_birth) setDob(settings.date_of_birth);
      if (settings.race) setRace(settings.race as Race);
      
      if (settings.basic_salary) setBasicSalary(settings.basic_salary.toString());
      if (settings.basic_bonus) setBasicBonus(settings.basic_bonus.toString());
      if (settings.salary_pay_day) setSalaryPayDay(settings.salary_pay_day.toString());
      if (settings.cpf_pay_day) setCpfPayDay(settings.cpf_pay_day.toString());

      if (settings.monthly_mortgage) setMortgage(settings.monthly_mortgage.toString());
      if (settings.mortgage_pay_day) setMortgagePayDay(settings.mortgage_pay_day.toString());
      if (settings.home_loan_total) setHomeLoanTotal(settings.home_loan_total.toString());
    }
  }, [settings, settingsLoading]);

  // Derived Values
  const calculatedMonthsLeft = parseFloat(mortgage) > 0 
    ? Math.ceil(parseFloat(homeLoanTotal) / parseFloat(mortgage)) 
    : 0;

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await updateSettings({
        date_of_birth: dob,
        race: race,
        basic_salary: parseFloat(basicSalary) || 0,
        basic_bonus: parseFloat(basicBonus) || 0,
        salary_pay_day: parseInt(salaryPayDay) || 25,
        cpf_pay_day: parseInt(cpfPayDay) || 14,
        monthly_mortgage: parseFloat(mortgage) || 0,
        mortgage_pay_day: parseInt(mortgagePayDay) || 15,
        home_loan_total: parseFloat(homeLoanTotal) || 0
      });
      toast.success('Automation settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="pb-20">
      <Header
        title="Income & CPF Automation"
        description="Configure your fixed salary and property loan details. The system will automatically process calculations on your defined pay days."
      />

      {settingsLoading ? (
         <div className="flex justify-center p-8 text-muted-foreground">Loading your configuration...</div>
      ) : (
      <div className="grid gap-6 px-4 md:grid-cols-2 lg:grid-cols-3 md:px-0">
        
        {/* PROFILE SETTINGS CARD */}
        <Card className="flex flex-col">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Profile Rules
            </CardTitle>
            <CardDescription>
              Determines your core CPF allocations and Community Deductions (CDAC/SINDA/etc).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 flex-1">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input 
                id="dob" 
                type="date" 
                value={dob} 
                onChange={(e) => setDob(e.target.value)} 
              />
              <p className="text-[10px] text-muted-foreground">Required to calculate strict age-based CPF limits accurately on calculation day.</p>
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
            </div>
          </CardContent>
        </Card>

        {/* INCOME AUTOMATION CARD */}
        <Card className="flex flex-col">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-sage" />
              Salary & CPF Triggers
            </CardTitle>
            <CardDescription>
              Your fixed compensation. The tracker will log income and inject CPF into your assets automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="basicSalary">Basic Salary</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input id="basicSalary" type="number" className="pl-7" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basicBonus">Expected Bonus</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input id="basicBonus" type="number" className="pl-7" value={basicBonus} onChange={(e) => setBasicBonus(e.target.value)} />
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryPayDay">Salary Pay Day</Label>
                  <div className="flex items-center gap-2">
                     <Input id="salaryPayDay" type="number" min="1" max="31" value={salaryPayDay} onChange={(e) => setSalaryPayDay(e.target.value)} />
                     <span className="text-xs text-muted-foreground shrink-0">of the month</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpfPayDay">CPF Deposit Day</Label>
                   <div className="flex items-center gap-2">
                     <Input id="cpfPayDay" type="number" min="1" max="31" value={cpfPayDay} onChange={(e) => setCpfPayDay(e.target.value)} />
                     <span className="text-xs hidden sm:inline text-muted-foreground shrink-0">of the month</span>
                  </div>
                </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Income records are added on your Salary Pay Day. Your OA/SA/MA asset balances are injected on your CPF Deposit Day.</p>
          </CardContent>
        </Card>

        {/* HOME LOAN TRACKER CARD */}
        <Card className="flex flex-col md:col-span-2 lg:col-span-1">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-terracotta" />
              Home Loan Tracker
            </CardTitle>
            <CardDescription>
              Your home loan balance. Monthly payments will be deducted from your CPF Ordinary Account (OA).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 flex-1">
             <div className="space-y-2">
               <Label htmlFor="homeLoanTotal">Total Loan Outstanding</Label>
               <div className="relative">
                 <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                 <Input id="homeLoanTotal" type="number" className="pl-7" value={homeLoanTotal} onChange={(e) => setHomeLoanTotal(e.target.value)} />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mortgage">Monthly Payment</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input id="mortgage" type="number" className="pl-7" value={mortgage} onChange={(e) => setMortgage(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calculatedMonths">Months Left (Est.)</Label>
                  <Input id="calculatedMonths" type="text" value={calculatedMonthsLeft} disabled className="bg-muted/50 text-muted-foreground" />
                </div>
            </div>

            <div className="space-y-2">
                  <Label htmlFor="mortgagePayDay">Mortgage Deduction Day</Label>
                   <div className="flex items-center gap-2 max-w-[200px]">
                     <Input id="mortgagePayDay" type="number" min="1" max="31" value={mortgagePayDay} onChange={(e) => setMortgagePayDay(e.target.value)} />
                     <span className="text-xs text-muted-foreground shrink-0">of the month</span>
                  </div>
            </div>
            <p className="text-[10px] text-muted-foreground">On the deduction day, the total loan and months left will decrement, and the payment amount will be withdrawn from your CPF OA limit.</p>

          </CardContent>
        </Card>

        {/* SAVE BAR */}
         <div className="md:col-span-2 lg:col-span-3 flex justify-end">
            <Button onClick={handleSaveSettings} disabled={savingSettings} size="lg" className="w-full sm:w-auto px-8">
               <Settings className="mr-2 h-5 w-5" />
               {savingSettings ? 'Saving Configuration...' : 'Save Automation Config'}
            </Button>
         </div>

      </div>
      )}
    </div>
  );
}
