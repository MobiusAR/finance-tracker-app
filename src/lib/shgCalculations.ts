export type Race = 'Chinese' | 'Indian' | 'Malay' | 'Others' | 'None';

export function calculateShgDeduction(grossPay: number, race: Race): number {
  if (race === 'None' || !grossPay) return 0;

  // Simplified CDAC (Chinese)
  if (race === 'Chinese') {
    if (grossPay <= 2000) return 0.5;
    if (grossPay <= 3500) return 1.0;
    if (grossPay <= 5000) return 1.5;
    if (grossPay <= 7000) return 2.0;
    return 3.0; // > 7000
  }

  // Simplified SINDA (Indian)
  if (race === 'Indian') {
    if (grossPay <= 1000) return 1;
    if (grossPay <= 1500) return 3;
    if (grossPay <= 2500) return 5;
    if (grossPay <= 4500) return 7;
    if (grossPay <= 7500) return 9;
    if (grossPay <= 10000) return 12;
    if (grossPay <= 15000) return 18;
    return 30; // > 15000
  }

  // Simplified MBMF (Malay)
  if (race === 'Malay') {
    if (grossPay <= 1000) return 3;
    if (grossPay <= 2000) return 4.5;
    if (grossPay <= 3000) return 6.5;
    if (grossPay <= 4000) return 15;
    if (grossPay <= 6000) return 19.5;
    if (grossPay <= 8000) return 24;
    if (grossPay <= 10000) return 26;
    return 30; // > 10000
  }

  // Simplified ECF (Eurasian/Others)
  if (race === 'Others') {
    if (grossPay <= 1000) return 2;
    if (grossPay <= 1500) return 4;
    if (grossPay <= 2500) return 6;
    if (grossPay <= 4000) return 9;
    if (grossPay <= 7000) return 12;
    if (grossPay <= 10000) return 16;
    return 20; // > 10000
  }

  return 0;
}
