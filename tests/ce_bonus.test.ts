import { describe, it, expect } from 'vitest';
import { computeCEInvestmentBonus, getTechniqueDamageDieSides } from '../utils/calculations';

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

  it('caso 4 CE: 1 dado, resto 1 => ceil(1/2)=1 fixo', () => {
    const res = computeCEInvestmentBonus(4);
    expect(res.dados_adicionais).toBe(1);
    expect(res.dano_fixo).toBe(1);
  });

  it('caso 5 CE: 1 dado, resto 2 => ceil(2/2)=1 fixo', () => {
    const res = computeCEInvestmentBonus(5);
    expect(res.dados_adicionais).toBe(1);
    expect(res.dano_fixo).toBe(1);
  });

  it('caso 8 CE: 2 dados, resto 2 => ceil(2/2)=1 fixo', () => {
    const res = computeCEInvestmentBonus(8);
    expect(res.dados_adicionais).toBe(2);
    expect(res.dano_fixo).toBe(1);
  });

  it('caso 9 CE: 3 dados, resto 0 => 0 fixo', () => {
    const res = computeCEInvestmentBonus(9);
    expect(res.dados_adicionais).toBe(3);
    expect(res.dano_fixo).toBe(0);
  });

  it('caso 10 CE: 3 dados, resto 1 => ceil(1/2)=1 fixo', () => {
    const res = computeCEInvestmentBonus(10);
    expect(res.dados_adicionais).toBe(3);
    expect(res.dano_fixo).toBe(1);
  });


describe('getTechniqueDamageDieSides', () => {
  it('retorna o dado correto por potência e nível', () => {
    expect(getTechniqueDamageDieSides('Pouco Dano', 0)).toBe(4);
    expect(getTechniqueDamageDieSides('Pouco Dano', 6)).toBe(6);
    expect(getTechniqueDamageDieSides('Pouco Dano', 11)).toBe(8);
    expect(getTechniqueDamageDieSides('Pouco Dano', 16)).toBe(10);

    expect(getTechniqueDamageDieSides('Dano Médio', 0)).toBe(6);
    expect(getTechniqueDamageDieSides('Dano Médio', 6)).toBe(8);
    expect(getTechniqueDamageDieSides('Dano Médio', 11)).toBe(10);
    expect(getTechniqueDamageDieSides('Dano Médio', 16)).toBe(12);

    expect(getTechniqueDamageDieSides('Alto Dano', 0)).toBe(8);
    expect(getTechniqueDamageDieSides('Alto Dano', 6)).toBe(10);
    expect(getTechniqueDamageDieSides('Alto Dano', 11)).toBe(12);
    expect(getTechniqueDamageDieSides('Alto Dano', 16)).toBe(14);
  });

  it('normaliza nível inválido para 0', () => {
    expect(getTechniqueDamageDieSides('Dano Médio', NaN as any)).toBe(6);
  });
});

  it('caso 6 CE: 2 dados, resto 0 => 0 fixo', () => {
    const res = computeCEInvestmentBonus(6);
    expect(res.dados_adicionais).toBe(2);
    expect(res.dano_fixo).toBe(0);
  });
});
