import {
  getPlanById,
  canCreateCV,
  canUseAIOptimization,
  SUBSCRIPTION_PLANS,
} from '@/lib/stripe';

describe('Stripe Utilities', () => {
  describe('getPlanById', () => {
    it('should return correct plan for free', () => {
      const plan = getPlanById('free');

      expect(plan).toBeDefined();
      expect(plan.id).toBe('free');
      expect(plan.name).toBe('Free');
      expect(plan.price).toBe(0);
      expect(plan.limits.maxCVs).toBe(3);
      expect(plan.limits.aiOptimizationsPerMonth).toBe(3);
    });

    it('should return correct plan for pro', () => {
      const plan = getPlanById('pro');

      expect(plan).toBeDefined();
      expect(plan.id).toBe('pro');
      expect(plan.name).toBe('Professional');
      expect(plan.price).toBe(9.99);
      expect(plan.limits.maxCVs).toBe(-1); // unlimited
      expect(plan.limits.aiOptimizationsPerMonth).toBe(-1); // unlimited
    });

    it('should return correct plan for enterprise', () => {
      const plan = getPlanById('enterprise');

      expect(plan).toBeDefined();
      expect(plan.id).toBe('enterprise');
      expect(plan.name).toBe('Enterprise');
      expect(plan.price).toBe(29.99);
      expect(plan.limits.maxCVs).toBe(-1); // unlimited
    });

    it('should throw error for invalid plan ID', () => {
      expect(() => getPlanById('invalid')).toThrow('Plan with ID invalid not found');
    });
  });

  describe('canCreateCV', () => {
    it('should allow CV creation within free plan limits', () => {
      expect(canCreateCV('free', 0)).toBe(true);
      expect(canCreateCV('free', 1)).toBe(true);
      expect(canCreateCV('free', 2)).toBe(true);
    });

    it('should prevent CV creation when free plan limit reached', () => {
      expect(canCreateCV('free', 3)).toBe(false);
      expect(canCreateCV('free', 4)).toBe(false);
    });

    it('should allow unlimited CV creation for pro plan', () => {
      expect(canCreateCV('pro', 0)).toBe(true);
      expect(canCreateCV('pro', 100)).toBe(true);
      expect(canCreateCV('pro', 1000)).toBe(true);
    });

    it('should allow unlimited CV creation for enterprise plan', () => {
      expect(canCreateCV('enterprise', 0)).toBe(true);
      expect(canCreateCV('enterprise', 100)).toBe(true);
      expect(canCreateCV('enterprise', 1000)).toBe(true);
    });
  });

  describe('canUseAIOptimization', () => {
    it('should allow AI optimization within free plan limits', () => {
      expect(canUseAIOptimization('free', 0)).toBe(true);
      expect(canUseAIOptimization('free', 1)).toBe(true);
      expect(canUseAIOptimization('free', 2)).toBe(true);
    });

    it('should prevent AI optimization when free plan limit reached', () => {
      expect(canUseAIOptimization('free', 3)).toBe(false);
      expect(canUseAIOptimization('free', 4)).toBe(false);
    });

    it('should allow unlimited AI optimization for pro plan', () => {
      expect(canUseAIOptimization('pro', 0)).toBe(true);
      expect(canUseAIOptimization('pro', 100)).toBe(true);
      expect(canUseAIOptimization('pro', 1000)).toBe(true);
    });

    it('should allow unlimited AI optimization for enterprise plan', () => {
      expect(canUseAIOptimization('enterprise', 0)).toBe(true);
      expect(canUseAIOptimization('enterprise', 100)).toBe(true);
      expect(canUseAIOptimization('enterprise', 1000)).toBe(true);
    });
  });

  describe('SUBSCRIPTION_PLANS', () => {
    it('should have all required plans defined', () => {
      expect(SUBSCRIPTION_PLANS.FREE).toBeDefined();
      expect(SUBSCRIPTION_PLANS.PRO).toBeDefined();
      expect(SUBSCRIPTION_PLANS.ENTERPRISE).toBeDefined();
    });

    it('should have consistent plan structure', () => {
      Object.values(SUBSCRIPTION_PLANS).forEach(plan => {
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('currency');
        expect(plan).toHaveProperty('features');
        expect(plan).toHaveProperty('limits');
        expect(Array.isArray(plan.features)).toBe(true);
      });
    });

    it('should have increasing prices', () => {
      const freePrice = SUBSCRIPTION_PLANS.FREE.price;
      const proPrice = SUBSCRIPTION_PLANS.PRO.price;
      const enterprisePrice = SUBSCRIPTION_PLANS.ENTERPRISE.price;

      expect(freePrice).toBe(0);
      expect(proPrice).toBeGreaterThan(freePrice);
      expect(enterprisePrice).toBeGreaterThan(proPrice);
    });
  });
});
