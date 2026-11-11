import React from 'react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import Alert from '../Alert';
import EmptyState from '../EmptyState';
import PageHeader from '../PageHeader';
import NavItem from '../NavItem';
import Modal from '../Modal';

describe('AA Components: Alert, EmptyState, PageHeader, NavItem, Modal', () => {
  it('renders Alert with tones and proper roles', () => {
    const htmlDanger = renderToStaticMarkup(
      React.createElement(Alert, {
        tone: 'danger',
        title: 'Xatolik yuz berdi',
      }, 'Server bilan aloqa uzildi.')
    );
    expect(htmlDanger).toContain('aa-alert--danger');
    expect(htmlDanger).toContain('role="alert"');
    expect(htmlDanger).toContain('Xatolik yuz berdi');

    const htmlSuccess = renderToStaticMarkup(
      React.createElement(Alert, {
        tone: 'success',
        title: 'Muvaffaqiyatli',
      }, 'Sozlamalar saqlandi.')
    );
    expect(htmlSuccess).toContain('aa-alert--success');
    expect(htmlSuccess).toContain('role="status"');
  });

  it('renders EmptyState with title, text, and actions', () => {
    const htmlEmpty = renderToStaticMarkup(
      React.createElement(EmptyState, {
        title: 'Bu davrda savdo yo‘q',
        text: 'Davrni o‘zgartirib ko‘ring.',
        actions: React.createElement('button', null, 'Filtrni tozalash'),
      })
    );
    expect(htmlEmpty).toContain('aa-empty');
    expect(htmlEmpty).toContain('aa-empty__icon');
    expect(htmlEmpty).toContain('Bu davrda savdo yo‘q');
    expect(htmlEmpty).toContain('Filtrni tozalash');
  });

  it('renders PageHeader with single h1, breadcrumbs, meta, and actions', () => {
    const breadcrumbs = [
      { label: 'Bosh sahifa', to: '/platform' },
      { label: 'Kompaniyalar', to: '/platform/companies' },
      { label: 'Tahrirlash' },
    ];
    const htmlPageHeader = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(PageHeader, {
          breadcrumbs,
          title: 'Kompaniya tafsilotlari',
          meta: React.createElement('span', null, 'ID: 1045'),
          actions: React.createElement('button', null, 'Saqlash'),
        })
      )
    );
    expect(htmlPageHeader).toContain('aa-pagehead');
    expect(htmlPageHeader).toContain('<h1 class="aa-pagehead__title">Kompaniya tafsilotlari</h1>');
    expect(htmlPageHeader).toContain('aria-current="page"');
    expect(htmlPageHeader).toContain('Tahrirlash');
    expect(htmlPageHeader).toContain('ID: 1045');
    expect(htmlPageHeader).toContain('Saqlash');
  });

  it('renders NavItem with active state, count, and analytics accent', () => {
    const htmlNav = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(NavItem, {
          label: 'Analitika',
          to: '/platform/analytics',
          count: 5,
          accent: 'analytics',
          active: true,
          as: 'a',
        })
      )
    );
    expect(htmlNav).toContain('aa-nav__item');
    expect(htmlNav).toContain('aa-nav__item--analytics');
    expect(htmlNav).toContain('aria-current="page"');
    expect(htmlNav).toContain('aa-nav__count');
    expect(htmlNav).toContain('5');
  });

  it('renders Modal when open and returns null when closed', () => {
    const htmlClosed = renderToStaticMarkup(
      React.createElement(Modal, { open: false, title: 'Yopiq modal' }, 'Yopiq')
    );
    expect(htmlClosed).toBe('');

    const htmlOpen = renderToStaticMarkup(
      React.createElement(
        Modal,
        {
          open: true,
          title: 'O‘chirishni tasdiqlash',
          danger: true,
          primaryAction: { label: 'O‘chirish' },
          secondaryAction: { label: 'Bekor qilish' },
        },
        'Haqiqatan ham ushbu yozuvni o‘chirmoqchimisiz?'
      )
    );
    expect(htmlOpen).toContain('aa-scrim');
    expect(htmlOpen).toContain('aa-modal');
    expect(htmlOpen).toContain('role="dialog"');
    expect(htmlOpen).toContain('aria-modal="true"');
    expect(htmlOpen).toContain('O‘chirishni tasdiqlash');
    expect(htmlOpen).toContain('aa-btn--danger');
    expect(htmlOpen).toContain('O‘chirish');
  });
});
