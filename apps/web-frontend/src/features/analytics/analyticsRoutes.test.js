import React from 'react';
import { describe, it, expect } from 'vitest';
import { platformRoutes } from '../../router/platform.routes';

describe('Analytics routes registration smoke test', () => {
  it('registers all required analytics sub-routes in platform.routes', () => {
    expect(platformRoutes).toBeDefined();

    // Flatten route tree to collect all path strings
    const paths = [];
    function collectPaths(children) {
      React.Children.forEach(children, (child) => {
        if (!child || !child.props) return;
        if (child.props.path) {
          paths.push(child.props.path);
        }
        if (child.props.children) {
          collectPaths(child.props.children);
        }
      });
    }

    collectPaths(platformRoutes.props.children);

    expect(paths).toContain('analytics');
    expect(paths).toContain('analytics/regions');
    expect(paths).toContain('analytics/companies');
    expect(paths).toContain('analytics/companies/:companyId');
    expect(paths).toContain('analytics/comparison');
    expect(paths).toContain('analytics/compare');
    expect(paths).toContain('analytics/receipts');
    expect(paths).toContain('analytics/reports');
  });
});
