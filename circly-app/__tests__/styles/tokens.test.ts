/**
 * 디자인 토큰 시스템 테스트
 * tokens.ts의 구조와 값들이 올바른지 검증
 */

import { tokens } from '../../src/styles/tokens';

describe('Design Tokens', () => {
  describe('Colors', () => {
    it('should have primary color scale', () => {
      expect(tokens.colors.primary[50]).toBe('#f3f4ff');
      expect(tokens.colors.primary[500]).toBe('#667eea'); // Main brand color
      expect(tokens.colors.primary[900]).toBe('#36427d');
    });

    it('should have semantic colors', () => {
      expect(tokens.colors.success[500]).toBe('#22c55e');
      expect(tokens.colors.warning[500]).toBe('#f59e0b');
      expect(tokens.colors.error[500]).toBe('#ef4444');
    });

    it('should have neutral gray scale', () => {
      expect(tokens.colors.gray[50]).toBe('#fafafa');
      expect(tokens.colors.gray[500]).toBe('#737373');
      expect(tokens.colors.gray[900]).toBe('#171717');
    });

    it('should have special colors', () => {
      expect(tokens.colors.white).toBe('#ffffff');
      expect(tokens.colors.black).toBe('#000000');
      expect(tokens.colors.transparent).toBe('transparent');
    });
  });

  describe('Gradients', () => {
    it('should have primary gradients', () => {
      expect(tokens.gradients.primary).toEqual(['#667eea', '#764ba2']);
      expect(tokens.gradients.primarySoft).toEqual(['#e8eaff', '#fae8ff']);
    });

    it('should have emotion gradients', () => {
      expect(tokens.gradients.joy).toEqual(['#ff9a9e', '#fecfef']);
      expect(tokens.gradients.calm).toEqual(['#a8edea', '#fed6e3']);
      expect(tokens.gradients.energy).toEqual(['#ffecd2', '#fcb69f']);
    });
  });

  describe('Typography', () => {
    it('should have font sizes', () => {
      expect(tokens.typography.fontSize.xs).toBe(12);
      expect(tokens.typography.fontSize.base).toBe(16);
      expect(tokens.typography.fontSize['2xl']).toBe(24);
    });

    it('should have font weights', () => {
      expect(tokens.typography.fontWeight.normal).toBe('400');
      expect(tokens.typography.fontWeight.semibold).toBe('600');
      expect(tokens.typography.fontWeight.bold).toBe('700');
    });

    it('should have line heights', () => {
      expect(tokens.typography.lineHeight.tight).toBe(1.25);
      expect(tokens.typography.lineHeight.normal).toBe(1.5);
      expect(tokens.typography.lineHeight.relaxed).toBe(1.75);
    });
  });

  describe('Spacing', () => {
    it('should follow 8pt grid system', () => {
      expect(tokens.spacing[1]).toBe(4);   // 4px
      expect(tokens.spacing[2]).toBe(8);   // 8px
      expect(tokens.spacing[4]).toBe(16);  // 16px
      expect(tokens.spacing[8]).toBe(32);  // 32px
    });

    it('should have complete spacing scale', () => {
      expect(tokens.spacing[0]).toBe(0);
      expect(tokens.spacing[20]).toBe(80);
    });
  });

  describe('Border Radius', () => {
    it('should have radius scale', () => {
      expect(tokens.borderRadius.none).toBe(0);
      expect(tokens.borderRadius.sm).toBe(6);
      expect(tokens.borderRadius.lg).toBe(16);
      expect(tokens.borderRadius.xl).toBe(20);
      expect(tokens.borderRadius['2xl']).toBe(24);
      expect(tokens.borderRadius.full).toBe(9999);
    });
  });

  describe('Shadows', () => {
    it('should have shadow objects with React Native properties', () => {
      expect(tokens.shadows.base).toHaveProperty('shadowColor');
      expect(tokens.shadows.base).toHaveProperty('shadowOffset');
      expect(tokens.shadows.base).toHaveProperty('shadowOpacity');
      expect(tokens.shadows.base).toHaveProperty('shadowRadius');
      expect(tokens.shadows.base).toHaveProperty('elevation');
    });

    it('should have brand shadows', () => {
      expect(tokens.shadows.primary.shadowColor).toBe('#667eea');
      expect(tokens.shadows.success.shadowColor).toBe('#22c55e');
      expect(tokens.shadows.error.shadowColor).toBe('#ef4444');
    });
  });

  describe('Z-Index', () => {
    it('should have proper z-index hierarchy', () => {
      expect(tokens.zIndex.base).toBe(0);
      expect(tokens.zIndex.dropdown).toBe(10);
      expect(tokens.zIndex.modal).toBe(50);
      expect(tokens.zIndex.toast).toBe(80);
      expect(tokens.zIndex.maximum).toBe(9999);
    });

    it('should have ascending order', () => {
      expect(tokens.zIndex.dropdown).toBeGreaterThan(tokens.zIndex.base);
      expect(tokens.zIndex.modal).toBeGreaterThan(tokens.zIndex.dropdown);
      expect(tokens.zIndex.toast).toBeGreaterThan(tokens.zIndex.modal);
    });
  });

  describe('Animation', () => {
    it('should have duration values in milliseconds', () => {
      expect(tokens.animation.duration.fast).toBe(150);
      expect(tokens.animation.duration.base).toBe(200);
      expect(tokens.animation.duration.slow).toBe(300);
    });

    it('should have spring animation configs', () => {
      expect(tokens.animation.spring.default).toHaveProperty('tension');
      expect(tokens.animation.spring.default).toHaveProperty('friction');
      expect(tokens.animation.spring.default.tension).toBe(100);
      expect(tokens.animation.spring.default.friction).toBe(8);
    });
  });

  describe('Dark Theme', () => {
    it('should have dark theme colors', () => {
      expect(tokens.darkTheme.colors.bg.primary).toBe('#1a1a1a');
      expect(tokens.darkTheme.colors.text.primary).toBe('#ffffff');
      expect(tokens.darkTheme.colors.border.primary).toBe('#404040');
    });

    it('should have dark theme gradient overrides', () => {
      expect(tokens.darkTheme.gradients.bgLight).toEqual(['#2d2d2d', '#404040']);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for token access', () => {
      // 이 테스트는 TypeScript 컴파일 시점에서 체크됨
      // 런타임에서도 올바른 타입인지 확인
      expect(typeof tokens.colors.primary[500]).toBe('string');
      expect(typeof tokens.spacing[4]).toBe('number');
      expect(typeof tokens.typography.fontWeight.bold).toBe('string');
    });
  });

  describe('Consistency', () => {
    it('should have consistent color naming', () => {
      const colorKeys = Object.keys(tokens.colors.primary);
      const grayKeys = Object.keys(tokens.colors.gray);
      
      // 모든 컬러 스케일이 동일한 키를 가져야 함
      expect(colorKeys).toContain('50');
      expect(colorKeys).toContain('500');
      expect(colorKeys).toContain('900');
      
      expect(grayKeys).toContain('50');
      expect(grayKeys).toContain('500');
      expect(grayKeys).toContain('900');
    });

    it('should have consistent spacing progression', () => {
      // 간격이 8의 배수로 증가하는지 확인
      expect(tokens.spacing[2]).toBe(tokens.spacing[1] * 2);
      expect(tokens.spacing[4]).toBe(tokens.spacing[2] * 2);
      expect(tokens.spacing[8]).toBe(tokens.spacing[4] * 2);
    });
  });
});