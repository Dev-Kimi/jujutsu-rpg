import { describe, it, expect } from 'vitest';
import { computeCEInvestmentBonus } from '../utils/calculations';

describe('computeCEInvestmentBonus', () => {
  it('valida entrada inteira não-negativa', () => {
    expect(() => computeCEInvestmentBonus(-1)).toThrow();
    expect(() => computeCEInvestmentBonus(1.2 as any)).toThrow();
  });

  it('caso 0 CE: 0 dados, 0 fixo', () => {
    const res = computeCEInvestmentBonus(0);
    expect(res.dados_adicionais).toBe(0);
    expect(res.dano_fixo).toBe(0);
  });

  it('caso 4 CE: 0 dados, floor(4%5/2)=floor(4/2)=2 fixo', () => {
    const res = computeCEInvestmentBonus(4);
    expect(res.dados_adicionais).toBe(0);
    expect(res.dano_fixo).toBe(2);
  });

  it('caso 5 CE: 1 dado, resto 0 => 0 fixo', () => {
    const res = computeCEInvestmentBonus(5);
    expect(res.dados_adicionais).toBe(1);
    expect(res.dano_fixo).toBe(0);
  });

  it('caso 8 CE: 1 dado, resto 3 => floor(3/2)=1 fixo', () => {
    const res = computeCEInvestmentBonus(8);
    expect(res.dados_adicionais).toBe(1);
    expect(res.dano_fixo).toBe(1);
  });

  it('caso 9 CE: 1 dado, resto 4 => floor(4/2)=2 fixo', () => {
    const res = computeCEInvestmentBonus(9);
    expect(res.dados_adicionais).toBe(1);
    expect(res.dano_fixo).toBe(2);
  });

  it('caso 10 CE: 2 dados, resto 0 => 0 fixo', () => {
    const res = computeCEInvestmentBonus(10);
    expect(res.dados_adicionais).toBe(2);
    expect(res.dano_fixo).toBe(0);
  });
});
