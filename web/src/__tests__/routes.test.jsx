import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { legacyPagePaths } from '../navigation.js';

vi.mock('../components/LegacyPage.jsx', () => ({
  default: ({ templatePath }) => <div data-testid="active-route">{templatePath}</div>,
}));

describe('main application routes', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.__ELARCA_PAGE_PATHS__ = legacyPagePaths;
  });

  it.each([
    ['/index.html', 'index.html'],
    ['/galeria.html', 'galeria.html'],
    ['/relatos.html', 'relatos.html'],
    ['/videos.html', 'videos.html'],
  ])('renders the correct page at %s', (path, templatePath) => {
    window.__ELARCA_PAGE_PATHS__ = legacyPagePaths;
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('active-route').textContent).toBe(templatePath);
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy();
    expect(document.getElementById('nav-player')).toBeTruthy();
  });
});
