let seq = 0;

export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

export function newMember(partial?: Partial<{
  name: string;
  age: number;
  retirementAge: number;
  annualIncome: number;
  savingsRate: number;
}>): {
  id: string;
  name: string;
  age: number;
  retirementAge: number;
  annualIncome: number;
  savingsRate: number;
} {
  return {
    id: uid("m"),
    name: partial?.name ?? "Member",
    age: partial?.age ?? 40,
    retirementAge: partial?.retirementAge ?? 65,
    annualIncome: partial?.annualIncome ?? 0,
    savingsRate: partial?.savingsRate ?? 0.15,
  };
}

export function newGoal(partial?: Partial<{
  type: "retirement_income" | "home" | "education" | "legacy";
  name: string;
  targetAmount: number;
  year: number;
  priority: number;
}>): {
  id: string;
  type: "retirement_income" | "home" | "education" | "legacy";
  name: string;
  targetAmount: number;
  year: number;
  priority: number;
} {
  const type = partial?.type ?? "home";
  const names = {
    retirement_income: "Retirement income",
    home: "Home purchase",
    education: "Education",
    legacy: "Legacy",
  } as const;
  return {
    id: uid("g"),
    type,
    name: partial?.name ?? names[type],
    targetAmount: partial?.targetAmount ?? 0,
    year: partial?.year ?? 2030,
    priority: partial?.priority ?? 2,
  };
}
